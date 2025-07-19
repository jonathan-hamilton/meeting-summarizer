using OpenAI.Audio;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service interface for OpenAI integration
/// </summary>
public interface IOpenAIService
{
    /// <summary>
    /// Transcribe audio file to text using OpenAI Whisper
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename for context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transcribed text</returns>
    Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate a summary from transcribed text using OpenAI Chat
    /// </summary>
    /// <param name="transcribedText">The transcribed text to summarize</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Summary text</returns>
    Task<string> SummarizeTextAsync(string transcribedText, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the OpenAI service is properly configured and accessible
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get service status information
    /// </summary>
    /// <returns>Service status details</returns>
    string GetServiceStatus();
}
