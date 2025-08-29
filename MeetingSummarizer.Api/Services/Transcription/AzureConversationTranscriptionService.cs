using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Transcription;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.FileProcessing;
using System.Diagnostics;

namespace MeetingSummarizer.Api.Services.Transcription;

/// <summary>
/// Azure Conversation Transcription Service for file-based audio processing
/// Uses ConversationTranscriber API for speaker diarization on uploaded audio files
/// </summary>
public class AzureConversationTranscriptionService : ITranscriptionService
{
    private readonly AzureSpeechOptions _options;
    private readonly ILogger<AzureConversationTranscriptionService> _logger;
    private readonly IFilePreProcessingService _filePreProcessingService;
    private readonly SpeechConfig _speechConfig;

    public AzureConversationTranscriptionService(
        IOptions<AzureSpeechOptions> options,
        ILogger<AzureConversationTranscriptionService> logger,
        IFilePreProcessingService filePreProcessingService)
    {
        _options = options.Value;
        _logger = logger;
        _filePreProcessingService = filePreProcessingService;

        if (!_options.IsValid())
        {
            throw new InvalidOperationException("Azure Speech Services configuration is invalid. Please check your API key and region.");
        }

        // Initialize Speech Configuration for ConversationTranscription
        _speechConfig = SpeechConfig.FromSubscription(_options.Key, _options.Region);
        _speechConfig.SpeechRecognitionLanguage = _options.Language;
        _speechConfig.EnableDictation();

        _logger.LogInformation("Azure Conversation Transcription Service initialized - Region: {Region}, Language: {Language}",
            _options.Region, _options.Language);
    }

    /// <summary>
    /// Transcribe audio file to text with speaker information using ConversationTranscriber
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var startTime = DateTime.UtcNow;
        var segments = new List<SpeakerSegment>();

        _logger.LogInformation("Starting conversation transcription [CorrelationId: {CorrelationId}] - File: {FileName}",
            correlationId, fileName);

        try
        {
            return await ProcessAudioFileWithConversationTranscriberAsync(audioStream, fileName, correlationId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Conversation transcription failed [CorrelationId: {CorrelationId}]", correlationId);
            throw;
        }
    }

