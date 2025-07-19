using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring transcription services with fallback support
/// </summary>
public static class TranscriptionServiceExtensions
{
    /// <summary>
    /// Configure transcription service with automatic fallback to mock service
    /// </summary>
    public static IServiceCollection AddTranscriptionService(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure OpenAI options
        services.Configure<OpenAIOptions>(configuration.GetSection("OpenAI"));

        // Register both services
        services.AddScoped<OpenAIService>();
        services.AddScoped<MockTranscriptionService>();

        // Register the appropriate service based on configuration
        services.AddScoped<IOpenAIService>(serviceProvider =>
        {
            var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("TranscriptionServiceConfiguration");
            var openAIOptions = configuration.GetSection("OpenAI").Get<OpenAIOptions>();

            if (openAIOptions?.IsValid() == true)
            {
                try
                {
                    var openAIService = serviceProvider.GetRequiredService<OpenAIService>();
                    logger.LogInformation("OpenAI service configured and available");
                    return openAIService;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "OpenAI service configuration failed, falling back to mock service");
                }
            }
            else
            {
                logger.LogWarning("OpenAI configuration not valid, using mock transcription service");
            }

            return serviceProvider.GetRequiredService<MockTranscriptionService>();
        });

        return services;
    }

    /// <summary>
    /// Check if OpenAI service should be used based on configuration and connectivity
    /// </summary>
    public static async Task<bool> ShouldUseOpenAIAsync(this IServiceProvider serviceProvider)
    {
        try
        {
            var openAIService = serviceProvider.GetService<OpenAIService>();
            if (openAIService == null) return false;

            return await openAIService.IsServiceAvailableAsync();
        }
        catch
        {
            return false;
        }
    }
}
