namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration options for OpenAI API integration
/// </summary>
public class OpenAIOptions
{
    /// <summary>
    /// OpenAI API Key
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// OpenAI Model to use (e.g., "gpt-4", "gpt-3.5-turbo")
    /// </summary>
    public string Model { get; set; } = "gpt-4";

    /// <summary>
    /// Default chat model for conversations (alias for Model)
    /// </summary>
    public string DefaultChatModel => Model;

    /// <summary>
    /// Maximum tokens for API requests
    /// </summary>
    public int MaxTokens { get; set; } = 1500;

    /// <summary>
    /// Request timeout in seconds
    /// </summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>
    /// Temperature for text generation (0.0 to 2.0)
    /// </summary>
    public double Temperature { get; set; } = 0.7;

    /// <summary>
    /// Validates if the configuration is valid
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(ApiKey) &&
               !string.IsNullOrWhiteSpace(Model) &&
               MaxTokens > 0 &&
               TimeoutSeconds > 0 &&
               Temperature >= 0.0 && Temperature <= 2.0;
    }

    /// <summary>
    /// Gets a masked version of the API key for logging
    /// </summary>
    public string GetMaskedApiKey()
    {
        if (string.IsNullOrWhiteSpace(ApiKey))
            return "Not configured";

        if (ApiKey.Length <= 8)
            return new string('*', ApiKey.Length);

        return $"{ApiKey[..4]}...{ApiKey[^4..]}";
    }
}