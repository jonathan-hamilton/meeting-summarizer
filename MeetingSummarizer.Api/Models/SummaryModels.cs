using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Enumeration of available summary styles
/// </summary>
public enum SummaryStyle
{
    Brief,
    Detailed,
    ActionItems,
    KeyDecisions,
    ExecutiveSummary
}

/// <summary>
/// Request model for generating summaries
/// </summary>
public class SummaryRequest
{
    /// <summary>
    /// The transcript text to summarize
    /// </summary>
    [Required(ErrorMessage = "Transcript is required")]
    [StringLength(500000, ErrorMessage = "Transcript cannot exceed 500,000 characters")]
    public string Transcript { get; set; } = string.Empty;

    /// <summary>
    /// Style of summary to generate
    /// </summary>
    public SummaryStyle Style { get; set; } = SummaryStyle.Brief;

    /// <summary>
    /// Optional target role for role-aware summarization
    /// </summary>
    [StringLength(50, ErrorMessage = "Target role cannot exceed 50 characters")]
    public string? TargetRole { get; set; }

    /// <summary>
    /// Maximum number of tokens in the output
    /// </summary>
    [Range(100, 2000, ErrorMessage = "Max tokens must be between 100 and 2000")]
    public int MaxTokens { get; set; } = 500;

    /// <summary>
    /// Optional speaker mappings for role-aware summarization
    /// </summary>
    public List<SpeakerMapping>? SpeakerMappings { get; set; }
}

/// <summary>
/// Request model for generating summaries using stored transcription data
/// </summary>
public class TranscriptionSummaryRequest
{
    /// <summary>
    /// ID of the transcription to summarize
    /// </summary>
    [Required(ErrorMessage = "Transcription ID is required")]
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Style of summary to generate
    /// </summary>
    public SummaryStyle Style { get; set; } = SummaryStyle.Brief;

    /// <summary>
    /// Optional target role for role-aware summarization
    /// </summary>
    [StringLength(50, ErrorMessage = "Target role cannot exceed 50 characters")]
    public string? TargetRole { get; set; }

    /// <summary>
    /// Maximum number of tokens in the output
    /// </summary>
    [Range(100, 2000, ErrorMessage = "Max tokens must be between 100 and 2000")]
    public int MaxTokens { get; set; } = 500;
}

/// <summary>
/// Summary result model
/// </summary>
public class SummaryResult
{
    /// <summary>
    /// Unique identifier for this summary
    /// </summary>
    public string SummaryId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Associated transcription ID
    /// </summary>
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Type of summary generated
    /// </summary>
    public SummaryStyle SummaryType { get; set; }

    /// <summary>
    /// Main summary content
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Extracted action items (when applicable)
    /// </summary>
    public List<string>? ActionItems { get; set; }

    /// <summary>
    /// Key decisions identified (when applicable)
    /// </summary>
    public List<string>? KeyDecisions { get; set; }

    /// <summary>
    /// Next steps or follow-up actions (when applicable)
    /// </summary>
    public List<string>? NextSteps { get; set; }

