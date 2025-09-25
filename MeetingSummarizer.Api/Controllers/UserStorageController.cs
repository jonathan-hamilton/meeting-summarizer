using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// User Storage Management API - handles persistent user data and meeting history (S6.1)
/// Provides GDPR-compliant data management with per-user isolation
/// </summary>
[ApiController]
[Route("api/users/{userId}/storage")]
public class UserStorageController : ControllerBase
{
    private readonly IUserStorageService _userStorageService;
    private readonly ILogger<UserStorageController> _logger;

    public UserStorageController(
        IUserStorageService userStorageService,
        ILogger<UserStorageController> logger)
    {
        _userStorageService = userStorageService;
        _logger = logger;
    }

    /// <summary>
    /// Upload an audio file for transcription processing
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="file">Audio file to upload</param>
    /// <returns>Upload result with blob URL and metadata</returns>
    [HttpPost("audio")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAudio(
        [FromRoute] Guid userId,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Audio file is required");
        }

        // Validate file size (1GB limit as per technical notes)
        const long maxFileSize = 1024 * 1024 * 1024; // 1GB
        if (file.Length > maxFileSize)
        {
            return BadRequest($"File size exceeds maximum limit of {maxFileSize / (1024 * 1024)} MB");
        }

        // Validate content type
        var allowedTypes = new[] { "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/flac" };
        if (!allowedTypes.Contains(file.ContentType))
        {
            return BadRequest($"Unsupported audio format. Allowed types: {string.Join(", ", allowedTypes)}");
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _userStorageService.UploadAudioFileAsync(
                userId, 
                file.FileName, 
                stream, 
                file.ContentType);

            _logger.LogInformation("User {UserId} uploaded audio file: {FileName}", userId, file.FileName);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload audio file for user {UserId}: {FileName}", userId, file.FileName);
            return StatusCode(500, "Failed to upload audio file");
        }
    }

