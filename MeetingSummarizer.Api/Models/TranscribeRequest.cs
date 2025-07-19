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
    /// The transcribed text content
    /// </summary>
    public string? TranscribedText { get; set; }

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
    /// Confidence score of the transcription (0.0 to 1.0)
    /// </summary>
    public double? ConfidenceScore { get; set; }

    /// <summary>
    /// Detected language of the audio
    /// </summary>
    public string? DetectedLanguage { get; set; }
}