    /// <summary>
    /// Timestamp when summary was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Role for which the summary was generated (if role-aware)
    /// </summary>
    public string? GeneratedFor { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public long ProcessingTimeMs { get; set; }

    /// <summary>
    /// Token count of the generated summary
    /// </summary>
    public int TokenCount { get; set; }

    /// <summary>
    /// Whether speaker mappings were used in generation
    /// </summary>
    public bool UsedSpeakerMappings { get; set; }

    /// <summary>
    /// Create a successful summary result
    /// </summary>
    public static SummaryResult FromSuccess(
        string content,
        string transcriptionId,
        SummaryStyle summaryType,
        long processingTime,
        string? targetRole = null,
        List<SpeakerMapping>? speakerMappings = null)
    {
        return new SummaryResult
        {
            Content = content,
            TranscriptionId = transcriptionId,
            SummaryType = summaryType,
            ProcessingTimeMs = processingTime,
            GeneratedFor = targetRole,
            UsedSpeakerMappings = speakerMappings?.Any() == true,
            TokenCount = EstimateTokenCount(content)
        };
    }

    /// <summary>
    /// Create an error summary result
    /// </summary>
    public static SummaryResult FromError(
        string transcriptionId,
        SummaryStyle summaryType,
        string errorMessage,
        long processingTime)
    {
        return new SummaryResult
        {
            Content = $"Summary generation failed: {errorMessage}",
            TranscriptionId = transcriptionId,
            SummaryType = summaryType,
            ProcessingTimeMs = processingTime,
            TokenCount = 0
        };
    }

    /// <summary>
    /// Rough token count estimation (1 token ≈ 4 characters for English)
    /// </summary>
    private static int EstimateTokenCount(string text)
    {
        return string.IsNullOrWhiteSpace(text) ? 0 : text.Length / 4;
    }
}

/// <summary>
/// Options for summary generation
/// </summary>
public class SummaryOptions
{
    /// <summary>
    /// Style of summary to generate
    /// </summary>
    public SummaryStyle Style { get; set; } = SummaryStyle.Brief;

    /// <summary>
    /// Optional target role for personalized summaries
    /// </summary>
    public string? TargetRole { get; set; }

    /// <summary>
    /// Maximum number of tokens in the output
    /// </summary>
    public int MaxTokens { get; set; } = 500;

    /// <summary>
    /// Temperature for OpenAI generation (0.0 - 1.0)
    /// </summary>
    public float Temperature { get; set; } = 0.3f;

    /// <summary>
    /// Whether to include action items extraction
    /// </summary>
    public bool IncludeActionItems => Style == SummaryStyle.ActionItems || Style == SummaryStyle.Detailed;

    /// <summary>
    /// Whether to include key decisions extraction
    /// </summary>
    public bool IncludeKeyDecisions => Style == SummaryStyle.KeyDecisions || Style == SummaryStyle.Detailed;
}

/// <summary>
/// S3.4: Meeting summary with role-aware action items
/// </summary>
public class MeetingSummary
{
    /// <summary>
    /// Unique identifier for this meeting summary
    /// </summary>
    public string SummaryId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Associated transcription ID
    /// </summary>
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Meeting narrative overview (targeting one page)
    /// </summary>
    public string MeetingOverview { get; set; } = string.Empty;

    /// <summary>
    /// Action items grouped by speaker role
    /// </summary>
    public List<ActionItemsByRole> ActionItemsByRole { get; set; } = new();

    /// <summary>
    /// Items that were identified but not assigned to any speaker
    /// </summary>
    public List<UnassignedActionItem> UnassignedActionItems { get; set; } = new();

    /// <summary>
    /// Meeting metadata
    /// </summary>
    public MeetingMetadata Metadata { get; set; } = new();

    /// <summary>
    /// Generation metadata
    /// </summary>
    public GenerationMetadata Generation { get; set; } = new();
}

/// <summary>
/// Action items grouped by a specific speaker/role
/// </summary>
public class ActionItemsByRole
{
    /// <summary>
    /// Speaker identifier (e.g., "Speaker 1", "John Smith")
    /// </summary>
    public string SpeakerId { get; set; } = string.Empty;

    /// <summary>
    /// Mapped speaker name
    /// </summary>
    public string SpeakerName { get; set; } = string.Empty;

    /// <summary>
    /// Speaker role/title
    /// </summary>
    public string SpeakerRole { get; set; } = string.Empty;

    /// <summary>
    /// Action items assigned to this speaker
    /// </summary>
    public List<ActionItem> ActionItems { get; set; } = new();
}

/// <summary>
/// Individual action item with metadata
/// </summary>
public class ActionItem
{
    /// <summary>
    /// Description of the action item
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether this was explicitly assigned or implicitly committed
    /// </summary>
    public bool IsExplicitAssignment { get; set; }

