using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Helpers;

/// <summary>
/// Validation helper for audio file uploads
/// </summary>
public static class AudioFileValidator
{
    /// <summary>
    /// Supported audio file extensions
    /// </summary>
    public static readonly string[] SupportedExtensions = { ".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm" };

    /// <summary>
    /// Maximum file size in bytes (500MB)
    /// </summary>
    public const long MaxFileSizeBytes = 500L * 1024 * 1024;

    /// <summary>
    /// Minimum file size in bytes (1KB to prevent empty files)
    /// </summary>
    public const long MinFileSizeBytes = 1024;

    /// <summary>
    /// Maximum file name length
    /// </summary>
    public const int MaxFileNameLength = 255;

    /// <summary>
    /// Audio MIME types that are considered valid
    /// </summary>
    public static readonly string[] ValidMimeTypes =
    {
        "audio/mpeg",        // .mp3
        "audio/wav",         // .wav
        "audio/wave",        // .wav alternative
        "audio/x-wav",       // .wav alternative
        "audio/mp4",         // .m4a
        "audio/x-m4a",       // .m4a alternative
        "audio/flac",        // .flac
        "audio/x-flac",      // .flac alternative
        "audio/ogg",         // .ogg
        "audio/webm"         // .webm
    };

    /// <summary>
    /// Validates an uploaded audio file
    /// </summary>
    /// <param name="audioFile">The uploaded file</param>
    /// <returns>Validation result</returns>
    public static AudioFileValidationResult ValidateAudioFile(IFormFile? audioFile)
    {
        if (audioFile == null)
        {
            return new AudioFileValidationResult(false, "Audio file is required");
        }

        if (audioFile.Length == 0)
        {
            return new AudioFileValidationResult(false, "Audio file cannot be empty");
        }

        // Validate file size
        if (audioFile.Length < MinFileSizeBytes)
        {
            return new AudioFileValidationResult(false, $"File is too small. Minimum size: {MinFileSizeBytes / 1024}KB");
        }

        if (audioFile.Length > MaxFileSizeBytes)
        {
            var maxSizeMB = MaxFileSizeBytes / (1024 * 1024);
            return new AudioFileValidationResult(false, $"File size exceeds {maxSizeMB}MB limit");
        }

        // Validate file name
        if (string.IsNullOrWhiteSpace(audioFile.FileName))
        {
            return new AudioFileValidationResult(false, "File name is required");
        }

        if (audioFile.FileName.Length > MaxFileNameLength)
        {
            return new AudioFileValidationResult(false, $"File name is too long. Maximum length: {MaxFileNameLength} characters");
        }

        // Check for potentially dangerous file names
        if (ContainsDangerousCharacters(audioFile.FileName))
        {
            return new AudioFileValidationResult(false, "File name contains invalid characters");
        }

        // Validate file extension
        var fileExtension = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(fileExtension))
        {
            return new AudioFileValidationResult(false, "File must have a valid extension");
        }

        if (!SupportedExtensions.Contains(fileExtension))
        {
            return new AudioFileValidationResult(false,
                $"Unsupported file format '{fileExtension}'. Supported formats: {string.Join(", ", SupportedExtensions)}");
        }

        // Validate MIME type if available
        if (!string.IsNullOrWhiteSpace(audioFile.ContentType))
        {
            var mimeType = audioFile.ContentType.ToLowerInvariant();
            if (!ValidMimeTypes.Contains(mimeType) && !mimeType.StartsWith("audio/"))
            {
                return new AudioFileValidationResult(false,
                    $"Invalid MIME type '{audioFile.ContentType}'. Expected audio format");
            }
        }

        return new AudioFileValidationResult(true, "File validation successful");
    }

    /// <summary>
    /// Checks if a filename contains potentially dangerous characters
    /// </summary>
    /// <param name="fileName">The filename to check</param>
    /// <returns>True if dangerous characters are found</returns>
    private static bool ContainsDangerousCharacters(string fileName)
    {
        // Check for path traversal attempts and dangerous characters
        var dangerousChars = new[] { "..", "\\", "/", ":", "*", "?", "\"", "<", ">", "|" };
        return dangerousChars.Any(fileName.Contains);
    }

    /// <summary>
    /// Gets a user-friendly file size string
    /// </summary>
    /// <param name="bytes">Size in bytes</param>
    /// <returns>Formatted size string</returns>
    public static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}

/// <summary>
/// Result of audio file validation
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
