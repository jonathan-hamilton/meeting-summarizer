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
            
            // Log response structure for debugging parsing issues
            _logger.LogInformation("Azure Fast Transcription Response (full): {ResponseJson}", responseJson);
            
            // Also parse and log structure details
            try 
            {
                using var tempDoc = JsonDocument.Parse(responseJson);
                var tempRoot = tempDoc.RootElement;
                _logger.LogInformation("Response structure properties: {Properties}", 
                    string.Join(", ", tempRoot.EnumerateObject().Select(p => p.Name)));
                
                if (tempRoot.TryGetProperty("phrases", out var tempPhrases) && tempPhrases.ValueKind == JsonValueKind.Array)
                {
                    var firstPhrase = tempPhrases.EnumerateArray().FirstOrDefault();
                    if (firstPhrase.ValueKind != JsonValueKind.Undefined)
                    {
                        _logger.LogInformation("First phrase properties: {Properties}", 
                            string.Join(", ", firstPhrase.EnumerateObject().Select(p => p.Name)));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse response for structure analysis");
            }

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

    public async Task<TranscriptionResult> TranscribeAudioAsync(
        Stream audioStream, 
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Convert stream to byte array
            using var memoryStream = new MemoryStream();
            await audioStream.CopyToAsync(memoryStream, cancellationToken);
            var audioData = memoryStream.ToArray();

            // Convert non-WAV files to WAV format before transcription
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (extension != ".wav")
            {
                _logger.LogInformation("Converting {Extension} file to WAV format for Fast Transcription: {FileName}", extension, fileName);
                audioData = await ConvertToWavAsync(audioData, fileName, cancellationToken);
                _logger.LogInformation("Audio conversion successful for {FileName}, new size: {Size} bytes", fileName, audioData.Length);
            }

            var result = await TranscribeAsync(audioData, fileName, cancellationToken);
            
            if (!result.Success)
            {
                throw new InvalidOperationException(result.Error ?? "Unknown transcription error");
            }

            return ParseAzureResults(result.TranscriptionJson!, result.ProcessingTimeMs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ TranscribeAudioAsync error for {FileName}", fileName);
            throw;
        }
    }

    private TranscriptionResult ParseAzureResults(string jsonResponse, long processingTimeMs)
    {
        try
        {
            _logger.LogInformation("🔍 Parsing Azure Fast Transcription response...");
            
            using var document = JsonDocument.Parse(jsonResponse);
            var root = document.RootElement;

            // Log the structure we received to debug parsing
            _logger.LogInformation("Azure response structure: {Properties}", 
                string.Join(", ", root.EnumerateObject().Select(p => p.Name)));

            var transcriptionSegments = new List<SpeakerSegment>();
            var speakers = new HashSet<string>();
            var totalDurationSeconds = 0.0;
            var fullText = new StringBuilder();

            // Try different possible structures for Azure Fast Transcription API
            // First try phrases array which contains detailed speaker diarization information
            if (root.TryGetProperty("phrases", out var phrases))
            {
                _logger.LogInformation("Found phrases structure with speaker diarization");
                
                // Extract total duration if available
                if (root.TryGetProperty("durationMilliseconds", out var durationMs))
                {
                    totalDurationSeconds = durationMs.GetDouble() / 1000.0;
                }
                
                foreach (var phrase in phrases.EnumerateArray())
                {
                    var segment = ParsePhraseSegment(phrase, speakers);
                    if (segment != null)
                    {
                        transcriptionSegments.Add(segment);
                        fullText.Append(segment.Text).Append(" ");
                    }
                }
            }
            // Fallback to combinedPhrases if phrases not available (less detailed)
            else if (root.TryGetProperty("combinedPhrases", out var combinedPhrases))
            {
                _logger.LogInformation("Found combinedPhrases structure (fallback)");
                
                // Extract total duration if available
                if (root.TryGetProperty("durationMilliseconds", out var durationMs))
                {
                    totalDurationSeconds = durationMs.GetDouble() / 1000.0;
                }
                
                foreach (var phrase in combinedPhrases.EnumerateArray())
                {
                    var segment = ParseCombinedPhraseSegment(phrase, speakers);
                    if (segment != null)
                    {
                        transcriptionSegments.Add(segment);
                        fullText.Append(segment.Text).Append(" ");
                    }
                }
            }
            // Fallback to alternative format if it exists
            else if (root.TryGetProperty("combinedRecognizedPhrases", out var combinedRecognizedPhrases))
            {
                _logger.LogInformation("Found combinedRecognizedPhrases structure (legacy)");
                foreach (var phrase in combinedRecognizedPhrases.EnumerateArray())
                {
                    if (phrase.TryGetProperty("recognitionResult", out var recognition))
                    {
                        var segment = ParseRecognitionSegment(recognition, speakers);
                        if (segment != null)
                        {
                            transcriptionSegments.Add(segment);
                            fullText.Append(segment.Text).Append(" ");
                            totalDurationSeconds = Math.Max(totalDurationSeconds, segment.End);
                        }
                    }
                }
            }
            else
            {
                _logger.LogWarning("❌ Unknown Azure Fast Transcription response format. Available properties: {Properties}",
                    string.Join(", ", root.EnumerateObject().Select(p => p.Name)));
            }

            var result = new TranscriptionResult
            {
                Text = fullText.ToString().Trim(),
                Segments = transcriptionSegments,
                Duration = totalDurationSeconds
            };

            _logger.LogInformation("✅ Parsed {SegmentCount} segments, {SpeakerCount} speakers, {Duration}s duration", 
                result.Segments.Count, speakers.Count, result.Duration);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error parsing Azure results");
            throw new InvalidOperationException("Failed to parse transcription results", ex);
        }
    }

    private SpeakerSegment? ParseRecognitionSegment(JsonElement recognition, HashSet<string> speakers)
    {
        try
        {
            if (!recognition.TryGetProperty("best", out var bestResults) || 
                bestResults.GetArrayLength() == 0)
                return null;

            var best = bestResults[0];
            if (!best.TryGetProperty("transcript", out var transcriptElement) ||
                string.IsNullOrWhiteSpace(transcriptElement.GetString()))
                return null;

            var text = transcriptElement.GetString()!;
            var speakerId = "Speaker 1";
            var startSeconds = 0.0;
            var endSeconds = 0.0;

            // Extract speaker information if available
            if (best.TryGetProperty("speaker", out var speakerElement))
            {
                speakerId = $"Speaker {speakerElement.GetInt32()}";
            }
            speakers.Add(speakerId);

            // Extract timing information
            if (recognition.TryGetProperty("offset", out var offsetElement))
            {
                startSeconds = offsetElement.GetInt64() / 10000000.0; // Convert from ticks to seconds
            }

            if (recognition.TryGetProperty("duration", out var durationElement))
            {
                var durationSecs = durationElement.GetInt64() / 10000000.0; // Convert from ticks to seconds
                endSeconds = startSeconds + durationSecs;
            }

            return new SpeakerSegment
            {
                Text = text,
                Speaker = speakerId,
                Start = startSeconds,
                End = endSeconds,
                Confidence = best.TryGetProperty("confidence", out var confElement) ? confElement.GetDouble() : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse recognition segment");
            return null;
        }
    }

    private SpeakerSegment? ParsePhraseSegment(JsonElement phrase, HashSet<string> speakers)
    {
        try
        {
            // Azure Fast Transcription API returns phrases with direct properties like:
            // {"speaker": 1, "offsetMilliseconds": 80, "durationMilliseconds": 960, "text": "Thanks for gathering."}
            
            if (!phrase.TryGetProperty("text", out var textElement) ||
                string.IsNullOrWhiteSpace(textElement.GetString()))
                return null;

            var text = textElement.GetString()!;
            var speakerId = "Speaker 1"; // Default speaker
            var startSeconds = 0.0;
            var endSeconds = 0.0;

            // Extract speaker information
            if (phrase.TryGetProperty("speaker", out var speakerElement))
            {
                speakerId = $"Speaker {speakerElement.GetInt32()}";
            }
            
            speakers.Add(speakerId);

            // Extract timing information
            if (phrase.TryGetProperty("offsetMilliseconds", out var offsetElement))
            {
                startSeconds = offsetElement.GetDouble() / 1000.0;
            }

            if (phrase.TryGetProperty("durationMilliseconds", out var durationElement))
            {
                var durationSecs = durationElement.GetDouble() / 1000.0;
                endSeconds = startSeconds + durationSecs;
            }

            var confidence = phrase.TryGetProperty("confidence", out var confElement) ? confElement.GetDouble() : (double?)null;

            return new SpeakerSegment
            {
                Text = text,
                Speaker = speakerId,
                Start = startSeconds,
                End = endSeconds,
                Confidence = confidence
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse phrase segment");
            return null;
        }
    }

    private SpeakerSegment? ParseCombinedPhraseSegment(JsonElement phrase, HashSet<string> speakers)
    {
        try
        {
            // Azure Fast Transcription API returns phrases with direct properties
            if (!phrase.TryGetProperty("text", out var textElement) ||
                string.IsNullOrWhiteSpace(textElement.GetString()))
                return null;

            var text = textElement.GetString()!;
            var speakerId = "Speaker 1"; // Default speaker for now
            var startSeconds = 0.0;
            var endSeconds = 0.0;

            // Extract speaker information if available
            if (phrase.TryGetProperty("speaker", out var speakerElement))
            {
                speakerId = $"Speaker {speakerElement.GetInt32()}";
            }
            else if (phrase.TryGetProperty("speakerId", out var speakerIdElement))
            {
                speakerId = $"Speaker {speakerIdElement.GetInt32()}";
            }
            
            speakers.Add(speakerId);

            // Extract timing information if available
            if (phrase.TryGetProperty("offsetMilliseconds", out var offsetElement))
            {
                startSeconds = offsetElement.GetDouble() / 1000.0;
            }
            else if (phrase.TryGetProperty("offset", out var offsetTicks))
            {
                startSeconds = offsetTicks.GetInt64() / 10000000.0; // Convert from ticks to seconds
            }

            if (phrase.TryGetProperty("durationMilliseconds", out var durationElement))
            {
                var durationSecs = durationElement.GetDouble() / 1000.0;
                endSeconds = startSeconds + durationSecs;
            }
            else if (phrase.TryGetProperty("duration", out var durationTicks))
            {
                var durationSecs = durationTicks.GetInt64() / 10000000.0; // Convert from ticks to seconds
                endSeconds = startSeconds + durationSecs;
            }

            var confidence = phrase.TryGetProperty("confidence", out var confElement) ? confElement.GetDouble() : (double?)null;

            return new SpeakerSegment
            {
                Text = text,
                Speaker = speakerId,
                Start = startSeconds,
                End = endSeconds,
                Confidence = confidence
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse combined phrase segment");
            return null;
        }
    }

    /// <summary>
    /// Convert audio file to WAV format using FFmpeg
    /// </summary>
    private async Task<byte[]> ConvertToWavAsync(byte[] audioData, string fileName, CancellationToken cancellationToken = default)
    {
        var tempInputPath = Path.Combine(Path.GetTempPath(), $"input_{Guid.NewGuid()}{Path.GetExtension(fileName)}");
        var tempOutputPath = Path.Combine(Path.GetTempPath(), $"output_{Guid.NewGuid()}.wav");

        try
        {
            // Write input file
            await File.WriteAllBytesAsync(tempInputPath, audioData, cancellationToken);

            // Run FFmpeg to convert to WAV (PCM 16kHz mono for Azure compatibility)
            var ffmpegArgs = $"-y -i \"{tempInputPath}\" -ar 16000 -ac 1 -acodec pcm_s16le -f wav -map_metadata -1 \"{tempOutputPath}\"";

            // Try to find ffmpeg in PATH, or use common install locations
            var ffmpegPath = FindFFmpegPath();

            using var process = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = ffmpegPath,
                    Arguments = ffmpegArgs,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();

            var stdOut = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            var stdErr = await process.StandardError.ReadToEndAsync(cancellationToken);

            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogError("FFmpeg conversion failed for {FileName} - Error: {Error}", fileName, stdErr);
                throw new InvalidOperationException($"Audio conversion failed: {stdErr}");
            }

            _logger.LogInformation("FFmpeg conversion successful for {FileName}", fileName);

            // Read converted file
            return await File.ReadAllBytesAsync(tempOutputPath, cancellationToken);
        }
        finally
        {
            // Clean up temp files
            try
            {
                if (File.Exists(tempInputPath)) File.Delete(tempInputPath);
                if (File.Exists(tempOutputPath)) File.Delete(tempOutputPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean up temporary conversion files");
            }
        }
    }

    /// <summary>
    /// Find FFmpeg executable path
    /// </summary>
    private string FindFFmpegPath()
    {
        // Try common locations
        var possiblePaths = new[]
        {
            "ffmpeg", // Try PATH first
            "C:\\ffmpeg\\bin\\ffmpeg.exe",
            "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), 
                "Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe")
        };

        foreach (var path in possiblePaths)
        {
            try
            {
                // Test if the path works by checking version
                using var testProcess = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = path,
                        Arguments = "-version",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                testProcess.Start();
                testProcess.WaitForExit(1000);
                
                if (testProcess.ExitCode == 0)
                {
                    _logger.LogInformation("Found FFmpeg at: {Path}", path);
                    return path;
                }
            }
            catch
            {
                // Try next path
                continue;
            }
        }

        throw new InvalidOperationException("FFmpeg executable not found. Please install FFmpeg and ensure it's in your system PATH.");
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