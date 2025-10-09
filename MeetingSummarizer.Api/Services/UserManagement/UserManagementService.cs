using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Authentication;

namespace MeetingSummarizer.Api.Services.UserManagement;

/// <summary>
/// Interface for user management operations
/// </summary>
public interface IUserManagementService
{
    /// <summary>
    /// Create a new user account
    /// </summary>
    Task<User> CreateUserAsync(CreateUserRequest request);
    
    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<User?> GetUserByIdAsync(Guid userId);
    
    /// <summary>
    /// Get user by email
    /// </summary>
    Task<User?> GetUserByEmailAsync(string email);
    
    /// <summary>
    /// Update user information
    /// </summary>
    Task<User> UpdateUserAsync(Guid userId, UpdateUserRequest request);
    
    /// <summary>
    /// Update user password with new hash and salt
    /// </summary>
    Task UpdatePasswordAsync(Guid userId, string passwordHash, string salt);
    
    /// <summary>
    /// Add tokens to user account
    /// </summary>
    Task<User> AddTokensAsync(Guid userId, decimal tokenAmount);
    
    /// <summary>
    /// Deduct tokens from user account
    /// </summary>
    Task<bool> DeductTokensAsync(Guid userId, decimal tokenAmount);
    
    /// <summary>
    /// Get user's meeting history
    /// </summary>
    Task<IEnumerable<Meeting>> GetUserMeetingHistoryAsync(Guid userId, int pageSize = 50, int page = 1);
    
    /// <summary>
    /// Create a new meeting record
    /// </summary>
    Task<Meeting> CreateMeetingAsync(Guid userId, CreateUserMeetingRequest request);
    
    /// <summary>
    /// Update meeting information
    /// </summary>
    Task<Meeting> UpdateMeetingAsync(Guid userId, Guid meetingId, UpdateMeetingRequest request);
    
    /// <summary>
    /// Delete user account and all associated data (GDPR compliance)
    /// </summary>
    Task<bool> DeleteUserAccountAsync(Guid userId);
    
    /// <summary>
    /// Get users whose data should be cleaned up based on retention policies
    /// </summary>
    Task<IEnumerable<User>> GetUsersForRetentionCleanupAsync();
    
    /// <summary>
    /// Update user's last activity timestamp
    /// </summary>
    Task UpdateUserActivityAsync(Guid userId);
    
    /// <summary>
    /// Update user's dialog acknowledgement preferences
    /// </summary>
    Task<bool> UpdateDialogPreferencesAsync(Guid userId, UpdateDialogPreferencesRequest request);
}

