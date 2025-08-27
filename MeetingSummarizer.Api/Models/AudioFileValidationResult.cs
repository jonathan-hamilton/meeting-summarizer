namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of audio file validation (migrated from AudioFileValidator)
/// </summary>
public class AudioFileValidationResult
{
    /// <summary>
    /// Whether the file passed validation
    /// </summary>
    public bool IsValid { get; }
    /// <summary>
    /// Validation message (error message if invalid, success message if valid)
    /// </summary>
    public string Message { get; }
    public AudioFileValidationResult(bool isValid, string message)
    {
        IsValid = isValid;
        Message = message;
    }
}
