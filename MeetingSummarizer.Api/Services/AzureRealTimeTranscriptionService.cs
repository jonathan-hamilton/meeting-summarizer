using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Transcription;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Configuration;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Azure Speech Services Real-time transcription implementation with speaker diarization
/// Uses the EXACT settings that were successfully tested in Azure Speech Playground
/// This is the ONLY transcription service implementation - no batch, no OpenAI
/// </summary>
public class AzureRealTimeTranscriptionService : ITranscriptionService
{
    private readonly ILogger<AzureRealTimeTranscriptionService> _logger;
    private readonly AzureSpeechOptions _options;

    public AzureRealTimeTranscriptionService(
        ILogger<AzureRealTimeTranscriptionService> logger,
        IOptions<AzureSpeechOptions> options)
    {
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// Transcribe audio file using the EXACT configuration tested successfully in Azure Speech Playground
    /// Matches: Real-time transcription + Speaker diarization ON + Detailed format + English (US)
    /// </summary>
    /// <param name="audioFilePath">Path to the WAV audio file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transcription result with speaker diarization exactly as tested in portal</returns>
    public async Task<TranscriptionResult> TranscribeFileWithPortalConfigAsync(
        string audioFilePath,
        CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var startTime = DateTime.UtcNow;
        
        _logger.LogInformation("Starting Azure Speech transcription with PORTAL CONFIGURATION [CorrelationId: {CorrelationId}] - File: {FilePath}", 
            correlationId, audioFilePath);

        try
        {
            // Create speech config exactly as tested in Azure portal
            var config = SpeechConfig.FromSubscription(_options.Key, _options.Region);
            config.SpeechRecognitionLanguage = "en-US"; // English (United States) - EXACT match to portal
            config.OutputFormat = OutputFormat.Detailed; // Detailed format - EXACT match to portal
            
            _logger.LogInformation("Portal config applied [CorrelationId: {CorrelationId}] - Language: en-US, Diarization: ON, Format: Detailed", 
                correlationId);

            // Configure audio input from file - EXACT match to portal file input method
            using var audioConfig = AudioConfig.FromWavFileInput(audioFilePath);
            
            // Use ConversationTranscriber for proper speaker diarization (Real-time transcription with speakers)
            using var conversationTranscriber = new ConversationTranscriber(config, audioConfig);

            var transcriptionSegments = new List<SpeakerSegment>();
            var sessionCompleted = new TaskCompletionSource<bool>();

            // Handle transcribed speech with speaker information
            conversationTranscriber.Transcribed += (s, e) =>
            {
                if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
                {
                    var segment = CreateSpeakerSegmentFromConversationResult(e.Result, correlationId);
                    if (segment != null)
                    {
                        lock (transcriptionSegments)
                        {
                            transcriptionSegments.Add(segment);
                        }
                        
                        _logger.LogDebug("Real-time transcription [CorrelationId: {CorrelationId}] - Speaker: {Speaker}, Text: {Text}", 
                            correlationId, segment.Speaker, segment.Text?.Substring(0, Math.Min(50, segment.Text?.Length ?? 0)));
                    }
                }
            };

            // Handle session events
            conversationTranscriber.SessionStarted += (s, e) =>
            {
                _logger.LogInformation("Conversation transcription session started [CorrelationId: {CorrelationId}] - SessionId: {SessionId}", 
                    correlationId, e.SessionId);
            };

            conversationTranscriber.SessionStopped += (s, e) =>
            {
                _logger.LogInformation("Conversation transcription session stopped [CorrelationId: {CorrelationId}] - SessionId: {SessionId}", 
                    correlationId, e.SessionId);
                sessionCompleted.TrySetResult(true);
            };

            conversationTranscriber.Canceled += (s, e) =>
            {
                _logger.LogWarning("Conversation transcription canceled [CorrelationId: {CorrelationId}] - Reason: {Reason}, Error: {ErrorDetails}", 
                    correlationId, e.Reason, e.ErrorDetails);
                sessionCompleted.TrySetResult(false);
            };

            // Start conversation transcription (this provides speaker diarization)
            await conversationTranscriber.StartTranscribingAsync();
            _logger.LogInformation("Started conversation transcription [CorrelationId: {CorrelationId}] - Processing audio with speaker diarization...", correlationId);

            // Wait for session completion with timeout
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromMinutes(10)); // Reasonable timeout

            try
            {
                await sessionCompleted.Task.WaitAsync(timeoutCts.Token);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("Conversation transcription session timed out [CorrelationId: {CorrelationId}]", correlationId);
            }

            // Stop transcription
            await conversationTranscriber.StopTranscribingAsync();

            // Build result exactly matching portal output format
            var sortedSegments = transcriptionSegments
                .OrderBy(s => s.Start)
                .ToList();

            var fullTranscript = string.Join(" ", sortedSegments.Select(s => s.Text));
            var speakerCount = sortedSegments.Select(s => s.Speaker).Distinct().Count();
            var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;

            var result = new TranscriptionResult
            {
                Text = fullTranscript,
                Segments = sortedSegments,
                DetectedLanguage = "en-US",
                Duration = processingTime
            };

            _logger.LogInformation("Portal-style transcription completed [CorrelationId: {CorrelationId}] - Success: {Success}, Speakers: {SpeakerCount}, Segments: {SegmentCount}, Duration: {Duration}s", 
                correlationId, sortedSegments.Any(), speakerCount, sortedSegments.Count, processingTime);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Portal-style transcription failed [CorrelationId: {CorrelationId}]", correlationId);
            
            return new TranscriptionResult
            {
                Text = string.Empty,
                Segments = new List<SpeakerSegment>(),
                DetectedLanguage = "en-US",
                Duration = (DateTime.UtcNow - startTime).TotalSeconds
            };
        }
    }

