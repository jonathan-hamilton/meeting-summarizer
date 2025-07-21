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
    private readonly ILogger<SpeakerMappingController> _logger;

    public SpeakerMappingController(
        ISpeakerMappingService speakerMappingService,
        ILogger<SpeakerMappingController> logger)
    {
        _speakerMappingService = speakerMappingService;
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
}
