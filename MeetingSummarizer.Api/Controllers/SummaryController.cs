using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Attributes;
using MeetingSummarizer.Api.Models.BatchTranscription;
using MeetingSummarizer.Api.Services.Transcription;
using MeetingSummarizer.Api.Services.Summarization;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Services.Interfaces;
using MeetingSummarizer.Api.Services.TokenManagement;
using SpeakerServices = MeetingSummarizer.Api.Services.SpeakerMapping;
using MeetingSummarizer.Api.Helpers;
using SpeakerMappingModel = MeetingSummarizer.Api.Models.SpeakerMapping;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for meeting transcription and summarization operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SummaryController : ControllerBase
{
    private readonly ILogger<SummaryController> _logger;
    private readonly ITranscriptionService _transcriptionService;
    private readonly ISummarizationService _summarizationService;
    private readonly ISpeakerMappingService _speakerMappingService;
    private readonly MeetingSummarizerDbContext _context;
    private readonly AzureBatchTranscriptionService _batchService;
    private readonly IUserStorageService _userStorageService;
    private readonly IMeetingService _meetingService;
    private readonly ITokenCalculationService _tokenCalculationService;
    private readonly ITokenService _tokenService;

    public SummaryController(
        ILogger<SummaryController> logger,
        ITranscriptionService transcriptionService,
        ISummarizationService summarizationService,
        ISpeakerMappingService speakerMappingService,
        MeetingSummarizerDbContext context,
        AzureBatchTranscriptionService batchService,
        IUserStorageService userStorageService,
        IMeetingService meetingService,
        ITokenCalculationService tokenCalculationService,
        ITokenService tokenService)
    {
        _logger = logger;
        _transcriptionService = transcriptionService;
        _summarizationService = summarizationService;
        _speakerMappingService = speakerMappingService;
        _context = context;
        _batchService = batchService;
        _userStorageService = userStorageService;
        _meetingService = meetingService;
        _tokenCalculationService = tokenCalculationService;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Upload an audio file for transcription
    /// </summary>
    /// <param name="request">The transcription request containing the audio file</param>
    /// <returns>Transcription result</returns>
    [HttpPost("transcribe")]
    [Authorize]
    [RequireEmailVerification]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(1024L * 1024L * 1024L)] // 1GB - matches AudioFileValidator.MaxFileSizeBytes
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

            // S6.3.6: Check if file should be processed with batch transcription (5+ minutes)
            var estimatedDurationMinutes = EstimateAudioDurationMinutes(request.AudioFile.Length, request.AudioFile.FileName);
            
            if (estimatedDurationMinutes >= 5)
            {
                // Check if user is authenticated for batch processing
                var userId = GetCurrentUserId();
                
                if (userId.HasValue)
                {
                    _logger.LogInformation("File {FileName} estimated at {Duration} minutes - routing to batch processing (authenticated user)", 
                        request.AudioFile.FileName, estimatedDurationMinutes);
                    
                    return await ProcessWithBatchTranscription(request.AudioFile, estimatedDurationMinutes);
                }
                else
                {
                    _logger.LogWarning("File {FileName} estimated at {Duration} minutes requires batch processing but user not authenticated - suggesting authentication", 
                        request.AudioFile.FileName, estimatedDurationMinutes);
                    
                    return BadRequest(new 
                    { 
                        error = "Long audio files (5+ minutes) require user authentication for batch processing",
                        estimatedDuration = estimatedDurationMinutes,
                        suggestion = "Please log in or register to process longer audio files",
                        maxRealTimeDuration = 5
                    });
                }
            }

            _logger.LogInformation("File {FileName} estimated at {Duration} minutes - using real-time processing", 
                request.AudioFile.FileName, estimatedDurationMinutes);

            // Token validation for authenticated users (real-time processing)
            var currentUserId = GetCurrentUserId();
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.FindAsync(currentUserId.Value);
                if (user == null)
                {
                    _logger.LogWarning("Authenticated user {UserId} not found in database", currentUserId.Value);
                    return NotFound(new { error = "User not found" });
                }

                // Check if user has sufficient tokens for real-time processing
                // Use proper duration-based calculation with volume discounts
                var calculation = _tokenCalculationService.CalculateTokensRequired((int)estimatedDurationMinutes);
                var requiredTokens = calculation.FinalTokens;
                
                if (user.TokenBalance < requiredTokens)
                {
                    _logger.LogWarning("User {UserId} ({Email}) has insufficient tokens for real-time processing. Required: {Required}, Available: {Available}",
                        currentUserId.Value, user.Email, requiredTokens, user.TokenBalance);
                    
                    return BadRequest(new 
                    { 
                        error = "Insufficient tokens to process this audio file",
                        required = requiredTokens,
                        available = user.TokenBalance,
                        estimatedDuration = estimatedDurationMinutes,
                        processingType = "real-time"
                    });
                }

                _logger.LogInformation("User {UserId} ({Email}) has sufficient tokens for real-time processing. Required: {Required}, Available: {Available}",
                    currentUserId.Value, user.Email, requiredTokens, user.TokenBalance);
            }

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            Guid? meetingId = null;

            try
            {
                // S6.5: Create meeting record FIRST for consistent ID usage (aligns with batch processing)
                meetingId = await CreateMeetingForRealTimeTranscriptionUpfront(request.AudioFile, estimatedDurationMinutes);

                // Use composite transcription service (Azure primary, OpenAI fallback) - S4.1
                using var audioStream = request.AudioFile.OpenReadStream();
                var transcriptionResult = await _transcriptionService.TranscribeAudioWithMetadataAsync(
                    audioStream,
                    request.AudioFile.FileName
                );

                stopwatch.Stop();

                // Convert to API response format using meeting ID for consistent transcription ID
                var response = TranscriptionResponse.FromResult(
                    transcriptionResult,
                    request.AudioFile.FileName,
                    request.AudioFile.Length,
                    stopwatch.ElapsedMilliseconds,
                    meetingId  // Use meeting ID as transcription ID from the start
                );

                _logger.LogInformation("Transcription completed for file: {FileName}, Meeting ID: {MeetingId}, Speakers: {SpeakerCount}",
                    request.AudioFile.FileName, meetingId, response.SpeakerCount);

                // Update the meeting record with transcription results
                await UpdateMeetingWithTranscriptionResults(meetingId, transcriptionResult);

                // Record token usage for authenticated users (real-time processing)
                if (currentUserId.HasValue)
                {
                    try
                    {
                        var calculation = _tokenCalculationService.CalculateTokensRequired((int)estimatedDurationMinutes);
                        var tokensUsed = calculation.FinalTokens;
                        
                        await _tokenService.RecordTokenUsageAsync(
                            currentUserId.Value.ToString(),
                            meetingId?.ToString() ?? throw new InvalidOperationException("Meeting ID is null"),
                            tokensUsed,
                            (int)estimatedDurationMinutes,
                            calculation.VolumeDiscountMultiplier > 0 ? 
                                (decimal)(calculation.BaseTokens - calculation.FinalTokens) : 0m
                        );
                        
                        _logger.LogInformation("Recorded token usage for user {UserId}: {TokensUsed} tokens for real-time transcription of {FileName} ({Duration} minutes)",
                            currentUserId.Value, tokensUsed, request.AudioFile.FileName, estimatedDurationMinutes);
                    }
                    catch (Exception tokenEx)
                    {
                        _logger.LogError(tokenEx, "Failed to record token usage for user {UserId} and meeting {MeetingId} - transcription succeeded but token tracking failed",
                            currentUserId.Value, meetingId);
                        // Don't fail the request if token tracking fails - transcription was successful
                    }
                }

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Transcription service error during transcription for file: {FileName}", request.AudioFile.FileName);

                // Update meeting status to Failed if meeting was created
                if (meetingId.HasValue)
                {
                    try
                    {
                        await _meetingService.UpdateMeetingStatusAsync(meetingId.Value, MeetingStatus.Failed);
                        _logger.LogInformation("Updated meeting {MeetingId} status to Failed due to transcription service error", meetingId.Value);
                    }
                    catch (Exception meetingUpdateEx)
                    {
                        _logger.LogError(meetingUpdateEx, "Failed to update meeting {MeetingId} status to Failed", meetingId.Value);
                    }
                }

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

                // Update meeting status to Failed if meeting was created
                if (meetingId.HasValue)
                {
                    try
                    {
                        await _meetingService.UpdateMeetingStatusAsync(meetingId.Value, MeetingStatus.Failed);
                        _logger.LogInformation("Updated meeting {MeetingId} status to Failed due to authentication error", meetingId.Value);
                    }
                    catch (Exception meetingUpdateEx)
                    {
                        _logger.LogError(meetingUpdateEx, "Failed to update meeting {MeetingId} status to Failed", meetingId.Value);
                    }
                }

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

                // Update meeting status to Failed if meeting was created
                if (meetingId.HasValue)
                {
                    try
                    {
                        await _meetingService.UpdateMeetingStatusAsync(meetingId.Value, MeetingStatus.Failed);
                        _logger.LogInformation("Updated meeting {MeetingId} status to Failed due to timeout", meetingId.Value);
                    }
                    catch (Exception meetingUpdateEx)
                    {
                        _logger.LogError(meetingUpdateEx, "Failed to update meeting {MeetingId} status to Failed", meetingId.Value);
                    }
                }

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

                // Update meeting status to Failed if meeting was created
                if (meetingId.HasValue)
                {
                    try
                    {
                        await _meetingService.UpdateMeetingStatusAsync(meetingId.Value, MeetingStatus.Failed);
                        _logger.LogInformation("Updated meeting {MeetingId} status to Failed due to I/O error", meetingId.Value);
                    }
                    catch (Exception meetingUpdateEx)
                    {
                        _logger.LogError(meetingUpdateEx, "Failed to update meeting {MeetingId} status to Failed", meetingId.Value);
                    }
                }

                return BadRequest(new { error = "Unable to read the uploaded file. Please try uploading again." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing transcription request");
            return StatusCode(500, new { error = "Failed to submit batch transcription job" });
        }
    }



    /// <summary>
    /// Upload an audio file for enhanced transcription with speaker diarization
    /// </summary>
    /// <param name="request">The transcription request containing the audio file</param>
    /// <returns>Enhanced transcription result with speaker segments</returns>
    [HttpPost("transcribe-enhanced")]
    [Authorize]
    [RequireEmailVerification]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(1024L * 1024L * 1024L)] // 1GB - matches AudioFileValidator.MaxFileSizeBytes
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
                // Use composite transcription service (Azure primary, OpenAI fallback) - S4.1
                using var audioStream = request.AudioFile.OpenReadStream();
                var transcriptionResult = await _transcriptionService.TranscribeAudioWithMetadataAsync(
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

    /// <summary>
    /// S3.4: Generate a meeting summary with role-aware action items
    /// </summary>
    /// <param name="request">The meeting summary request</param>
    /// <returns>Meeting summary with role-grouped action items</returns>
    [HttpPost("meeting-summary")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(MeetingSummary), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(503)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GenerateMeetingSummary([FromBody] MeetingSummaryRequest request)
    {
        try
        {
            _logger.LogInformation("Received S3.4 meeting summary request. Speakers: {SpeakerCount}, MaxTokens: {MaxTokens}",
                request.SpeakerMappings.Count, request.MaxTokens);

            // Validate the service is available
            if (!await _summarizationService.IsServiceAvailableAsync())
            {
                _logger.LogWarning("Summarization service is not available for meeting summary generation");
                return StatusCode(503, new { error = "Summarization service is currently unavailable" });
            }

            // Generate the meeting summary
            var meetingSummary = await _summarizationService.GenerateMeetingSummaryAsync(
                request.Transcript,
                request.SpeakerMappings,
                request.MaxTokens);

            _logger.LogInformation("S3.4 meeting summary generation completed. Summary ID: {SummaryId}, Action items: {ActionCount}, Time: {TimeMs}ms",
                meetingSummary.SummaryId, 
                meetingSummary.ActionItemsByRole.Sum(g => g.ActionItems.Count), 
                meetingSummary.Generation.ProcessingTimeMs);

            return Ok(meetingSummary);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid meeting summary generation request");
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Meeting summary service error");
            return StatusCode(503, new { error = "Meeting summary service is currently unavailable", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating meeting summary");
            return StatusCode(500, new { error = "An error occurred while generating the meeting summary" });
        }
    }

    #region Batch Processing Helper Methods

    /// <summary>
    /// Estimate audio duration in minutes from file size and extension
    /// </summary>
    /// <param name="fileSizeBytes">File size in bytes</param>
    /// <param name="fileName">File name with extension</param>
    /// <returns>Estimated duration in minutes</returns>
    private int EstimateAudioDurationMinutes(long fileSizeBytes, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        
        // Approximate bitrates by format (kbps)
        var avgBitrates = new Dictionary<string, int>
        {
            { ".mp3", 128 },
            { ".wav", 1411 }, // Uncompressed
            { ".m4a", 128 },
            { ".flac", 800 },
            { ".ogg", 128 },
            { ".wma", 128 },
            { ".aac", 128 }
        };

        var bitrate = avgBitrates.GetValueOrDefault(extension, 128); // Default to 128 kbps
        
        // Calculate duration: file_size_bits / bitrate_per_second = duration_seconds
        var fileSizeBits = fileSizeBytes * 8;
        var bitratePerSecond = bitrate * 1000; // Convert kbps to bps
        var durationSeconds = fileSizeBits / bitratePerSecond;
        var durationMinutes = (int)Math.Ceiling(durationSeconds / 60.0);

        _logger.LogDebug("Estimated duration for {FileName} ({SizeMB:F1}MB, {Extension}): {Duration} minutes (bitrate: {Bitrate} kbps)",
            fileName, fileSizeBytes / (1024.0 * 1024), extension, durationMinutes, bitrate);

        return Math.Max(1, durationMinutes); // At least 1 minute
    }

    /// <summary>
    /// Get current user ID from JWT token
    /// </summary>
    /// <returns>User ID</returns>
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }

    /// <summary>
    /// Process long audio files using batch transcription service
    /// </summary>
    /// <param name="audioFile">The audio file to process</param>
    /// <param name="estimatedDurationMinutes">Estimated duration in minutes</param>
    /// <returns>Batch job submission response</returns>
    private async Task<IActionResult> ProcessWithBatchTranscription(IFormFile audioFile, int estimatedDurationMinutes)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                _logger.LogWarning("Batch transcription requested but user not authenticated");
                return Unauthorized(new { error = "Authentication required for batch processing" });
            }

            // Check if user has sufficient tokens using proper duration-based calculation
            var calculation = _tokenCalculationService.CalculateTokensRequired((int)estimatedDurationMinutes);
            var requiredTokens = calculation.FinalTokens;
            var user = await _context.Users.FindAsync(userId.Value);
            
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            if (user.TokenBalance < requiredTokens)
            {
                _logger.LogWarning("User {UserId} has insufficient tokens for batch processing. Required: {Required}, Available: {Available}",
                    userId, requiredTokens, user.TokenBalance);
                
                return BadRequest(new 
                { 
                    error = "Insufficient tokens for batch processing",
                    required = requiredTokens,
                    available = user.TokenBalance,
                    estimatedDuration = estimatedDurationMinutes
                });
            }

            // Create batch job record first
            var batchJob = new BatchTranscriptionJob
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                FileName = audioFile.FileName,
                EstimatedDurationMinutes = estimatedDurationMinutes,
                TokensCharged = requiredTokens,
                Status = "submitted",
                SubmittedAt = DateTime.UtcNow
            };

            // Upload audio file to Azure Blob Storage for batch processing
            _logger.LogInformation("Uploading audio file to blob storage for batch job {JobId}", batchJob.Id);
            StorageUploadResult uploadResult;
            using (var audioStream = audioFile.OpenReadStream())
            {
                uploadResult = await _userStorageService.UploadAudioFileAsync(
                    userId.Value, 
                    audioFile.FileName, 
                    audioStream, 
                    audioFile.ContentType);
            }

            // Store the blob URL for Azure Speech Services
            batchJob.AudioBlobUrl = uploadResult.BlobUrl;
            
            _logger.LogInformation("Audio file uploaded to blob storage: {BlobUrl}", uploadResult.BlobUrl);

            // Deduct tokens immediately
            user.TokenBalance -= requiredTokens;

            _context.BatchTranscriptionJobs.Add(batchJob);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created batch job {JobId} for user {UserId}, file: {FileName}, charged {Tokens} tokens", 
                batchJob.Id, userId, audioFile.FileName, requiredTokens);

            // Return batch job response compatible with frontend expecting TranscriptionResponse
            var response = new 
            {
                // Batch-specific fields - CRITICAL: Use camelCase for frontend compatibility
                jobId = batchJob.Id.ToString(), // Frontend expects lowercase 'jobId'
                status = "batch_submitted",
                estimatedTime = $"{estimatedDurationMinutes * 0.3:F0}-{estimatedDurationMinutes * 0.5:F0} minutes",
                checkStatusUrl = $"/api/BatchJob/{batchJob.Id}/status",
                submittedAt = batchJob.SubmittedAt,
                
                // TranscriptionResponse-compatible fields for frontend compatibility
                transcriptionId = batchJob.Id.ToString(),
                fileName = audioFile.FileName,
                fileSize = audioFile.Length,
                processingTimeMs = 0,
                createdAt = batchJob.SubmittedAt,
                
                // Batch processing indicators
                isBatchProcessing = true,
                estimatedDurationMinutes = estimatedDurationMinutes,
                tokensCharged = requiredTokens
            };

            return Accepted(response); // HTTP 202 Accepted for async processing
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting batch transcription job for file: {FileName}", audioFile.FileName);
            return StatusCode(500, new { error = "Failed to submit batch transcription job" });
        }
    }

    /// <summary>
    /// Creates meeting record upfront for real-time transcription (aligned with batch processing architecture)
    /// </summary>
    /// <param name="audioFile">The audio file being transcribed</param>
    /// <param name="estimatedDurationMinutes">Estimated duration in minutes</param>
    /// <returns>Meeting ID if user is authenticated, null for anonymous users</returns>
    private async Task<Guid?> CreateMeetingForRealTimeTranscriptionUpfront(
        IFormFile audioFile, 
        int estimatedDurationMinutes)
    {
        try
        {
            // Only create meeting for authenticated users
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                _logger.LogDebug("Skipping meeting creation for real-time transcription - user not authenticated");
                return null;
            }

            // Prepare meeting data
            var meetingTitle = !string.IsNullOrEmpty(audioFile.FileName) 
                ? Path.GetFileNameWithoutExtension(audioFile.FileName) 
                : $"Meeting - {DateTime.UtcNow:yyyy-MM-dd HH:mm}";

            var originalFileName = audioFile.FileName ?? "Unknown File";
            
            // For real-time transcriptions, we don't store the audio file in blob storage
            var blobStoragePath = $"realtime-transcription-{Guid.NewGuid()}";

            // Use estimated duration for now - will be updated with actual duration after transcription
            var estimatedDurationSeconds = estimatedDurationMinutes * 60;

            _logger.LogInformation("Creating meeting record upfront for real-time transcription, user {UserId}, file {FileName}, estimated duration {Duration}s", 
                userId, audioFile.FileName, estimatedDurationSeconds);

            // Create the meeting record with estimated duration
            var meeting = await _meetingService.CreateMeetingAsync(
                userId.Value,
                meetingTitle,
                $"Real-time transcription started at {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                originalFileName,
                audioFile.Length,
                estimatedDurationSeconds,
                blobStoragePath);

            _logger.LogInformation("Successfully created meeting {MeetingId} upfront for real-time transcription {FileName}", 
                meeting.Id, audioFile.FileName);
                
            return meeting.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create meeting record upfront for real-time transcription {FileName}", audioFile.FileName);
            // Don't throw - we can still proceed with anonymous transcription
            return null;
        }
    }

    /// <summary>
    /// Updates meeting record with transcription results after processing
    /// </summary>
    /// <param name="meetingId">Meeting ID to update</param>
    /// <param name="transcriptionResult">Transcription results</param>
    private async Task UpdateMeetingWithTranscriptionResults(Guid? meetingId, TranscriptionResult transcriptionResult)
    {
        if (!meetingId.HasValue)
        {
            // Anonymous user - no meeting to update
            return;
        }

        try
        {
            // Convert TranscriptionResult to the format expected by UpdateMeetingTranscriptionAsync
            var transcriptionJson = System.Text.Json.JsonSerializer.Serialize(transcriptionResult);
            
            // Create speaker mappings from segments (with null safety)
            Dictionary<string, string> speakerMappings = new();
            if (transcriptionResult?.Segments?.Any() == true)
            {
                speakerMappings = transcriptionResult.Segments
                    .Where(s => !string.IsNullOrEmpty(s.Speaker))
                    .GroupBy(s => s.Speaker)
                    .Select((group, index) => new { Speaker = group.Key, DisplayName = $"Speaker {index + 1}" })
                    .ToDictionary(x => x.Speaker!, x => x.DisplayName);
            }
            
            var speakerMappingsJson = speakerMappings.Any() 
                ? System.Text.Json.JsonSerializer.Serialize(speakerMappings)
                : null;

            // Calculate speaker count (with null safety)
            var speakerCount = 0;
            if (transcriptionResult?.Segments?.Any() == true)
            {
                speakerCount = transcriptionResult.Segments
                    .Where(s => !string.IsNullOrEmpty(s.Speaker))
                    .Select(s => s.Speaker)
                    .Distinct()
                    .Count();
            }

            // Calculate actual duration from transcription segments (more accurate than estimation)
            var actualDurationSeconds = 0;
            if (transcriptionResult?.Segments?.Any() == true)
            {
                actualDurationSeconds = (int)Math.Ceiling(transcriptionResult.Segments.Max(s => s.End));
                _logger.LogInformation("Using actual duration {ActualDuration}s from transcription segments for meeting {MeetingId}", 
                    actualDurationSeconds, meetingId.Value);
            }
            else if (transcriptionResult?.Duration.HasValue == true)
            {
                actualDurationSeconds = (int)Math.Ceiling(transcriptionResult.Duration.Value);
                _logger.LogInformation("Using actual duration {ActualDuration}s from transcription result Duration property for meeting {MeetingId}", 
                    actualDurationSeconds, meetingId.Value);
            }

            // Update meeting with transcription data
            await _meetingService.UpdateMeetingTranscriptionAsync(
                meetingId.Value,
                transcriptionJson,
                speakerMappingsJson,
                0); // No tokens consumed for real-time transcriptions

            // Update speaker count
            await _meetingService.UpdateMeetingSpeakerCountAsync(meetingId.Value, speakerCount);

            // Mark meeting as completed
            await _meetingService.UpdateMeetingStatusAsync(meetingId.Value, MeetingStatus.Completed);

            _logger.LogInformation("Successfully updated meeting {MeetingId} with transcription results", meetingId.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update meeting {MeetingId} with transcription results", meetingId.Value);
            // Don't throw - transcription was successful, meeting update is supplementary
        }
    }

    #endregion
}
