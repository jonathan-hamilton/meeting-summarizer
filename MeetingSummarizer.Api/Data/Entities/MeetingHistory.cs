using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents audit trail and history for meeting operations
/// </summary>
public class MeetingHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Foreign key to the meeting this history entry belongs to
    /// </summary>
    [Required]
    public Guid MeetingId { get; set; }
    
    /// <summary>
    /// Type of operation performed
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OperationType { get; set; } = string.Empty;
    
    /// <summary>
    /// Description of what happened
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional metadata about the operation (JSON format)
    /// </summary>
    public string? MetadataJson { get; set; }
    
    /// <summary>
    /// User who performed the operation (if applicable)
    /// </summary>
    public Guid? PerformedByUserId { get; set; }
    
    /// <summary>
    /// When this operation occurred
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property to the meeting
    /// </summary>
    [ForeignKey(nameof(MeetingId))]
    public virtual Meeting Meeting { get; set; } = null!;
    
    /// <summary>
    /// Navigation property to user who performed the operation
    /// </summary>
    [ForeignKey(nameof(PerformedByUserId))]
    public virtual User? PerformedBy { get; set; }
}

/// <summary>
/// Common operation types for meeting history
/// </summary>
public static class MeetingOperationType
{
    public const string Created = "Created";
    public const string Uploaded = "Uploaded";
    public const string TranscriptionStarted = "TranscriptionStarted";
    public const string TranscriptionCompleted = "TranscriptionCompleted";
    public const string SummarizationStarted = "SummarizationStarted";
    public const string SummarizationCompleted = "SummarizationCompleted";
    public const string SpeakerMappingUpdated = "SpeakerMappingUpdated";
    public const string ActionItemsUpdated = "ActionItemsUpdated";
    public const string Accessed = "Accessed";
    public const string Downloaded = "Downloaded";
    public const string StorageTierChanged = "StorageTierChanged";
    public const string ScheduledForDeletion = "ScheduledForDeletion";
    public const string Deleted = "Deleted";
    public const string DataExported = "DataExported"; // GDPR compliance
}