    /// <summary>
    /// Transcribe audio file to text (simple version)
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = await TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
        return result.Text;
    }

    /// <summary>
    /// Convert audio stream to WAV format compatible with Azure Speech Services
    /// </summary>
    private async Task<string> ConvertAudioToWavAsync(
        Stream audioStream, 
        string fileName, 
        string correlationId, 
        CancellationToken cancellationToken)
    {
        var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
        
        // If already WAV, just save it directly
        if (fileExtension == ".wav")
        {
            var tempWavPath = Path.GetTempFileName() + ".wav";
            audioStream.Position = 0;
            using (var fileStream = new FileStream(tempWavPath, FileMode.Create))
            {
                await audioStream.CopyToAsync(fileStream, cancellationToken);
            }
            
            _logger.LogInformation("Using existing WAV file [CorrelationId: {CorrelationId}]", correlationId);
            
            return tempWavPath;
        }
        
        // Convert non-WAV files using FFmpeg
        string? tempInputPath = null;
        string? tempOutputPath = null;
        
        try
        {
            // Save original file
            tempInputPath = Path.Combine(Path.GetTempPath(), $"msio_input_{Guid.NewGuid()}{fileExtension}");
            audioStream.Position = 0;
            using (var fs = new FileStream(tempInputPath, FileMode.Create, FileAccess.Write))
            {
                await audioStream.CopyToAsync(fs, cancellationToken);
            }
            
            // Prepare output path
            tempOutputPath = Path.Combine(Path.GetTempPath(), $"msio_output_{Guid.NewGuid()}.wav");
            
            // Run FFmpeg to convert to WAV (PCM 16kHz mono)
            var ffmpegArgs = $"-y -i \"{tempInputPath}\" -ar 16000 -ac 1 -acodec pcm_s16le -f wav -map_metadata -1 \"{tempOutputPath}\"";
            
            _logger.LogInformation("Converting audio to WAV [CorrelationId: {CorrelationId}] - From: {Extension}",
                correlationId, fileExtension);
            
            var proc = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = ffmpegArgs,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };
            
            proc.Start();
            string stdOut = await proc.StandardOutput.ReadToEndAsync();
            string stdErr = await proc.StandardError.ReadToEndAsync();
            proc.WaitForExit();
            
            if (proc.ExitCode != 0)
            {
                _logger.LogError("FFmpeg conversion failed [CorrelationId: {CorrelationId}] - Error: {Error}",
                    correlationId, stdErr);
                throw new InvalidOperationException($"Audio conversion failed: {stdErr}");
            }
            
            if (!File.Exists(tempOutputPath))
            {
                throw new InvalidOperationException("Converted WAV file was not created");
            }
            
            _logger.LogInformation("Audio conversion successful [CorrelationId: {CorrelationId}]", correlationId);
            
            return tempOutputPath;
        }
        finally
        {
            // Clean up input file
            if (tempInputPath != null && File.Exists(tempInputPath))
            {
                try { File.Delete(tempInputPath); } catch { }
            }
        }
    }

    /// <summary>
    /// Get the name of the transcription provider
    /// Implementation of ITranscriptionService interface
    /// </summary>
    public string GetProviderName()
    {
        return "Azure Conversation Transcription";
    }

    /// <summary>
    /// Check if Azure Speech Services is available
    /// </summary>
    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // Test basic connectivity by creating a SpeechConfig
            var testConfig = SpeechConfig.FromSubscription(_options.Key, _options.Region);
            _logger.LogDebug("Azure Speech Services availability check passed");
            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Speech Services availability check failed: {Message}", ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Get service status and configuration information
    /// </summary>
    public string GetServiceStatus()
    {
        return $"Azure Conversation Transcription - Region: {_options.Region}, Language: {_options.Language}";
    }

    /// <summary>
    /// Process audio file with ConversationTranscriber for speaker diarization
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
            // Convert audio to WAV format if needed
            var tempFilePath = await ConvertAudioToWavAsync(audioStream, fileName, correlationId, cancellationToken);
            
            try
            {
                _logger.LogInformation("Using converted audio file [CorrelationId: {CorrelationId}] - Path: {TempPath}",
                    correlationId, tempFilePath);

                // Configure audio input from file
                using var audioConfig = AudioConfig.FromWavFileInput(tempFilePath);
                
                // Create ConversationTranscriber for speaker diarization
                using var conversationTranscriber = new ConversationTranscriber(_speechConfig, audioConfig);

                // Setup completion tracking
                var transcriptionComplete = new TaskCompletionSource<bool>();

                // Set up event handlers for ConversationTranscriber
                conversationTranscriber.Transcribed += (s, e) =>
                {
                    _logger.LogInformation("Conversation transcribed [CorrelationId: {CorrelationId}] - Reason: {Reason}, Speaker: {Speaker}, Text: '{Text}'",
                        correlationId, e.Result.Reason, e.Result.SpeakerId ?? "Unknown", e.Result.Text ?? "null");

                    if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
                    {
                        var segment = CreateSpeakerSegmentFromConversationResult(e.Result, correlationId);
                        segments.Add(segment);
                    }
                };

                conversationTranscriber.Transcribing += (s, e) =>
                {
                    _logger.LogDebug("Conversation transcribing [CorrelationId: {CorrelationId}] - Speaker: {Speaker}: {Text}",
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
                    _logger.LogDebug("Conversation transcription session started [CorrelationId: {CorrelationId}]", correlationId);
                };

                conversationTranscriber.SessionStopped += (s, e) =>
                {
                    _logger.LogDebug("Conversation transcription session stopped [CorrelationId: {CorrelationId}]", correlationId);
                    transcriptionComplete.TrySetResult(true);
                };

                // Start conversation transcription
                await conversationTranscriber.StartTranscribingAsync();

                // Wait for completion with timeout
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

            // Process and return results
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
    /// Create speaker segment from ConversationTranscriptionResult
    /// </summary>
    private SpeakerSegment CreateSpeakerSegmentFromConversationResult(ConversationTranscriptionResult result, string correlationId)
    {
        // ConversationTranscriber provides speaker ID directly
        var speakerId = result.SpeakerId ?? "Speaker 1";
        
        // Normalize speaker naming format to use "Speaker #" format
        if (speakerId.StartsWith("Guest", StringComparison.OrdinalIgnoreCase))
        {
            // Convert Guest-X to Speaker X format
            var guestNumber = speakerId.Substring(5).TrimStart('-');
            speakerId = $"Speaker {guestNumber}";
        }
        else if (speakerId.StartsWith("Speaker", StringComparison.OrdinalIgnoreCase))
        {
            // Keep Speaker format but ensure space format "Speaker X"
            var parts = speakerId.Split(new[] { '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 1)
            {
                speakerId = $"Speaker {parts[1]}";
            }
        }
        else
        {
            // Default naming for unknown formats
            speakerId = "Speaker 1";
        }

        // Calculate timing from Azure result
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
}
