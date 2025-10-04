namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Configuration options for the AI Chat Assistant feature
/// </summary>
public class ChatAssistantOptions
{
    /// <summary>
    /// OpenAI model to use for chat responses (e.g., "gpt-3.5-turbo")
    /// </summary>
    public string OpenAIModel { get; set; } = "gpt-3.5-turbo";

    /// <summary>
    /// Maximum number of messages allowed per user session
    /// </summary>
    public int MaxMessagesPerSession { get; set; } = 30;

    /// <summary>
    /// Maximum tokens per AI response to control costs
    /// </summary>
    public int MaxTokensPerResponse { get; set; } = 150;

    /// <summary>
    /// System prompt template for AI responses. Use {context} placeholder for dynamic context.
    /// </summary>
    public string SystemPromptTemplate { get; set; } = 
        "You are a helpful assistant for meeting-summary.io, a professional meeting transcription application. " +
        "Keep responses brief, professional, and focused on app workflow guidance. Current context: {context}";

    /// <summary>
    /// Session timeout in minutes after which message count resets
    /// </summary>
    public int SessionTimeoutMinutes { get; set; } = 120;

    /// <summary>
    /// Whether to collect usage analytics for chat interactions
    /// </summary>
    public bool EnableAnalytics { get; set; } = true;

    /// <summary>
    /// Whether to track costs for chat API calls
    /// </summary>
    public bool EnableCostTracking { get; set; } = true;

    /// <summary>
    /// Temperature setting for OpenAI responses (0.0 to 1.0)
    /// Lower values = more focused/deterministic responses
    /// </summary>
    public double Temperature { get; set; } = 0.3;

    /// <summary>
    /// Maximum context size to send to OpenAI (in characters)
    /// </summary>
    public int MaxContextSize { get; set; } = 2000;
}