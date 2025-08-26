using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller specifically for testing Azure Speech Services Portal Configuration
/// Tests the exact same setup that worked successfully in Azure Speech Playground
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AzurePortalTestController : ControllerBase
{
    private readonly ILogger<AzurePortalTestController> _logger;
    private readonly AzurePortalTranscriptionService _azurePortalService;

    public AzurePortalTestController(
        ILogger<AzurePortalTestController> logger,
        AzurePortalTranscriptionService azurePortalService)
    {
        _logger = logger;
        _azurePortalService = azurePortalService;
    }

    /// <summary>
    /// Test the exact Azure Speech Services configuration that worked in the portal
    /// Uses the same settings: Real-time transcription + Speaker diarization ON + Detailed format + English (US)
    /// </summary>
    /// <param name="audioFile">The audio file to transcribe (same format as tested in portal)</param>
    /// <returns>Transcription result with speaker diarization</returns>
    [HttpPost("transcribe-portal-config")]
    public async Task<IActionResult> TranscribeWithPortalConfig([FromForm] IFormFile audioFile)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("Portal configuration test requested [CorrelationId: {CorrelationId}] - File: {FileName}",
            correlationId, audioFile?.FileName);

        if (audioFile == null || audioFile.Length == 0)
        {
            return BadRequest(new
            {
                Status = "Error",
                Message = "No audio file provided",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow
            });
        }

        try
        {
            // Save uploaded file temporarily
            var tempFilePath = Path.GetTempFileName();
            var actualFilePath = Path.ChangeExtension(tempFilePath, Path.GetExtension(audioFile.FileName));
            
            using (var stream = new FileStream(actualFilePath, FileMode.Create))
            {
                await audioFile.CopyToAsync(stream);
            }

            try
            {
                // Use our portal-style transcription method
                var result = await _azurePortalService.TranscribeFileWithPortalConfigAsync(
                    actualFilePath, 
                    HttpContext.RequestAborted);

                var response = new
                {
                    Status = !string.IsNullOrEmpty(result.Text) ? "Success" : "NoTranscription",
                    Message = !string.IsNullOrEmpty(result.Text) ? "Transcription completed successfully" : "No speech detected in audio",
                    CorrelationId = correlationId,
                    Timestamp = DateTime.UtcNow,
                    Configuration = new
                    {
                        Method = "Azure Speech Services - Portal Configuration",
                        Language = "en-US",
                        SpeakerDiarization = true,
                        OutputFormat = "Detailed",
                        InputFile = audioFile.FileName,
                        FileSizeMB = Math.Round(audioFile.Length / (1024.0 * 1024), 2)
                    },
                    Results = new
                    {
                        TranscribedText = result.Text,
                        SpeakerCount = result.Segments?.Select(s => s.Speaker).Distinct().Count() ?? 0,
                        SegmentCount = result.Segments?.Count ?? 0,
                        ProcessingDurationSeconds = result.Duration,
                        DetectedLanguage = result.DetectedLanguage,
                        Segments = result.Segments?.Select(s => new
                        {
                            Speaker = s.Speaker,
                            Text = s.Text,
                            StartSeconds = s.Start,
                            EndSeconds = s.End,
                            DurationSeconds = Math.Round(s.End - s.Start, 2),
                            Confidence = s.Confidence
                        }).ToList()
                    }
                };

                _logger.LogInformation("Portal configuration test completed [CorrelationId: {CorrelationId}] - Success: {HasText}, Speakers: {SpeakerCount}, Segments: {SegmentCount}",
                    correlationId, !string.IsNullOrEmpty(result.Text), result.Segments?.Select(s => s.Speaker).Distinct().Count() ?? 0, result.Segments?.Count ?? 0);

                return Ok(response);
            }
            finally
            {
                // Clean up temporary file
                if (System.IO.File.Exists(actualFilePath))
                {
                    System.IO.File.Delete(actualFilePath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Portal configuration test failed [CorrelationId: {CorrelationId}]", correlationId);

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Transcription failed due to internal error",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message,
                Details = "Check that Azure Speech Services configuration matches portal settings"
            });
        }
    }

    /// <summary>
    /// Get information about the Azure Speech Services configuration
    /// Useful for verifying it matches the portal setup
    /// </summary>
    /// <returns>Configuration information</returns>
    [HttpGet("configuration-info")]
    public IActionResult GetConfigurationInfo()
    {
        try
        {
            var response = new
            {
                Status = "Active",
                Timestamp = DateTime.UtcNow,
                AzureConfiguration = new
                {
                    ServiceName = "Azure Speech Services",
                    ExpectedLanguage = "en-US",
                    SpeakerDiarizationEnabled = true,
                    OutputFormat = "Detailed",
                    TranscriptionMethod = "Real-time Continuous Recognition",
                    AudioInputMethod = "FromWavFileInput",
                    PortalTestStatus = "Successfully tested in Azure Speech Playground"
                },
                SupportedFormats = new[]
                {
                    "WAV",
                    "MP3", 
                    "FLAC",
                    "OGG"
                },
                PortalTestResults = new
                {
                    TestFile = "sample-scrum-no-identifiers.wav",
                    SpeakersDetected = "Guest-1, potentially more",
                    TestOutput = "[Guest-1 00:00] Good morning everyone. Let's get started with our Sprint stand up. I'll go first."
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get configuration info");

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Failed to retrieve configuration information",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }
}
