using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Configuration;
using MeetingSummarizer.Api.Models.Chat;

namespace MeetingSummarizer.Api.Services.Chat;

/// <summary>
/// In-memory analytics service for chat interactions
/// Note: For production, consider using a persistent storage solution
/// </summary>
public class ChatAnalyticsService : IChatAnalyticsService
{
    private readonly ChatAssistantOptions _options;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ChatAnalyticsService> _logger;

    // Cache keys
    private const string ANALYTICS_KEY = "chat_analytics";
    private const string DAILY_STATS_KEY = "chat_daily_stats_{0:yyyy-MM-dd}";

    public ChatAnalyticsService(
        IOptions<ChatAssistantOptions> options,
        IMemoryCache cache,
        ILogger<ChatAnalyticsService> logger)
    {
        _options = options.Value;
        _cache = cache;
        _logger = logger;
    }

    public Task TrackInteractionAsync(ChatAnalytics analytics)
    {
        if (!_options.EnableAnalytics)
        {
            return Task.CompletedTask;
        }

        try
        {
            // Store in daily aggregated stats
            var dateKey = string.Format(DAILY_STATS_KEY, analytics.Timestamp.Date);
            var dailyStats = _cache.GetOrCreate(dateKey, _ => new DailyStats
            {
                Date = analytics.Timestamp.Date,
                Interactions = new List<InteractionSummary>()
            });

            // Add interaction summary (without storing full message content for privacy)
            dailyStats?.Interactions?.Add(new InteractionSummary
            {
                SessionId = analytics.SessionId,
                Timestamp = analytics.Timestamp,
                ResponseLength = analytics.ResponseLength,
                TokensUsed = analytics.TokensUsed,
                EstimatedCost = analytics.EstimatedCost,
                ContextPage = analytics.Context?.CurrentPage ?? "unknown",
                HasUploadedFile = analytics.Context?.HasUploadedFile ?? false,
                HasTranscript = analytics.Context?.HasTranscript ?? false,
                HasSummary = analytics.Context?.HasSummary ?? false
            });

            // Set cache expiration for 7 days
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7),
                Priority = CacheItemPriority.Normal
            };

            _cache.Set(dateKey, dailyStats, cacheOptions);

            _logger.LogDebug("Tracked chat interaction for session {SessionId} with {TokensUsed} tokens", 
                analytics.SessionId, analytics.TokensUsed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking chat analytics for session {SessionId}", analytics.SessionId);
        }
        
        return Task.CompletedTask;
    }

    public Task<ChatUsageStats> GetUsageStatsAsync(DateTime startDate, DateTime endDate)
    {
        var stats = new ChatUsageStats();
        var uniqueSessions = new HashSet<string>();
        var pageCounter = new Dictionary<string, int>();

        try
        {
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                var dateKey = string.Format(DAILY_STATS_KEY, date);
                
                if (_cache.TryGetValue(dateKey, out DailyStats? dailyStats) && dailyStats != null)
                {
                    stats.TotalInteractions += dailyStats.Interactions.Count;
                    stats.TotalTokensUsed += dailyStats.Interactions.Sum(i => i.TokensUsed);
                    stats.TotalEstimatedCost += dailyStats.Interactions.Sum(i => i.EstimatedCost);

                    // Track unique sessions
                    foreach (var interaction in dailyStats.Interactions)
                    {
                        uniqueSessions.Add(interaction.SessionId);
                        
                        // Count page contexts
                        if (pageCounter.ContainsKey(interaction.ContextPage))
                            pageCounter[interaction.ContextPage]++;
                        else
                            pageCounter[interaction.ContextPage] = 1;
                    }
                }
            }

            stats.UniqueSessions = uniqueSessions.Count;
            stats.AverageResponseLength = stats.TotalInteractions > 0 
                ? GetAverageResponseLength(startDate, endDate) 
                : 0;
            stats.TopContextPages = pageCounter.OrderByDescending(kvp => kvp.Value)
                                              .Take(10)
                                              .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating usage stats for period {StartDate} to {EndDate}", startDate, endDate);
        }

        return Task.FromResult(stats);
    }

    public Task<decimal> GetEstimatedCostsAsync(DateTime startDate, DateTime endDate)
    {
        decimal totalCost = 0;

        try
        {
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                var dateKey = string.Format(DAILY_STATS_KEY, date);
                
                if (_cache.TryGetValue(dateKey, out DailyStats? dailyStats) && dailyStats != null)
                {
                    totalCost += dailyStats.Interactions.Sum(i => i.EstimatedCost);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating costs for period {StartDate} to {EndDate}", startDate, endDate);
        }

        return Task.FromResult(totalCost);
    }

    private double GetAverageResponseLength(DateTime startDate, DateTime endDate)
    {
        var totalLength = 0;
        var count = 0;

        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            var dateKey = string.Format(DAILY_STATS_KEY, date);
            
            if (_cache.TryGetValue(dateKey, out DailyStats? dailyStats) && dailyStats != null)
            {
                totalLength += dailyStats.Interactions.Sum(i => i.ResponseLength);
                count += dailyStats.Interactions.Count;
            }
        }

        return count > 0 ? (double)totalLength / count : 0;
    }

    // Internal models for analytics storage
    private class DailyStats
    {
        public DateTime Date { get; set; }
        public List<InteractionSummary> Interactions { get; set; } = new();
    }

    private class InteractionSummary
    {
        public string SessionId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public int ResponseLength { get; set; }
        public int TokensUsed { get; set; }
        public decimal EstimatedCost { get; set; }
        public string ContextPage { get; set; } = string.Empty;
        public bool HasUploadedFile { get; set; }
        public bool HasTranscript { get; set; }
        public bool HasSummary { get; set; }
    }
}