using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Transcription;

public class AzureFastTranscriptionService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AzureFastTranscriptionService> _logger;
    private readonly AzureSpeechOptions _speechOptions;

    public AzureFastTranscriptionService(
        HttpClient httpClient,
        ILogger<AzureFastTranscriptionService> logger,
        IOptions<AzureSpeechOptions> speechOptions)
    {
        _httpClient = httpClient;
        _logger = logger;
        _speechOptions = speechOptions.Value;
    }

    public async Task<FastTranscriptionResult> TranscribeAsync(
        byte[] audioData,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = $"https://{_speechOptions.Region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15";
            
            _logger.LogInformation("🚀 Starting Fast Transcription for {FileName} ({FileSize} bytes)", fileName, audioData.Length);

            using var content = new MultipartFormDataContent();
            
            // Add audio file
            var audioContent = new ByteArrayContent(audioData);
            audioContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav");
            content.Add(audioContent, "audio", fileName);

            // Add transcription configuration
            var config = new
            {
                locales = new[] { "en-US" },
                diarization = new { enabled = true, maxSpeakers = 10 },
                profanityFilterMode = "Masked"
            };

            var configJson = JsonSerializer.Serialize(config);
            var configContent = new StringContent(configJson, Encoding.UTF8, "application/json");
            content.Add(configContent, "definition");

            // Set headers
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _speechOptions.Key);

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
            stopwatch.Stop();

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("❌ Fast Transcription failed: {StatusCode} - {Content}", response.StatusCode, errorContent);
                throw new InvalidOperationException($"Fast transcription failed: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogInformation("✅ Fast Transcription completed in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);

            return new FastTranscriptionResult
            {
                Success = true,
                TranscriptionJson = responseJson,
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
                FileName = fileName,
                FileSizeBytes = audioData.Length
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fast Transcription error for {FileName}", fileName);
            return new FastTranscriptionResult
            {
                Success = false,
                Error = ex.Message,
                FileName = fileName,
                FileSizeBytes = audioData.Length
            };
        }
    }
}

public class FastTranscriptionResult
{
    public bool Success { get; set; }
    public string? TranscriptionJson { get; set; }
    public string? Error { get; set; }
    public long ProcessingTimeMs { get; set; }
    public string FileName { get; set; } = string.Empty;
    public int FileSizeBytes { get; set; }
}