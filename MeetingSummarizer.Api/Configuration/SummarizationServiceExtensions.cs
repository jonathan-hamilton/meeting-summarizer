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
        // Configure OpenAI options for summarization
        services.Configure<OpenAIOptions>(configuration.GetSection("OpenAI"));

        // Register HTTP client for OpenAI
        services.AddHttpClient<OpenAISummarizationService>();

        // Register OpenAI summarization service
        services.AddScoped<OpenAISummarizationService>();

        // Register the summarization service interface with fallback logic
        services.AddScoped<IOpenAISummarizationService>(serviceProvider =>
        {
            var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("SummarizationServiceConfiguration");
            var openAIOptions = configuration.GetSection("OpenAI").Get<OpenAIOptions>();

            if (openAIOptions?.IsValid() == true)
            {
                try
                {
                    var openAIService = serviceProvider.GetRequiredService<OpenAISummarizationService>();
                    logger.LogInformation("OpenAI summarization service configured successfully");
                    return openAIService;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "OpenAI summarization service configuration failed, using mock service");
                }
            }
            else
            {
                logger.LogWarning("OpenAI configuration not valid, using mock service for summarization");
            }

            // Return a mock implementation if OpenAI is not available
            return new MockOpenAISummarizationService(logger);
        });

        // Register the main summarization service
        services.AddScoped<ISummarizationService, SummarizationService>();

        return services;
    }

    /// <summary>
    /// Check if AI summarization service should be used based on configuration and connectivity
    /// </summary>
    public static async Task<bool> ShouldUseAISummarizationAsync(this IServiceProvider serviceProvider)
    {
        try
        {
            var summarizationService = serviceProvider.GetService<ISummarizationService>();
            if (summarizationService == null) return false;

            return await summarizationService.IsServiceAvailableAsync();
        }
        catch
        {
            return false;
        }
    }
}
