using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Transcription;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring Azure Speech Services
/// </summary>
public static class AzureSpeechServiceExtensions
{
    /// <summary>
    /// Add Azure Speech Services to the service collection
    /// </summary>
    public static IServiceCollection AddAzureSpeechServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Azure Speech options
        services.Configure<AzureSpeechOptions>(configuration.GetSection(AzureSpeechOptions.SectionName));

        // Register Azure Conversation Transcription Service
        services.AddScoped<AzureConversationTranscriptionService>();

        return services;
    }

    /// <summary>
    /// Validate Azure Speech Services configuration at startup
    /// </summary>
    public static void ValidateAzureSpeechConfiguration(this IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<AzureConversationTranscriptionService>>();
        var options = serviceProvider.GetRequiredService<IOptions<AzureSpeechOptions>>();

        if (options.Value.IsValid())
        {
            logger.LogInformation("Azure Speech Services configured successfully - Region: {Region}, Key: {MaskedKey}",
                options.Value.Region, options.Value.GetMaskedKey());
        }
        else
        {
            logger.LogWarning("Azure Speech Services configuration incomplete");
        }
    }
}
