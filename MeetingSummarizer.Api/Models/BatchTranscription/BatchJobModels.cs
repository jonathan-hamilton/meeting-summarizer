using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models.BatchTranscription;

/// <summary>
/// Request model for submitting a batch transcription job
/// </summary>
public class SubmitBatchJobRequest
{
    /// <summary>
    /// Estimated duration of the audio file in minutes
    /// </summary>
    [Required]
    [Range(5, 60, ErrorMessage = "Duration must be between 5 and 60 minutes for batch processing")]
    public int EstimatedDurationMinutes { get; set; }

    /// <summary>
    /// Original filename
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Number of tokens to charge for this job
    /// </summary>
    [Required]
    [Range(1, 10000)]
    public int TokensToCharge { get; set; }
}

/// <summary>
/// Response model for batch job submission
/// </summary>
public class SubmitBatchJobResponse
{
    /// <summary>
    /// Unique job identifier
    /// </summary>
    public Guid JobId { get; set; }

    /// <summary>
    /// Current status of the job
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Estimated processing time in minutes
    /// </summary>
    public string EstimatedTime { get; set; } = string.Empty;

    /// <summary>
    /// URL to check job status
    /// </summary>
    public string CheckStatusUrl { get; set; } = string.Empty;

    /// <summary>
    /// When the job was submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }
}

/// <summary>
/// Response model for job status queries
/// </summary>
public class BatchJobStatusResponse
{
    /// <summary>
    /// Job identifier
    /// </summary>
    public Guid JobId { get; set; }

    /// <summary>
    /// Current status: submitted, processing, completed, failed
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// When the job was submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// When the job was completed (if applicable)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Estimated duration in minutes
    /// </summary>
    public int EstimatedDurationMinutes { get; set; }

    /// <summary>
    /// Original filename
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Error message if failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Number of retry attempts
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// Maximum retries allowed
    /// </summary>
    public int MaxRetries { get; set; }

    /// <summary>
    /// Whether a refund was issued
    /// </summary>
    public bool RefundIssued { get; set; }

    /// <summary>
    /// Processing duration if completed
    /// </summary>
    public TimeSpan? ProcessingDuration { get; set; }

    /// <summary>
    /// Transcription results (only when completed)
    /// </summary>
    public TranscriptionResult? Results { get; set; }
}

/// <summary>
/// Azure Batch Transcription API configuration
/// </summary>
public class AzureBatchJobRequest
{
    /// <summary>
    /// Audio file URI in Azure Blob Storage
    /// </summary>
    public string AudioFileUri { get; set; } = string.Empty;

    /// <summary>
    /// Language for transcription
    /// </summary>
    public string Language { get; set; } = "en-US";

    /// <summary>
    /// Enable speaker diarization
    /// </summary>
    public bool DiarizationEnabled { get; set; } = true;

    /// <summary>
    /// Maximum number of speakers
    /// </summary>
    public int MaxSpeakers { get; set; } = 10;

    /// <summary>
    /// Display name for the job
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the job
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Azure Batch Transcription API response
/// </summary>
public class AzureBatchJobResponse
{
    /// <summary>
    /// Azure job identifier
    /// </summary>
    public string JobId { get; set; } = string.Empty;

    /// <summary>
    /// Job status from Azure
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Created timestamp
    /// </summary>
    public DateTime CreatedDateTime { get; set; }

    /// <summary>
    /// Last action timestamp
    /// </summary>
    public DateTime LastActionDateTime { get; set; }

    /// <summary>
    /// Results URI when completed
    /// </summary>
    public string? ResultsUri { get; set; }

    /// <summary>
    /// Error details if failed
    /// </summary>
    public string? Error { get; set; }
}
