using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service interface for AI-powered meeting summarization
/// </summary>
public interface ISummarizationService
{
    /// <summary>
    /// Generate a summary from transcript text
    /// </summary>
    /// <param name="transcript">The transcript text to summarize</param>
    /// <param name="options">Summary generation options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated summary result</returns>
    Task<SummaryResult> GenerateSummaryAsync(
        string transcript,
        SummaryOptions options,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate a role-aware summary using speaker mappings
    /// </summary>
    /// <param name="transcript">The transcript text to summarize</param>
    /// <param name="speakerMappings">Speaker name and role mappings</param>
    /// <param name="options">Summary generation options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated role-aware summary result</returns>
    Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript,
        List<SpeakerMapping> speakerMappings,
        SummaryOptions options,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the summarization service is properly configured and available
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get service status information
    /// </summary>
    /// <returns>Service status details</returns>
    string GetServiceStatus();
}
