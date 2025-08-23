using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Adapter to make OpenAI service compatible with ITranscriptionService interface
/// </summary>
public class OpenAITranscriptionAdapter : ITranscriptionService
{
    private readonly IOpenAIService _openAIService;
    private readonly ILogger<OpenAITranscriptionAdapter> _logger;

    public OpenAITranscriptionAdapter(IOpenAIService openAIService, ILogger<OpenAITranscriptionAdapter> logger)
    {
        _openAIService = openAIService;
        _logger = logger;
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        return await _openAIService.TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        return await _openAIService.TranscribeAudioAsync(audioStream, fileName, cancellationToken);
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        return await _openAIService.IsServiceAvailableAsync(cancellationToken);
    }

    public string GetServiceStatus()
    {
        return _openAIService.GetServiceStatus();
    }

    public string GetProviderName()
    {
        return "OpenAI Whisper";
    }
}
