using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Request model for audio transcription
/// </summary>
public class TranscribeRequest
{
    /// <summary>
    /// The audio file to transcribe
    /// </summary>
    [Required(ErrorMessage = "Audio file is required")]
    public IFormFile AudioFile { get; set; } = null!;

    /// <summary>
    /// Optional language hint for transcription (e.g., "en", "es", "fr")
    /// </summary>
    public string? Language { get; set; }

    /// <summary>
    /// Optional prompt to guide the transcription
    /// </summary>
    public string? Prompt { get; set; }

    /// <summary>
    /// Temperature setting for transcription (0.0 to 1.0)
    /// Lower values are more focused and deterministic
    /// </summary>
    [Range(0.0, 1.0, ErrorMessage = "Temperature must be between 0.0 and 1.0")]
    public double Temperature { get; set; } = 0.0;
}

/// <summary>
/// Enhanced transcription result with speaker information
/// </summary>
public class TranscriptionResult
{
    /// <summary>
    /// The complete transcribed text
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// List of speaker segments with timestamps
    /// </summary>
    public List<SpeakerSegment> Segments { get; set; } = new();

    /// <summary>
    /// Detected language of the audio
    /// </summary>
    public string? DetectedLanguage { get; set; }

    /// <summary>
    /// Duration of the audio in seconds
    /// </summary>
    public double? Duration { get; set; }
}

/// <summary>
/// Represents a segment of transcribed audio with speaker information
/// </summary>
public class SpeakerSegment
{
    /// <summary>
    /// Start time of the segment in seconds
    /// </summary>
    public double Start { get; set; }

    /// <summary>
    /// End time of the segment in seconds
    /// </summary>
    public double End { get; set; }

    /// <summary>
    /// Text content of this segment
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Speaker identifier (e.g., "Speaker 1", "Speaker 2")
    /// </summary>
    public string Speaker { get; set; } = "Speaker 1";

    /// <summary>
    /// Confidence score for this segment (0.0 to 1.0)
    /// </summary>
    public double? Confidence { get; set; }
}

/// <summary>
/// Response model for transcription results
/// </summary>
public class TranscriptionResponse
{
    /// <summary>
    /// Unique identifier for this transcription
    /// </summary>
    public string TranscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Original filename of the uploaded audio
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Size of the uploaded file in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Current status of the transcription (Processing, Completed, Failed)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// The complete transcribed text content
    /// </summary>
    public string? TranscribedText { get; set; }

    /// <summary>
    /// List of speaker segments with timestamps and speaker identification
    /// </summary>
    public List<SpeakerSegment>? SpeakerSegments { get; set; }

    /// <summary>
    /// Error message if transcription failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public long ProcessingTimeMs { get; set; }

    /// <summary>
    /// Timestamp when the transcription was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the transcription was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Overall confidence score of the transcription (0.0 to 1.0)
    /// </summary>
    public double? ConfidenceScore { get; set; }

    /// <summary>
    /// Detected language of the audio
    /// </summary>
    public string? DetectedLanguage { get; set; }

    /// <summary>
    /// Duration of the audio in seconds
    /// </summary>
    public double? Duration { get; set; }

    /// <summary>
    /// Number of speakers detected in the audio
    /// </summary>
    public int? SpeakerCount { get; set; }

    /// <summary>
    /// Indicates whether speaker diarization was performed
    /// </summary>
    public bool HasSpeakerDiarization => SpeakerSegments?.Any() == true;

    /// <summary>
    /// Creates a TranscriptionResponse from a TranscriptionResult
    /// </summary>
    /// <param name="result">The transcription result from the OpenAI service</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="fileSize">File size in bytes</param>
    /// <param name="processingTimeMs">Processing time in milliseconds</param>
    /// <returns>A complete TranscriptionResponse</returns>
    public static TranscriptionResponse FromResult(TranscriptionResult result, string fileName, long fileSize, long processingTimeMs)
    {
        var speakers = result.Segments.Select(s => s.Speaker).Distinct().ToList();
        var confidenceSegments = result.Segments.Where(s => s.Confidence.HasValue).ToList();
        var averageConfidence = confidenceSegments.Any() ?
            confidenceSegments.Average(s => s.Confidence!.Value) :
            (double?)null;

        return new TranscriptionResponse
        {
            TranscriptionId = Guid.NewGuid().ToString(),
            FileName = fileName,
            FileSize = fileSize,
            Status = "Completed",
            TranscribedText = result.Text,
            SpeakerSegments = result.Segments,
            ProcessingTimeMs = processingTimeMs,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            ConfidenceScore = averageConfidence,
            DetectedLanguage = result.DetectedLanguage,
            Duration = result.Duration,
            SpeakerCount = speakers.Count
        };
    }

    /// <summary>
    /// Creates a failed TranscriptionResponse
    /// </summary>
    /// <param name="fileName">Original filename</param>
    /// <param name="fileSize">File size in bytes</param>
    /// <param name="errorMessage">Error description</param>
    /// <param name="processingTimeMs">Processing time before failure</param>
    /// <returns>A failed TranscriptionResponse</returns>
    public static TranscriptionResponse FromError(string fileName, long fileSize, string errorMessage, long processingTimeMs)
    {
        return new TranscriptionResponse
        {
            TranscriptionId = Guid.NewGuid().ToString(),
            FileName = fileName,
            FileSize = fileSize,
            Status = "Failed",
            ErrorMessage = errorMessage,
            ProcessingTimeMs = processingTimeMs,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
    }
}
