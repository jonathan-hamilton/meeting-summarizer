using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for speaker mapping operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SpeakerMappingController : ControllerBase
{
    private readonly ISpeakerMappingService _speakerMappingService;
    private readonly ISessionSpeakerMappingService _sessionSpeakerMappingService;
    private readonly ILogger<SpeakerMappingController> _logger;

    public SpeakerMappingController(
        ISpeakerMappingService speakerMappingService,
        ISessionSpeakerMappingService sessionSpeakerMappingService,
        ILogger<SpeakerMappingController> logger)
    {
        _speakerMappingService = speakerMappingService;
        _sessionSpeakerMappingService = sessionSpeakerMappingService;
        _logger = logger;
    }

    /// <summary>
    /// Save speaker mappings for a transcription
    /// </summary>
    /// <param name="request">Speaker mapping request containing transcription ID and mappings</param>
    /// <returns>Saved speaker mappings with metadata</returns>
    [HttpPost("map")]
    [ProducesResponseType(typeof(SpeakerMappingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SpeakerMappingResponse>> SaveSpeakerMappings(
        [FromBody] SpeakerMappingRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request cannot be null");
            }

            _logger.LogInformation("Saving speaker mappings for transcription {TranscriptionId}",
                request.TranscriptionId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.Mappings == null || !request.Mappings.Any())
            {
                return BadRequest("Mappings cannot be null or empty");
            }

            // Validate that speaker IDs are unique within the request
            var duplicateSpeakers = request.Mappings
                .GroupBy(m => m.SpeakerId)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateSpeakers.Any())
            {
                ModelState.AddModelError("Mappings",
                    $"Duplicate speaker IDs found: {string.Join(", ", duplicateSpeakers)}");
                return BadRequest(ModelState);
            }

            var response = await _speakerMappingService.SaveSpeakerMappingsAsync(request);

            _logger.LogInformation("Successfully saved {Count} speaker mappings for transcription {TranscriptionId}",
                response.MappedSpeakerCount, request.TranscriptionId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving speaker mappings for transcription {TranscriptionId}",
                request?.TranscriptionId ?? "unknown");
            return StatusCode(500, "An error occurred while saving speaker mappings");
        }
    }

    /// <summary>
    /// Retrieve speaker mappings for a transcription
    /// </summary>
    /// <param name="transcriptionId">ID of the transcription</param>
    /// <returns>Speaker mappings if found, otherwise 404</returns>
    [HttpGet("{transcriptionId}")]
    [ProducesResponseType(typeof(SpeakerMappingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SpeakerMappingResponse>> GetSpeakerMappings(string transcriptionId)
    {
        try
        {
            _logger.LogInformation("Retrieving speaker mappings for transcription {TranscriptionId}",
                transcriptionId);

            if (string.IsNullOrWhiteSpace(transcriptionId))
            {
                return BadRequest("Transcription ID is required");
            }

            var mappings = await _speakerMappingService.GetSpeakerMappingsAsync(transcriptionId);

            if (mappings == null)
            {
                _logger.LogInformation("No speaker mappings found for transcription {TranscriptionId}",
                    transcriptionId);
                return NotFound();
            }

            _logger.LogInformation("Found {Count} speaker mappings for transcription {TranscriptionId}",
                mappings.MappedSpeakerCount, transcriptionId);

            return Ok(mappings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving speaker mappings for transcription {TranscriptionId}",
                transcriptionId);
            return StatusCode(500, "An error occurred while retrieving speaker mappings");
        }
    }

    /// <summary>
    /// Delete speaker mappings for a transcription
    /// </summary>
    /// <param name="transcriptionId">ID of the transcription</param>
    /// <returns>Success status</returns>
    [HttpDelete("{transcriptionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteSpeakerMappings(string transcriptionId)
    {
        try
        {
            _logger.LogInformation("Deleting speaker mappings for transcription {TranscriptionId}",
                transcriptionId);

            if (string.IsNullOrWhiteSpace(transcriptionId))
            {
                return BadRequest("Transcription ID is required");
            }

            var deleted = await _speakerMappingService.DeleteSpeakerMappingsAsync(transcriptionId);

            if (!deleted)
            {
                _logger.LogInformation("No speaker mappings found to delete for transcription {TranscriptionId}",
                    transcriptionId);
                return NotFound();
            }

            _logger.LogInformation("Successfully deleted speaker mappings for transcription {TranscriptionId}",
                transcriptionId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting speaker mappings for transcription {TranscriptionId}",
                transcriptionId);
            return StatusCode(500, "An error occurred while deleting speaker mappings");
        }
    }

    #region Session-Based Override Methods (S3.1)

    /// <summary>
    /// Apply a session-based speaker override
    /// </summary>
    [HttpPost("session/override")]
    [ProducesResponseType(typeof(SessionOverrideResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SessionOverrideResponse>> ApplySessionOverride(
        [FromBody] SessionOverrideRequest request)
    {
        try
        {
            _logger.LogInformation("Applying session override for speaker {SpeakerId} in session {SessionId}",
                request.SpeakerId, request.SessionId);

            if (string.IsNullOrWhiteSpace(request.SpeakerId) || string.IsNullOrWhiteSpace(request.NewName))
            {
                return BadRequest("Speaker ID and new name are required");
            }

            var result = await _sessionSpeakerMappingService.ApplySessionOverrideAsync(
                "temp_transcription", // We'll enhance this in the future to support actual transcription IDs
                request.SessionId ?? Guid.NewGuid().ToString(),
                request.SpeakerId,
                request.NewName,
                string.Empty); // No role change for now

            var response = new SessionOverrideResponse
            {
                Success = true,
                SessionId = request.SessionId ?? Guid.NewGuid().ToString(),
                SpeakerId = request.SpeakerId,
                OriginalName = null, // Will be enhanced when we integrate with actual speaker data
                NewName = request.NewName
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying session override for speaker {SpeakerId}", request.SpeakerId);
            return BadRequest($"Failed to apply override: {ex.Message}");
        }
    }

    /// <summary>
    /// Revert a session-based speaker override
    /// </summary>
    [HttpPost("session/revert")]
    [ProducesResponseType(typeof(SessionOverrideResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SessionOverrideResponse>> RevertSessionOverride(
        [FromBody] SessionRevertRequest request)
    {
        try
        {
            _logger.LogInformation("Reverting session override for speaker {SpeakerId} in session {SessionId}",
                request.SpeakerId, request.SessionId);

            if (string.IsNullOrWhiteSpace(request.SpeakerId) || string.IsNullOrWhiteSpace(request.SessionId))
            {
                return BadRequest("Speaker ID and session ID are required");
            }

            var result = await _sessionSpeakerMappingService.RevertSessionOverrideAsync(
                "temp_transcription", // We'll enhance this in the future to support actual transcription IDs
                request.SessionId,
                request.SpeakerId);

            var response = new SessionOverrideResponse
            {
                Success = true,
                SessionId = request.SessionId,
                SpeakerId = request.SpeakerId,
                OriginalName = null, // Will be enhanced when we integrate with actual speaker data
                NewName = string.Empty // Will be enhanced when we integrate with actual speaker data
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverting session override for speaker {SpeakerId}", request.SpeakerId);
            return BadRequest($"Failed to revert override: {ex.Message}");
        }
    }

    /// <summary>
    /// Clear all session data for privacy
    /// </summary>
    [HttpPost("session/clear")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ClearSessionData([FromBody] SessionClearRequest request)
    {
        try
        {
            _logger.LogInformation("Clearing session data for session {SessionId}", request.SessionId);

            if (string.IsNullOrWhiteSpace(request.SessionId))
            {
                return BadRequest("Session ID is required");
            }

            await _sessionSpeakerMappingService.ClearSessionDataAsync(request.SessionId);

            _logger.LogInformation("Successfully cleared session data for session {SessionId}", request.SessionId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing session data for session {SessionId}", request.SessionId);
            return BadRequest($"Failed to clear session data: {ex.Message}");
        }
    }

    /// <summary>
    /// Get session status and override count
    /// </summary>
    [HttpGet("session/status/{sessionId}")]
    [ProducesResponseType(typeof(SessionStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SessionStatusResponse>> GetSessionStatus(string sessionId)
    {
        try
        {
            _logger.LogInformation("Getting session status for session {SessionId}", sessionId);

            if (string.IsNullOrWhiteSpace(sessionId))
            {
                return BadRequest("Session ID is required");
            }

            var sessionData = await _sessionSpeakerMappingService.GetSessionDataAsync(sessionId);

            if (sessionData == null)
            {
                return NotFound($"Session {sessionId} not found or expired");
            }

            var response = new SessionStatusResponse
            {
                SessionId = sessionId,
                IsActive = DateTime.UtcNow.Subtract(sessionData.LastActivity).TotalMinutes < 120, // 2 hours
                OverrideCount = sessionData.Actions.Count
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session status for session {SessionId}", sessionId);
            return StatusCode(500, "An error occurred while getting session status");
        }
    }

    #endregion
}