    /// <summary>
    /// AI confidence score for this action item (0.0 - 1.0)
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Source text snippet that led to this action item
    /// </summary>
    public string? SourceText { get; set; }
}

/// <summary>
/// Action item that couldn't be assigned to a specific speaker
/// </summary>
public class UnassignedActionItem
{
    /// <summary>
    /// Description of the action item
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// AI confidence score for this action item (0.0 - 1.0)
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Source text snippet that led to this action item
    /// </summary>
    public string? SourceText { get; set; }

    /// <summary>
    /// Reason why it couldn't be assigned
    /// </summary>
    public string? UnassignedReason { get; set; }
}

/// <summary>
/// Meeting metadata for context
/// </summary>
public class MeetingMetadata
{
    /// <summary>
    /// Meeting participants from speaker mappings
    /// </summary>
    public List<string> Participants { get; set; } = new();

    /// <summary>
    /// Estimated meeting duration (if available)
    /// </summary>
    public TimeSpan? Duration { get; set; }

    /// <summary>
    /// Number of speakers detected
    /// </summary>
    public int SpeakerCount { get; set; }
}

/// <summary>
/// Generation metadata for tracking
/// </summary>
public class GenerationMetadata
{
    /// <summary>
    /// Timestamp when summary was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public long ProcessingTimeMs { get; set; }

    /// <summary>
    /// Token count of the generated content
    /// </summary>
    public int TokenCount { get; set; }

    /// <summary>
    /// Whether the summary is editable (session-based)
    /// </summary>
    public bool IsEditable { get; set; } = true;
}

/// <summary>
/// Request model for S3.4 meeting summary generation
/// </summary>
public class MeetingSummaryRequest
{
    /// <summary>
    /// The transcript text to summarize
    /// </summary>
    [Required(ErrorMessage = "Transcript is required")]
    [StringLength(500000, ErrorMessage = "Transcript cannot exceed 500,000 characters")]
    public string Transcript { get; set; } = string.Empty;

    /// <summary>
    /// Speaker mappings for role-aware action items
    /// </summary>
    [Required(ErrorMessage = "Speaker mappings are required")]
    public List<SpeakerMapping> SpeakerMappings { get; set; } = new();

    /// <summary>
    /// Maximum number of tokens for the narrative overview
    /// </summary>
    [Range(200, 1500, ErrorMessage = "Max tokens must be between 200 and 1500")]
    public int MaxTokens { get; set; } = 800;
}

// ============================================================================
// Summary Persistence DTOs (S6.10)
// ============================================================================

/// <summary>
/// DTO for saved summary data
/// </summary>
public class SavedSummaryDto
{
    /// <summary>
    /// Unique identifier for this saved summary
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// User who owns this summary
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Associated meeting ID (optional)
    /// </summary>
    public Guid? MeetingId { get; set; }
    
    /// <summary>
    /// Display title for the summary
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional description or notes
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Meeting summary data (deserialized JSON)
    /// </summary>
    public object SummaryData { get; set; } = new();
    
    /// <summary>
    /// Original transcript filename
    /// </summary>
    public string TranscriptFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// When this summary was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// When this summary was last modified
    /// </summary>
    public DateTime LastModifiedAt { get; set; }
    
    /// <summary>
    /// When this summary was last accessed
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }
    
    /// <summary>
    /// Action items in this summary
    /// </summary>
    public List<SavedActionItemDto> ActionItems { get; set; } = new();
}

/// <summary>
/// DTO for saved action item data
/// </summary>
public class SavedActionItemDto
{
    /// <summary>
    /// Unique identifier for this action item
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Parent summary ID
    /// </summary>
    public Guid SummaryId { get; set; }
    
    /// <summary>
    /// Action item description
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Person or role assigned to this action item
    /// </summary>
    public string AssignedTo { get; set; } = string.Empty;
    
    /// <summary>
    /// AI confidence level (0.0 to 1.0)
    /// </summary>
    public decimal Confidence { get; set; }
    
    /// <summary>
    /// Whether assignment was explicitly made
    /// </summary>
    public bool IsExplicitAssignment { get; set; }
    
