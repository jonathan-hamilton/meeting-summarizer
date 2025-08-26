using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring Azure Speech Services (Real-time only)
/// </summary>
public static class AzureSpeechServiceExtensions
{
    /// <summary>
    /// Add Azure Speech Services Real-time transcription to the service collection
    /// </summary>
    public static IServiceCollection AddAzureSpeechServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Azure Speech options
        services.Configure<AzureSpeechOptions>(configuration.GetSection(AzureSpeechOptions.SectionName));

        return services;
    }

    /// <summary>
    /// Validate Azure Speech Services configuration at startup
    /// </summary>
    public static void ValidateAzureSpeechConfiguration(this IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<AzureRealTimeTranscriptionService>>();
        var options = serviceProvider.GetRequiredService<IOptions<AzureSpeechOptions>>();

        if (options.Value.IsValid())
        {
            logger.LogInformation("Azure Speech Services configured successfully - Region: {Region}, Key: {MaskedKey}",
                options.Value.Region, options.Value.GetMaskedKey());
        }
        else
        {
            logger.LogWarning("Azure Speech Services configuration incomplete - will fallback to OpenAI Whisper");
        }
    }
}
