using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Enumeration for speaker source tracking (S2.5)
/// </summary>
public enum SpeakerSource
{
    /// <summary>
    /// Speaker was automatically detected during transcription
    /// </summary>
    AutoDetected,

    /// <summary>
    /// Speaker was manually added by user
    /// </summary>
    ManuallyAdded
}

/// <summary>
/// Model for mapping speaker labels to real names and roles
/// Enhanced with source tracking for S2.5
/// </summary>
public class SpeakerMapping
{
    /// <summary>
    /// Speaker identifier from transcription (e.g., "Speaker 1", "Speaker 2")
    /// </summary>
    [Required(ErrorMessage = "Speaker ID is required")]
    public string SpeakerId { get; set; } = string.Empty;

    /// <summary>
    /// Real name assigned to this speaker (e.g., "John Smith")
    /// </summary>
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Role or title assigned to this speaker (e.g., "Manager", "Developer")
    /// </summary>
    [Required(ErrorMessage = "Role is required")]
    [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Associated transcription ID for context
    /// </summary>
    [Required(ErrorMessage = "Transcription ID is required")]
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Source of the speaker (AutoDetected or ManuallyAdded) - S2.5
    /// </summary>
    public SpeakerSource Source { get; set; } = SpeakerSource.AutoDetected;
}

/// <summary>
/// Request model for saving speaker mappings
/// </summary>
public class SpeakerMappingRequest
{
    /// <summary>
    /// Transcription ID to associate mappings with
    /// </summary>
    [Required(ErrorMessage = "Transcription ID is required")]
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// List of speaker mappings to save
    /// </summary>
    [Required(ErrorMessage = "Mappings are required")]
    [MinLength(1, ErrorMessage = "At least one mapping is required")]
    public List<SpeakerMapping> Mappings { get; set; } = new();
}

/// <summary>
/// Response model for speaker mapping operations
/// </summary>
public class SpeakerMappingResponse
{
    /// <summary>
    /// Transcription ID these mappings belong to
    /// </summary>
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// List of speaker mappings
    /// </summary>
    public List<SpeakerMapping> Mappings { get; set; } = new();

    /// <summary>
    /// Indicates whether the operation was successful
    /// </summary>
    public bool Success { get; set; } = true;

    /// <summary>
    /// Message describing the result of the operation
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when mappings were last updated
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Number of speakers mapped
    /// </summary>
    public int MappedSpeakerCount => Mappings.Count;
}

/// <summary>
/// Service interface for speaker mapping operations
/// Enhanced with session-based override capabilities (S3.1)
/// </summary>
public interface ISpeakerMappingService
{
    /// <summary>
    /// Save speaker mappings for a transcription
    /// </summary>
    Task<SpeakerMappingResponse> SaveSpeakerMappingsAsync(SpeakerMappingRequest request);

    /// <summary>
    /// Retrieve speaker mappings for a transcription
    /// </summary>
    Task<SpeakerMappingResponse?> GetSpeakerMappingsAsync(string transcriptionId);

    /// <summary>
    /// Delete speaker mappings for a transcription
    /// </summary>
    Task<bool> DeleteSpeakerMappingsAsync(string transcriptionId);
}

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

/// <summary>
/// Extended speaker mapping model with session-based override tracking (S3.1)
/// </summary>
public class SessionSpeakerMappingWithOverride : SpeakerMapping
{
    /// <summary>
    /// Original auto-detected name before any user overrides
    /// </summary>
    public string? OriginalName { get; set; }

    /// <summary>
    /// Original auto-detected role before any user overrides
    /// </summary>
    public string? OriginalRole { get; set; }

    /// <summary>
    /// Indicates whether this speaker mapping has been manually overridden by the user
    /// </summary>
    public bool IsOverridden { get; set; } = false;

    /// <summary>
    /// Timestamp when the override was applied during the session
    /// </summary>
    public DateTime? SessionTimestamp { get; set; }

    /// <summary>
    /// Session identifier for tracking session-scoped overrides
    /// </summary>
    public string SessionId { get; set; } = string.Empty;
}

/// <summary>
/// Session-based override tracking for speaker mapping actions (S3.1)
/// </summary>
public class SessionOverrideTracker
{
    /// <summary>
    /// Unique identifier for the current session
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// Dictionary of override actions keyed by speaker ID
    /// </summary>
    public Dictionary<string, SessionOverrideAction> Actions { get; set; } = new();

    /// <summary>
    /// Timestamp when the session was started
    /// </summary>
    public DateTime SessionStarted { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp of the last activity in this session
    /// </summary>
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Transcription ID associated with this session
    /// </summary>
    public string TranscriptionId { get; set; } = string.Empty;
}

/// <summary>
/// Individual session override action for audit tracking (S3.1)
/// </summary>
public class SessionOverrideAction
{
    /// <summary>
    /// Type of action performed (Override, Revert, Clear)
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Original value before the override
    /// </summary>
    public string? OriginalValue { get; set; }

    /// <summary>
    /// New value after the override
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// Timestamp when this action was performed
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Field that was modified (Name, Role)
    /// </summary>
    public string FieldModified { get; set; } = string.Empty;
}

#region Session API Models (S3.1)

/// <summary>
/// Request model for applying session-based speaker overrides
/// </summary>
public class SessionOverrideRequest
{
    public string SpeakerId { get; set; } = string.Empty;
    public string NewName { get; set; } = string.Empty;
    public string? SessionId { get; set; }
}

/// <summary>
/// Request model for reverting session-based speaker overrides
/// </summary>
public class SessionRevertRequest
{
    public string SpeakerId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
}

/// <summary>
/// Request model for clearing session data
/// </summary>
public class SessionClearRequest
{
    public string SessionId { get; set; } = string.Empty;
}

/// <summary>
/// Response model for session-based override operations
/// </summary>
public class SessionOverrideResponse
{
    public bool Success { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string SpeakerId { get; set; } = string.Empty;
    public string? OriginalName { get; set; }
    public string NewName { get; set; } = string.Empty;
}

/// <summary>
/// Response model for session status queries
/// </summary>
public class SessionStatusResponse
{
    public string SessionId { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int OverrideCount { get; set; }
}

#endregion