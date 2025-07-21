using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring summarization services with fallback support
/// </summary>
public static class SummarizationServiceExtensions
{
    /// <summary>
    /// Configure summarization service with automatic fallback to mock service
    /// </summary>
    public static IServiceCollection AddSummarizationService(this IServiceCollection services, IConfiguration configuration)
    {
        // Register both services
        services.AddScoped<SummarizationService>();
        services.AddScoped<MockSummarizationService>();

        // Register the appropriate service based on OpenAI configuration
        services.AddScoped<ISummarizationService>(serviceProvider =>
        {
            var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("SummarizationServiceConfiguration");
            var openAIOptions = configuration.GetSection("OpenAI").Get<OpenAIOptions>();

            if (openAIOptions?.IsValid() == true)
            {
                try
                {
                    var summarizationService = serviceProvider.GetRequiredService<SummarizationService>();
                    logger.LogInformation("AI Summarization service configured and available");
                    return summarizationService;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "AI Summarization service configuration failed, falling back to mock service");
                }
            }
            else
            {
                logger.LogWarning("OpenAI configuration not valid, using mock summarization service");
            }

            return serviceProvider.GetRequiredService<MockSummarizationService>();
        });

        return services;
    }

    /// <summary>
    /// Check if AI summarization service should be used based on configuration and connectivity
    /// </summary>
    public static async Task<bool> ShouldUseAISummarizationAsync(this IServiceProvider serviceProvider)
    {
        try
        {
            var summarizationService = serviceProvider.GetService<SummarizationService>();
            if (summarizationService == null) return false;

            return await summarizationService.IsServiceAvailableAsync();
        }
        catch
        {
            return false;
        }
    }
}
