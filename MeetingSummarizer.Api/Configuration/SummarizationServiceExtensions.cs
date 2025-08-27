using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Summarization;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring summarization services
/// </summary>
public static class SummarizationServiceExtensions
{
    /// <summary>
    /// Configure OpenAI-based summarization service
    /// </summary>
    public static IServiceCollection AddSummarizationService(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure OpenAI options for summarization
        services.Configure<OpenAIOptions>(configuration.GetSection("OpenAI"));

        // Add HttpClient for OpenAI API calls
        services.AddHttpClient<OpenAISummarizationService>();

        // Register the OpenAI summarization service as the ISummarizationService implementation
        services.AddScoped<ISummarizationService, OpenAISummarizationService>();

        return services;
    }
}
