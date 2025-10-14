using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Services.Invitation;

/// <summary>
/// Service implementation for managing invitation codes in development environment
/// </summary>
public class InvitationService : IInvitationService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<InvitationService> _logger;

    public InvitationService(MeetingSummarizerDbContext context, ILogger<InvitationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generates a new invitation code
    /// </summary>
    /// <param name="email">Email restriction - only this email can use the code</param>
    /// <param name="createdByUserId">ID of the user creating the invitation</param>
    /// <param name="expirationDays">How many days until the code expires (default: 7)</param>
    /// <returns>The generated invitation code</returns>
    public async Task<InvitationCode> GenerateInvitationCodeAsync(string email, int createdByUserId, int expirationDays = 7)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required for invitation codes", nameof(email));
        }

        _logger.LogInformation("Generating invitation code for email: {Email}, expires in {Days} days", 
            email, expirationDays);

        var invitationCode = new InvitationCode
        {
            Code = GenerateSecureCode(),
            Email = email,
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            CreatedBy = createdByUserId.ToString(), // Store user ID as string for now
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.InvitationCodes.Add(invitationCode);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated invitation code {CodeId} with code {Code}", 
            invitationCode.Id, invitationCode.Code);

        return invitationCode;
    }

    /// <inheritdoc />
    public async Task<InvitationCode?> ValidateInvitationCodeAsync(string code, string email)
    {
        _logger.LogInformation("Validating invitation code {Code} for email {Email}", code, email);

        var invitationCode = await _context.InvitationCodes
            .FirstOrDefaultAsync(ic => 
                ic.Code == code && 
                ic.IsActive && 
                ic.ExpiresAt > DateTime.UtcNow &&
                ic.UsedAt == null);

        if (invitationCode == null)
        {
            _logger.LogWarning("Invitation code {Code} not found, expired, or already used", code);
            return null;
        }

        // Check email restriction if specified
        if (!string.IsNullOrEmpty(invitationCode.Email) && 
            !string.Equals(invitationCode.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Invitation code {Code} email restriction failed. Expected: {ExpectedEmail}, Provided: {ProvidedEmail}", 
                code, invitationCode.Email, email);
            return null;
        }

        _logger.LogInformation("Invitation code {Code} is valid for email {Email}", code, email);
        return invitationCode;
    }

    /// <inheritdoc />
    public async Task<bool> MarkInvitationCodeAsUsedAsync(string code, Guid userId)
    {
        _logger.LogInformation("Marking invitation code {Code} as used by user {UserId}", code, userId);

        var invitationCode = await _context.InvitationCodes
            .FirstOrDefaultAsync(ic => ic.Code == code && ic.IsActive && ic.UsedAt == null);

        if (invitationCode == null)
        {
            _logger.LogWarning("Cannot mark invitation code {Code} as used - not found or already used", code);
            return false;
        }

        invitationCode.UsedAt = DateTime.UtcNow;
        invitationCode.UsedByUserId = userId;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully marked invitation code {Code} as used by user {UserId}", code, userId);
        return true;
    }

    /// <inheritdoc />
    public async Task<int> CleanupExpiredCodesAsync()
    {
        _logger.LogInformation("Cleaning up expired invitation codes");

        var expiredCodes = await _context.InvitationCodes
            .Where(ic => ic.ExpiresAt <= DateTime.UtcNow && ic.IsActive)
            .ToListAsync();

        foreach (var code in expiredCodes)
        {
            code.IsActive = false;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cleaned up {Count} expired invitation codes", expiredCodes.Count);
        return expiredCodes.Count;
    }

    /// <summary>
    /// Generates a cryptographically secure invitation code
    /// </summary>
    /// <returns>A secure 20-character code</returns>
    private static string GenerateSecureCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const int codeLength = 20;
        
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[codeLength];
        rng.GetBytes(bytes);
        
        var result = new StringBuilder(codeLength);
        for (int i = 0; i < codeLength; i++)
        {
            result.Append(chars[bytes[i] % chars.Length]);
        }
        
        return result.ToString();
    }
}