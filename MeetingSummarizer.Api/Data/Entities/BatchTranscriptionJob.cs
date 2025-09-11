using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Entity for tracking Azure Batch Transcription jobs
/// Supports async job processing with retry logic and auto-refund capability
/// </summary>
[Table("BatchTranscriptionJobs")]
public class BatchTranscriptionJob
{
    /// <summary>
    /// Primary key for the batch transcription job
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who submitted the job
    /// </summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Original filename of the uploaded audio file
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the batch job
    /// Values: submitted, processing, completed, failed
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "submitted";

    /// <summary>
    /// Azure Batch Transcription API job ID
    /// </summary>
    [MaxLength(255)]
    public string? AzureJobId { get; set; }

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
    /// Final transcription results as JSON
    /// </summary>
    public string? ResultsJson { get; set; }

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Number of retry attempts made
    /// </summary>
    [Range(0, 10)]
    public int RetryCount { get; set; } = 0;

    /// <summary>
    /// Maximum number of retries allowed
    /// </summary>
    [Range(1, 10)]
    public int MaxRetries { get; set; } = 3;

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
    /// Navigation property to User entity
    /// </summary>
    public virtual User? User { get; set; }

    /// <summary>
    /// Check if the job can be retried
    /// </summary>
    public bool CanRetry => RetryCount < MaxRetries && Status == "failed";

    /// <summary>
    /// Check if the job is in a final state
    /// </summary>
    public bool IsCompleted => Status == "completed" || Status == "failed";

    /// <summary>
    /// Get processing duration if completed
    /// </summary>
    public TimeSpan? ProcessingDuration => 
        CompletedAt.HasValue ? CompletedAt.Value - SubmittedAt : null;
}
