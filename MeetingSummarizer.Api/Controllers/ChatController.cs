using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models.Chat;
using MeetingSummarizer.Api.Services.Chat;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for AI chat assistant functionality
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatAssistantService _chatService;
    private readonly IChatAnalyticsService _analyticsService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IChatAssistantService chatService,
        IChatAnalyticsService analyticsService,
        ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Send a message to the AI chat assistant
    /// </summary>
    /// <param name="request">Chat request with message and context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI response</returns>
    [HttpPost("message")]
    public async Task<ActionResult<ChatResponse>> SendMessage(
        [FromBody] ChatRequest request, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Message is required" });
        }

        if (request.Message.Length > 1000)
        {
            return BadRequest(new { error = "Message is too long. Please keep messages under 1000 characters." });
        }

        try
        {
            // Generate session ID if not provided
            if (string.IsNullOrEmpty(request.SessionId))
            {
                request.SessionId = HttpContext.Session.Id ?? Guid.NewGuid().ToString();
            }

            _logger.LogDebug("Processing chat message for session {SessionId}", request.SessionId);

            var response = await _chatService.ProcessChatMessageAsync(request, cancellationToken);
            
            _logger.LogDebug("Chat response generated for session {SessionId}: {MessageLength} characters", 
                request.SessionId, response.Message.Length);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat message for session {SessionId}", request.SessionId);
            
            return StatusCode(500, new ChatResponse
            {
                Message = "I'm experiencing technical difficulties. Please try again in a moment or contact support@meeting-summary.io for assistance.",
                SessionLimitReached = false,
                MessagesRemaining = await _chatService.GetRemainingMessagesAsync(request.SessionId ?? string.Empty)
            });
        }
    }

    /// <summary>
    /// Check session status and remaining messages
    /// </summary>
    /// <param name="sessionId">Session ID to check</param>
    /// <returns>Session status information</returns>
    [HttpGet("session/{sessionId}/status")]
    public async Task<ActionResult<object>> GetSessionStatus(string sessionId)
    {
        try
        {
            var canSend = await _chatService.CanSendMessageAsync(sessionId);
            var remaining = await _chatService.GetRemainingMessagesAsync(sessionId);

            return Ok(new
            {
                sessionId,
                canSendMessage = canSend,
                messagesRemaining = remaining,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session status for {SessionId}", sessionId);
            return StatusCode(500, new { error = "Unable to get session status" });
        }
    }

    /// <summary>
    /// Get usage statistics (admin endpoint - could be secured with authentication)
    /// </summary>
    /// <param name="startDate">Start date for statistics</param>
    /// <param name="endDate">End date for statistics</param>
    /// <returns>Usage statistics</returns>
    [HttpGet("analytics/usage")]
    public async Task<ActionResult<ChatUsageStats>> GetUsageStats(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.Date.AddDays(-7);
            var end = endDate ?? DateTime.UtcNow.Date;

            var stats = await _analyticsService.GetUsageStatsAsync(start, end);
            
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage statistics");
            return StatusCode(500, new { error = "Unable to get usage statistics" });
        }
    }

    /// <summary>
    /// Get estimated costs for a time period (admin endpoint)
    /// </summary>
    /// <param name="startDate">Start date for cost calculation</param>
    /// <param name="endDate">End date for cost calculation</param>
    /// <returns>Estimated total cost</returns>
    [HttpGet("analytics/costs")]
    public async Task<ActionResult<object>> GetEstimatedCosts(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.Date.AddDays(-7);
            var end = endDate ?? DateTime.UtcNow.Date;

            var totalCost = await _analyticsService.GetEstimatedCostsAsync(start, end);
            
            return Ok(new
            {
                startDate = start,
                endDate = end,
                totalEstimatedCost = totalCost,
                currency = "USD"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost estimates");
            return StatusCode(500, new { error = "Unable to get cost estimates" });
        }
    }

    /// <summary>
    /// Reset a session (admin/testing endpoint)
    /// </summary>
    /// <param name="sessionId">Session ID to reset</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("session/{sessionId}/reset")]
    public async Task<ActionResult> ResetSession(string sessionId)
    {
        try
        {
            await _chatService.ResetSessionAsync(sessionId);
            
            _logger.LogInformation("Reset chat session {SessionId}", sessionId);
            
            return Ok(new { message = "Session reset successfully", sessionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting session {SessionId}", sessionId);
            return StatusCode(500, new { error = "Unable to reset session" });
        }
    }
}