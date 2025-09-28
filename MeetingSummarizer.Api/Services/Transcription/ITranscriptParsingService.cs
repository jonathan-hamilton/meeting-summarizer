using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Transcription;

/// <summary>
/// Service for parsing Azure transcription results into structured database segments
/// </summary>
public interface ITranscriptParsingService
{
    /// <summary>
    /// Parse Azure transcription JSON into transcript segments for database storage
    /// </summary>
    /// <param name="azureResultsJson">Raw Azure transcription JSON</param>
    /// <param name="jobId">Transcription job ID</param>
    /// <returns>Collection of parsed transcript segments</returns>
    Task<ICollection<TranscriptSegment>> ParseAzureResultsToSegmentsAsync(string azureResultsJson, Guid jobId);

    /// <summary>
    /// Parse Azure transcription JSON and return both segments and full text
    /// </summary>
    /// <param name="azureResultsJson">Raw Azure transcription JSON</param>
    /// <param name="jobId">Transcription job ID</param>
    /// <returns>Parsed transcript segments and formatted full text</returns>
    Task<TranscriptParsingResult> ParseAzureResultsAsync(string azureResultsJson, Guid jobId);

    /// <summary>
    /// Validate Azure JSON structure before parsing
    /// </summary>
    /// <param name="azureResultsJson">Raw Azure transcription JSON</param>
    /// <returns>Validation result with any issues found</returns>
    Task<JsonValidationResult> ValidateAzureJsonAsync(string azureResultsJson);

    /// <summary>
    /// Extract speaker statistics from parsed segments
    /// </summary>
    /// <param name="segments">Collection of transcript segments</param>
    /// <returns>Speaker analysis including count and speaking time distribution</returns>
    SpeakerAnalysis AnalyzeSpeakers(ICollection<TranscriptSegment> segments);
}