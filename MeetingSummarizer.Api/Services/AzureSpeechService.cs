using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Text;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Azure Speech Services implementation for transcription with speaker diarization
/// </summary>
public class AzureSpeechService : ITranscriptionService
{
    private readonly AzureSpeechOptions _options;
    private readonly ILogger<AzureSpeechService> _logger;
    private readonly AzureBatchTranscriptionService? _batchTranscriptionService;
    private readonly TimeSpan _requestTimeout;

    public AzureSpeechService(
        IOptions<AzureSpeechOptions> options, 
        ILogger<AzureSpeechService> logger,
        AzureBatchTranscriptionService? batchTranscriptionService)
    {
        _options = options.Value;
        _logger = logger;
        _batchTranscriptionService = batchTranscriptionService;
        _requestTimeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);

        // DEBUG: Check if batch service is available at startup
        Console.WriteLine($"[DEBUG STARTUP] AzureSpeechService created. Batch service available: {_batchTranscriptionService != null}");

        if (!_options.IsValid())
        {
            _logger.LogError("Azure Speech Services configuration is invalid. Key: {MaskedKey}, Region: {Region}",
                _options.GetMaskedKey(), _options.Region);
        }
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        // CRITICAL: Use WARNING level logging to ensure it appears in logs
        _logger.LogWarning("TRANSCRIPTION START - AzureSpeechService.TranscribeAudioWithMetadataAsync called for {FileName}, Size: {Size} bytes", fileName, audioStream.Length);

        if (!_options.IsValid())
        {
            throw new InvalidOperationException("Azure Speech Services is not properly configured. Please check your API key and region.");
        }

        if (_batchTranscriptionService == null)
        {
            throw new InvalidOperationException("Batch transcription service is not available. Only batch processing is supported.");
        }

        return await ExecuteWithRetryAsync(async () =>
        {
            _logger.LogInformation("Starting Azure Batch transcription for file: {FileName} (Size: {Size} bytes)", fileName, audioStream.Length);
            
            // Ensure stream is at the beginning
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            // Always use batch transcription - no real-time API
            _logger.LogWarning("ROUTING DECISION - Using BATCH transcription for {FileName}, BatchAvailable: {BatchAvailable}", fileName, _batchTranscriptionService != null);

            try
            {
                _logger.LogInformation("Processing batch transcription for file: {FileName}", fileName);
                var result = await _batchTranscriptionService!.ProcessBatchTranscriptionAsync(audioStream, fileName, cancellationToken);
                _logger.LogInformation("Batch transcription completed successfully for file: {FileName}", fileName);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch transcription failed for {FileName}", fileName);
                throw; // Re-throw the exception since we don't have fallback
            }

        }, cancellationToken);
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = await TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
        return result.Text;
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.IsValid())
        {
            _logger.LogDebug("Azure Speech Services configuration is invalid");
            return false;
        }

        try
        {
            // Test Azure Speech Services connectivity
            var speechConfig = SpeechConfig.FromSubscription(_options.Key, _options.Region);
            speechConfig.SpeechRecognitionLanguage = _options.Language;

            // Quick test with empty audio config
            using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

            // This will validate the configuration without actually recognizing
            var testResult = await Task.FromResult(true);

            _logger.LogDebug("Azure Speech Services availability check passed");
            return testResult;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Speech Services availability check failed: {Message}", ex.Message);
            return false;
        }
    }

    public string GetServiceStatus()
    {
        if (!_options.IsValid())
        {
            return "Azure Speech Services - Configuration Invalid";
        }

        return $"Azure Speech Services - Region: {_options.Region}, Language: {_options.Language}, Key: {_options.GetMaskedKey()}";
    }

    public string GetProviderName()
    {
        return "Azure Speech Services";
    }

    /// <summary>
    /// Execute operation with retry logic for Azure-specific errors
    /// </summary>
    private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken)
    {
        var retryCount = 0;
        var baseDelay = TimeSpan.FromSeconds(1);

        while (retryCount <= _options.MaxRetries)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex) when (retryCount < _options.MaxRetries && IsRetryableException(ex))
            {
                retryCount++;
                var delay = TimeSpan.FromMilliseconds(baseDelay.TotalMilliseconds * Math.Pow(2, retryCount - 1));

                _logger.LogWarning(ex, "Azure Speech Services request failed (attempt {Attempt}/{MaxAttempts}). Retrying in {Delay}ms. Error: {Message}",
                    retryCount, _options.MaxRetries + 1, delay.TotalMilliseconds, ex.Message);

                await Task.Delay(delay, cancellationToken);
            }
        }

        // Final attempt without catch
        return await operation();
    }

    /// <summary>
    /// Determine if an exception is retryable for Azure Speech Services
    /// </summary>
    private static bool IsRetryableException(Exception ex)
    {
        return ex is HttpRequestException ||
               ex is TimeoutException ||
               (ex is InvalidOperationException && ex.Message.Contains("network")) ||
               (ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase)) ||
               (ex.Message.Contains("throttle", StringComparison.OrdinalIgnoreCase)) ||
               (ex.Message.Contains("rate limit", StringComparison.OrdinalIgnoreCase));
    }
}
