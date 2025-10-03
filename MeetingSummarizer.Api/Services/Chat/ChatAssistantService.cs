using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Configuration;
using MeetingSummarizer.Api.Models.Chat;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MeetingSummarizer.Api.Services.Chat;

/// <summary>
/// OpenAI-powered chat assistant service for user guidance
/// </summary>
public class ChatAssistantService : IChatAssistantService
{
    private readonly ChatAssistantOptions _options;
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IChatAnalyticsService _analyticsService;
    private readonly ILogger<ChatAssistantService> _logger;

    // Cache keys
    private const string SESSION_MESSAGE_COUNT_KEY = "chat_session_count_{0}";
    private const string SESSION_LAST_ACTIVITY_KEY = "chat_session_activity_{0}";

    public ChatAssistantService(
        IOptions<ChatAssistantOptions> options,
        HttpClient httpClient,
        IMemoryCache cache,
        IChatAnalyticsService analyticsService,
        ILogger<ChatAssistantService> logger)
    {
        _options = options.Value;
        _httpClient = httpClient;
        _cache = cache;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    public async Task<ChatResponse> ProcessChatMessageAsync(ChatRequest request, CancellationToken cancellationToken = default)
    {
        var sessionId = request.SessionId ?? Guid.NewGuid().ToString();
        
        try
        {
            // Check session limits
            if (!await CanSendMessageAsync(sessionId))
            {
                return new ChatResponse
                {
                    Message = "You've reached the message limit for this session. Please refresh the page to start a new conversation.",
                    SessionLimitReached = true,
                    MessagesRemaining = 0
                };
            }

            // Increment message count
            await IncrementMessageCountAsync(sessionId);

            // Build system prompt with context
            var systemPrompt = BuildSystemPrompt(request.Context);
            
            // Prepare OpenAI request
            var openAIRequest = new
            {
                model = _options.OpenAIModel,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = request.Message }
                },
                max_tokens = _options.MaxTokensPerResponse,
                temperature = _options.Temperature
            };

            var jsonContent = JsonSerializer.Serialize(openAIRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Call OpenAI API
            _logger.LogInformation("Making OpenAI API call to {Url}", "https://api.openai.com/v1/chat/completions");
            
            // Debug: Check if Authorization header exists
            var hasAuthProperty = _httpClient.DefaultRequestHeaders.Authorization != null;
            var hasAuthHeader = _httpClient.DefaultRequestHeaders.Contains("Authorization");
            _logger.LogInformation("HttpClient Authorization property set: {HasAuthProperty}, Authorization header exists: {HasAuthHeader}", 
                hasAuthProperty, hasAuthHeader);
            
            if (_httpClient.DefaultRequestHeaders.Authorization != null)
            {
                _logger.LogInformation("Authorization scheme: {Scheme}, Parameter starts with: {ParamStart}", 
                    _httpClient.DefaultRequestHeaders.Authorization.Scheme,
                    _httpClient.DefaultRequestHeaders.Authorization.Parameter?.Substring(0, Math.Min(10, _httpClient.DefaultRequestHeaders.Authorization.Parameter?.Length ?? 0)));
            }
            
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("OpenAI API call failed with status {StatusCode}: {Content}", 
                    response.StatusCode, errorContent);
                
                return new ChatResponse
                {
                    Message = "I'm temporarily unavailable. Please try again in a moment or contact support@meeting-summary.io for assistance.",
                    SessionLimitReached = false,
                    MessagesRemaining = await GetRemainingMessagesAsync(sessionId)
                };
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("OpenAI Response received: {ResponseContent}", responseContent);
            
            var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);
            _logger.LogInformation("Deserialized OpenAI response - Choices count: {ChoicesCount}", 
                openAIResponse?.Choices?.Count() ?? 0);

            var aiMessage = openAIResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? 
                "I'm having trouble processing your request. Please try again.";
                
            _logger.LogInformation("Extracted AI message: {AiMessage}", aiMessage);

            // Track analytics if enabled
            if (_options.EnableAnalytics)
            {
                var analytics = new ChatAnalytics
                {
                    SessionId = sessionId,
                    UserMessageSummary = request.Message.Length > 50 ? $"{request.Message[..47]}..." : request.Message,
                    ResponseLength = aiMessage.Length,
                    TokensUsed = openAIResponse?.Usage?.TotalTokens ?? 0,
                    EstimatedCost = CalculateEstimatedCost(openAIResponse?.Usage?.TotalTokens ?? 0),
                    Context = request.Context
                };

                await _analyticsService.TrackInteractionAsync(analytics);
            }

            return new ChatResponse
            {
                Message = aiMessage,
                SessionLimitReached = false,
                MessagesRemaining = await GetRemainingMessagesAsync(sessionId)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat message for session {SessionId}", sessionId);
            
            return new ChatResponse
            {
                Message = "I encountered an error processing your request. Please try again or contact support@meeting-summary.io if the problem persists.",
                SessionLimitReached = false,
                MessagesRemaining = await GetRemainingMessagesAsync(sessionId)
            };
        }
    }

