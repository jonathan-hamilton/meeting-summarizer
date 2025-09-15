using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using MeetingSummarizer.Api.Services.Interfaces;
using MeetingSummarizer.Api.Models.Requests;
using MeetingSummarizer.Api.Models.Responses;
using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// REST API endpoints for persistent meeting management
/// Provides CRUD operations for meeting records with user isolation
/// Part of S6.5 Increment 4: REST API Endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;
    private readonly ILogger<MeetingsController> _logger;

    public MeetingsController(IMeetingService meetingService, ILogger<MeetingsController> logger)
    {
        _meetingService = meetingService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new meeting record
    /// </summary>
    /// <param name="request">Meeting creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created meeting</returns>
    [HttpPost]
    public async Task<ActionResult<Meeting>> CreateMeeting(
        [FromBody] CreateMeetingRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            _logger.LogWarning("CreateMeeting called without valid user ID in token");
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Creating meeting for user {UserId}: {Title}", userId, request.Title);

        try
        {
            var meeting = await _meetingService.CreateMeetingAsync(
                userId.Value,
                request.Title,
                request.Description,
                request.OriginalFileName,
                request.FileSizeBytes,
                request.DurationSeconds,
                request.BlobStoragePath,
                cancellationToken);

            _logger.LogInformation("Created meeting {MeetingId} for user {UserId}", meeting.Id, userId);
            return CreatedAtAction(nameof(GetMeeting), new { id = meeting.Id }, meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating meeting for user {UserId}", userId);
            return StatusCode(500, "An error occurred while creating the meeting");
        }
    }

    /// <summary>
    /// Get a specific meeting by ID
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Meeting details</returns>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Meeting>> GetMeeting(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Getting meeting {MeetingId} for user {UserId}", id, userId);

        try
        {
            var meeting = await _meetingService.GetMeetingAsync(id, userId.Value, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", id, userId);
                return NotFound("Meeting not found");
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting meeting {MeetingId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while retrieving the meeting");
        }
    }

    /// <summary>
    /// Get user's meeting history with filtering and pagination
    /// </summary>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="statusFilter">Optional status filter</param>
    /// <param name="pageNumber">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated meeting list</returns>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<MeetingListItem>>> GetMeetings(
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? statusFilter = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        // Validate pagination parameters
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        _logger.LogInformation("Getting meetings for user {UserId}, search: {SearchTerm}, status: {StatusFilter}, page: {PageNumber}", 
            userId, searchTerm, statusFilter, pageNumber);

        try
        {
            MeetingStatus? status = null;
            if (statusFilter.HasValue && Enum.IsDefined(typeof(MeetingStatus), statusFilter.Value))
            {
                status = (MeetingStatus)statusFilter.Value;
            }

            var result = await _meetingService.GetUserMeetingsAsync(
                userId.Value,
                searchTerm,
                status,
                pageNumber,
                pageSize,
                cancellationToken);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting meetings for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving meetings");
        }
    }

    /// <summary>
    /// Update meeting metadata (title, description)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="request">Updated metadata</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting</returns>
    [HttpPut("{id:guid}/metadata")]
    public async Task<ActionResult<Meeting>> UpdateMeetingMetadata(
        Guid id,
        [FromBody] UpdateMeetingMetadataRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Updating metadata for meeting {MeetingId} by user {UserId}", id, userId);

        try
        {
            var meeting = await _meetingService.UpdateMeetingMetadataAsync(
                id,
                userId.Value,
                request.Title,
                request.Description,
                cancellationToken);

            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", id, userId);
                return NotFound("Meeting not found");
            }

            _logger.LogInformation("Updated metadata for meeting {MeetingId}", id);
            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating metadata for meeting {MeetingId} by user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while updating the meeting");
        }
    }

    /// <summary>
    /// Delete a meeting (soft delete)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteMeeting(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Deleting meeting {MeetingId} for user {UserId}", id, userId);

        try
        {
            var success = await _meetingService.DeleteMeetingAsync(id, userId.Value, cancellationToken);
            if (!success)
            {
                _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", id, userId);
                return NotFound("Meeting not found");
            }

            _logger.LogInformation("Deleted meeting {MeetingId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting meeting {MeetingId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while deleting the meeting");
        }
    }

    /// <summary>
    /// Get user's meeting statistics
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Meeting statistics</returns>
    [HttpGet("statistics")]
    public async Task<ActionResult<MeetingStatistics>> GetMeetingStatistics(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Getting statistics for user {UserId}", userId);

        try
        {
            var statistics = await _meetingService.GetMeetingStatisticsAsync(userId.Value, cancellationToken);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting statistics for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }

    // Internal endpoints for system use (batch job completion, etc.)

    /// <summary>
    /// Update meeting processing status (internal use)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="status">New status</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting</returns>
    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<Meeting>> UpdateMeetingStatus(
        Guid id,
        [FromBody] MeetingStatus status,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating status for meeting {MeetingId} to {Status}", id, status);

        try
        {
            var meeting = await _meetingService.UpdateMeetingStatusAsync(id, status, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found for status update", id);
                return NotFound("Meeting not found");
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status for meeting {MeetingId}", id);
            return StatusCode(500, "An error occurred while updating meeting status");
        }
    }

    /// <summary>
    /// Update meeting with transcription data (internal use)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="request">Transcription update data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting</returns>
    [HttpPut("{id:guid}/transcription")]
    public async Task<ActionResult<Meeting>> UpdateMeetingTranscription(
        Guid id,
        [FromBody] UpdateTranscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating transcription for meeting {MeetingId}", id);

        try
        {
            var meeting = await _meetingService.UpdateMeetingTranscriptionAsync(
                id,
                request.TranscriptionJson,
                request.SpeakerMappingsJson,
                request.TokensConsumed,
                cancellationToken);

            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found for transcription update", id);
                return NotFound("Meeting not found");
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transcription for meeting {MeetingId}", id);
            return StatusCode(500, "An error occurred while updating transcription");
        }
    }

    /// <summary>
    /// Update meeting with summary data (internal use)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="request">Summary update data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting</returns>
    [HttpPut("{id:guid}/summary")]
    public async Task<ActionResult<Meeting>> UpdateMeetingSummary(
        Guid id,
        [FromBody] UpdateSummaryRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating summary for meeting {MeetingId}", id);

        try
        {
            var meeting = await _meetingService.UpdateMeetingSummaryAsync(
                id,
                request.SummaryJson,
                request.ActionItemsJson,
                request.TokensConsumed,
                cancellationToken);

            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found for summary update", id);
                return NotFound("Meeting not found");
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating summary for meeting {MeetingId}", id);
            return StatusCode(500, "An error occurred while updating summary");
        }
    }

    /// <summary>
    /// Mark meeting as completed (internal use)
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Completed meeting</returns>
    [HttpPut("{id:guid}/complete")]
    public async Task<ActionResult<Meeting>> CompleteMeeting(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Completing meeting {MeetingId}", id);

        try
        {
            var meeting = await _meetingService.CompleteMeetingAsync(id, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found for completion", id);
                return NotFound("Meeting not found");
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing meeting {MeetingId}", id);
            return StatusCode(500, "An error occurred while completing meeting");
        }
    }

    /// <summary>
    /// Extract current user ID from JWT token
    /// </summary>
    /// <returns>User ID if valid token, null otherwise</returns>
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                         User.FindFirst("sub")?.Value ??
                         User.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            _logger.LogWarning("No user ID claim found in token");
            return null;
        }

        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        _logger.LogWarning("Invalid user ID format in token: {UserIdClaim}", userIdClaim);
        return null;
    }
}