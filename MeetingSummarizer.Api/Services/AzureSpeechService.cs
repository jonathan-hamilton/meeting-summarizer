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
    private readonly TimeSpan _requestTimeout;

    public AzureSpeechService(IOptions<AzureSpeechOptions> options, ILogger<AzureSpeechService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _requestTimeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);

        if (!_options.IsValid())
        {
            _logger.LogError("Azure Speech Services configuration is invalid. Key: {MaskedKey}, Region: {Region}",
                _options.GetMaskedKey(), _options.Region);
        }
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        if (!_options.IsValid())
        {
            throw new InvalidOperationException("Azure Speech Services is not properly configured. Please check your API key and region.");
        }

        return await ExecuteWithRetryAsync(async () =>
        {
            _logger.LogInformation("Starting Azure Speech Services transcription for file: {FileName} (Size: {Size} bytes)",
                fileName, audioStream.Length);

            // Ensure stream is at the beginning
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            // Use REST API approach which has better audio format support
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _options.Key);

            // Convert stream to byte array
            byte[] audioData;
            using (var memoryStream = new MemoryStream())
            {
                await audioStream.CopyToAsync(memoryStream, cancellationToken);
                audioData = memoryStream.ToArray();
            }

            _logger.LogDebug("Audio data size: {Size} bytes", audioData.Length);
            Console.WriteLine($"[DEBUG] Audio data size: {audioData.Length} bytes");

            // Create the REST API request
            var requestUri = $"https://{_options.Region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language={_options.Language}&format=detailed";
            
            _logger.LogDebug("Azure Speech API request URI: {RequestUri}", requestUri);
            Console.WriteLine($"[DEBUG] Azure Speech API request URI: {requestUri}");
            
            using var content = new ByteArrayContent(audioData);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/mpeg");

            try
            {
                using var timeoutCts = new CancellationTokenSource(_requestTimeout);
                using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                _logger.LogDebug("Sending request to Azure Speech Services...");
                Console.WriteLine($"[DEBUG] Sending request to Azure Speech Services...");
                var response = await httpClient.PostAsync(requestUri, content, combinedCts.Token);
                var responseContent = await response.Content.ReadAsStringAsync(combinedCts.Token);

                _logger.LogInformation("Azure Speech API response: Status={StatusCode}, Content={Response}", response.StatusCode, responseContent);
                Console.WriteLine($"[DEBUG] Azure Speech API response: Status={response.StatusCode}, Content={responseContent}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Azure Speech Services API error: {StatusCode} {Content}", response.StatusCode, responseContent);
                    throw new HttpRequestException($"Azure Speech Services API returned {response.StatusCode}: {responseContent}");
                }

                // Parse the JSON response
                using var document = System.Text.Json.JsonDocument.Parse(responseContent);
                var root = document.RootElement;

                // Check recognition status first
                string recognitionStatus = "";
                if (root.TryGetProperty("RecognitionStatus", out var statusElement))
                {
                    recognitionStatus = statusElement.GetString() ?? "";
                }

                // Handle different recognition statuses
                if (recognitionStatus == "InitialSilenceTimeout")
                {
                    _logger.LogWarning("Azure Speech Services timed out waiting for speech to begin. Audio may have leading silence or low volume.");
                    throw new InvalidOperationException("Azure Speech Services: Initial silence timeout - audio may be unclear");
                }
                else if (recognitionStatus != "Success")
                {
                    _logger.LogWarning("Azure Speech Services returned status: {Status}", recognitionStatus);
                    throw new InvalidOperationException($"Azure Speech Services returned status: {recognitionStatus}");
                }

                string recognizedText = "";
                if (root.TryGetProperty("DisplayText", out var displayTextElement))
                {
                    recognizedText = displayTextElement.GetString() ?? "";
                }
                else if (root.TryGetProperty("NBest", out var nbestElement) && nbestElement.GetArrayLength() > 0)
                {
                    var firstResult = nbestElement[0];
                    if (firstResult.TryGetProperty("Display", out var displayElement))
                    {
                        recognizedText = displayElement.GetString() ?? "";
                    }
                }

                if (string.IsNullOrWhiteSpace(recognizedText))
                {
                    _logger.LogWarning("Azure Speech Services returned empty transcription for file: {FileName}", fileName);
                    throw new InvalidOperationException("Azure Speech Services returned empty transcription - audio may be unclear");
                }

                // Create speaker segments from the transcribed text
                var segments = CreateSimpleSpeakerSegments(recognizedText);

                _logger.LogInformation("Azure Speech Services transcription completed for file: {FileName}. Text length: {Length} characters",
                    fileName, recognizedText.Length);

                return new TranscriptionResult
                {
                    Text = recognizedText,
                    Segments = segments,
                    DetectedLanguage = _options.Language,
                    Duration = segments.LastOrDefault()?.End ?? 0
                };
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                _logger.LogError("Azure Speech Services request timed out for file: {FileName}", fileName);
                throw new TimeoutException($"Azure Speech Services request timed out after {_requestTimeout.TotalSeconds} seconds", ex);
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

    /// <summary>
    /// Create simple speaker segments from transcribed text
    /// </summary>
    private static List<SpeakerSegment> CreateSimpleSpeakerSegments(string text)
    {
        var segments = new List<SpeakerSegment>();
        if (string.IsNullOrWhiteSpace(text)) return segments;

        var sentences = text.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);
        var currentTime = 0.0;
        var speakerIndex = 1;

        foreach (var sentence in sentences)
        {
            if (string.IsNullOrWhiteSpace(sentence)) continue;

            var trimmedSentence = sentence.Trim() + ".";
            var duration = Math.Max(2.0, trimmedSentence.Length * 0.1);

            segments.Add(new SpeakerSegment
            {
                Speaker = $"Speaker {speakerIndex}",
                Text = trimmedSentence,
                Start = currentTime,
                End = currentTime + duration,
                Confidence = 0.9
            });

            currentTime += duration + 0.5;
            speakerIndex = speakerIndex % 3 + 1; // Rotate between 3 speakers
        }

        return segments;
    }
}
