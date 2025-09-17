using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Services.Interfaces;
using MeetingSummarizer.Api.Models.Requests;
using MeetingSummarizer.Api.Models.Responses;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Services.SpeakerMapping;
using MeetingSummarizer.Api.Models;

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
    private readonly ISessionSpeakerMappingService _speakerMappingService;
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<MeetingsController> _logger;

    public MeetingsController(IMeetingService meetingService, ISessionSpeakerMappingService speakerMappingService, MeetingSummarizerDbContext context, ILogger<MeetingsController> logger)
    {
        _meetingService = meetingService;
        _speakerMappingService = speakerMappingService;
        _context = context;
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
        [FromBody] MeetingSummarizer.Api.Models.Requests.CreateMeetingRequest request,
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
    /// Export meeting transcript as text file with speaker mappings applied
    /// </summary>
    /// <param name="id">Meeting ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Text file containing transcript with speaker names/roles</returns>
    [HttpGet("{id:guid}/export")]
    public async Task<ActionResult> ExportMeetingTranscript(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user token");
        }

        _logger.LogInformation("Exporting transcript for meeting {MeetingId} for user {UserId}", id, userId);

        try
        {
            // Get the meeting
            var meeting = await _meetingService.GetMeetingAsync(id, userId.Value, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", id, userId);
                return NotFound("Meeting not found");
            }

            // Check if meeting has transcription
            if (string.IsNullOrEmpty(meeting.TranscriptionJson))
            {
                _logger.LogWarning("Meeting {MeetingId} has no transcription to export", id);
                return BadRequest("Meeting has no transcription available");
            }

            // Parse the transcription JSON
            TranscriptionResult? transcription;
            try
            {
                transcription = JsonSerializer.Deserialize<TranscriptionResult>(meeting.TranscriptionJson);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse transcription JSON for meeting {MeetingId}", id);
                return StatusCode(500, "Failed to parse transcription data");
            }

            if (transcription == null || transcription.Segments == null || !transcription.Segments.Any())
            {
                _logger.LogWarning("Meeting {MeetingId} has no transcription segments to export", id);
                return BadRequest("Meeting has no transcription segments available");
            }

            // Get speaker mappings - transcriptionId is typically the BatchJob ID, not the meeting ID
            SpeakerMappingResponse? speakerMappings = null;
            
            _logger.LogInformation("Attempting to get speaker mappings for meeting {MeetingId}", id);
            _logger.LogInformation("Meeting details: Title={Title}, Status={Status}, HasSpeakerMappingsJson={HasMappings}", 
                meeting.Title, meeting.Status, !string.IsNullOrEmpty(meeting.SpeakerMappingsJson));
            
            // First try using meeting ID (might work for real-time transcriptions)
            speakerMappings = await _speakerMappingService.GetSpeakerMappingsAsync(id.ToString());
            _logger.LogInformation("Session mappings with meeting ID: Found={Found}, Count={Count}", 
                speakerMappings != null, speakerMappings?.MappedSpeakerCount ?? 0);
            
            // If not found, query the database to find the batch job ID for this meeting
            if (speakerMappings == null)
            {
                var batchJob = await _context.BatchTranscriptionJobs
                    .Where(b => b.MeetingId == id)
                    .FirstOrDefaultAsync();
                    
                _logger.LogInformation("Batch job lookup for meeting {MeetingId}: Found={Found}", id, batchJob != null);
                if (batchJob != null)
                {
                    var batchJobId = batchJob.Id.ToString();
                    _logger.LogInformation("Found batch job {BatchJobId} for meeting {MeetingId}, Status={Status}", batchJobId, id, batchJob.Status);
                    speakerMappings = await _speakerMappingService.GetSpeakerMappingsAsync(batchJobId);
                    _logger.LogInformation("Session mappings with batch job ID: Found={Found}, Count={Count}", 
                        speakerMappings != null, speakerMappings?.MappedSpeakerCount ?? 0);
                }
                else
                {
                    _logger.LogInformation("No batch job found for meeting {MeetingId} - this might be a real-time transcription", id);
                }
            }
            
            // If no session mappings found, try to get from the meeting's stored mappings
            if (speakerMappings == null && !string.IsNullOrEmpty(meeting.SpeakerMappingsJson))
            {
                try
                {
                    _logger.LogInformation("Parsing stored speaker mappings from Meeting.SpeakerMappingsJson");
                    speakerMappings = JsonSerializer.Deserialize<SpeakerMappingResponse>(meeting.SpeakerMappingsJson);
                    _logger.LogInformation("Successfully parsed stored mappings: {Count} speakers", speakerMappings?.Mappings?.Count ?? 0);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to parse stored speaker mappings for meeting {MeetingId}", id);
                }
            }
            
            _logger.LogInformation("Final speaker mappings result: {HasMappings}, Count: {Count}", 
                speakerMappings != null, speakerMappings?.Mappings?.Count ?? 0);
            
            // Generate transcript text with speaker mappings applied
            var transcriptText = GenerateTranscriptWithSpeakerMappings(transcription, speakerMappings);

            // Create filename using original filename or meeting title
            var baseFileName = !string.IsNullOrEmpty(meeting.OriginalFileName) 
                ? Path.GetFileNameWithoutExtension(meeting.OriginalFileName)
                : meeting.Title ?? $"meeting-{meeting.Id}";
            
            var fileName = $"{baseFileName}-transcript.txt";

            // Return file
            var fileBytes = Encoding.UTF8.GetBytes(transcriptText);
            
            _logger.LogInformation("Successfully exported transcript for meeting {MeetingId} ({Size} bytes)", id, fileBytes.Length);
            
            return File(fileBytes, "text/plain", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting transcript for meeting {MeetingId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while exporting the transcript");
        }
    }

    /// <summary>
    /// Generate transcript text with speaker mappings applied
    /// </summary>
    /// <param name="transcription">Original transcription result</param>
    /// <param name="speakerMappings">Speaker mappings to apply</param>
    /// <returns>Formatted transcript text</returns>
    private static string GenerateTranscriptWithSpeakerMappings(TranscriptionResult transcription, SpeakerMappingResponse? speakerMappings)
    {
        var sb = new StringBuilder();
        
        // Add header
        sb.AppendLine("Meeting Transcript");
        sb.AppendLine("==================");
        sb.AppendLine();
        
        if (transcription.Duration.HasValue)
        {
            var duration = TimeSpan.FromSeconds(transcription.Duration.Value);
            sb.AppendLine($"Duration: {duration:h\\:mm\\:ss}");
        }
        
        if (!string.IsNullOrEmpty(transcription.DetectedLanguage))
        {
            sb.AppendLine($"Language: {transcription.DetectedLanguage}");
        }
        
        sb.AppendLine($"Export Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();
        
        // Create speaker mapping lookup
        var speakerLookup = new Dictionary<string, string>();
        if (speakerMappings?.Mappings != null)
        {
            foreach (var mapping in speakerMappings.Mappings)
            {
                var displayName = !string.IsNullOrEmpty(mapping.Role) 
                    ? $"{mapping.Name} ({mapping.Role})"
                    : mapping.Name;
                speakerLookup[mapping.SpeakerId] = displayName;
            }
        }
        
        // Generate transcript with speaker names
        sb.AppendLine("Transcript:");
        sb.AppendLine("-----------");
        sb.AppendLine();
        
        foreach (var segment in transcription.Segments)
        {
            var timestamp = TimeSpan.FromSeconds(segment.Start);
            var speaker = speakerLookup.GetValueOrDefault(segment.Speaker, segment.Speaker);
            
            sb.AppendLine($"[{timestamp:h\\:mm\\:ss}] {speaker}: {segment.Text.Trim()}");
        }
        
        return sb.ToString();
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