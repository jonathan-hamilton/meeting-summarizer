using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

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

        // Configure Azure Storage options
        services.Configure<AzureStorageOptions>(configuration.GetSection(AzureStorageOptions.SectionName));

        // Register HTTP client for batch transcription
        services.AddHttpClient<AzureBatchTranscriptionClient>();

        // Register batch transcription services
        services.AddScoped<AzureBatchTranscriptionClient>();
        services.AddScoped<AzureBatchTranscriptionService>();

        // Register Azure Speech Services
        services.AddScoped<AzureSpeechService>();

        return services;
    }



    /// <summary>
    /// Add the composite transcription service that handles Azure + OpenAI fallback
    /// This replaces the direct IOpenAIService registration for transcription
    /// Note: Requires OpenAI services to be registered separately
    /// </summary>
    public static IServiceCollection AddCompositeTranscriptionService(this IServiceCollection services)
    {
        // Register the OpenAI adapter
        services.AddScoped<OpenAITranscriptionAdapter>();

        // Register the composite service as the primary transcription service
        services.AddScoped<ITranscriptionService, CompositeTranscriptionService>();

        return services;
    }

    /// <summary>
    /// Validate Azure Speech Services configuration at startup
    /// </summary>
    public static void ValidateAzureSpeechConfiguration(this IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<AzureSpeechService>>();
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