/// <summary>
/// User management service implementation
/// </summary>
public class UserManagementService : IUserManagementService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<UserManagementService> _logger;
    private readonly IJwtAuthenticationService _jwtService;

    public UserManagementService(
        MeetingSummarizerDbContext context,
        ILogger<UserManagementService> logger,
        IJwtAuthenticationService jwtService)
    {
        _context = context;
        _logger = logger;
        _jwtService = jwtService;
    }

    public async Task<User> CreateUserAsync(CreateUserRequest request)
    {
        // Check if user already exists
        var existingUser = await GetUserByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException($"User with email {request.Email} already exists");
        }

        // Hash password if provided (for authenticated users)
        string? passwordHash = null;
        string? salt = null;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            (passwordHash, salt) = _jwtService.HashPassword(request.Password);
        }

        var user = new User
        {
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsPaidUser = request.IsPaidUser,
            TokenBalance = request.InitialTokenBalance,
            HasConsentedToDataProcessing = request.HasConsentedToDataProcessing,
            ConsentDate = request.HasConsentedToDataProcessing ? DateTime.UtcNow : null,
            Role = request.Role,
            PasswordHash = passwordHash,
            Salt = salt,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new user account: {UserId} ({Email})", user.Id, user.Email);
        return user;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users
            .Include(u => u.Meetings)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Meetings)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException($"User {userId} not found");
        }

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.LastActivityAt = DateTime.UtcNow;

        if (request.HasConsentedToDataProcessing.HasValue)
        {
            user.HasConsentedToDataProcessing = request.HasConsentedToDataProcessing.Value;
            if (request.HasConsentedToDataProcessing.Value && user.ConsentDate == null)
            {
                user.ConsentDate = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated user information: {UserId}", userId);
        
        return user;
    }

    public async Task UpdatePasswordAsync(Guid userId, string passwordHash, string salt)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException($"User {userId} not found");
        }

        user.PasswordHash = passwordHash;
        user.Salt = salt;
        user.LastActivityAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated password for user: {UserId}", userId);
    }

    public async Task<User> AddTokensAsync(Guid userId, decimal tokenAmount)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException($"User {userId} not found");
        }

        user.TokenBalance += tokenAmount;
        user.IsPaidUser = true; // User becomes paid when they have tokens
        user.LastActivityAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Added {TokenAmount} tokens to user {UserId}. New balance: {Balance}", 
            tokenAmount, userId, user.TokenBalance);

        return user;
    }

    public async Task<bool> DeductTokensAsync(Guid userId, decimal tokenAmount)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException($"User {userId} not found");
        }

        if (user.TokenBalance < tokenAmount)
        {
            _logger.LogWarning("Insufficient tokens for user {UserId}. Required: {Required}, Available: {Available}", 
                userId, tokenAmount, user.TokenBalance);
            return false;
        }

        user.TokenBalance -= tokenAmount;
        user.LastActivityAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Deducted {TokenAmount} tokens from user {UserId}. New balance: {Balance}", 
            tokenAmount, userId, user.TokenBalance);

        return true;
    }

    public async Task<IEnumerable<Meeting>> GetUserMeetingHistoryAsync(Guid userId, int pageSize = 50, int page = 1)
    {
        return await _context.Meetings
            .Include(m => m.FastTranscriptionJobs) // Include fast job information for progress tracking
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<Meeting> CreateMeetingAsync(Guid userId, CreateUserMeetingRequest request)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException($"User {userId} not found");
        }

        var meeting = new Meeting
        {
            UserId = userId,
            Title = request.Title,
            Description = request.Description,
            OriginalFileName = request.OriginalFileName,
            BlobStoragePath = request.AudioFileBlobUrl ?? string.Empty,
            FileSizeBytes = request.FileSizeBytes ?? 0,
            DurationSeconds = request.DurationSeconds ?? 0,
            Status = MeetingStatus.Uploaded,
            CreatedAt = DateTime.UtcNow
        };

        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new meeting record for user {UserId}: {MeetingId}", userId, meeting.Id);
        return meeting;
    }

    public async Task<Meeting> UpdateMeetingAsync(Guid userId, Guid meetingId, UpdateMeetingRequest request)
    {
        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId && m.UserId == userId);

        if (meeting == null)
        {
            throw new ArgumentException($"Meeting {meetingId} not found for user {userId}");
        }

        meeting.Title = request.Title ?? meeting.Title;
        meeting.Description = request.Description ?? meeting.Description;
        meeting.TranscriptionJson = request.TranscriptionText ?? meeting.TranscriptionJson;
        meeting.SummaryJson = request.SummaryText ?? meeting.SummaryJson;
        meeting.Status = request.Status ?? meeting.Status;
        meeting.CompletedAt = request.Status == MeetingStatus.Completed ? DateTime.UtcNow : meeting.CompletedAt;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated meeting {MeetingId} for user {UserId}", meetingId, userId);

        return meeting;
    }

    public async Task<bool> DeleteUserAccountAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Meetings)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return false;
        }

        // Delete all associated meetings
        _context.Meetings.RemoveRange(user.Meetings);
        
        // Delete the user
        _context.Users.Remove(user);
        
        await _context.SaveChangesAsync();
        
        _logger.LogWarning("GDPR: Deleted user account and all associated data: {UserId} ({Email})", 
            userId, user.Email);

        return true;
    }

    public async Task<IEnumerable<User>> GetUsersForRetentionCleanupAsync()
    {
        // Users who haven't been active for more than 365 days and have no token balance
        var cutoffDate = DateTime.UtcNow.AddDays(-365);
        
        return await _context.Users
            .Where(u => u.LastActivityAt < cutoffDate && u.TokenBalance <= 0 && !u.IsPaidUser)
            .ToListAsync();
    }

    public async Task UpdateUserActivityAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LastActivityAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> UpdateDialogPreferencesAsync(Guid userId, UpdateDialogPreferencesRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        
        if (request.HasAcknowledgedLegalDisclaimer.HasValue)
        {
            user.HasAcknowledgedLegalDisclaimer = request.HasAcknowledgedLegalDisclaimer.Value;
            if (request.HasAcknowledgedLegalDisclaimer.Value)
            {
                user.LegalDisclaimerAcknowledgedAt = now;
            }
        }

        if (request.HasSeenAiChatDiscovery.HasValue)
        {
            user.HasSeenAiChatDiscovery = request.HasSeenAiChatDiscovery.Value;
            if (request.HasSeenAiChatDiscovery.Value)
            {
                user.AiChatDiscoveryShownAt = now;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
