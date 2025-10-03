using MeetingSummarizer.Api.Models.Chat;

namespace MeetingSummarizer.Api.Services.Chat;

/// <summary>
/// Service interface for AI chat assistant functionality
/// </summary>
public interface IChatAssistantService
{
    /// <summary>
    /// Process a chat message and return AI response
    /// </summary>
    /// <param name="request">Chat request with message and context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI-generated response</returns>
    Task<ChatResponse> ProcessChatMessageAsync(ChatRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if session has reached message limits
    /// </summary>
    /// <param name="sessionId">Session ID to check</param>
    /// <returns>True if session can send more messages</returns>
    Task<bool> CanSendMessageAsync(string sessionId);

    /// <summary>
    /// Get remaining messages for a session
    /// </summary>
    /// <param name="sessionId">Session ID to check</param>
    /// <returns>Number of messages remaining</returns>
    Task<int> GetRemainingMessagesAsync(string sessionId);

    /// <summary>
    /// Reset session message count (for testing or admin purposes)
    /// </summary>
    /// <param name="sessionId">Session ID to reset</param>
    Task ResetSessionAsync(string sessionId);
}

/// <summary>
/// Service interface for chat analytics and cost tracking
/// </summary>
public interface IChatAnalyticsService
{
    /// <summary>
    /// Track a chat interaction for analytics
    /// </summary>
    /// <param name="analytics">Analytics data to track</param>
    Task TrackInteractionAsync(ChatAnalytics analytics);

    /// <summary>
    /// Get usage statistics for a time period
    /// </summary>
    /// <param name="startDate">Start date for statistics</param>
    /// <param name="endDate">End date for statistics</param>
    /// <returns>Usage statistics</returns>
    Task<ChatUsageStats> GetUsageStatsAsync(DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get estimated costs for a time period
    /// </summary>
    /// <param name="startDate">Start date for cost calculation</param>
    /// <param name="endDate">End date for cost calculation</param>
    /// <returns>Total estimated cost</returns>
    Task<decimal> GetEstimatedCostsAsync(DateTime startDate, DateTime endDate);
}

/// <summary>
/// Usage statistics model
/// </summary>
public class ChatUsageStats
{
    public int TotalInteractions { get; set; }
    public int UniqueSessions { get; set; }
    public int TotalTokensUsed { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public double AverageResponseLength { get; set; }
    public Dictionary<string, int> TopContextPages { get; set; } = new();
}