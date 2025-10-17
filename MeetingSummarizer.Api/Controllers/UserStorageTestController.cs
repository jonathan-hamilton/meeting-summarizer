using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Models;
using System.Text;

#if DEBUG || DEVELOPMENT
namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Test controller for User Storage Service functionality
/// This controller provides per-user storage isolation and file management
/// WARNING: This controller is only available in DEBUG/DEVELOPMENT builds
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UserStorageTestController : ControllerBase
{
    private readonly IUserStorageService _userStorageService;
    private readonly ILogger<UserStorageTestController> _logger;

    public UserStorageTestController(
        IUserStorageService userStorageService,
        ILogger<UserStorageTestController> logger)
    {
        _userStorageService = userStorageService;
        _logger = logger;
    }

    /// <summary>
    /// Test uploading a sample audio file for a user
    /// </summary>
    [HttpPost("upload-sample/{userId}")]
    public async Task<IActionResult> UploadSampleAudio(Guid userId)
    {
        try
        {
            // Create a sample audio file (in practice this would be uploaded)
            var sampleContent = "This is a sample audio file content for testing"u8.ToArray();
            using var stream = new MemoryStream(sampleContent);
            
            var result = await _userStorageService.UploadAudioFileAsync(
                userId, 
                "sample-test-audio.mp3", 
                stream, 
                "audio/mpeg");

            _logger.LogInformation("Uploaded sample audio for user {UserId}: {BlobUrl}", userId, result.BlobUrl);

            return Ok(new
            {
                Message = "Sample audio uploaded successfully",
                UserId = userId,
                BlobUrl = result.BlobUrl,
                FileName = result.FileName,
                Size = result.FileSizeBytes,
                StorageTier = result.StorageTier.ToString(),
                UploadedAt = result.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload sample audio for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to upload sample audio", Details = ex.Message });
        }
    }

    /// <summary>
    /// Test uploading a meeting artifact for a user
    /// </summary>
    [HttpPost("upload-artifact/{userId}/{meetingId}")]
    public async Task<IActionResult> UploadMeetingArtifact(
        Guid userId, 
        Guid meetingId, 
        [FromQuery] string artifactType = "transcript")
    {
        try
        {
            var sampleTranscript = $"Sample meeting transcript for meeting {meetingId}.\n" +
                                 $"Speaker 1: Hello, welcome to the meeting.\n" +
                                 $"Speaker 2: Thank you for joining us today.\n" +
                                 $"Generated at: {DateTime.UtcNow}";

            var result = await _userStorageService.UploadMeetingArtifactAsync(
                userId, meetingId, artifactType, sampleTranscript);

            return Ok(new
            {
                Message = "Meeting artifact uploaded successfully",
                UserId = userId,
                MeetingId = meetingId,
                ArtifactType = artifactType,
                BlobUrl = result.BlobUrl,
                Size = result.FileSizeBytes,
                UploadedAt = result.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload meeting artifact for user {UserId}, meeting {MeetingId}", 
                userId, meetingId);
            return StatusCode(500, new { Error = "Failed to upload meeting artifact", Details = ex.Message });
        }
    }

    /// <summary>
    /// List all files for a user
    /// </summary>
    [HttpGet("files/{userId}")]
    public async Task<IActionResult> ListUserFiles(Guid userId, [FromQuery] string? prefix = null, [FromQuery] int maxResults = 10)
    {
        try
        {
            var files = await _userStorageService.ListUserFilesAsync(userId, prefix, maxResults);

            return Ok(new
            {
                UserId = userId,
                Prefix = prefix,
                TotalFiles = files.Count(),
                Files = files.Select(f => new
                {
                    f.FileName,
                    f.BlobUrl,
                    SizeMB = Math.Round(f.FileSizeBytes / 1024.0 / 1024.0, 2),
                    f.ContentType,
                    StorageTier = f.StorageTier.ToString(),
                    f.CreatedAt,
                    f.LastModified
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list files for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to list user files", Details = ex.Message });
        }
    }

    /// <summary>
    /// Get storage statistics for a user
    /// </summary>
    [HttpGet("stats/{userId}")]
    public async Task<IActionResult> GetUserStorageStats(Guid userId)
    {
        try
        {
            var stats = await _userStorageService.GetStorageStatsAsync(userId);

            return Ok(new
            {
                stats.UserId,
                TotalFiles = stats.TotalFilesCount,
                TotalSizeMB = stats.TotalSizeMB,
                StorageDistribution = new
                {
                    HotTierMB = Math.Round(stats.HotTierSizeBytes / 1024.0 / 1024.0, 2),
                    CoolTierMB = Math.Round(stats.CoolTierSizeBytes / 1024.0 / 1024.0, 2),
                    ArchiveTierMB = Math.Round(stats.ArchiveTierSizeBytes / 1024.0 / 1024.0, 2)
                },
                ContentDistribution = new
                {
                    AudioFilesMB = Math.Round(stats.AudioFilesSizeBytes / 1024.0 / 1024.0, 2),
                    ArtifactsMB = Math.Round(stats.MeetingArtifactsSizeBytes / 1024.0 / 1024.0, 2)
                },
                EstimatedMonthlyCostUSD = stats.MonthlyEstimatedCostUSD,
                stats.LastUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get storage stats for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to get storage statistics", Details = ex.Message });
        }
    }

    /// <summary>
    /// Generate secure access URL for a file
    /// </summary>
    [HttpPost("secure-url/{userId}")]
    public async Task<IActionResult> GenerateSecureUrl(
        Guid userId, 
        [FromBody] SecureUrlRequest request)
    {
        try
        {
            var secureUrl = await _userStorageService.GenerateSecureAccessUrlAsync(
                userId, request.BlobUrl, request.ExpiryHours);

            return Ok(new
            {
                SecureUrl = secureUrl,
                ExpiresIn = $"{request.ExpiryHours} hours",
                ExpiresAt = DateTime.UtcNow.AddHours(request.ExpiryHours)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate secure URL for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to generate secure access URL", Details = ex.Message });
        }
    }

    /// <summary>
    /// Delete a specific file for a user
    /// </summary>
    [HttpDelete("file/{userId}")]
    public async Task<IActionResult> DeleteFile(Guid userId, [FromBody] DeleteFileRequest request)
    {
        try
        {
            var deleted = await _userStorageService.DeleteFileAsync(userId, request.BlobUrl);

            return Ok(new
            {
                Deleted = deleted,
                Message = deleted ? "File deleted successfully" : "File not found or already deleted"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to delete file", Details = ex.Message });
        }
    }

    /// <summary>
    /// WARNING: Delete ALL data for a user (GDPR compliance test)
    /// </summary>
    [HttpDelete("user-data/{userId}")]
    public async Task<IActionResult> DeleteAllUserData(Guid userId, [FromQuery] bool confirm = false)
    {
        if (!confirm)
        {
            return BadRequest(new 
            { 
                Error = "This operation will delete ALL user data permanently", 
                Message = "Add ?confirm=true to proceed with deletion" 
            });
        }

        try
        {
            var deletedCount = await _userStorageService.DeleteAllUserDataAsync(userId);

            return Ok(new
            {
                Message = $"All user data deleted successfully",
                UserId = userId,
                DeletedFiles = deletedCount,
                Warning = "This operation is irreversible"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete all data for user {UserId}", userId);
            return StatusCode(500, new { Error = "Failed to delete user data", Details = ex.Message });
        }
    }
}

/// <summary>
/// Request model for generating secure URLs
/// </summary>
public class SecureUrlRequest
{
    public string BlobUrl { get; set; } = string.Empty;
    public int ExpiryHours { get; set; } = 24;
}

/// <summary>
/// Request model for file deletion
/// </summary>
public class DeleteFileRequest
{
    public string BlobUrl { get; set; } = string.Empty;
}
#endif
