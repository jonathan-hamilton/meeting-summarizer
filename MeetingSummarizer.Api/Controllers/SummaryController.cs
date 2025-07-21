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
    private readonly ISummarizationService _summarizationService;
    private readonly ISpeakerMappingService _speakerMappingService;

    public SummaryController(
        ILogger<SummaryController> logger,
        IOpenAIService openAIService,
        ISummarizationService summarizationService,
        ISpeakerMappingService speakerMappingService)
    {
        _logger = logger;
        _openAIService = openAIService;
        _summarizationService = summarizationService;
        _speakerMappingService = speakerMappingService;
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

    /// <summary>
    /// Generate a summary from transcript text
    /// </summary>
    /// <param name="request">The summary generation request</param>
    /// <returns>Generated summary</returns>
    [HttpPost("generate")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(SummaryResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(503)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GenerateSummary([FromBody] SummaryRequest request)
    {
        try
        {
            _logger.LogInformation("Received summary generation request. Style: {Style}, Length: {Length} characters, Target role: {TargetRole}",
                request.Style, request.Transcript.Length, request.TargetRole ?? "None");

            var options = new SummaryOptions
            {
                Style = request.Style,
                TargetRole = request.TargetRole,
                MaxTokens = request.MaxTokens,
                Temperature = 0.3f
            };

            SummaryResult result;

            if (request.SpeakerMappings?.Any() == true)
            {
                _logger.LogInformation("Generating role-aware summary with {SpeakerCount} speaker mappings", request.SpeakerMappings.Count);
                result = await _summarizationService.GenerateRoleAwareSummaryAsync(
                    request.Transcript,
                    request.SpeakerMappings,
                    options);
            }
            else
            {
                _logger.LogInformation("Generating standard summary without speaker mappings");
                result = await _summarizationService.GenerateSummaryAsync(request.Transcript, options);
            }

            _logger.LogInformation("Summary generation completed. Style: {Style}, Output length: {Length} characters, Time: {TimeMs}ms",
                result.SummaryType, result.Content.Length, result.ProcessingTimeMs);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid summary generation request");
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Summarization service error");
            return StatusCode(503, new { error = "Summarization service is currently unavailable", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating summary");
            return StatusCode(500, new { error = "An error occurred while generating the summary" });
        }
    }

    /// <summary>
    /// Generate a summary for a specific transcription using stored speaker mappings
    /// </summary>
    /// <param name="transcriptionId">The ID of the transcription to summarize</param>
    /// <param name="request">The summary generation request</param>
    /// <returns>Generated summary with role awareness if speaker mappings exist</returns>
    [HttpPost("{transcriptionId}/summarize")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(SummaryResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(503)]
    [ProducesResponseType(500)]
    public IActionResult SummarizeTranscription(
        string transcriptionId,
        [FromBody] TranscriptionSummaryRequest request)
    {
        try
        {
            _logger.LogInformation("Received transcription summarization request for ID: {TranscriptionId}, Style: {Style}",
                transcriptionId, request.Style);

            // Validate that the transcription ID matches
            if (request.TranscriptionId != transcriptionId)
            {
                return BadRequest(new { error = "Transcription ID in URL and request body must match" });
            }

            // TODO: In a real implementation, retrieve the transcript from storage
            // For now, return a helpful error message
            return StatusCode(501, new
            {
                error = "Transcription storage not yet implemented",
                message = "This endpoint requires storing transcriptions in a database. Use the /api/summary/generate endpoint with the full transcript instead.",
                transcriptionId = transcriptionId
            });

            /* Future implementation when transcription storage is added:
            
            // Retrieve the transcript (this would come from a database/storage service)
            var transcript = await _transcriptionStorageService.GetTranscriptAsync(transcriptionId);
            if (transcript == null)
            {
                return NotFound(new { error = $"Transcription with ID {transcriptionId} not found" });
            }

            // Try to get speaker mappings for this transcription
            var speakerMappings = await _speakerMappingService.GetSpeakerMappingsAsync(transcriptionId);

            var options = new SummaryOptions
            {
                Style = request.Style,
                TargetRole = request.TargetRole,
                MaxTokens = request.MaxTokens,
                Temperature = 0.3f
            };

            SummaryResult result;
            
            if (speakerMappings?.Mappings?.Any() == true)
            {
                _logger.LogInformation("Generating role-aware summary for transcription {TranscriptionId} with {SpeakerCount} speaker mappings",
                    transcriptionId, speakerMappings.Mappings.Count);
                    
                result = await _summarizationService.GenerateRoleAwareSummaryAsync(
                    transcript, 
                    speakerMappings.Mappings, 
                    options);
            }
            else
            {
                _logger.LogInformation("Generating standard summary for transcription {TranscriptionId} without speaker mappings", transcriptionId);
                result = await _summarizationService.GenerateSummaryAsync(transcript, options);
            }

            result.TranscriptionId = transcriptionId;

            _logger.LogInformation("Summary generation completed for transcription {TranscriptionId}. Style: {Style}, Output length: {Length} characters",
                transcriptionId, result.SummaryType, result.Content.Length);

            return Ok(result);
            */
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid transcription summarization request for ID: {TranscriptionId}", transcriptionId);
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Summarization service error for transcription {TranscriptionId}", transcriptionId);
            return StatusCode(503, new { error = "Summarization service is currently unavailable", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating summary for transcription {TranscriptionId}", transcriptionId);
            return StatusCode(500, new { error = "An error occurred while generating the summary" });
        }
    }

    /// <summary>
    /// Get the status of the summarization service
    /// </summary>
    /// <returns>Service status information</returns>
    [HttpGet("status")]
    [ProducesResponseType(typeof(object), 200)]
    public IActionResult GetSummarizationStatus()
    {
        try
        {
            _logger.LogInformation("Checking summarization service status");

            var status = _summarizationService.GetServiceStatus();
            return Ok(new
            {
                status = "Service status retrieved successfully",
                serviceInfo = status,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving summarization service status");
            return StatusCode(500, new { error = "Failed to retrieve service status" });
        }
    }
}
