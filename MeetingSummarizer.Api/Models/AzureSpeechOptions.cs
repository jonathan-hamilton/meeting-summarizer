using Microsoft.Extensions.Options;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration options for Azure Speech Services
/// </summary>
public class AzureSpeechOptions
{
    public const string SectionName = "AzureSpeechServices";

    /// <summary>
    /// Azure Speech Services subscription key
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Azure Speech Services endpoint URL
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Azure Speech Services region
    /// </summary>
    public string Region { get; set; } = string.Empty;

    /// <summary>
    /// Enable speaker diarization (speaker identification)
    /// </summary>
    public bool EnableSpeakerDiarization { get; set; } = true;

    /// <summary>
    /// Language for speech recognition (default: en-US)
    /// </summary>
    public string Language { get; set; } = "en-US";

    /// <summary>
    /// Request timeout in seconds
    /// </summary>
    public int RequestTimeoutSeconds { get; set; } = 120;

    /// <summary>
    /// Maximum number of retry attempts
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// Validate that all required configuration is present
    /// </summary>
    /// <returns>True if configuration is valid</returns>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(Key) &&
               !string.IsNullOrWhiteSpace(Region);
    }

    /// <summary>
    /// Get a masked version of the API key for logging (shows only first 8 characters)
    /// </summary>
    /// <returns>Masked API key</returns>
    public string GetMaskedKey()
    {
        if (string.IsNullOrWhiteSpace(Key) || Key.Length < 8)
        {
            return "[NOT_SET]";
        }

        return $"{Key[..8]}***";
    }
}
