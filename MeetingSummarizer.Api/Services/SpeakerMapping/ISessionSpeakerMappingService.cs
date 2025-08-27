using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.SpeakerMapping;

/// <summary>
/// Extended service interface for session-based speaker mapping operations (S3.1)
/// </summary>
public interface ISessionSpeakerMappingService : ISpeakerMappingService
{
    /// <summary>
    /// Apply session-based override to a speaker mapping
    /// </summary>
    Task<SpeakerMappingResponse> ApplySessionOverrideAsync(string transcriptionId, string sessionId, string speakerId, string newName, string newRole);

    /// <summary>
    /// Revert a speaker override back to original values
    /// </summary>
    Task<SpeakerMappingResponse> RevertSessionOverrideAsync(string transcriptionId, string sessionId, string speakerId);

    /// <summary>
    /// Clear all session data for a specific session
    /// </summary>
    Task<bool> ClearSessionDataAsync(string sessionId);

    /// <summary>
    /// Get session override information for a transcription
    /// </summary>
    Task<SessionOverrideTracker?> GetSessionOverrideInfoAsync(string sessionId);

    /// <summary>
    /// Get session data for status checking
    /// </summary>
    Task<SessionOverrideTracker?> GetSessionDataAsync(string sessionId);
}
