using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Session-based implementation of speaker mapping service with privacy-first approach (S3.1)
/// Extends functionality with session override tracking while maintaining existing interface
/// </summary>
public class SessionSpeakerMappingService : ISessionSpeakerMappingService
{
    // Session-based storage for speaker mappings with override tracking
    private static readonly Dictionary<string, SpeakerMappingResponse> _speakerMappings = new();

    // Session override tracking storage
    private static readonly Dictionary<string, SessionOverrideTracker> _sessionTrackers = new();

    // Session timeout configuration (configurable in future)
    private static readonly TimeSpan SessionTimeout = TimeSpan.FromHours(2);

    public async Task<SpeakerMappingResponse> SaveSpeakerMappingsAsync(SpeakerMappingRequest request)
    {
        await Task.CompletedTask; // Async for future database operations

        // Clean up expired sessions before processing
        CleanupExpiredSessions();

        var response = new SpeakerMappingResponse
        {
            TranscriptionId = request.TranscriptionId,
            Mappings = request.Mappings.ToList(),
            LastUpdated = DateTime.UtcNow
        };

        _speakerMappings[request.TranscriptionId] = response;

        return response;
    }

    public async Task<SpeakerMappingResponse?> GetSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.CompletedTask; // Async for future database operations

        // Clean up expired sessions before processing
        CleanupExpiredSessions();