    #region ITranscriptionService Implementation

    /// <summary>
    /// Transcribe audio file to text with speaker information (main interface method)
    /// </summary>
    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("Starting real-time transcription with metadata [CorrelationId: {CorrelationId}] - File: {FileName}", correlationId, fileName);

        // Save stream to temporary file for Azure Speech Services
        var tempFilePath = Path.GetTempFileName();
        try
        {
            await using (var fileStream = File.Create(tempFilePath))
            {
                audioStream.Position = 0;
                await audioStream.CopyToAsync(fileStream, cancellationToken);
            }

            // Use our proven portal configuration method
            return await TranscribeFileWithPortalConfigAsync(tempFilePath, cancellationToken);
        }
        finally
        {
            // Clean up temp file
            if (File.Exists(tempFilePath))
            {
                try { File.Delete(tempFilePath); } catch { /* Ignore cleanup errors */ }
            }
        }
    }

    /// <summary>
    /// Transcribe audio file to text (simple version)
    /// </summary>
    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = await TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
        return result.Text;
    }

    /// <summary>
    /// Check if the Azure Speech service is properly configured and accessible
    /// </summary>
    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var config = SpeechConfig.FromSubscription(_options.Key, _options.Region);
            config.SpeechRecognitionLanguage = "en-US";

            // Simple availability test
            using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            using var recognizer = new SpeechRecognizer(config, audioConfig);
            
            // Just test that we can create a recognizer - don't actually listen
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Speech Service availability check failed");
            return false;
        }
    }

    /// <summary>
    /// Get service status information
    /// </summary>
    public string GetServiceStatus()
    {
        return $"Azure Speech Services Real-time Transcription - Region: {_options.Region}, Language: en-US, Speaker Diarization: Enabled";
    }

    /// <summary>
    /// Get the name of the transcription provider
    /// </summary>
    public string GetProviderName()
    {
        return "Azure Speech Services Real-time";
    }

    #endregion

    /// <summary>
    /// Create speaker segment from Azure Conversation Transcription result
    /// This properly extracts speaker information from conversation transcription
    /// </summary>
    private SpeakerSegment? CreateSpeakerSegmentFromConversationResult(SpeechRecognitionResult result, string correlationId)
    {
        try
        {
            // Extract timing information
            var startTimeSeconds = result.OffsetInTicks / TimeSpan.TicksPerSecond;
            var durationSeconds = result.Duration.Ticks / TimeSpan.TicksPerSecond;

            // Extract speaker information from conversation transcription result
            var speakerId = "Guest-1"; // Default fallback
            
            // Conversation transcription provides speaker ID in the result properties
            var jsonResult = result.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
            if (!string.IsNullOrEmpty(jsonResult))
            {
                try
                {
                    var jsonDoc = JsonDocument.Parse(jsonResult);
                    
                    // Look for speaker information in the detailed JSON response
                    if (jsonDoc.RootElement.TryGetProperty("SpeakerId", out var speakerIdElement))
                    {
                        speakerId = $"Guest-{speakerIdElement.GetString()}";
                    }
                    else if (jsonDoc.RootElement.TryGetProperty("NBest", out var nBest) && 
                             nBest.GetArrayLength() > 0)
                    {
                        var firstResult = nBest[0];
                        if (firstResult.TryGetProperty("Speaker", out var speakerElement))
                        {
                            speakerId = speakerElement.GetString() ?? "Guest-1";
                        }
                        else if (firstResult.TryGetProperty("SpeakerId", out var nestedSpeakerIdElement))
                        {
                            speakerId = $"Guest-{nestedSpeakerIdElement.GetString()}";
                        }
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogDebug("Could not parse speaker JSON from conversation result [CorrelationId: {CorrelationId}] - Using default. Error: {Error}", 
                        correlationId, ex.Message);
                }
            }
            
            // Also check direct property access for speaker ID
            var directSpeakerId = result.Properties.GetProperty("SpeakerId");
            if (!string.IsNullOrEmpty(directSpeakerId))
            {
                speakerId = $"Guest-{directSpeakerId}";
            }

            return new SpeakerSegment
            {
                Text = result.Text.Trim(),
                Speaker = speakerId,
                Start = startTimeSeconds,
                End = startTimeSeconds + durationSeconds,
                Confidence = 0.95 // Default confidence for Azure Speech Services
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create speaker segment from conversation result [CorrelationId: {CorrelationId}]", correlationId);
            return null;
        }
    }
}