    /// <summary>
    /// Sort order within summary
    /// </summary>
    public int SortOrder { get; set; }
    
    /// <summary>
    /// Whether this action item is completed
    /// </summary>
    public bool IsCompleted { get; set; }
    
    /// <summary>
    /// When this action item was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// When this action item was last modified
    /// </summary>
    public DateTime LastModifiedAt { get; set; }
}

/// <summary>
/// Request model for saving a summary
/// </summary>
public class SaveSummaryRequest
{
    /// <summary>
    /// Display title for the summary
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional description or notes
    /// </summary>
    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }
    
    /// <summary>
    /// Meeting summary data to save
    /// </summary>
    [Required(ErrorMessage = "Summary data is required")]
    public object SummaryData { get; set; } = new();
    
    /// <summary>
    /// Original transcript filename
    /// </summary>
    [Required(ErrorMessage = "Transcript filename is required")]
    [StringLength(255, ErrorMessage = "Transcript filename cannot exceed 255 characters")]
    public string TranscriptFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// Associated meeting ID (optional)
    /// </summary>
    public Guid? MeetingId { get; set; }
    
    /// <summary>
    /// Action items to save with this summary
    /// </summary>
    public List<SaveActionItemRequest> ActionItems { get; set; } = new();
}

/// <summary>
/// Request model for saving an action item
/// </summary>
public class SaveActionItemRequest
{
    /// <summary>
    /// Action item description
    /// </summary>
    [Required(ErrorMessage = "Description is required")]
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Person or role assigned to this action item
    /// </summary>
    [Required(ErrorMessage = "AssignedTo is required")]
    [StringLength(100, ErrorMessage = "AssignedTo cannot exceed 100 characters")]
    public string AssignedTo { get; set; } = string.Empty;
    
    /// <summary>
    /// AI confidence level (0.0 to 1.0)
    /// </summary>
    [Range(0.0, 1.0, ErrorMessage = "Confidence must be between 0.0 and 1.0")]
    public decimal Confidence { get; set; } = 0.0m;
    
    /// <summary>
    /// Whether assignment was explicitly made
    /// </summary>
    public bool IsExplicitAssignment { get; set; } = false;
    
    /// <summary>
    /// Sort order within summary
    /// </summary>
    public int SortOrder { get; set; } = 0;
    
    /// <summary>
    /// Whether this action item is completed
    /// </summary>
    public bool IsCompleted { get; set; } = false;
}

/// <summary>
/// Request model for updating a saved summary
/// </summary>
public class UpdateSavedSummaryRequest
{
    /// <summary>
    /// Updated title for the summary
    /// </summary>
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }
    
    /// <summary>
    /// Updated description or notes
    /// </summary>
    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }
    
    /// <summary>
    /// Updated summary data (optional)
    /// </summary>
    public object? SummaryData { get; set; }
    
    /// <summary>
    /// Updated action items (optional) - replaces all existing action items
    /// </summary>
    public List<SaveActionItemRequest>? ActionItems { get; set; }
}

/// <summary>
/// Request model for updating a saved action item
/// </summary>
public class UpdateSavedActionItemRequest
{
    /// <summary>
    /// Updated description
    /// </summary>
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
    
    /// <summary>
    /// Updated assignee
    /// </summary>
    [StringLength(100, ErrorMessage = "AssignedTo cannot exceed 100 characters")]
    public string? AssignedTo { get; set; }
    
    /// <summary>
    /// Updated confidence level
    /// </summary>
    [Range(0.0, 1.0, ErrorMessage = "Confidence must be between 0.0 and 1.0")]
    public decimal? Confidence { get; set; }
    
    /// <summary>
    /// Updated explicit assignment flag
    /// </summary>
    public bool? IsExplicitAssignment { get; set; }
    
    /// <summary>
    /// Updated sort order
    /// </summary>
    public int? SortOrder { get; set; }
    
    /// <summary>
    /// Updated completion status
    /// </summary>
    public bool? IsCompleted { get; set; }
}