        _speakerMappings.TryGetValue(transcriptionId, out var mappings);
        return mappings;
    }

    public async Task<bool> DeleteSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.CompletedTask; // Async for future database operations

        // Clean up expired sessions before processing
        CleanupExpiredSessions();

        // Also remove any session trackers for this transcription
        var sessionToRemove = _sessionTrackers.FirstOrDefault(kvp => kvp.Value.TranscriptionId == transcriptionId);
        if (!sessionToRemove.Equals(default(KeyValuePair<string, SessionOverrideTracker>)))
        {
            _sessionTrackers.Remove(sessionToRemove.Key);
        }

        return _speakerMappings.Remove(transcriptionId);
    }

    /// <summary>
    /// Apply session-based override to a speaker mapping (S3.1)
    /// </summary>
    public async Task<SpeakerMappingResponse> ApplySessionOverrideAsync(string transcriptionId, string sessionId, string speakerId, string newName, string newRole)
    {
        await Task.CompletedTask;

        // Get or create session tracker
        var sessionTracker = GetOrCreateSessionTracker(sessionId, transcriptionId);

        // Get existing mappings or create baseline if they don't exist
        var existingResponse = await GetSpeakerMappingsAsync(transcriptionId);
        if (existingResponse == null)
        {
            // Create baseline speaker mapping for testing (S3.1 - will be enhanced in future iterations)
            existingResponse = new SpeakerMappingResponse
            {
                TranscriptionId = transcriptionId,
                Mappings = new List<SpeakerMapping>
                {
                    new SpeakerMapping
                    {
                        SpeakerId = speakerId,
                        Name = $"Speaker {speakerId}",
                        Role = "Participant",
                        TranscriptionId = transcriptionId,
                        Source = SpeakerSource.AutoDetected
                    }
                },
                LastUpdated = DateTime.UtcNow
            };

            // Save the baseline mapping
            _speakerMappings[transcriptionId] = existingResponse;
        }

        // Find the speaker to override
        var speakerToOverride = existingResponse.Mappings.FirstOrDefault(m => m.SpeakerId == speakerId);
        if (speakerToOverride == null)
        {
            // Create a new speaker mapping if it doesn't exist
            speakerToOverride = new SpeakerMapping
            {
                SpeakerId = speakerId,
                Name = $"Speaker {speakerId}",
                Role = "Participant",
                TranscriptionId = transcriptionId,
                Source = SpeakerSource.AutoDetected
            };
            existingResponse.Mappings.Add(speakerToOverride);
        }

        // Create session override mapping
        var overrideMapping = new SessionSpeakerMappingWithOverride
        {
            SpeakerId = speakerToOverride.SpeakerId,
            Name = newName,
            Role = newRole,
            TranscriptionId = speakerToOverride.TranscriptionId,
            Source = speakerToOverride.Source,
            OriginalName = speakerToOverride.Name,
            OriginalRole = speakerToOverride.Role,
            IsOverridden = true,
            SessionTimestamp = DateTime.UtcNow,
            SessionId = sessionId
        };

        // Track the override action
        sessionTracker.Actions[speakerId] = new SessionOverrideAction
        {
            Action = "Override",
            OriginalValue = $"{speakerToOverride.Name}|{speakerToOverride.Role}",
            NewValue = $"{newName}|{newRole}",
            Timestamp = DateTime.UtcNow,
            FieldModified = "Name,Role"
        };
        sessionTracker.LastActivity = DateTime.UtcNow;

        // Update the mappings with override
        var updatedMappings = existingResponse.Mappings.ToList();
        var index = updatedMappings.FindIndex(m => m.SpeakerId == speakerId);
        updatedMappings[index] = overrideMapping;

        var response = new SpeakerMappingResponse
        {
            TranscriptionId = transcriptionId,
            Mappings = updatedMappings,
            LastUpdated = DateTime.UtcNow
        };

        _speakerMappings[transcriptionId] = response;
        return response;
    }

    /// <summary>
    /// Revert a speaker override back to original values (S3.1)
    /// </summary>
    public async Task<SpeakerMappingResponse> RevertSessionOverrideAsync(string transcriptionId, string sessionId, string speakerId)
    {
        await Task.CompletedTask;

        // Get session tracker
        if (!_sessionTrackers.TryGetValue(sessionId, out var sessionTracker))
        {
            throw new InvalidOperationException($"Session {sessionId} not found");
        }

        // Get existing mappings
        var existingResponse = await GetSpeakerMappingsAsync(transcriptionId);
        if (existingResponse == null)
        {
            throw new InvalidOperationException($"No speaker mappings found for transcription {transcriptionId}");
        }

        // Find the overridden speaker
        var overriddenSpeaker = existingResponse.Mappings.FirstOrDefault(m => m.SpeakerId == speakerId);
        if (overriddenSpeaker == null)
        {
            throw new InvalidOperationException($"Speaker {speakerId} not found in transcription {transcriptionId}");
        }

        // Check if it's actually overridden
        if (overriddenSpeaker is SessionSpeakerMappingWithOverride sessionSpeaker && sessionSpeaker.IsOverridden)
        {
            // Revert to original values
            var revertedMapping = new SpeakerMapping
            {
                SpeakerId = sessionSpeaker.SpeakerId,
                Name = sessionSpeaker.OriginalName ?? sessionSpeaker.Name,
                Role = sessionSpeaker.OriginalRole ?? sessionSpeaker.Role,
                TranscriptionId = sessionSpeaker.TranscriptionId,
                Source = sessionSpeaker.Source
            };

            // Track the revert action
            sessionTracker.Actions[speakerId] = new SessionOverrideAction
            {
                Action = "Revert",
                OriginalValue = $"{sessionSpeaker.Name}|{sessionSpeaker.Role}",
                NewValue = $"{revertedMapping.Name}|{revertedMapping.Role}",
                Timestamp = DateTime.UtcNow,
                FieldModified = "Name,Role"
            };
            sessionTracker.LastActivity = DateTime.UtcNow;

            // Update the mappings
            var updatedMappings = existingResponse.Mappings.ToList();
            var index = updatedMappings.FindIndex(m => m.SpeakerId == speakerId);
            updatedMappings[index] = revertedMapping;

            var response = new SpeakerMappingResponse
            {
                TranscriptionId = transcriptionId,
                Mappings = updatedMappings,
                LastUpdated = DateTime.UtcNow
            };

            _speakerMappings[transcriptionId] = response;
            return response;
        }

        // Return existing response if no override to revert
        return existingResponse;
    }

    /// <summary>
    /// Clear all session data for a specific session (S3.1)
    /// </summary>
    public async Task<bool> ClearSessionDataAsync(string sessionId)
    {
        await Task.CompletedTask;

        if (_sessionTrackers.TryGetValue(sessionId, out var sessionTracker))
        {
            // Remove the session tracker
            _sessionTrackers.Remove(sessionId);

            // Remove speaker mappings associated with this session
            var transcriptionId = sessionTracker.TranscriptionId;
            if (!string.IsNullOrEmpty(transcriptionId))
            {
                _speakerMappings.Remove(transcriptionId);
            }

            return true;
        }

        return false;
    }

    /// <summary>
    /// Get session override information for a transcription (S3.1)
    /// </summary>
    public async Task<SessionOverrideTracker?> GetSessionOverrideInfoAsync(string sessionId)
    {
        await Task.CompletedTask;

        _sessionTrackers.TryGetValue(sessionId, out var sessionTracker);
        return sessionTracker;
    }

    /// <summary>
    /// Get or create a session tracker for override tracking
    /// </summary>
    private SessionOverrideTracker GetOrCreateSessionTracker(string sessionId, string transcriptionId)
    {
        if (!_sessionTrackers.TryGetValue(sessionId, out var sessionTracker))
        {
            sessionTracker = new SessionOverrideTracker
            {
                SessionId = sessionId,
                TranscriptionId = transcriptionId,
                SessionStarted = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow,
                Actions = new Dictionary<string, SessionOverrideAction>()
            };
            _sessionTrackers[sessionId] = sessionTracker;
        }
        else
        {
            sessionTracker.LastActivity = DateTime.UtcNow;
        }

        return sessionTracker;
    }

    /// <summary>
    /// Get session data for status checking (S3.1)
    /// </summary>
    public async Task<SessionOverrideTracker?> GetSessionDataAsync(string sessionId)
    {
        await Task.CompletedTask; // Async for future database operations

        // Clean up expired sessions before processing
        CleanupExpiredSessions();

        _sessionTrackers.TryGetValue(sessionId, out var sessionTracker);
        return sessionTracker;
    }

    /// <summary>
    /// Clean up expired sessions automatically (S3.1)
    /// </summary>
    private void CleanupExpiredSessions()
    {
        var expiredSessionIds = new List<string>();
        var cutoffTime = DateTime.UtcNow.Subtract(SessionTimeout);

        foreach (var kvp in _sessionTrackers)
        {
            if (kvp.Value.LastActivity < cutoffTime)
            {
                expiredSessionIds.Add(kvp.Key);
            }
        }

        foreach (var expiredSessionId in expiredSessionIds)
        {
            ClearSessionDataAsync(expiredSessionId).Wait();
        }
    }
}
