using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Helpers;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for meeting transcription and summarization operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SummaryController : ControllerBase
{
    private readonly ILogger<SummaryController> _logger;
    private readonly IOpenAIService _openAIService;

    public SummaryController(ILogger<SummaryController> logger, IOpenAIService openAIService)
    {
        _logger = logger;
        _openAIService = openAIService;
    }

    /// <summary>
    /// Upload an audio file for transcription
    /// </summary>
    /// <param name="request">The transcription request containing the audio file</param>
    /// <returns>Transcription result</returns>
    [HttpPost("transcribe")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TranscriptionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(408)]
    [ProducesResponseType(503)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> TranscribeAudio([FromForm] TranscribeRequest request)
    {
        try
        {
            _logger.LogInformation("Received transcription request for file: {FileName}, Size: {FileSize}",
                request.AudioFile?.FileName, request.AudioFile?.Length);

            // Enhanced file validation
            var validationResult = AudioFileValidator.ValidateAudioFile(request.AudioFile);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("File validation failed for {FileName}: {ValidationMessage}",
                    request.AudioFile?.FileName, validationResult.Message);
                return BadRequest(new { error = validationResult.Message });
            }

            _logger.LogInformation("File validation passed for {FileName} ({FileSize})",
                request.AudioFile!.FileName, AudioFileValidator.FormatFileSize(request.AudioFile.Length));

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                // Use OpenAI service for transcription with speaker diarization
                using var audioStream = request.AudioFile.OpenReadStream();
                var transcriptionResult = await _openAIService.TranscribeAudioWithMetadataAsync(
                    audioStream,
                    request.AudioFile.FileName
                );

                stopwatch.Stop();

                // Convert to API response format
                var response = TranscriptionResponse.FromResult(
                    transcriptionResult,
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    stopwatch.ElapsedMilliseconds
                );

                _logger.LogInformation("Transcription completed for file: {FileName}, ID: {TranscriptionId}, Speakers: {SpeakerCount}",
                    request.AudioFile.FileName, response.TranscriptionId, response.SpeakerCount);

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "OpenAI service error during transcription for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    ex.Message,
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(503, errorResponse); // Service Unavailable
            }
            catch (UnauthorizedAccessException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Authentication error during transcription for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    "Authentication failed with OpenAI service",
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(401, errorResponse); // Unauthorized
            }
            catch (TaskCanceledException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Transcription timeout for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    "Transcription request timed out",
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(408, errorResponse); // Request Timeout
            }
            catch (IOException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "File I/O error during transcription for file: {FileName}", request.AudioFile.FileName);

                return BadRequest(new { error = "Unable to read the uploaded file. Please try uploading again." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing transcription request");
            return StatusCode(500, new { error = "An error occurred while processing the transcription" });
        }
    }

    /// <summary>
    /// Upload an audio file for enhanced transcription with speaker diarization
    /// </summary>
    /// <param name="request">The transcription request containing the audio file</param>
    /// <returns>Enhanced transcription result with speaker segments</returns>
    [HttpPost("transcribe-enhanced")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TranscriptionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(408)]
    [ProducesResponseType(503)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> TranscribeAudioEnhanced([FromForm] TranscribeRequest request)
    {
        try
        {
            _logger.LogInformation("Received enhanced transcription request for file: {FileName}, Size: {FileSize}",
                request.AudioFile?.FileName, request.AudioFile?.Length);

            // Enhanced file validation
            var validationResult = AudioFileValidator.ValidateAudioFile(request.AudioFile);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("File validation failed for enhanced transcription {FileName}: {ValidationMessage}",
                    request.AudioFile?.FileName, validationResult.Message);
                return BadRequest(new { error = validationResult.Message });
            }

            _logger.LogInformation("File validation passed for enhanced transcription {FileName} ({FileSize})",
                request.AudioFile!.FileName, AudioFileValidator.FormatFileSize(request.AudioFile.Length));

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                // Use OpenAI service for enhanced transcription with speaker diarization
                using var audioStream = request.AudioFile.OpenReadStream();
                var transcriptionResult = await _openAIService.TranscribeAudioWithMetadataAsync(
                    audioStream,
                    request.AudioFile.FileName
                );

                stopwatch.Stop();

                // Convert to API response format
                var response = TranscriptionResponse.FromResult(
                    transcriptionResult,
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    stopwatch.ElapsedMilliseconds
                );

                _logger.LogInformation("Enhanced transcription completed for file: {FileName}, ID: {TranscriptionId}, Speakers: {SpeakerCount}, Segments: {SegmentCount}",
                    request.AudioFile.FileName, response.TranscriptionId, response.SpeakerCount, response.SpeakerSegments?.Count ?? 0);

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "OpenAI service error during enhanced transcription for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    ex.Message,
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(503, errorResponse); // Service Unavailable
            }
            catch (UnauthorizedAccessException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Authentication error during enhanced transcription for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    "Authentication failed with OpenAI service",
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(401, errorResponse); // Unauthorized
            }
            catch (TaskCanceledException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Enhanced transcription timeout for file: {FileName}", request.AudioFile.FileName);

                var errorResponse = TranscriptionResponse.FromError(
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    "Enhanced transcription request timed out",
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(408, errorResponse); // Request Timeout
            }
            catch (IOException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "File I/O error during enhanced transcription for file: {FileName}", request.AudioFile.FileName);

                return BadRequest(new { error = "Unable to read the uploaded file. Please try uploading again." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing enhanced transcription request");
            return StatusCode(500, new { error = "An error occurred while processing the enhanced transcription" });
        }
    }

    /// <summary>
    /// Get the status of a transcription request
    /// </summary>
    /// <param name="transcriptionId">The ID of the transcription</param>
    /// <returns>Transcription status and result</returns>
    [HttpGet("transcribe/{transcriptionId}")]
    [ProducesResponseType(typeof(TranscriptionResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetTranscription(string transcriptionId)
    {
        _logger.LogInformation("Getting transcription status for ID: {TranscriptionId}", transcriptionId);

        // Simulate async lookup delay
        await Task.Delay(50);

        // TODO: Implement actual transcription lookup
        // For now, return a mock response
        var response = new TranscriptionResponse
        {
            TranscriptionId = transcriptionId,
            FileName = "example.mp3",
            FileSize = 1024000,
            Status = "Completed",
            TranscribedText = "Mock transcription text for testing purposes.",
            ProcessingTimeMs = 2000,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        return Ok(response);
    }

    /// <summary>
    /// Test endpoint to validate audio file without processing
    /// </summary>
    /// <param name="request">The transcription request containing the audio file</param>
    /// <returns>Validation result only</returns>
    [HttpPost("validate")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(400)]
    public IActionResult ValidateAudioFile([FromForm] TranscribeRequest request)
    {
        _logger.LogInformation("Testing file validation for: {FileName}, Size: {FileSize}",
            request.AudioFile?.FileName, request.AudioFile?.Length);

        // Test our validation logic
        var validationResult = AudioFileValidator.ValidateAudioFile(request.AudioFile);

        var response = new
        {
            IsValid = validationResult.IsValid,
            Message = validationResult.Message,
            FileName = request.AudioFile?.FileName,
            FileSize = request.AudioFile?.Length,
            FormattedSize = request.AudioFile != null ? AudioFileValidator.FormatFileSize(request.AudioFile.Length) : "N/A",
            SupportedExtensions = AudioFileValidator.SupportedExtensions,
            MaxFileSize = AudioFileValidator.FormatFileSize(AudioFileValidator.MaxFileSizeBytes),
            MinFileSize = AudioFileValidator.FormatFileSize(AudioFileValidator.MinFileSizeBytes)
        };

        if (validationResult.IsValid)
        {
            _logger.LogInformation("File validation passed: {Message}", validationResult.Message);
            return Ok(response);
        }
        else
        {
            _logger.LogWarning("File validation failed: {Message}", validationResult.Message);
            return BadRequest(response);
        }
    }
}
