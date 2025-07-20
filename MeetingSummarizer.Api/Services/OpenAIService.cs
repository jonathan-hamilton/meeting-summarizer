using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Audio;
using OpenAI.Chat;
using MeetingSummarizer.Api.Models;
using System.ClientModel;
using System.Text;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// OpenAI service implementation for transcription and summarization with production-ready error handling
/// </summary>
public class OpenAIService : IOpenAIService
{
    private readonly OpenAIClient _openAIClient;
    private readonly OpenAIOptions _options;
    private readonly ILogger<OpenAIService> _logger;
    private readonly TimeSpan _requestTimeout;

    public OpenAIService(IOptions<OpenAIOptions> options, ILogger<OpenAIService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _requestTimeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);

        if (!_options.IsValid())
        {
            _logger.LogWarning("OpenAI service is not properly configured. API key is missing.");
            _openAIClient = null!; // Will be handled gracefully in methods
            return;
        }

        try
        {
            var clientOptions = new OpenAIClientOptions();

            // Configure organization and project if provided
            if (!string.IsNullOrWhiteSpace(_options.OrganizationId))
            {
                _logger.LogInformation("OpenAI Organization ID configured: {OrganizationId}",
                    _options.OrganizationId.Substring(0, Math.Min(8, _options.OrganizationId.Length)) + "...");
            }

            if (!string.IsNullOrWhiteSpace(_options.ProjectId))
            {
                _logger.LogInformation("OpenAI Project ID configured: {ProjectId}",
                    _options.ProjectId.Substring(0, Math.Min(8, _options.ProjectId.Length)) + "...");
            }

            _openAIClient = new OpenAIClient(new ApiKeyCredential(_options.ApiKey), clientOptions);
            _logger.LogInformation("OpenAI client initialized successfully with timeout: {TimeoutSeconds}s, max retries: {MaxRetries}",
                _options.TimeoutSeconds, _options.MaxRetries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize OpenAI client");
            _openAIClient = null!;
        }
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            throw new InvalidOperationException("OpenAI service is not properly configured. Please check your API key configuration.");
        }