    public async Task<bool> CanSendMessageAsync(string sessionId)
    {
        var count = await GetSessionMessageCountAsync(sessionId);
        return count < _options.MaxMessagesPerSession;
    }

    public async Task<int> GetRemainingMessagesAsync(string sessionId)
    {
        var count = await GetSessionMessageCountAsync(sessionId);
        return Math.Max(0, _options.MaxMessagesPerSession - count);
    }

    public Task ResetSessionAsync(string sessionId)
    {
        var countKey = string.Format(SESSION_MESSAGE_COUNT_KEY, sessionId);
        var activityKey = string.Format(SESSION_LAST_ACTIVITY_KEY, sessionId);
        
        _cache.Remove(countKey);
        _cache.Remove(activityKey);
        
        return Task.CompletedTask;
    }

    private async Task<int> GetSessionMessageCountAsync(string sessionId)
    {
        var key = string.Format(SESSION_MESSAGE_COUNT_KEY, sessionId);
        var activityKey = string.Format(SESSION_LAST_ACTIVITY_KEY, sessionId);
        
        // Check if session has expired
        if (_cache.TryGetValue(activityKey, out DateTime lastActivity))
        {
            if (DateTime.UtcNow.Subtract(lastActivity).TotalMinutes > _options.SessionTimeoutMinutes)
            {
                // Session expired, reset count
                _cache.Remove(key);
                _cache.Remove(activityKey);
                return 0;
            }
        }

        return _cache.GetOrCreate(key, _ => 0);
    }

    private async Task IncrementMessageCountAsync(string sessionId)
    {
        var countKey = string.Format(SESSION_MESSAGE_COUNT_KEY, sessionId);
        var activityKey = string.Format(SESSION_LAST_ACTIVITY_KEY, sessionId);
        
        var currentCount = await GetSessionMessageCountAsync(sessionId);
        var newCount = currentCount + 1;
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.SessionTimeoutMinutes),
            Priority = CacheItemPriority.Normal
        };
        
        _cache.Set(countKey, newCount, cacheOptions);
        _cache.Set(activityKey, DateTime.UtcNow, cacheOptions);
    }

    private string BuildSystemPrompt(ChatContext? context)
    {
        var contextStr = BuildContextString(context);
        return _options.SystemPromptTemplate.Replace("{context}", contextStr);
    }

    private string BuildContextString(ChatContext? context)
    {
        if (context == null) return "User is browsing the application.";

        var contextParts = new List<string>();
        
        if (!string.IsNullOrEmpty(context.CurrentPage))
            contextParts.Add($"On page: {context.CurrentPage}");
        
        if (context.HasUploadedFile)
            contextParts.Add("File uploaded");
        
        if (!string.IsNullOrEmpty(context.ProcessingStatus))
            contextParts.Add($"Status: {context.ProcessingStatus}");
        
        if (context.HasTranscript)
            contextParts.Add("Transcript available");
        
        if (context.SpeakersDetected > 0)
            contextParts.Add($"{context.SpeakersDetected} speakers detected");
        
        if (context.SpeakersMapped)
            contextParts.Add("Speakers mapped");
        
        if (context.HasSummary)
            contextParts.Add("Summary available");
        
        if (!context.IsAuthenticated)
            contextParts.Add("Not authenticated");
        
        if (!string.IsNullOrEmpty(context.RecentError))
            contextParts.Add($"Recent error: {context.RecentError}");

        var contextString = string.Join(", ", contextParts);
        
        // Limit context size
        if (contextString.Length > _options.MaxContextSize)
        {
            contextString = contextString[.._options.MaxContextSize] + "...";
        }

        return contextString.Length > 0 ? contextString : "User is browsing the application.";
    }

    private decimal CalculateEstimatedCost(int tokens)
    {
        if (!_options.EnableCostTracking) return 0;
        
        // GPT-3.5-turbo pricing: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
        // For simplicity, estimate average cost of $0.00175 per 1K tokens
        return tokens * 0.00175m / 1000;
    }

    // OpenAI API response models
    private class OpenAIResponse
    {
        [JsonPropertyName("choices")]
        public Choice[]? Choices { get; set; }
        
        [JsonPropertyName("usage")]
        public Usage? Usage { get; set; }
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public Message? Message { get; set; }
    }

    private class Message
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    private class Usage
    {
        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }
}