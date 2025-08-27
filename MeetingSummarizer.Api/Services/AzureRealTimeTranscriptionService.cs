using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Transcription;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Collections.Concurrent;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Azure Speech Services conversation transcription with speaker diarization
/// Implements REQ-AZR-1 to REQ-AZR-10 for file-based audio processing with ConversationTranscriber
/// </summary>
public class AzureConversationTranscriptionService : ITranscriptionService
{
    private readonly AzureSpeechOptions _options;
    private readonly ILogger<AzureConversationTranscriptionService> _logger;
    private readonly SpeechConfig _speechConfig;

    public AzureConversationTranscriptionService(
        IOptions<AzureSpeechOptions> options,
        ILogger<AzureConversationTranscriptionService> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (!_options.IsValid())
        {
            throw new InvalidOperationException("Azure Speech Services configuration is invalid. Please check your API key and region.");
        }

        // Initialize Speech Configuration
        _speechConfig = SpeechConfig.FromSubscription(_options.Key, _options.Region);
        _speechConfig.SpeechRecognitionLanguage = _options.Language;
        _speechConfig.EnableDictation();

        _logger.LogInformation("Azure Conversation Transcription Service initialized - Region: {Region}, Language: {Language}",
            _options.Region, _options.Language);
    }

    /// <summary>
    /// Start real-time transcription session with speaker diarization
    /// </summary>
    /// <param name="audioStream">Audio stream to transcribe</param>
    /// <param name="onTranscriptionReceived">Callback for receiving transcription segments</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Real-time transcription session</returns>
    public async Task<RealTimeTranscriptionSession> StartRealTimeTranscriptionAsync(
        Stream audioStream,
        Action<SpeakerSegment> onTranscriptionReceived,
        CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("Starting real-time transcription session [CorrelationId: {CorrelationId}]", correlationId);

        try
        {
            // Configure audio input from stream for real-time transcription
            var audioFormat = AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1);
            var audioInputStream = AudioInputStream.CreatePushStream(audioFormat);
            var audioConfig = AudioConfig.FromStreamInput(audioInputStream);

            // Create SpeechRecognizer for real-time transcription
            using var recognizer = new SpeechRecognizer(_speechConfig, audioConfig);

            var session = new RealTimeTranscriptionSession(correlationId, recognizer, audioInputStream);

            // Set up event handlers
            SetupTranscriptionEventHandlers(recognizer, onTranscriptionReceived, correlationId);

            // Start continuous recognition
            await recognizer.StartContinuousRecognitionAsync();

            // Feed audio data to the stream
            _ = Task.Run(async () =>
            {
                try
                {
                    await FeedAudioStreamAsync(audioStream, audioInputStream, correlationId, cancellationToken);
                    
                    // Give some time for final recognition results after audio feeding is complete
                    await Task.Delay(2000, cancellationToken);
                    
                    // Signal that transcription is complete
                    session.SignalCompletion();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error feeding audio stream [CorrelationId: {CorrelationId}]", correlationId);
                    session.SignalCompletion(); // Signal completion even on error
                }
            }, cancellationToken);

            _logger.LogInformation("Real-time transcription session started successfully [CorrelationId: {CorrelationId}]", correlationId);
            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start real-time transcription [CorrelationId: {CorrelationId}]", correlationId);
            throw;
        }
    }

    /// <summary>
    /// Transcribe conversation from audio file with speaker diarization using ConversationTranscriber
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">File name for logging</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete transcription result with speakers</returns>
    public async Task<TranscriptionResult> TranscribeConversationFromFileAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var startTime = DateTime.UtcNow;
        var segments = new List<SpeakerSegment>();

        _logger.LogInformation("Processing audio file with ConversationTranscriber [CorrelationId: {CorrelationId}] - File: {FileName}",
            correlationId, fileName);

        try
        {
            // Use ConversationTranscriber for file-based transcription with speaker diarization
            return await ProcessAudioFileWithConversationTranscriberAsync(audioStream, fileName, correlationId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audio file transcription failed [CorrelationId: {CorrelationId}]", correlationId);
            throw;
        }
    }

    /// <summary>
    /// Process audio file with ConversationTranscriber for speaker diarization (best for uploaded files)
    /// </summary>
    private async Task<TranscriptionResult> ProcessAudioFileWithConversationTranscriberAsync(
        Stream audioStream,
        string fileName,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var segments = new List<SpeakerSegment>();
        var startTime = DateTime.UtcNow;

        try
        {
            // Save stream to temporary file for Azure Speech SDK
            var tempFilePath = Path.GetTempFileName() + ".wav";
            
            try
            {
                // Write stream to temporary file
                audioStream.Position = 0;
                using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await audioStream.CopyToAsync(fileStream, cancellationToken);
                }

                _logger.LogInformation("Created temporary audio file [CorrelationId: {CorrelationId}] - Path: {TempPath}",
                    correlationId, tempFilePath);

                // Configure audio input from file
                using var audioConfig = AudioConfig.FromWavFileInput(tempFilePath);
                
                // Create ConversationTranscriber with file input for speaker diarization
                using var conversationTranscriber = new ConversationTranscriber(_speechConfig, audioConfig);

                // Setup completion tracking
                var transcriptionComplete = new TaskCompletionSource<bool>();

                // Set up event handlers for ConversationTranscriber
                conversationTranscriber.Transcribed += (s, e) =>
                {
                    _logger.LogInformation("Conversation transcribed event [CorrelationId: {CorrelationId}] - Reason: {Reason}, Speaker: {Speaker}, Text: '{Text}'",
                        correlationId, e.Result.Reason, e.Result.SpeakerId ?? "Unknown", e.Result.Text ?? "null");

                    if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
                    {
                        var segment = CreateSpeakerSegmentFromConversationResult(e.Result, correlationId);
                        segments.Add(segment);
                    }
                };

                conversationTranscriber.Transcribing += (s, e) =>
                {
                    _logger.LogDebug("Conversation transcribing event [CorrelationId: {CorrelationId}] - Speaker: {Speaker}: {Text}",
                        correlationId, e.Result.SpeakerId ?? "Unknown", e.Result.Text ?? "null");
                };

                conversationTranscriber.Canceled += (s, e) =>
                {
                    _logger.LogWarning("Conversation transcription canceled [CorrelationId: {CorrelationId}] - Reason: {Reason}, Details: {Details}",
                        correlationId, e.Reason, e.ErrorDetails);
                    transcriptionComplete.TrySetResult(false);
                };

                conversationTranscriber.SessionStarted += (s, e) =>
                {
                    _logger.LogInformation("Conversation transcription session started [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                        correlationId, e.SessionId);
                };

                conversationTranscriber.SessionStopped += (s, e) =>
                {
                    _logger.LogInformation("Conversation transcription session stopped [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                        correlationId, e.SessionId);
                    transcriptionComplete.TrySetResult(true);
                };

                // Start conversation transcription
                await conversationTranscriber.StartTranscribingAsync();

                // Wait for completion
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(TimeSpan.FromMinutes(10)); // Extended timeout for file processing

                try
                {
                    await transcriptionComplete.Task.WaitAsync(timeoutCts.Token);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogWarning("Conversation transcription timed out [CorrelationId: {CorrelationId}]", correlationId);
                }

                // Stop transcription
                await conversationTranscriber.StopTranscribingAsync();
            }
            finally
            {
                // Clean up temporary file
                try
                {
                    if (File.Exists(tempFilePath))
                    {
                        File.Delete(tempFilePath);
                        _logger.LogDebug("Cleaned up temporary file [CorrelationId: {CorrelationId}]", correlationId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clean up temporary file [CorrelationId: {CorrelationId}]", correlationId);
                }
            }

            // Process results
            var sortedSegments = segments.OrderBy(s => s.Start).ToList();
            var processingTime = DateTime.UtcNow - startTime;
            var fullText = string.Join(" ", sortedSegments.Select(s => s.Text));

            _logger.LogInformation("Conversation transcription completed [CorrelationId: {CorrelationId}] - Segments: {SegmentCount}, Speakers: {SpeakerCount}, Duration: {Duration}ms",
                correlationId, sortedSegments.Count, sortedSegments.Select(s => s.Speaker).Distinct().Count(), processingTime.TotalMilliseconds);

            return new TranscriptionResult
            {
                Text = fullText,
                Segments = sortedSegments,
                DetectedLanguage = _options.Language,
                Duration = sortedSegments.LastOrDefault()?.End ?? 0.0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Conversation transcription failed [CorrelationId: {CorrelationId}]", correlationId);
            throw;
        }
    }

    /// <summary>
    /// Process audio file with speaker diarization using file input (more appropriate for uploaded files)
    /// </summary>
    private async Task<TranscriptionResult> ProcessAudioFileWithSpeakerDiarizationAsync(
        Stream audioStream,
        string fileName,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var segments = new List<SpeakerSegment>();
        var startTime = DateTime.UtcNow;

        try
        {
            // Save stream to temporary file for Azure Speech SDK
            var tempFilePath = Path.GetTempFileName() + ".wav";
            
            try
            {
                // Write stream to temporary file
                audioStream.Position = 0;
                using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await audioStream.CopyToAsync(fileStream, cancellationToken);
                }

                _logger.LogInformation("Created temporary audio file [CorrelationId: {CorrelationId}] - Path: {TempPath}",
                    correlationId, tempFilePath);

                // Configure audio input from file
                using var audioConfig = AudioConfig.FromWavFileInput(tempFilePath);
                using var recognizer = new SpeechRecognizer(_speechConfig, audioConfig);

                // Setup completion tracking
                var recognitionComplete = new TaskCompletionSource<bool>();

                // Set up event handlers with completion tracking
                recognizer.Recognized += (s, e) =>
                {
                    _logger.LogInformation("Recognition event fired [CorrelationId: {CorrelationId}] - Reason: {Reason}, Text: '{Text}'",
                        correlationId, e.Result.Reason, e.Result.Text ?? "null");

                    if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
                    {
                        var segment = CreateSpeakerSegmentFromResult(e.Result, correlationId);
                        segments.Add(segment);
                    }
                };

                recognizer.Recognizing += (s, e) =>
                {
                    _logger.LogDebug("Recognizing event fired [CorrelationId: {CorrelationId}]: {Text}",
                        correlationId, e.Result.Text ?? "null");
                };

                recognizer.Canceled += (s, e) =>
                {
                    _logger.LogWarning("Recognition canceled [CorrelationId: {CorrelationId}] - Reason: {Reason}, Details: {Details}",
                        correlationId, e.Reason, e.ErrorDetails);
                    recognitionComplete.TrySetResult(false);
                };

                recognizer.SessionStarted += (s, e) =>
                {
                    _logger.LogInformation("Recognition session started [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                        correlationId, e.SessionId);
                };

                recognizer.SessionStopped += (s, e) =>
                {
                    _logger.LogInformation("Recognition session stopped [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                        correlationId, e.SessionId);
                    recognitionComplete.TrySetResult(true);
                };

                // Start recognition
                await recognizer.StartContinuousRecognitionAsync();

                // Wait for completion
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(TimeSpan.FromMinutes(5)); // 5 minute timeout

                try
                {
                    await recognitionComplete.Task.WaitAsync(timeoutCts.Token);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogWarning("File transcription timed out [CorrelationId: {CorrelationId}]", correlationId);
                }

                // Stop recognition
                await recognizer.StopContinuousRecognitionAsync();
            }
            finally
            {
                // Clean up temporary file
                try
                {
                    if (File.Exists(tempFilePath))
                    {
                        File.Delete(tempFilePath);
                        _logger.LogDebug("Cleaned up temporary file [CorrelationId: {CorrelationId}]", correlationId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clean up temporary file [CorrelationId: {CorrelationId}]", correlationId);
                }
            }

            // Process results
            var sortedSegments = segments.OrderBy(s => s.Start).ToList();
            var processingTime = DateTime.UtcNow - startTime;
            var fullText = string.Join(" ", sortedSegments.Select(s => s.Text));

            _logger.LogInformation("File transcription completed [CorrelationId: {CorrelationId}] - Segments: {SegmentCount}, Duration: {Duration}ms",
                correlationId, sortedSegments.Count, processingTime.TotalMilliseconds);

            return new TranscriptionResult
            {
                Text = fullText,
                Segments = sortedSegments,
                DetectedLanguage = _options.Language,
                Duration = sortedSegments.LastOrDefault()?.End ?? 0.0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File transcription failed [CorrelationId: {CorrelationId}]", correlationId);
            throw;
        }
    }

    /// <summary>
    /// Setup event handlers for speech recognition
    /// </summary>
    private void SetupTranscriptionEventHandlers(
        SpeechRecognizer recognizer,
        Action<SpeakerSegment> onTranscriptionReceived,
        string correlationId)
    {
        // Recognized event (final results)
        recognizer.Recognized += (s, e) =>
        {
            _logger.LogInformation("Recognition event fired [CorrelationId: {CorrelationId}] - Reason: {Reason}, Text: '{Text}'",
                correlationId, e.Result.Reason, e.Result.Text ?? "null");
                
            if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
            {
                var segment = CreateSpeakerSegmentFromResult(e.Result, correlationId);
                onTranscriptionReceived(segment);
            }
        };

        // Recognizing event (intermediate results)
        recognizer.Recognizing += (s, e) =>
        {
            _logger.LogInformation("Recognizing event fired [CorrelationId: {CorrelationId}]: {Text}",
                correlationId, e.Result.Text ?? "null");
                
            if (!string.IsNullOrWhiteSpace(e.Result.Text))
            {
                _logger.LogDebug("Intermediate recognition [CorrelationId: {CorrelationId}]: {Text}",
                    correlationId, e.Result.Text.Substring(0, Math.Min(50, e.Result.Text.Length)));
            }
        };

        // Error handling
        recognizer.Canceled += (s, e) =>
        {
            _logger.LogWarning("Recognition canceled [CorrelationId: {CorrelationId}] - Reason: {Reason}, Details: {Details}",
                correlationId, e.Reason, e.ErrorDetails);
        };

        // Session events
        recognizer.SessionStarted += (s, e) =>
        {
            _logger.LogInformation("Recognition session started [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                correlationId, e.SessionId);
        };

        recognizer.SessionStopped += (s, e) =>
        {
            _logger.LogInformation("Recognition session stopped [CorrelationId: {CorrelationId}] - SessionId: {SessionId}",
                correlationId, e.SessionId);
        };
    }

    /// <summary>
    /// Create speaker segment from Azure Speech Services result
    /// </summary>
    private SpeakerSegment CreateSpeakerSegmentFromResult(SpeechRecognitionResult result, string correlationId)
    {
        // Extract speaker information from result properties
        var speakerId = ExtractSpeakerIdFromResult(result);
        var confidence = ExtractConfidenceFromResult(result);

        // Calculate timing
        var startTime = TimeSpan.FromTicks(result.OffsetInTicks);
        var duration = TimeSpan.FromTicks(result.Duration.Ticks);

        _logger.LogDebug("Creating speaker segment [CorrelationId: {CorrelationId}] - Speaker: {SpeakerId}, Confidence: {Confidence}",
            correlationId, speakerId, confidence);

        return new SpeakerSegment
        {
            Speaker = speakerId,
            Text = result.Text,
            Start = startTime.TotalSeconds,
            End = (startTime + duration).TotalSeconds,
            Confidence = confidence
        };
    }

    /// <summary>
    /// Extract speaker ID from Azure Speech Services result
    /// </summary>
    private string ExtractSpeakerIdFromResult(SpeechRecognitionResult result)
    {
        // Try to get speaker ID from result properties
        var jsonResult = result.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
        if (!string.IsNullOrEmpty(jsonResult))
        {
            try
            {
                var jsonDoc = JsonDocument.Parse(jsonResult);
                if (jsonDoc.RootElement.TryGetProperty("Speaker", out var speakerElement))
                {
                    return speakerElement.GetString() ?? "Speaker_1";
                }
                if (jsonDoc.RootElement.TryGetProperty("SpeakerId", out var speakerIdElement))
                {
                    return speakerIdElement.GetString() ?? "Speaker_1";
                }
            }
            catch (JsonException ex)
            {
                _logger.LogDebug("Failed to parse Azure JSON result for speaker extraction: {Error}", ex.Message);
            }
        }

        // Fallback: Use result ID pattern or default
        if (result.ResultId.Contains("speaker", StringComparison.OrdinalIgnoreCase))
        {
            return result.ResultId;
        }

        return "Speaker_1"; // Default fallback
    }

    /// <summary>
    /// Extract confidence score from Azure Speech Services result
    /// </summary>
    private double ExtractConfidenceFromResult(SpeechRecognitionResult result)
    {
        var jsonResult = result.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
        if (!string.IsNullOrEmpty(jsonResult))
        {
            try
            {
                var jsonDoc = JsonDocument.Parse(jsonResult);
                if (jsonDoc.RootElement.TryGetProperty("NBest", out var nbestArray) && nbestArray.GetArrayLength() > 0)
                {
                    var bestResult = nbestArray[0];
                    if (bestResult.TryGetProperty("Confidence", out var confidenceElement))
                    {
                        return confidenceElement.GetDouble();
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogDebug("Failed to parse confidence from Azure JSON result: {Error}", ex.Message);
            }
        }

        return 0.8; // Default confidence for Azure Speech Services
    }

    /// <summary>
    /// Create speaker segment from ConversationTranscriptionResult (for file-based transcription)
    /// </summary>
    private SpeakerSegment CreateSpeakerSegmentFromConversationResult(ConversationTranscriptionResult result, string correlationId)
    {
        // ConversationTranscriber provides speaker ID directly
        var speakerId = result.SpeakerId ?? "Guest-1";
        
        // Map Azure's format to our format if needed
        if (speakerId.StartsWith("Guest", StringComparison.OrdinalIgnoreCase))
        {
            // Keep Guest format from ConversationTranscriber
        }
        else if (speakerId.StartsWith("Speaker", StringComparison.OrdinalIgnoreCase))
        {
            // Keep Speaker format
        }
        else
        {
            // Default naming
            speakerId = "Guest-1";
        }

        // Calculate timing
        var startTime = TimeSpan.FromTicks(result.OffsetInTicks);
        var duration = TimeSpan.FromTicks(result.Duration.Ticks);

        _logger.LogDebug("Creating conversation segment [CorrelationId: {CorrelationId}] - Speaker: {SpeakerId}, Text: '{Text}'",
            correlationId, speakerId, result.Text?.Substring(0, Math.Min(50, result.Text?.Length ?? 0)));

        return new SpeakerSegment
        {
            Speaker = speakerId,
            Text = result.Text ?? string.Empty,
            Start = startTime.TotalSeconds,
            End = (startTime + duration).TotalSeconds,
            Confidence = 0.9 // ConversationTranscriber typically has high confidence
        };
    }

    /// <summary>
    /// Feed audio stream data to Azure Speech Services
    /// </summary>
    private async Task FeedAudioStreamAsync(
        Stream audioStream,
        AudioInputStream audioInputStream,
        string correlationId,
        CancellationToken cancellationToken)
    {
        const int bufferSize = 4096;
        var buffer = new byte[bufferSize];
        var totalBytes = 0;

        try
        {
            audioStream.Position = 0;

            while (!cancellationToken.IsCancellationRequested)
            {
                var bytesRead = await audioStream.ReadAsync(buffer, 0, bufferSize, cancellationToken);
                if (bytesRead == 0)
                {
                    break; // End of stream
                }

                // Write audio data to the input stream
                ((PushAudioInputStream)audioInputStream).Write(buffer, bytesRead);
                totalBytes += bytesRead;

                // Add small delay to simulate real-time audio
                await Task.Delay(50, cancellationToken);
            }

            _logger.LogInformation("Audio stream feeding completed [CorrelationId: {CorrelationId}] - Total bytes: {TotalBytes}",
                correlationId, totalBytes);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Audio stream feeding cancelled [CorrelationId: {CorrelationId}]", correlationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error feeding audio stream [CorrelationId: {CorrelationId}]", correlationId);
        }
        finally
        {
            // Close the audio input stream to signal end of audio
            try
            {
                ((PushAudioInputStream)audioInputStream).Close();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error closing audio input stream [CorrelationId: {CorrelationId}]", correlationId);
            }
        }
    }

    /// <summary>
    /// Check if Azure Speech Services is available for real-time transcription
    /// </summary>
    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // Test basic connectivity without actual transcription
            using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            using var recognizer = new SpeechRecognizer(_speechConfig, audioConfig);

            _logger.LogDebug("Azure Speech Services real-time availability check passed");
            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Speech Services real-time availability check failed: {Message}", ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Get service status and configuration information
    /// </summary>
    public string GetServiceStatus()
    {
        return $"Azure Real-Time Transcription - Region: {_options.Region}, Language: {_options.Language}, Diarization: {_options.EnableSpeakerDiarization}";
    }

    /// <summary>
    /// Transcribe audio file to text with speaker information
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        return await TranscribeConversationFromFileAsync(audioStream, fileName, cancellationToken);
    }

    /// <summary>
    /// Transcribe audio file to text (simple version)
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = await TranscribeConversationFromFileAsync(audioStream, fileName, cancellationToken);
        return result.Text;
    }

    /// <summary>
    /// Get the name of the transcription provider
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public string GetProviderName()
    {
        return "Azure Speech Services (Real-Time)";
    }
}

/// <summary>
/// Represents an active real-time transcription session
/// </summary>
public class RealTimeTranscriptionSession : IDisposable
{
    public string CorrelationId { get; }
    public DateTime StartTime { get; }
    public bool IsActive { get; private set; }

    private readonly SpeechRecognizer _recognizer;
    private readonly AudioInputStream _audioInputStream;
    private readonly TaskCompletionSource<bool> _completionSource;
    private bool _disposed;

    public RealTimeTranscriptionSession(
        string correlationId,
        SpeechRecognizer recognizer,
        AudioInputStream audioInputStream)
    {
        CorrelationId = correlationId;
        StartTime = DateTime.UtcNow;
        IsActive = true;
        _recognizer = recognizer;
        _audioInputStream = audioInputStream;
        _completionSource = new TaskCompletionSource<bool>();
    }

    /// <summary>
    /// Stop the transcription session
    /// </summary>
    public async Task StopAsync()
    {
        if (!IsActive || _disposed)
            return;

        try
        {
            await _recognizer.StopContinuousRecognitionAsync();
            IsActive = false;
        }
        catch (Exception)
        {
            // Ignore errors during stop
        }
    }

    /// <summary>
    /// Wait for the transcription session to complete
    /// </summary>
    public async Task WaitForCompletionAsync(CancellationToken cancellationToken = default)
    {
        await _completionSource.Task.WaitAsync(cancellationToken);
    }

    /// <summary>
    /// Signal that the transcription session is complete
    /// </summary>
    public void SignalCompletion()
    {
        _completionSource.TrySetResult(true);
    }

    /// <summary>
    /// Get session duration
    /// </summary>
    public TimeSpan GetDuration()
    {
        return DateTime.UtcNow - StartTime;
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        try
        {
            if (IsActive)
            {
                _ = Task.Run(async () => await StopAsync());
            }

            _recognizer?.Dispose();
            _audioInputStream?.Dispose();
        }
        catch (Exception)
        {
            // Ignore disposal errors
        }
        finally
        {
            _disposed = true;
            IsActive = false;
        }
    }
}
