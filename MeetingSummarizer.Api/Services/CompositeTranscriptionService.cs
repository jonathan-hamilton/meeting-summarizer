using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Composite transcription service that provides fallback between Azure Speech Services and OpenAI Whisper
/// Implements S4.1 requirement for Azure primary with OpenAI fallback
/// </summary>
public class CompositeTranscriptionService : ITranscriptionService
{
    private readonly AzureSpeechService _azureService;
    private readonly OpenAITranscriptionAdapter _openAIService;
    private readonly ILogger<CompositeTranscriptionService> _logger;

    public CompositeTranscriptionService(
        AzureSpeechService azureService,
        OpenAITranscriptionAdapter openAIService,
        ILogger<CompositeTranscriptionService> logger)
    {
        _azureService = azureService;
        _openAIService = openAIService;
        _logger = logger;
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        // Try Azure Speech Services first
        try
        {
            if (await _azureService.IsServiceAvailableAsync(cancellationToken))
            {
                _logger.LogInformation("Using Azure Speech Services for transcription of {FileName}", fileName);
                
                // Reset stream position for Azure
                if (audioStream.CanSeek)
                {
                    audioStream.Seek(0, SeekOrigin.Begin);
                }

                var result = await _azureService.TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
                
                _logger.LogInformation("Azure Speech Services transcription completed successfully for {FileName}", fileName);
                return result;
            }
            else
            {
                _logger.LogWarning("Azure Speech Services is not available, falling back to OpenAI Whisper");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure Speech Services transcription failed for {FileName}, falling back to OpenAI Whisper: {Message}", 
                fileName, ex.Message);
        }

        // Fallback to OpenAI Whisper
        try
        {
            _logger.LogInformation("Using OpenAI Whisper fallback for transcription of {FileName}", fileName);
            
            // Reset stream position for OpenAI
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }

            var result = await _openAIService.TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
            
            _logger.LogInformation("OpenAI Whisper fallback transcription completed for {FileName}", fileName);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Both Azure and OpenAI transcription services failed for {FileName}: {Message}", 
                fileName, ex.Message);
            throw new InvalidOperationException(
                $"All transcription services failed for {fileName}. Azure: unavailable or failed, OpenAI: {ex.Message}", ex);
        }
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = await TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationToken);
        return result.Text;
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        // Service is available if either Azure or OpenAI is available
        var azureAvailable = await _azureService.IsServiceAvailableAsync(cancellationToken);
        var openAIAvailable = await _openAIService.IsServiceAvailableAsync(cancellationToken);

        var isAvailable = azureAvailable || openAIAvailable;
        
        _logger.LogDebug("Service availability check - Azure: {AzureAvailable}, OpenAI: {OpenAIAvailable}, Overall: {IsAvailable}",
            azureAvailable, openAIAvailable, isAvailable);

        return isAvailable;
    }

    public string GetServiceStatus()
    {
        var azureStatus = _azureService.GetServiceStatus();
        var openAIStatus = _openAIService.GetServiceStatus();

        return $"Composite Transcription Service:\n" +
               $"  Primary: {azureStatus}\n" +
               $"  Fallback: {openAIStatus}";
    }

    public string GetProviderName()
    {
        return "Azure Speech Services (with OpenAI Whisper fallback)";
    }
}
