using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

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
    [ProducesResponseType(500)]
    public async Task<IActionResult> TranscribeAudio([FromForm] TranscribeRequest request)
    {
        try
        {
            _logger.LogInformation("Received transcription request for file: {FileName}", request.AudioFile?.FileName);

            if (request.AudioFile == null || request.AudioFile.Length == 0)
            {
                return BadRequest(new { error = "Audio file is required" });
            }

            // Validate file format
            var allowedExtensions = new[] { ".mp3", ".wav", ".m4a", ".flac", ".ogg" };
            var fileExtension = Path.GetExtension(request.AudioFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { error = $"Unsupported file format. Allowed formats: {string.Join(", ", allowedExtensions)}" });
            }

            // Validate file size (500MB limit)
            const int maxFileSizeBytes = 500 * 1024 * 1024; // 500MB
            if (request.AudioFile.Length > maxFileSizeBytes)
            {
                return BadRequest(new { error = "File size exceeds 500MB limit" });
            }

            // Simulate async processing delay
            await Task.Delay(100);

            // TODO: Implement actual transcription using OpenAI service
            // For now, return a mock response to test the infrastructure
            var response = new TranscriptionResponse
            {
                TranscriptionId = Guid.NewGuid().ToString(),
                FileName = request.AudioFile.FileName,
                FileSize = request.AudioFile.Length,
                Status = "Completed",
                TranscribedText = "This is a mock transcription response for infrastructure testing.",
                ProcessingTimeMs = 1500,
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Transcription completed for file: {FileName}, ID: {TranscriptionId}",
                request.AudioFile.FileName, response.TranscriptionId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing transcription request");
            return StatusCode(500, new { error = "An error occurred while processing the transcription" });
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
}
