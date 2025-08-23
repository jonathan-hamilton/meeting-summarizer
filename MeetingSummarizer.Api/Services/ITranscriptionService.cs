using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Common interface for transcription services
/// Supports both Azure Speech Services and OpenAI Whisper
/// </summary>
public interface ITranscriptionService
{
    /// <summary>
    /// Transcribe audio file to text with speaker information
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename for context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Enhanced transcription result with speaker information</returns>
    Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Transcribe audio file to text (simple version)
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename for context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transcribed text</returns>
    Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the transcription service is properly configured and accessible
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get service status information
    /// </summary>
    /// <returns>Service status details</returns>
    string GetServiceStatus();

    /// <summary>
    /// Get the name of the transcription provider
    /// </summary>
    /// <returns>Provider name (e.g., "Azure Speech Services", "OpenAI Whisper")</returns>
    string GetProviderName();
}
