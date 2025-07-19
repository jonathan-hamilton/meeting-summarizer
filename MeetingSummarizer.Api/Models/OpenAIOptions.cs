namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration options for OpenAI integration
/// </summary>
public class OpenAIOptions
{
    /// <summary>
    /// Configuration section name in appsettings.json
    /// </summary>
    public const string SectionName = "OpenAI";

    /// <summary>
    /// OpenAI API Key
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// OpenAI Organization ID (optional)
    /// </summary>
    public string? OrganizationId { get; set; }

    /// <summary>
    /// OpenAI Project ID (optional)
    /// </summary>
    public string? ProjectId { get; set; }

    /// <summary>
    /// Default model for transcription
    /// </summary>
    public string DefaultTranscriptionModel { get; set; } = "whisper-1";

    /// <summary>
    /// Default model for chat/summarization
    /// </summary>
    public string DefaultChatModel { get; set; } = "gpt-4o-mini";

    /// <summary>
    /// Request timeout in seconds
    /// </summary>
    public int TimeoutSeconds { get; set; } = 300;

    /// <summary>
    /// Maximum retries for failed requests
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// Validates that required configuration is present
    /// </summary>
    /// <returns>True if configuration is valid</returns>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(ApiKey);
    }
}