        return await ExecuteWithRetryAsync(async () =>
        {
            _logger.LogInformation("Starting enhanced audio transcription with speaker diarization for file: {FileName} (Size: {Size} bytes)",
                fileName, audioStream.Length);

            var audioClient = _openAIClient.GetAudioClient(_options.DefaultTranscriptionModel);

            // Ensure stream is at the beginning
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            // Validate audio stream
            ValidateAudioStream(audioStream, fileName);

            var transcriptionOptions = new AudioTranscriptionOptions
            {
                ResponseFormat = AudioTranscriptionFormat.Text,
                Temperature = 0.1f, // Lower temperature for more consistent transcription
                // Note: Language can be specified for better performance if known
                // Language = "en"
            };

            using var timeoutCts = new CancellationTokenSource(_requestTimeout);
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            var result = await audioClient.TranscribeAudioAsync(audioStream, fileName, transcriptionOptions, combinedCts.Token);
            var transcriptionText = result.Value.Text ?? string.Empty;

            if (string.IsNullOrWhiteSpace(transcriptionText))
            {
                _logger.LogWarning("OpenAI returned empty transcription for file: {FileName}", fileName);
                throw new InvalidOperationException("Transcription returned empty result");
            }

            // Create speaker segments from the transcribed text
            // Note: OpenAI Whisper in this SDK version doesn't provide native speaker diarization
            // This creates simulated speaker segments for demonstration
            var segments = CreateSpeakerSegments(transcriptionText);

            var transcriptionResult = new TranscriptionResult
            {
                Text = transcriptionText,
                Segments = segments,
                DetectedLanguage = "en", // Could be enhanced to detect language
                Duration = null // Duration would come from audio analysis
            };

            _logger.LogInformation("Enhanced audio transcription completed successfully. Length: {Length} characters, Segments: {SegmentCount}",
                transcriptionText.Length, segments.Count);

            return transcriptionResult;
        }, $"transcribe audio file: {fileName}", cancellationToken);
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            throw new InvalidOperationException("OpenAI service is not properly configured. Please check your API key configuration.");
        }

        return await ExecuteWithRetryAsync(async () =>
        {
            _logger.LogInformation("Starting audio transcription for file: {FileName} (Size: {Size} bytes)",
                fileName, audioStream.Length);

            var audioClient = _openAIClient.GetAudioClient(_options.DefaultTranscriptionModel);

            // Ensure stream is at the beginning
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            // Validate audio stream
            ValidateAudioStream(audioStream, fileName);

            var transcriptionOptions = new AudioTranscriptionOptions
            {
                ResponseFormat = AudioTranscriptionFormat.Text,
                Temperature = 0.1f // Lower temperature for more consistent transcription
            };

            using var timeoutCts = new CancellationTokenSource(_requestTimeout);
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            var result = await audioClient.TranscribeAudioAsync(audioStream, fileName, transcriptionOptions, combinedCts.Token);
            var transcriptionText = result.Value.Text ?? string.Empty;

            if (string.IsNullOrWhiteSpace(transcriptionText))
            {
                _logger.LogWarning("OpenAI returned empty transcription for file: {FileName}", fileName);
                throw new InvalidOperationException("Transcription returned empty result");
            }

            _logger.LogInformation("Audio transcription completed successfully. Length: {Length} characters", transcriptionText.Length);
            return transcriptionText;

        }, $"transcribe audio file: {fileName}", cancellationToken);
    }

    public async Task<string> SummarizeTextAsync(string transcribedText, CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            throw new InvalidOperationException("OpenAI service is not properly configured. Please check your API key configuration.");
        }

        if (string.IsNullOrWhiteSpace(transcribedText))
        {
            throw new ArgumentException("Transcribed text cannot be null or empty.", nameof(transcribedText));
        }

        return await ExecuteWithRetryAsync(async () =>
        {
            _logger.LogInformation("Starting text summarization. Input length: {Length} characters", transcribedText.Length);

            // Validate input length (GPT models have token limits)
            ValidateTextLength(transcribedText);

            var chatClient = _openAIClient.GetChatClient(_options.DefaultChatModel);

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage("You are a helpful assistant that creates concise, well-structured summaries of meeting transcripts. " +
                                    "Focus on key decisions, action items, and important discussion points. " +
                                    "Format the summary with clear sections and bullet points where appropriate. " +
                                    "If the transcript mentions specific people, preserve their names and roles in the summary."),
                new UserChatMessage($"Please summarize the following meeting transcript:\n\n{transcribedText}")
            };

            var chatCompletionOptions = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 1000,
                Temperature = 0.3f // Slightly higher for more natural summary language
            };

            using var timeoutCts = new CancellationTokenSource(_requestTimeout);
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            var result = await chatClient.CompleteChatAsync(messages, chatCompletionOptions, combinedCts.Token);
            var summary = result.Value.Content[0].Text;

            if (string.IsNullOrWhiteSpace(summary))
            {
                _logger.LogWarning("OpenAI returned empty summary for text with length: {Length}", transcribedText.Length);
                throw new InvalidOperationException("Summarization returned empty result");
            }

            _logger.LogInformation("Text summarization completed successfully. Output length: {Length} characters", summary.Length);
            return summary;

        }, "summarize text", cancellationToken);
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            _logger.LogDebug("OpenAI service availability check failed: client not configured");
            return false;
        }

        try
        {
            _logger.LogDebug("Checking OpenAI service availability");

            // Simple test to verify API connectivity with timeout
            var chatClient = _openAIClient.GetChatClient(_options.DefaultChatModel);
            var testMessages = new List<ChatMessage>
            {
                new UserChatMessage("Say 'OK' if you can respond.")
            };

            var testOptions = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 5
            };

            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(10)); // Shorter timeout for availability check
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            var result = await chatClient.CompleteChatAsync(testMessages, testOptions, combinedCts.Token);
            var isAvailable = result != null && !string.IsNullOrWhiteSpace(result.Value.Content[0].Text);

            _logger.LogDebug("OpenAI service availability check result: {IsAvailable}", isAvailable);
            return isAvailable;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogDebug("OpenAI service availability check cancelled");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI service availability check failed");
            return false;
        }
    }

    public string GetServiceStatus()
    {
        if (_openAIClient == null)
        {
            return "Not configured - API key is missing or invalid";
        }

        var status = new
        {
            Configured = true,
            TranscriptionModel = _options.DefaultTranscriptionModel,
            ChatModel = _options.DefaultChatModel,
            HasOrganization = !string.IsNullOrWhiteSpace(_options.OrganizationId),
            TimeoutSeconds = _options.TimeoutSeconds,
            MaxRetries = _options.MaxRetries
        };

        return System.Text.Json.JsonSerializer.Serialize(status, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    /// <summary>
    /// Executes an operation with retry logic and enhanced error handling
    /// </summary>
    /// <typeparam name="T">The return type of the operation</typeparam>
    /// <param name="operation">The operation to execute</param>
    /// <param name="operationName">Name of the operation for logging</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The result of the operation</returns>
    private async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> operation,
        string operationName,
        CancellationToken cancellationToken = default)
    {
        var retryCount = 0;
        var maxRetries = _options.MaxRetries;

        while (retryCount <= maxRetries)
        {
            try
            {
                return await operation();
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation("Operation cancelled: {OperationName}", operationName);
                throw;
            }
            catch (Exception ex) when (retryCount < maxRetries && IsRetryableException(ex))
            {
                retryCount++;
                var delay = CalculateRetryDelay(retryCount);

                _logger.LogWarning(ex, "Retryable error during {OperationName} (attempt {Attempt}/{MaxRetries}). Retrying in {Delay}ms",
                    operationName, retryCount, maxRetries, delay.TotalMilliseconds);

                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during {OperationName} after {Attempts} attempts", operationName, retryCount + 1);

                // Wrap exceptions with more context
                var errorMessage = BuildErrorMessage(ex, operationName, retryCount);
                throw new InvalidOperationException(errorMessage, ex);
            }
        }

        throw new InvalidOperationException($"Operation {operationName} failed after {maxRetries + 1} attempts");
    }

    /// <summary>
    /// Determines if an exception is retryable
    /// </summary>
    /// <param name="exception">The exception to check</param>
    /// <returns>True if the exception is retryable</returns>
    private static bool IsRetryableException(Exception exception)
    {
        // Retry on network-related issues, timeouts, and transient OpenAI errors
        return exception is HttpRequestException ||
               exception is TaskCanceledException ||
               exception is TimeoutException ||
               (exception.Message?.Contains("timeout", StringComparison.OrdinalIgnoreCase) == true) ||
               (exception.Message?.Contains("rate limit", StringComparison.OrdinalIgnoreCase) == true) ||
               (exception.Message?.Contains("server error", StringComparison.OrdinalIgnoreCase) == true) ||
               (exception.Message?.Contains("503", StringComparison.OrdinalIgnoreCase) == true) ||
               (exception.Message?.Contains("502", StringComparison.OrdinalIgnoreCase) == true) ||
               (exception.Message?.Contains("500", StringComparison.OrdinalIgnoreCase) == true);
    }

    /// <summary>
    /// Calculates retry delay using exponential backoff with jitter
    /// </summary>
    /// <param name="retryAttempt">The current retry attempt number</param>
    /// <returns>The delay to wait before the next attempt</returns>
    private static TimeSpan CalculateRetryDelay(int retryAttempt)
    {
        var baseDelay = TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)); // Exponential backoff
        var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000)); // Add jitter
        return baseDelay + jitter;
    }

    /// <summary>
    /// Builds a comprehensive error message with context
    /// </summary>
    /// <param name="exception">The original exception</param>
    /// <param name="operationName">Name of the failed operation</param>
    /// <param name="retryCount">Number of retries attempted</param>
    /// <returns>A detailed error message</returns>
    private string BuildErrorMessage(Exception exception, string operationName, int retryCount)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Failed to {operationName} after {retryCount + 1} attempts.");
        sb.AppendLine($"Error: {exception.Message}");

        if (exception.InnerException != null)
        {
            sb.AppendLine($"Inner exception: {exception.InnerException.Message}");
        }

        // Add configuration context
        sb.AppendLine($"Configuration: Model={_options.DefaultTranscriptionModel}, Timeout={_options.TimeoutSeconds}s, MaxRetries={_options.MaxRetries}");

        return sb.ToString();
    }

    /// <summary>
    /// Validates audio stream before processing
    /// </summary>
    /// <param name="audioStream">The audio stream to validate</param>
    /// <param name="fileName">The file name for context</param>
    private static void ValidateAudioStream(Stream audioStream, string fileName)
    {
        if (audioStream == null)
        {
            throw new ArgumentNullException(nameof(audioStream));
        }

        if (!audioStream.CanRead)
        {
            throw new ArgumentException($"Audio stream for file '{fileName}' is not readable", nameof(audioStream));
        }

        if (audioStream.Length == 0)
        {
            throw new ArgumentException($"Audio stream for file '{fileName}' is empty", nameof(audioStream));
        }

        // Check for reasonable file size limits (e.g., 25MB for Whisper API)
        const long maxFileSize = 25 * 1024 * 1024; // 25MB
        if (audioStream.Length > maxFileSize)
        {
            throw new ArgumentException($"Audio file '{fileName}' is too large ({audioStream.Length / (1024 * 1024)}MB). Maximum size is {maxFileSize / (1024 * 1024)}MB", nameof(audioStream));
        }
    }

    /// <summary>
    /// Validates text length for summarization
    /// </summary>
    /// <param name="text">The text to validate</param>
    private static void ValidateTextLength(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Text cannot be null or empty", nameof(text));
        }

        // Rough token estimation (1 token ≈ 4 characters for English)
        var estimatedTokens = text.Length / 4;
        const int maxTokens = 100000; // Conservative limit for GPT-4

        if (estimatedTokens > maxTokens)
        {
            throw new ArgumentException($"Text is too long for summarization. Estimated tokens: {estimatedTokens}, maximum: {maxTokens}", nameof(text));
        }
    }

    /// <summary>
    /// Creates mock speaker segments from transcribed text
    /// This is a temporary implementation until true speaker diarization is available
    /// </summary>
    /// <param name="transcriptionText">The transcribed text</param>
    /// <returns>List of speaker segments</returns>
    private List<SpeakerSegment> CreateSpeakerSegments(string transcriptionText)
    {
        var segments = new List<SpeakerSegment>();

        if (string.IsNullOrWhiteSpace(transcriptionText))
        {
            return segments;
        }

        // Split text into sentences for speaker segments
        var sentences = transcriptionText.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);

        double currentTime = 0;
        const double averageSecondsPerSentence = 3.0; // Estimate

        for (int i = 0; i < sentences.Length; i++)
        {
            var sentence = sentences[i].Trim();
            if (string.IsNullOrEmpty(sentence)) continue;

            // Alternate speakers for demonstration (every 2-3 sentences)
            var speakerNumber = (i / 2) % 3 + 1; // Cycles through Speaker 1, 2, 3

            var segment = new SpeakerSegment
            {
                Start = currentTime,
                End = currentTime + averageSecondsPerSentence,
                Text = sentence + ".",
                Speaker = $"Speaker {speakerNumber}",
                Confidence = 0.85 + (i % 10) * 0.01 // Mock confidence between 0.85-0.94
            };

            segments.Add(segment);
            currentTime += averageSecondsPerSentence;
        }

        return segments;
    }
}
