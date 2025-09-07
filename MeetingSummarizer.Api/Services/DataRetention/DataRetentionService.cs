using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.DataRetention;

/// <summary>
/// Interface for data retention and cleanup operations
/// </summary>
public interface IDataRetentionService
{
    /// <summary>
    /// Perform scheduled cleanup of inactive users and old data
    /// </summary>
    Task<DataCleanupResult> PerformScheduledCleanupAsync();
    
    /// <summary>
    /// Clean up user data that exceeds retention policy
    /// </summary>
    Task<int> CleanupInactiveUsersAsync(int inactiveDays = 365);
    
    /// <summary>
    /// Clean up old meeting records and associated files
    /// </summary>
    Task<int> CleanupOldMeetingsAsync(int retentionDays = 90);
    
    /// <summary>
    /// Clean up orphaned blob storage files
    /// </summary>
    Task<int> CleanupOrphanedBlobsAsync();
    
    /// <summary>
    /// Get retention policy statistics
    /// </summary>
    Task<RetentionStatsResult> GetRetentionStatsAsync();
    
    /// <summary>
    /// Archive old meeting data to cold storage tier
    /// </summary>
    Task<int> ArchiveOldMeetingDataAsync(int archiveAfterDays = 30);
}

/// <summary>
/// Data retention service implementation
/// </summary>
public class DataRetentionService : IDataRetentionService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly IUserStorageService _storageService;
    private readonly ILogger<DataRetentionService> _logger;

    public DataRetentionService(
        MeetingSummarizerDbContext context,
        IUserStorageService storageService,
        ILogger<DataRetentionService> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<DataCleanupResult> PerformScheduledCleanupAsync()
    {
        _logger.LogInformation("Starting scheduled data cleanup");

        var result = new DataCleanupResult
        {
            StartedAt = DateTime.UtcNow
        };

        try
        {
            // Clean up inactive users
            result.InactiveUsersDeleted = await CleanupInactiveUsersAsync();
            
            // Clean up old meetings
            result.OldMeetingsDeleted = await CleanupOldMeetingsAsync();
            
            // Clean up orphaned blobs
            result.OrphanedBlobsDeleted = await CleanupOrphanedBlobsAsync();
            
            // Archive old data
            result.MeetingsArchived = await ArchiveOldMeetingDataAsync();

            result.CompletedAt = DateTime.UtcNow;
            result.Success = true;

            _logger.LogInformation("Scheduled cleanup completed successfully. " +
                "Users deleted: {UsersDeleted}, Meetings deleted: {MeetingsDeleted}, " +
                "Blobs deleted: {BlobsDeleted}, Meetings archived: {MeetingsArchived}",
                result.InactiveUsersDeleted, result.OldMeetingsDeleted, 
                result.OrphanedBlobsDeleted, result.MeetingsArchived);
        }
        catch (Exception ex)
        {
            result.CompletedAt = DateTime.UtcNow;
            result.Success = false;
            result.ErrorMessage = ex.Message;
            
            _logger.LogError(ex, "Error during scheduled data cleanup");
        }

        return result;
    }

    public async Task<int> CleanupInactiveUsersAsync(int inactiveDays = 365)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-inactiveDays);
        
        var inactiveUsers = await _context.Users
            .Where(u => u.LastActivityAt < cutoffDate && 
                       u.TokenBalance <= 0 && 
                       !u.IsPaidUser)
            .Include(u => u.Meetings)
            .ToListAsync();

        int deletedCount = 0;

        foreach (var user in inactiveUsers)
        {
            try
            {
                // Delete user's blob storage data
                await _storageService.DeleteAllUserDataAsync(user.Id);
                
                // Delete meeting records
                _context.Meetings.RemoveRange(user.Meetings);
                
                // Delete user record
                _context.Users.Remove(user);
                
                await _context.SaveChangesAsync();
                deletedCount++;
                
                _logger.LogInformation("Deleted inactive user: {UserId} ({Email}) - Last active: {LastActive}", 
                    user.Id, user.Email, user.LastActivityAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting inactive user {UserId}", user.Id);
            }
        }

        _logger.LogInformation("Cleaned up {Count} inactive users (inactive for {Days} days)", 
            deletedCount, inactiveDays);
        
        return deletedCount;
    }

    public async Task<int> CleanupOldMeetingsAsync(int retentionDays = 90)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
        
        var oldMeetings = await _context.Meetings
            .Where(m => m.CreatedAt < cutoffDate)
            .ToListAsync();

        int deletedCount = 0;

        foreach (var meeting in oldMeetings)
        {
            try
            {
                // Delete associated blob files
                if (!string.IsNullOrEmpty(meeting.BlobStoragePath))
                {
                    var fileName = Path.GetFileName(meeting.BlobStoragePath);
                    await _storageService.DeleteFileAsync(meeting.UserId, fileName);
                }

                // Delete meeting record
                _context.Meetings.Remove(meeting);
                await _context.SaveChangesAsync();
                deletedCount++;
                
                _logger.LogDebug("Deleted old meeting: {MeetingId} (Created: {Created})", 
                    meeting.Id, meeting.CreatedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old meeting {MeetingId}", meeting.Id);
            }
        }

        _logger.LogInformation("Cleaned up {Count} old meetings (older than {Days} days)", 
            deletedCount, retentionDays);
        
        return deletedCount;
    }

    public async Task<int> CleanupOrphanedBlobsAsync()
    {
        int deletedCount = 0;

        try
        {
            // Get all users
            var users = await _context.Users.ToListAsync();
            
            // Get all meeting file references
            var meetingFileUrls = await _context.Meetings
                .Where(m => !string.IsNullOrEmpty(m.BlobStoragePath))
                .Select(m => new { m.UserId, m.BlobStoragePath })
                .ToListAsync();

            var referencedFiles = new HashSet<string>();
            foreach (var meeting in meetingFileUrls)
            {
                var fileName = Path.GetFileName(meeting.BlobStoragePath);
                referencedFiles.Add($"{meeting.UserId}/{fileName}");
            }

            // Check each user's storage for orphaned files
            foreach (var user in users)
            {
                try
                {
                    var userFiles = await _storageService.ListUserFilesAsync(user.Id);
                    
                    foreach (var file in userFiles)
                    {
                        var filePath = $"{user.Id}/{file.FileName}";
                        
                        if (!referencedFiles.Contains(filePath))
                        {
                            // This is an orphaned file
                            await _storageService.DeleteFileAsync(user.Id, file.FileName);
                            deletedCount++;
                            
                            _logger.LogDebug("Deleted orphaned blob: {FilePath}", filePath);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error cleaning up orphaned blobs for user {UserId}", user.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during orphaned blob cleanup");
        }

        _logger.LogInformation("Cleaned up {Count} orphaned blob files", deletedCount);
        return deletedCount;
    }

    public async Task<RetentionStatsResult> GetRetentionStatsAsync()
    {
        var now = DateTime.UtcNow;
        
        var stats = new RetentionStatsResult
        {
            GeneratedAt = now,
            
            // User statistics
            TotalUsers = await _context.Users.CountAsync(),
            ActiveUsers30Days = await _context.Users.CountAsync(u => u.LastActivityAt > now.AddDays(-30)),
            ActiveUsers90Days = await _context.Users.CountAsync(u => u.LastActivityAt > now.AddDays(-90)),
            InactiveUsers365Days = await _context.Users.CountAsync(u => u.LastActivityAt < now.AddDays(-365) && u.TokenBalance <= 0 && !u.IsPaidUser),
            
            // Meeting statistics
            TotalMeetings = await _context.Meetings.CountAsync(),
            MeetingsLast30Days = await _context.Meetings.CountAsync(m => m.CreatedAt > now.AddDays(-30)),
            MeetingsLast90Days = await _context.Meetings.CountAsync(m => m.CreatedAt > now.AddDays(-90)),
            MeetingsOlderThan90Days = await _context.Meetings.CountAsync(m => m.CreatedAt < now.AddDays(-90)),
            
            // Storage statistics
            TotalStorageSizeBytes = await GetTotalStorageSizeAsync(),
            
            // Token statistics
            TotalTokenBalance = await _context.Users.SumAsync(u => u.TokenBalance),
            PaidUsers = await _context.Users.CountAsync(u => u.IsPaidUser),
            UsersWithTokens = await _context.Users.CountAsync(u => u.TokenBalance > 0)
        };

        return stats;
    }

    public async Task<int> ArchiveOldMeetingDataAsync(int archiveAfterDays = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-archiveAfterDays);
        
        var meetingsToArchive = await _context.Meetings
            .Where(m => m.CreatedAt < cutoffDate && 
                       !string.IsNullOrEmpty(m.BlobStoragePath))
            .ToListAsync();

        int archivedCount = 0;

        foreach (var meeting in meetingsToArchive)
        {
            try
            {
                var fileName = Path.GetFileName(meeting.BlobStoragePath!);
                
                // Move to archive (cold) storage tier
                await _storageService.ChangeStorageTierAsync(meeting.UserId, meeting.BlobStoragePath!, StorageTier.Archive);
                
                archivedCount++;
                
                _logger.LogDebug("Archived meeting data: {MeetingId} - {FileName}", 
                    meeting.Id, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving meeting {MeetingId}", meeting.Id);
            }
        }

        _logger.LogInformation("Archived {Count} meetings to cold storage (older than {Days} days)", 
            archivedCount, archiveAfterDays);
        
        return archivedCount;
    }

    private async Task<long> GetTotalStorageSizeAsync()
    {
        try
        {
            var users = await _context.Users.ToListAsync();
            long totalSize = 0;

            foreach (var user in users)
            {
                try
                {
                    var stats = await _storageService.GetStorageStatsAsync(user.Id);
                    totalSize += stats.TotalSizeBytes;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting storage size for user {UserId}", user.Id);
                }
            }

            return totalSize;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating total storage size");
            return 0;
        }
    }
}

/// <summary>
/// Result of data cleanup operation
/// </summary>
public class DataCleanupResult
{
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int InactiveUsersDeleted { get; set; }
    public int OldMeetingsDeleted { get; set; }
    public int OrphanedBlobsDeleted { get; set; }
    public int MeetingsArchived { get; set; }
    public TimeSpan Duration => CompletedAt - StartedAt;
}

/// <summary>
/// Retention policy statistics
/// </summary>
public class RetentionStatsResult
{
    public DateTime GeneratedAt { get; set; }
    
    // User statistics
    public int TotalUsers { get; set; }
    public int ActiveUsers30Days { get; set; }
    public int ActiveUsers90Days { get; set; }
    public int InactiveUsers365Days { get; set; }
    
    // Meeting statistics
    public int TotalMeetings { get; set; }
    public int MeetingsLast30Days { get; set; }
    public int MeetingsLast90Days { get; set; }
    public int MeetingsOlderThan90Days { get; set; }
    
    // Storage statistics
    public long TotalStorageSizeBytes { get; set; }
    
    // Token statistics
    public decimal TotalTokenBalance { get; set; }
    public int PaidUsers { get; set; }
    public int UsersWithTokens { get; set; }
}