    /// <summary>
    /// Store meeting artifacts (transcription, summary, etc.)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="request">Artifact upload request</param>
    /// <returns>Upload result with storage metadata</returns>
    [HttpPost("meetings/{meetingId}/artifacts")]
    public async Task<IActionResult> UploadMeetingArtifact(
        [FromRoute] Guid userId,
        [FromRoute] Guid meetingId,
        [FromBody] MeetingArtifactRequest request)
    {
        if (string.IsNullOrEmpty(request.ArtifactType) || string.IsNullOrEmpty(request.Content))
        {
            return BadRequest("ArtifactType and Content are required");
        }

        var allowedTypes = new[] { "transcript", "summary", "speaker-mapping", "metadata" };
        if (!allowedTypes.Contains(request.ArtifactType))
        {
            return BadRequest($"Invalid artifact type. Allowed types: {string.Join(", ", allowedTypes)}");
        }

        try
        {
            var result = await _userStorageService.UploadMeetingArtifactAsync(
                userId, 
                meetingId, 
                request.ArtifactType, 
                request.Content);

            _logger.LogInformation("User {UserId} uploaded meeting artifact: {MeetingId}/{ArtifactType}", 
                userId, meetingId, request.ArtifactType);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload meeting artifact for user {UserId}: {MeetingId}/{ArtifactType}", 
                userId, meetingId, request.ArtifactType);
            return StatusCode(500, "Failed to upload meeting artifact");
        }
    }

    /// <summary>
    /// Retrieve a specific audio file
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="blobUrl">Blob URL of the audio file</param>
    /// <returns>Audio file stream</returns>
    [HttpGet("audio")]
    public async Task<IActionResult> GetAudioFile(
        [FromRoute] Guid userId,
        [FromQuery, Required] string blobUrl)
    {
        try
        {
            var result = await _userStorageService.GetAudioFileAsync(userId, blobUrl);
            
            return File(result.Content, result.ContentType, result.FileName);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied to this audio file");
        }
        catch (FileNotFoundException)
        {
            return NotFound("Audio file not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audio file for user {UserId}: {BlobUrl}", userId, blobUrl);
            return StatusCode(500, "Failed to retrieve audio file");
        }
    }

    /// <summary>
    /// Retrieve meeting artifact content
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="artifactType">Type of artifact (transcript, summary, etc.)</param>
    /// <returns>Artifact content</returns>
    [HttpGet("meetings/{meetingId}/artifacts/{artifactType}")]
    public async Task<IActionResult> GetMeetingArtifact(
        [FromRoute] Guid userId,
        [FromRoute] Guid meetingId,
        [FromRoute] string artifactType)
    {
        try
        {
            var result = await _userStorageService.GetMeetingArtifactAsync(userId, meetingId, artifactType);
            
            return File(result.Content, result.ContentType, $"{artifactType}-{meetingId}.txt");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied to this meeting artifact");
        }
        catch (FileNotFoundException)
        {
            return NotFound("Meeting artifact not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve meeting artifact for user {UserId}: {MeetingId}/{ArtifactType}", 
                userId, meetingId, artifactType);
            return StatusCode(500, "Failed to retrieve meeting artifact");
        }
    }

    /// <summary>
    /// List all files for a user with optional filtering
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="prefix">Optional prefix filter (e.g., "audio/", "meetings/")</param>
    /// <param name="maxResults">Maximum number of results (default: 100)</param>
    /// <returns>List of user files with metadata</returns>
    [HttpGet("files")]
    public async Task<IActionResult> ListUserFiles(
        [FromRoute] Guid userId,
        [FromQuery] string? prefix = null,
        [FromQuery] int maxResults = 100)
    {
        if (maxResults <= 0 || maxResults > 1000)
        {
            return BadRequest("maxResults must be between 1 and 1000");
        }

        try
        {
            var files = await _userStorageService.ListUserFilesAsync(userId, prefix, maxResults);
            
            return Ok(new
            {
                UserId = userId,
                TotalFiles = files.Count(),
                Prefix = prefix,
                Files = files
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list files for user {UserId}", userId);
            return StatusCode(500, "Failed to list user files");
        }
    }

    /// <summary>
    /// Get storage usage statistics for the user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Storage usage statistics</returns>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStorageStats([FromRoute] Guid userId)
    {
        try
        {
            var stats = await _userStorageService.GetStorageStatsAsync(userId);
            
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get storage stats for user {UserId}", userId);
            return StatusCode(500, "Failed to get storage statistics");
        }
    }

    /// <summary>
    /// Generate a secure, time-limited access URL for file sharing
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="blobUrl">Blob URL to generate access for</param>
    /// <param name="expiryHours">Hours until URL expires (1-168 hours, default: 24)</param>
    /// <returns>Secure access URL with expiration time</returns>
    [HttpPost("secure-access")]
    public async Task<IActionResult> GenerateSecureAccessUrl(
        [FromRoute] Guid userId,
        [FromBody] SecureAccessRequest request)
    {
        if (string.IsNullOrEmpty(request.BlobUrl))
        {
            return BadRequest("BlobUrl is required");
        }

        if (request.ExpiryHours < 1 || request.ExpiryHours > 168) // Max 7 days
        {
            return BadRequest("ExpiryHours must be between 1 and 168 (7 days)");
        }

        try
        {
            var secureUrl = await _userStorageService.GenerateSecureAccessUrlAsync(
                userId, 
                request.BlobUrl, 
                request.ExpiryHours);

            return Ok(new
            {
                SecureUrl = secureUrl,
                ExpiresAt = DateTime.UtcNow.AddHours(request.ExpiryHours),
                ExpiryHours = request.ExpiryHours
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied to generate secure URL for this file");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate secure access URL for user {UserId}: {BlobUrl}", 
                userId, request.BlobUrl);
            return StatusCode(500, "Failed to generate secure access URL");
        }
    }

    /// <summary>
    /// Delete a specific file (GDPR compliance)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="blobUrl">Blob URL to delete</param>
    /// <returns>Deletion result</returns>
    [HttpDelete("files")]
    public async Task<IActionResult> DeleteFile(
        [FromRoute] Guid userId,
        [FromQuery, Required] string blobUrl)
    {
        try
        {
            var deleted = await _userStorageService.DeleteFileAsync(userId, blobUrl);
            
            if (deleted)
            {
                _logger.LogInformation("User {UserId} deleted file: {BlobUrl}", userId, blobUrl);
                return Ok(new { Message = "File deleted successfully" });
            }
            else
            {
                return NotFound("File not found or already deleted");
            }
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied to delete this file");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file for user {UserId}: {BlobUrl}", userId, blobUrl);
            return StatusCode(500, "Failed to delete file");
        }
    }

    /// <summary>
    /// Delete all user data (GDPR Right to be Forgotten)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Number of files deleted</returns>
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllUserData([FromRoute] Guid userId)
    {
        try
        {
            var deletedCount = await _userStorageService.DeleteAllUserDataAsync(userId);
            
            _logger.LogWarning("User {UserId} requested deletion of all data - {DeletedCount} files deleted", 
                userId, deletedCount);

            return Ok(new 
            { 
                Message = "All user data deleted successfully", 
                DeletedFilesCount = deletedCount,
                DeletionTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete all data for user {UserId}", userId);
            return StatusCode(500, "Failed to delete user data");
        }
    }

    /// <summary>
    /// Change storage tier for cost optimization
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="request">Storage tier change request</param>
    /// <returns>Tier change result</returns>
    [HttpPatch("tier")]
    public async Task<IActionResult> ChangeStorageTier(
        [FromRoute] Guid userId,
        [FromBody] StorageTierChangeRequest request)
    {
        if (string.IsNullOrEmpty(request.BlobUrl))
        {
            return BadRequest("BlobUrl is required");
        }

        try
        {
            var success = await _userStorageService.ChangeStorageTierAsync(
                userId, 
                request.BlobUrl, 
                request.TargetTier);

            if (success)
            {
                return Ok(new { Message = $"Storage tier changed to {request.TargetTier}" });
            }
            else
            {
                return BadRequest("Failed to change storage tier");
            }
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied to change storage tier for this file");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to change storage tier for user {UserId}: {BlobUrl} -> {TargetTier}", 
                userId, request.BlobUrl, request.TargetTier);
            return StatusCode(500, "Failed to change storage tier");
        }
    }
}

/// <summary>
/// Request model for meeting artifact upload
/// </summary>
public class MeetingArtifactRequest
{
    [Required]
    public string ArtifactType { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// Request model for secure access URL generation
/// </summary>
public class SecureAccessRequest
{
    [Required]
    public string BlobUrl { get; set; } = string.Empty;
    
    public int ExpiryHours { get; set; } = 24;
}

/// <summary>
/// Request model for storage tier changes
/// </summary>
public class StorageTierChangeRequest
{
    [Required]
    public string BlobUrl { get; set; } = string.Empty;
    
    [Required]
    public StorageTier TargetTier { get; set; }
}
