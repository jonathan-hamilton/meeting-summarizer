using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of transcript parsing including segments and formatted text
/// </summary>
public class TranscriptParsingResult
{
    /// <summary>
    /// Parsed transcript segments for database storage
    /// </summary>
    public ICollection<TranscriptSegment> Segments { get; set; } = new List<TranscriptSegment>();

    /// <summary>
    /// Formatted full transcript text
    /// </summary>
    public string FullText { get; set; } = string.Empty;

    /// <summary>
    /// Total number of segments parsed
    /// </summary>
    public int TotalSegments { get; set; }

    /// <summary>
    /// Number of unique speakers detected
    /// </summary>
    public int SpeakerCount { get; set; }

    /// <summary>
    /// Total duration of the transcript in seconds
    /// </summary>
    public double TotalDurationSeconds { get; set; }

    /// <summary>
    /// Average confidence score across all segments
    /// </summary>
    public double AverageConfidence { get; set; }

    /// <summary>
    /// When the parsing was completed
    /// </summary>
    public DateTime ParsedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Result of JSON validation before parsing
/// </summary>
public class JsonValidationResult
{
    /// <summary>
    /// Whether the JSON is valid for parsing
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// List of validation issues found
    /// </summary>
    public List<string> Issues { get; set; } = new List<string>();

    /// <summary>
    /// Detected JSON structure type
    /// </summary>
    public string? DetectedFormat { get; set; }

    /// <summary>
    /// Estimated number of segments that will be parsed
    /// </summary>
    public int? EstimatedSegmentCount { get; set; }
}

/// <summary>
/// Speaker analysis results from transcript segments
/// </summary>
public class SpeakerAnalysis
{
    /// <summary>
    /// Number of unique speakers detected
    /// </summary>
    public int SpeakerCount { get; set; }

    /// <summary>
    /// Speaker identifiers found in the transcript
    /// </summary>
    public List<string> SpeakerIds { get; set; } = new List<string>();

    /// <summary>
    /// Speaking time distribution by speaker
    /// </summary>
    public Dictionary<string, double> SpeakingTimeSeconds { get; set; } = new Dictionary<string, double>();

    /// <summary>
    /// Number of segments per speaker
    /// </summary>
    public Dictionary<string, int> SegmentCounts { get; set; } = new Dictionary<string, int>();

    /// <summary>
    /// Average confidence score per speaker
    /// </summary>
    public Dictionary<string, double> AverageConfidencePerSpeaker { get; set; } = new Dictionary<string, double>();

    /// <summary>
    /// Most active speaker (by speaking time)
    /// </summary>
    public string? DominantSpeaker { get; set; }

    /// <summary>
    /// Total speaking time across all speakers
    /// </summary>
    public double TotalSpeakingTime { get; set; }
}