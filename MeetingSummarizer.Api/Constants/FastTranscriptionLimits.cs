namespace MeetingSummarizer.Api.Constants;

/// <summary>
/// Azure Speech Services Fast Transcription API limits and constraints
/// Based on Microsoft documentation: https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/
/// </summary>
public static class FastTranscriptionLimits
{
    /// <summary>
    /// Maximum file size for Azure Fast Transcription API (200MB)
    /// </summary>
    public const long MaxFileSizeBytes = 200L * 1024 * 1024; // 200MB
    
    /// <summary>
    /// Maximum file size formatted as string
    /// </summary>
    public const string MaxFileSizeFormatted = "200MB";
    
    /// <summary>
    /// Maximum audio duration for Azure Fast Transcription API (2 hours)
    /// </summary>
    public const int MaxDurationHours = 2;
    
    /// <summary>
    /// Maximum audio duration in seconds
    /// </summary>
    public const int MaxDurationSeconds = MaxDurationHours * 60 * 60; // 7200 seconds
    
    /// <summary>
    /// Maximum audio duration formatted as string
    /// </summary>
    public const string MaxDurationFormatted = "2 hours";
    
    /// <summary>
    /// Supported audio formats for Fast Transcription
    /// </summary>
    public static readonly string[] SupportedFormats = { "MP3", "WAV", "M4A", "FLAC", "OGG", "WEBM" };
    
    /// <summary>
    /// User-friendly error message for oversized files
    /// </summary>
    public const string FileSizeErrorMessage = "File size exceeds 200MB limit for fast transcription";
    
    /// <summary>
    /// User-friendly error message for duration limit
    /// </summary>
    public const string DurationErrorMessage = "Audio duration exceeds 2-hour limit for fast transcription";
}