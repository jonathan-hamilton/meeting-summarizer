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

        // Register Azure Conversation Transcription Service as the ITranscriptionService implementation
        services.AddScoped<AzureConversationTranscriptionService>();
        services.AddScoped<ITranscriptionService>(provider => provider.GetRequiredService<AzureConversationTranscriptionService>());

        return services;
    }
}
