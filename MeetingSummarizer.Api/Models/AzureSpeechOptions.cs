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
    /// Batch transcription configuration options
    /// </summary>
    public BatchTranscriptionOptions BatchTranscription { get; set; } = new();

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

/// <summary>
/// Configuration options specific to Azure Batch Transcription
/// </summary>
public class BatchTranscriptionOptions
{
    /// <summary>
    /// Minimum duration in seconds to use batch transcription instead of real-time
    /// Files shorter than this will use real-time API
    /// </summary>
    public int MinimumDurationForBatch { get; set; } = 300; // 5 minutes

    /// <summary>
    /// Maximum duration in seconds supported by batch transcription
    /// </summary>
    public int MaximumDurationSupported { get; set; } = 3600; // 60 minutes

    /// <summary>
    /// Polling interval in seconds for checking batch job status
    /// </summary>
    public int PollingIntervalSeconds { get; set; } = 15;

    /// <summary>
    /// Maximum polling timeout in seconds before giving up on a batch job
    /// </summary>
    public int MaxPollingTimeoutSeconds { get; set; } = 1800; // 30 minutes

    /// <summary>
    /// Base delay in milliseconds for exponential backoff during status polling
    /// </summary>
    public int BaseDelayMilliseconds { get; set; } = 1000;

    /// <summary>
    /// Maximum delay in milliseconds for exponential backoff
    /// </summary>
    public int MaxDelayMilliseconds { get; set; } = 30000; // 30 seconds

    /// <summary>
    /// Enable automatic cleanup of completed batch jobs
    /// </summary>
    public bool EnableJobCleanup { get; set; } = true;

    /// <summary>
    /// How long to keep completed batch jobs before cleanup (in hours)
    /// </summary>
    public int JobRetentionHours { get; set; } = 24;
}
