using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Request model for sending emails via the email API
/// </summary>
public class SendEmailRequest
{
    /// <summary>
    /// Email recipients (comma-separated or array)
    /// </summary>
    [Required(ErrorMessage = "Recipients are required")]
    [MinLength(1, ErrorMessage = "At least one recipient is required")]
    public List<string> Recipients { get; set; } = new();
    
    /// <summary>
    /// Email subject line
    /// </summary>
    [Required(ErrorMessage = "Subject is required")]
    [StringLength(200, ErrorMessage = "Subject cannot exceed 200 characters")]
    public string Subject { get; set; } = string.Empty;
    
    /// <summary>
    /// Email content (HTML format)
    /// </summary>
    [Required(ErrorMessage = "Content is required")]
    [StringLength(500000, ErrorMessage = "Content cannot exceed 500,000 characters")]
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional plain text version of the email
    /// </summary>
    public string? PlainTextContent { get; set; }
    
    /// <summary>
    /// Meeting summary data for template generation
    /// </summary>
    public MeetingSummary? MeetingSummary { get; set; }
    
    /// <summary>
    /// Speaker mappings for context
    /// </summary>
    public List<SpeakerMapping>? SpeakerMappings { get; set; }
    
    /// <summary>
    /// S6.5 Phase 3: Whether to include transcript in the email
    /// </summary>
    public bool IncludeTranscript { get; set; }
    
    /// <summary>
    /// S6.5 Phase 3: Transcript data for email inclusion
    /// </summary>
    public TranscriptEmailData? TranscriptData { get; set; }
}

/// <summary>
/// S6.5 Phase 3: Transcript data for email functionality
/// </summary>
public class TranscriptEmailData
{
    /// <summary>
    /// Transcript/Meeting ID
    /// </summary>
    [Required]
    public string TranscriptionId { get; set; } = string.Empty;
    
    /// <summary>
    /// Original file name
    /// </summary>
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// Full transcript text
    /// </summary>
    public string TranscribedText { get; set; } = string.Empty;
    
    /// <summary>
    /// Speaker segments with speaker identification
    /// </summary>
    public List<TranscriptSpeakerSegment>? SpeakerSegments { get; set; }
}

/// <summary>
/// S6.5 Phase 3: Speaker segment for transcript email formatting
/// </summary>
public class TranscriptSpeakerSegment
{
    public string Speaker { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public double? StartTime { get; set; }
    public double? EndTime { get; set; }
}

/// <summary>
/// S6.5 Phase 3: Request model for sending transcript emails
/// </summary>
public class SendTranscriptEmailRequest
{
    /// <summary>
    /// Email recipients
    /// </summary>
    [Required(ErrorMessage = "Recipients are required")]
    [MinLength(1, ErrorMessage = "At least one recipient is required")]
    public List<string> Recipients { get; set; } = new();
    
    /// <summary>
    /// Optional custom subject line (defaults to "Meeting Transcript - [filename]")
    /// </summary>
    public string? Subject { get; set; }
    
    /// <summary>
    /// Optional custom message to include in the email
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// Response model for email sending operations
/// </summary>
public class SendEmailResponse
{
    /// <summary>
    /// Whether the email was sent successfully
    /// </summary>
    public bool Success { get; set; }
    
    /// <summary>
    /// Message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// SendGrid message ID (if successful)
    /// </summary>
    public string? MessageId { get; set; }
    
    /// <summary>
    /// Number of recipients the email was sent to
    /// </summary>
    public int RecipientsCount { get; set; }
    
    /// <summary>
    /// Timestamp when the email was sent
    /// </summary>
    public DateTime SentAt { get; set; }
    
    /// <summary>
    /// Any error details if sending failed
    /// </summary>
    public string? ErrorDetails { get; set; }
}
