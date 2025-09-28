using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Entity for tracking Azure Fast Transcription jobs
/// Supports async job processing with simplified architecture
/// </summary>
[Table("FastTranscriptionJobs")]
public class FastTranscriptionJob
{
    /// <summary>
    /// Primary key for the fast transcription job
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who submitted the job
    /// </summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Meeting associated with this fast transcription job
    /// </summary>
    public Guid? MeetingId { get; set; }

    /// <summary>
    /// Original filename of the uploaded audio file
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the fast transcription job
    /// Values: submitted, processing, completed, failed
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "submitted";

    /// <summary>
    /// Processing method used for this transcription
    /// Default: 'fast' (Azure Fast Transcription API)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ProcessingMethod { get; set; } = "fast";

    /// <summary>
    /// When the job was submitted
    /// </summary>
    [Required]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the job was completed (success or failure)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Estimated duration of the audio file in minutes
    /// </summary>
    [Required]
    public int EstimatedDurationMinutes { get; set; }

    /// <summary>
    /// Current progress percentage (0-100)
    /// </summary>
    [Range(0, 100)]
    public int ProgressPercentage { get; set; } = 0;

    /// <summary>
    /// Blob storage URL for compressed transcript JSON (replaces large inline storage)
    /// </summary>
    [MaxLength(2048)]
    public string? TranscriptBlobUrl { get; set; }

    /// <summary>
    /// Flag indicating whether transcript is stored in blob storage (true) or inline JSON (false)
    /// </summary>
    public bool IsTranscriptInBlobStorage { get; set; } = false;

    /// <summary>
    /// Compressed size of the transcript in blob storage (bytes)
    /// </summary>
    public long? CompressedTranscriptSize { get; set; }

    /// <summary>
    /// Final transcription results as JSON - deprecated in favor of blob storage for large files
    /// </summary>
    [Obsolete("Use TranscriptBlobUrl for large transcripts. This field maintained for backward compatibility only.")]
    public string? ResultsJson { get; set; }

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Number of tokens charged for this job
    /// </summary>
    [Required]
    public int TokensCharged { get; set; }

    /// <summary>
    /// Whether a refund has been issued for failed processing
    /// </summary>
    public bool RefundIssued { get; set; } = false;

    /// <summary>
    /// Azure Blob Storage URL for the uploaded audio file
    /// </summary>
    [MaxLength(2048)]
    public string? AudioBlobUrl { get; set; }

    /// <summary>
    /// Navigation property to User entity
    /// </summary>
    public virtual User? User { get; set; }

    /// <summary>
    /// Navigation property to parsed transcript segments
    /// </summary>
    public virtual ICollection<TranscriptSegment> TranscriptSegments { get; set; } = new List<TranscriptSegment>();

    /// <summary>
    /// Navigation property to token refunds related to this job
    /// </summary>
    public virtual ICollection<TokenRefund> TokenRefunds { get; set; } = new List<TokenRefund>();

    /// <summary>
    /// Check if the job is in a final state
    /// </summary>
    public bool IsCompleted => Status == "completed" || Status == "failed";

    /// <summary>
    /// Get processing duration if completed
    /// </summary>
    public TimeSpan? ProcessingDuration => 
        CompletedAt.HasValue ? CompletedAt.Value - SubmittedAt : null;

    /// <summary>
    /// Navigation property to the associated meeting
    /// </summary>
    [ForeignKey(nameof(MeetingId))]
    public virtual Meeting? Meeting { get; set; }
}