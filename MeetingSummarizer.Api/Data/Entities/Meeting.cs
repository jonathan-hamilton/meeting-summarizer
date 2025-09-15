using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a meeting session with persistent storage
/// </summary>
public class Meeting
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Foreign key to User who owns this meeting
    /// </summary>
    [Required]
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Display name for the meeting
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional meeting description
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Original uploaded filename
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// File size in bytes for storage tracking
    /// </summary>
    public long FileSizeBytes { get; set; }
    
    /// <summary>
    /// Audio duration in seconds
    /// </summary>
    public int DurationSeconds { get; set; }
    
    /// <summary>
    /// Azure Blob Storage path for the audio file
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string BlobStoragePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Current Azure storage tier (Hot, Cool, Archive)
    /// </summary>
    [MaxLength(20)]
    public string StorageTier { get; set; } = "Hot";
    
    /// <summary>
    /// Processing status of the meeting
    /// </summary>
    public MeetingStatus Status { get; set; } = MeetingStatus.Uploaded;
    
    /// <summary>
    /// Transcription text (JSON format)
    /// </summary>
    public string? TranscriptionJson { get; set; }
    
    /// <summary>
    /// Summary content (JSON format)
    /// </summary>
    public string? SummaryJson { get; set; }
    
    /// <summary>
    /// Speaker mappings (JSON format)
    /// </summary>
    public string? SpeakerMappingsJson { get; set; }
    
    /// <summary>
    /// Number of detected speakers in the meeting
    /// </summary>
    public int SpeakerCount { get; set; } = 0;
    
    /// <summary>
    /// Action items (JSON format)
    /// </summary>
    public string? ActionItemsJson { get; set; }
    
    /// <summary>
    /// Tokens consumed for processing this meeting
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TokensConsumed { get; set; } = 0;
    
    /// <summary>
    /// When the meeting was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When processing was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }
    
    /// <summary>
    /// When this meeting was last accessed (for storage tier management)
    /// </summary>
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Automatic deletion date (365 days from creation for paid users)
    /// </summary>
    public DateTime? ScheduledDeletionAt { get; set; }
    
    /// <summary>
    /// Navigation property to owning user
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;
    
    /// <summary>
    /// Navigation property for meeting history/audit trail
    /// </summary>
    public virtual ICollection<MeetingHistory> History { get; set; } = new List<MeetingHistory>();

    /// <summary>
    /// Navigation property for batch transcription jobs associated with this meeting
    /// </summary>
    public virtual ICollection<BatchTranscriptionJob> BatchTranscriptionJobs { get; set; } = new List<BatchTranscriptionJob>();
}

/// <summary>
/// Meeting processing status enumeration
/// </summary>
public enum MeetingStatus
{
    Uploaded = 0,
    Transcribing = 1,
    Transcribed = 2,
    Summarizing = 3,
    Completed = 4,
    Failed = 5,
    Deleted = 6
}
