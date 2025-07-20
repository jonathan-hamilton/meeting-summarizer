using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Model for mapping speaker labels to real names and roles
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
