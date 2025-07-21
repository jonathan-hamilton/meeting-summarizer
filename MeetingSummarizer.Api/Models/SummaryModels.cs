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
