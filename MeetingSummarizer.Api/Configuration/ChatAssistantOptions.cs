namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Configuration options for the AI Chat Assistant feature
/// </summary>
public class ChatAssistantOptions
{
    /// <summary>
    /// OpenAI model to use for chat responses (e.g., "gpt-4o-mini")
    /// </summary>
    public string OpenAIModel { get; set; } = "gpt-4o-mini";

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
        "Keep responses brief, professional, and focused on app workflow guidance." +
        "\n\nCORE WORKFLOW: Upload → Transcribe → Map Speakers → Generate Summary → Email Results" +
        "\n\nKEY FEATURES:" +
        "\n• File Upload: Drag & drop or click 'SELECT FILE' button on main /app page" +
        "\n• Supported formats: MP3, WAV, M4A, FLAC, OGG (up to 100MB)" +
        "\n• Transcription: Automatic processing with real-time status updates" +
        "\n• Speaker Mapping: Use 'Edit Mapping' button to assign real names to Speaker 1, Speaker 2, etc." +
        "\n• Summary Generation: After transcription completes, click the 'GENERATE SUMMARY' button at the bottom of the page" +
        "\n• Meeting History: Access past meetings and generate summaries for those without one using 'GENERATE SUMMARY' button" +
        "\n• Email Options: Two separate email dialogs - transcript email vs summary email" +
        "\n\nSUMMARY GENERATION PROCESS:" +
        "\nTo generate a summary of your meeting, you first need to upload the meeting audio file on the main /app page by either dragging and dropping the file into the drop zone or clicking the 'SELECT FILE' button. Once the transcription is complete, there will be a GENERATE SUMMARY button at the bottom of the page. Alternatively, on the Meeting History page you can look at a specific meeting that doesn't have a summary generated and click the GENERATE SUMMARY at the bottom of the transcript." +
        "\n\nCurrent context: {context}";

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