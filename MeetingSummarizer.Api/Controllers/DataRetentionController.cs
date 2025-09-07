using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.DataRetention;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Data Retention API Controller
/// Handles data retention policies, cleanup operations, and administrative tasks
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DataRetentionController : ControllerBase
{
    private readonly IDataRetentionService _retentionService;
    private readonly ILogger<DataRetentionController> _logger;

    public DataRetentionController(
        IDataRetentionService retentionService,
        ILogger<DataRetentionController> logger)
    {
        _retentionService = retentionService;
        _logger = logger;
    }

    /// <summary>
    /// Get retention policy statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<RetentionStatsResult>> GetRetentionStats()
    {
        try
        {
            var stats = await _retentionService.GetRetentionStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving retention statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving retention statistics" });
        }
    }

    /// <summary>
    /// Perform manual data cleanup
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<ActionResult<DataCleanupResult>> PerformCleanup()
    {
        try
        {
            _logger.LogInformation("Manual data cleanup initiated");
            var result = await _retentionService.PerformScheduledCleanupAsync();
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual cleanup operation");
            return StatusCode(500, new { message = "An error occurred during cleanup operation" });
        }
    }

    /// <summary>
    /// Clean up inactive users
    /// </summary>
    [HttpPost("cleanup/inactive-users")]
    public async Task<ActionResult<int>> CleanupInactiveUsers([FromQuery] int inactiveDays = 365)
    {
        try
        {
            if (inactiveDays < 30)
            {
                return BadRequest(new { message = "Minimum inactive period is 30 days" });
            }

            var deletedCount = await _retentionService.CleanupInactiveUsersAsync(inactiveDays);
            
            _logger.LogInformation("Manual inactive user cleanup completed: {Count} users deleted", deletedCount);
            return Ok(new { deletedUsers = deletedCount, inactiveDays });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during inactive user cleanup");
            return StatusCode(500, new { message = "An error occurred during inactive user cleanup" });
        }
    }

    /// <summary>
    /// Clean up old meeting records
    /// </summary>
    [HttpPost("cleanup/old-meetings")]
    public async Task<ActionResult<int>> CleanupOldMeetings([FromQuery] int retentionDays = 90)
    {
        try
        {
            if (retentionDays < 7)
            {
                return BadRequest(new { message = "Minimum retention period is 7 days" });
            }

            var deletedCount = await _retentionService.CleanupOldMeetingsAsync(retentionDays);
            
            _logger.LogInformation("Manual old meeting cleanup completed: {Count} meetings deleted", deletedCount);
            return Ok(new { deletedMeetings = deletedCount, retentionDays });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during old meeting cleanup");
            return StatusCode(500, new { message = "An error occurred during old meeting cleanup" });
        }
    }

    /// <summary>
    /// Clean up orphaned blob storage files
    /// </summary>
    [HttpPost("cleanup/orphaned-blobs")]
    public async Task<ActionResult<int>> CleanupOrphanedBlobs()
    {
        try
        {
            var deletedCount = await _retentionService.CleanupOrphanedBlobsAsync();
            
            _logger.LogInformation("Manual orphaned blob cleanup completed: {Count} blobs deleted", deletedCount);
            return Ok(new { deletedBlobs = deletedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during orphaned blob cleanup");
            return StatusCode(500, new { message = "An error occurred during orphaned blob cleanup" });
        }
    }

    /// <summary>
    /// Archive old meeting data to cold storage
    /// </summary>
    [HttpPost("archive/old-meetings")]
    public async Task<ActionResult<int>> ArchiveOldMeetings([FromQuery] int archiveAfterDays = 30)
    {
        try
        {
            if (archiveAfterDays < 1)
            {
                return BadRequest(new { message = "Minimum archive period is 1 day" });
            }

            var archivedCount = await _retentionService.ArchiveOldMeetingDataAsync(archiveAfterDays);
            
            _logger.LogInformation("Manual meeting archival completed: {Count} meetings archived", archivedCount);
            return Ok(new { archivedMeetings = archivedCount, archiveAfterDays });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during meeting archival");
            return StatusCode(500, new { message = "An error occurred during meeting archival" });
        }
    }

    /// <summary>
    /// Get system health information related to data retention
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult> GetRetentionHealth()
    {
        try
        {
            var stats = await _retentionService.GetRetentionStatsAsync();
            
            var health = new
            {
                status = "healthy",
                lastCheck = DateTime.UtcNow,
                metrics = new
                {
                    inactiveUsersEligibleForDeletion = stats.InactiveUsers365Days,
                    oldMeetingsEligibleForDeletion = stats.MeetingsOlderThan90Days,
                    totalStorageSizeGB = Math.Round(stats.TotalStorageSizeBytes / (1024.0 * 1024.0 * 1024.0), 2),
                    activeUserRetentionRate = stats.TotalUsers > 0 
                        ? Math.Round((double)stats.ActiveUsers30Days / stats.TotalUsers * 100, 2) 
                        : 0,
                    meetingCreationRate30Days = stats.MeetingsLast30Days,
                    totalTokensInCirculation = stats.TotalTokenBalance
                },
                recommendations = GetRetentionRecommendations(stats)
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving retention health information");
            return StatusCode(500, new { 
                status = "unhealthy", 
                message = "An error occurred while retrieving retention health information" 
            });
        }
    }

    private static List<string> GetRetentionRecommendations(RetentionStatsResult stats)
    {
        var recommendations = new List<string>();

        if (stats.InactiveUsers365Days > 0)
        {
            recommendations.Add($"Consider cleaning up {stats.InactiveUsers365Days} inactive users to free up database space");
        }

        if (stats.MeetingsOlderThan90Days > 50)
        {
            recommendations.Add($"Consider archiving or cleaning up {stats.MeetingsOlderThan90Days} old meetings");
        }

        var storageGB = stats.TotalStorageSizeBytes / (1024.0 * 1024.0 * 1024.0);
        if (storageGB > 100)
        {
            recommendations.Add($"Storage usage is high ({storageGB:F2} GB). Consider implementing automated archival");
        }

        var activeUserRate = stats.TotalUsers > 0 ? (double)stats.ActiveUsers30Days / stats.TotalUsers : 0;
        if (activeUserRate < 0.1 && stats.TotalUsers > 100)
        {
            recommendations.Add($"Low user activity rate ({activeUserRate:P}). Review user engagement strategies");
        }

        if (stats.TotalTokenBalance > 10000)
        {
            recommendations.Add("High token balance in system. Monitor for token usage patterns");
        }

        if (recommendations.Count == 0)
        {
            recommendations.Add("System retention policies are operating optimally");
        }

        return recommendations;
    }
}
