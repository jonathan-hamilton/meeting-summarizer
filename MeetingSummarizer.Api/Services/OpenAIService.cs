using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Audio;
using OpenAI.Chat;
using MeetingSummarizer.Api.Models;
using System.ClientModel;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// OpenAI service implementation for transcription and summarization
/// </summary>
public class OpenAIService : IOpenAIService
{
    private readonly OpenAIClient _openAIClient;
    private readonly OpenAIOptions _options;
    private readonly ILogger<OpenAIService> _logger;

    public OpenAIService(IOptions<OpenAIOptions> options, ILogger<OpenAIService> logger)
    {
        _options = options.Value;
        _logger = logger;

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
                // Note: Organization setup depends on specific SDK version
                _logger.LogInformation("OpenAI Organization ID configured: {OrganizationId}", _options.OrganizationId);
            }

            _openAIClient = new OpenAIClient(new ApiKeyCredential(_options.ApiKey), clientOptions);
            _logger.LogInformation("OpenAI client initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize OpenAI client");
            _openAIClient = null!;
        }
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            throw new InvalidOperationException("OpenAI service is not properly configured. Please check your API key configuration.");
        }

        try
        {
            _logger.LogInformation("Starting audio transcription for file: {FileName}", fileName);

            var audioClient = _openAIClient.GetAudioClient(_options.DefaultTranscriptionModel);

            // Ensure stream is at the beginning
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            var transcriptionOptions = new AudioTranscriptionOptions
            {
                ResponseFormat = AudioTranscriptionFormat.Text,
                Temperature = 0.1f // Lower temperature for more consistent transcription
            };

            var result = await audioClient.TranscribeAudioAsync(audioStream, fileName, transcriptionOptions, cancellationToken);

            var transcriptionText = result.Value.Text;
            _logger.LogInformation("Audio transcription completed successfully. Length: {Length} characters", transcriptionText.Length);
            return transcriptionText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transcribing audio file: {FileName}", fileName);
            throw new InvalidOperationException($"Failed to transcribe audio: {ex.Message}", ex);
        }
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

        try
        {
            _logger.LogInformation("Starting text summarization. Input length: {Length} characters", transcribedText.Length);

            var chatClient = _openAIClient.GetChatClient(_options.DefaultChatModel);

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage("You are a helpful assistant that creates concise, well-structured summaries of meeting transcripts. " +
                                    "Focus on key decisions, action items, and important discussion points. " +
                                    "Format the summary with clear sections and bullet points where appropriate."),
                new UserChatMessage($"Please summarize the following meeting transcript:\n\n{transcribedText}")
            };

            var chatCompletionOptions = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 1000,
                Temperature = 0.3f // Slightly higher for more natural summary language
            };

            var result = await chatClient.CompleteChatAsync(messages, chatCompletionOptions, cancellationToken);

            var summary = result.Value.Content[0].Text;
            _logger.LogInformation("Text summarization completed successfully. Output length: {Length} characters", summary.Length);

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error summarizing text");
            throw new InvalidOperationException($"Failed to summarize text: {ex.Message}", ex);
        }
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (_openAIClient == null)
        {
            return false;
        }

        try
        {
            // Simple test to verify API connectivity
            var chatClient = _openAIClient.GetChatClient(_options.DefaultChatModel);
            var testMessages = new List<ChatMessage>
            {
                new UserChatMessage("Say 'OK' if you can respond.")
            };

            var testOptions = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 5
            };

            var result = await chatClient.CompleteChatAsync(testMessages, testOptions, cancellationToken);
            return result != null && !string.IsNullOrWhiteSpace(result.Value.Content[0].Text);
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
}
