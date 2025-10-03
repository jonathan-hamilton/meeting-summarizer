namespace MeetingSummarizer.Api.Models.Chat;

/// <summary>
/// Request model for chat interactions
/// </summary>
public class ChatRequest
{
    /// <summary>
    /// User's message content
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Current app context to help AI provide relevant responses
    /// </summary>
    public ChatContext? Context { get; set; }

    /// <summary>
    /// Session ID for tracking conversation and rate limiting
    /// </summary>
    public string? SessionId { get; set; }
}

/// <summary>
/// Response model for chat interactions
/// </summary>
public class ChatResponse
{
    /// <summary>
    /// AI-generated response message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Timestamp of the response
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether the session has reached message limits
    /// </summary>
    public bool SessionLimitReached { get; set; }

    /// <summary>
    /// Number of messages remaining in current session
    /// </summary>
    public int MessagesRemaining { get; set; }

    /// <summary>
    /// Suggested actions the user can take (future enhancement)
    /// </summary>
    public List<ChatAction>? SuggestedActions { get; set; }
}

/// <summary>
/// Current application context to help AI provide relevant responses
/// </summary>
public class ChatContext
{
    /// <summary>
    /// Current page/route in the application
    /// </summary>
    public string? CurrentPage { get; set; }

    /// <summary>
    /// Whether user has uploaded a file
    /// </summary>
    public bool HasUploadedFile { get; set; }

    /// <summary>
    /// Current processing status if applicable
    /// </summary>
    public string? ProcessingStatus { get; set; }

    /// <summary>
    /// Whether transcript has been generated
    /// </summary>
    public bool HasTranscript { get; set; }

    /// <summary>
    /// Number of speakers detected
    /// </summary>
    public int SpeakersDetected { get; set; }

    /// <summary>
    /// Whether speakers have been mapped
    /// </summary>
    public bool SpeakersMapped { get; set; }

    /// <summary>
    /// Whether summary has been generated
    /// </summary>
    public bool HasSummary { get; set; }

    /// <summary>
    /// Whether user is authenticated
    /// </summary>
    public bool IsAuthenticated { get; set; }

    /// <summary>
    /// Any recent error messages
    /// </summary>
    public string? RecentError { get; set; }
}

/// <summary>
/// Actionable response suggestion (future enhancement for Phase 2)
/// </summary>
public class ChatAction
{
    /// <summary>
    /// Type of action: navigate, scroll, dialog, trigger
    /// </summary>
    public required string Type { get; set; }

    /// <summary>
    /// Target for the action (page, element, dialog name)
    /// </summary>
    public required string Target { get; set; }

    /// <summary>
    /// Display label for the action button
    /// </summary>
    public required string Label { get; set; }
}

/// <summary>
/// Analytics model for chat usage tracking
/// </summary>
public class ChatAnalytics
{
    /// <summary>
    /// Session ID for tracking
    /// </summary>
    public required string SessionId { get; set; }

    /// <summary>
    /// Timestamp of interaction
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User's message (not stored for privacy)
    /// </summary>
    public string? UserMessageSummary { get; set; }

    /// <summary>
    /// Length of AI response
    /// </summary>
    public int ResponseLength { get; set; }

    /// <summary>
    /// Tokens used for the request
    /// </summary>
    public int TokensUsed { get; set; }

    /// <summary>
    /// Estimated cost of the interaction
    /// </summary>
    public decimal EstimatedCost { get; set; }

    /// <summary>
    /// Context that was provided with the request
    /// </summary>
    public ChatContext? Context { get; set; }
}