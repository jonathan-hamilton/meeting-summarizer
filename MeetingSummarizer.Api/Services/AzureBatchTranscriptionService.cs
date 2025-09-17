using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Models.BatchTranscription;
using MeetingSummarizer.Api.Services.Configuration;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service for interacting with Azure Batch Transcription API v3.1+
/// Handles asynchronous transcription jobs for longer audio files
/// </summary>
public class AzureBatchTranscriptionService
{
    private readonly HttpClient _httpClient;
    private readonly IAzureConfigurationService _configService;
    private readonly AzureSpeechOptions _speechOptions;
    private readonly ILogger<AzureBatchTranscriptionService> _logger;

    public AzureBatchTranscriptionService(
        HttpClient httpClient,
        IAzureConfigurationService configService,
        IOptions<AzureSpeechOptions> speechOptions,
        ILogger<AzureBatchTranscriptionService> logger)
    {
        _httpClient = httpClient;
        _configService = configService;
        _speechOptions = speechOptions.Value;
        _logger = logger;

        // Configure HttpClient for Azure Batch Transcription API
        // Note: Base address and API key will be set dynamically in methods
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    /// <summary>
    /// Submit a new batch transcription job to Azure
    /// </summary>
    /// <param name="request">Job configuration</param>
    /// <param name="speechRegion">Azure Speech region (e.g., "eastus")</param>
    /// <param name="speechApiKey">Azure Speech API key</param>
    /// <returns>Azure job response with job ID</returns>
    public async Task<AzureBatchJobResponse> SubmitJobAsync(
        AzureBatchJobRequest request, 
        string speechRegion, 
        string speechApiKey)
    {
        try
        {
            _logger.LogInformation("Submitting batch transcription job for audio: {AudioUri}", request.AudioFileUri);

            // Set up the HTTP client for this request
            var baseAddress = $"https://{speechRegion}.api.cognitive.microsoft.com/speechtotext/v3.1/";
            _httpClient.BaseAddress = new Uri(baseAddress);
            _httpClient.DefaultRequestHeaders.Remove("Ocp-Apim-Subscription-Key");
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", speechApiKey);

            var jobPayload = new
            {
                contentUrls = new[] { request.AudioFileUri },
                properties = new
                {
                    diarizationEnabled = request.DiarizationEnabled,
                    diarization = new
                    {
                        speakers = new
                        {
                            minCount = 1,
                            maxCount = request.MaxSpeakers
                        }
                    },
                    punctuationMode = "DictatedAndAutomatic",
                    profanityFilterMode = "Masked",
                    wordLevelTimestampsEnabled = true
                },
                locale = request.Language,
                displayName = request.DisplayName,
                description = request.Description
            };

            var json = JsonSerializer.Serialize(jobPayload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            _logger.LogInformation("Azure Batch Job Payload: {Payload}", json);

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("transcriptions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to submit batch job. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"Azure API error: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var azureResponse = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            var selfUrl = azureResponse.GetProperty("self").GetString() ?? "";
            var jobId = selfUrl.Split('/').LastOrDefault() ?? "";
            
            var jobResponse = new AzureBatchJobResponse
            {
                JobId = jobId,
                Status = azureResponse.GetProperty("status").GetString() ?? "Unknown",
                CreatedDateTime = azureResponse.GetProperty("createdDateTime").GetDateTime(),
                LastActionDateTime = azureResponse.GetProperty("lastActionDateTime").GetDateTime()
            };

            _logger.LogInformation("Successfully submitted batch job. Azure Job ID: {JobId}", jobResponse.JobId);
            return jobResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting batch transcription job");
            throw;
        }
    }

    /// <summary>
    /// Check the status of a batch transcription job
    /// </summary>
    /// <param name="azureJobId">Azure job identifier</param>
    /// <returns>Current job status</returns>
    public async Task<AzureBatchJobResponse> GetJobStatusAsync(string azureJobId)
    {
        try
        {
            _logger.LogDebug("Checking status for Azure job: {JobId}", azureJobId);

            // Set up the HTTP client for this request
            var baseAddress = $"https://{_speechOptions.Region}.api.cognitive.microsoft.com/speechtotext/v3.1/";
            _httpClient.BaseAddress = new Uri(baseAddress);
            
            // Clear any existing auth headers and set the new API key
            _httpClient.DefaultRequestHeaders.Remove("Ocp-Apim-Subscription-Key");
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _speechOptions.Key);

            var response = await _httpClient.GetAsync($"transcriptions/{azureJobId}");

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get job status. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"Azure API error: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var azureResponse = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            var jobResponse = new AzureBatchJobResponse
            {
                JobId = azureJobId,
                Status = azureResponse.GetProperty("status").GetString() ?? "Unknown",
                CreatedDateTime = azureResponse.GetProperty("createdDateTime").GetDateTime(),
                LastActionDateTime = azureResponse.GetProperty("lastActionDateTime").GetDateTime()
            };

            // Check if job is completed and has results
            if (jobResponse.Status == "Succeeded")
            {
                // Get the results URL from the files endpoint
                var filesResponse = await _httpClient.GetAsync($"transcriptions/{azureJobId}/files");
                if (filesResponse.IsSuccessStatusCode)
                {
                    var filesJson = await filesResponse.Content.ReadAsStringAsync();
                    var filesData = JsonSerializer.Deserialize<JsonElement>(filesJson);
                    
                    if (filesData.TryGetProperty("values", out var filesArray))
                    {
                        foreach (var file in filesArray.EnumerateArray())
                        {
                            if (file.GetProperty("kind").GetString() == "Transcription")
                            {
                                jobResponse.ResultsUri = file.GetProperty("links").GetProperty("contentUrl").GetString();
                                break;
                            }
                        }
                    }
                }
            }
            else if (jobResponse.Status == "Failed")
            {
                // Try to get error details
                if (azureResponse.TryGetProperty("properties", out var properties) &&
                    properties.TryGetProperty("error", out var error))
                {
                    jobResponse.Error = error.GetProperty("message").GetString();
                }
            }

            return jobResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting job status for Azure job: {JobId}", azureJobId);
            throw;
        }
    }

    /// <summary>
    /// Download and parse transcription results from Azure
    /// </summary>
    /// <param name="resultsUri">Azure results URI</param>
    /// <returns>Parsed transcription results</returns>
    public async Task<string> DownloadResultsAsync(string resultsUri)
    {
        try
        {
            _logger.LogInformation("Downloading transcription results from: {Uri}", resultsUri);

            var response = await _httpClient.GetAsync(resultsUri);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to download results. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to download results: {response.StatusCode} - {errorContent}");
            }

            var resultsJson = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Successfully downloaded transcription results ({Size} bytes)", resultsJson.Length);
            
            return resultsJson;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading transcription results from: {Uri}", resultsUri);
            throw;
        }
    }

    /// <summary>
    /// Cancel a running batch transcription job
    /// </summary>
    /// <param name="azureJobId">Azure job identifier</param>
    /// <returns>True if successfully cancelled</returns>
    public async Task<bool> CancelJobAsync(string azureJobId)
    {
        try
        {
            _logger.LogInformation("Cancelling Azure batch job: {JobId}", azureJobId);

            // Set up the HTTP client for this request
            var baseAddress = $"https://{_speechOptions.Region}.api.cognitive.microsoft.com/speechtotext/v3.1/";
            _httpClient.BaseAddress = new Uri(baseAddress);
            
            // Clear any existing auth headers and set the new API key
            _httpClient.DefaultRequestHeaders.Remove("Ocp-Apim-Subscription-Key");
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _speechOptions.Key);

            var response = await _httpClient.DeleteAsync($"transcriptions/{azureJobId}");
            
            var success = response.IsSuccessStatusCode;
            if (success)
            {
                _logger.LogInformation("Successfully cancelled Azure batch job: {JobId}", azureJobId);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to cancel job {JobId}. Status: {Status}, Error: {Error}", 
                    azureJobId, response.StatusCode, errorContent);
            }

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling Azure batch job: {JobId}", azureJobId);
            return false;
        }
    }

    /// <summary>
    /// Parse Azure transcription results into our standard format
    /// </summary>
    /// <param name="azureResultsJson">Raw Azure results JSON</param>
    /// <returns>Parsed transcription result</returns>
    public TranscriptionResult ParseAzureResults(string azureResultsJson)
    {
        try
        {
            var azureData = JsonSerializer.Deserialize<JsonElement>(azureResultsJson);
            
            // Try different possible property names for Azure Speech Services response
            JsonElement combinedResults;
            if (azureData.TryGetProperty("combinedRecognizedPhrases", out combinedResults))
            {
                // Original expected format
            }
            else if (azureData.TryGetProperty("recognizedPhrases", out combinedResults))
            {
                // Common Azure Speech Services format
            }
            else if (azureData.TryGetProperty("results", out combinedResults))
            {
                // Alternative format
            }
            else
            {
                // Log the actual structure for debugging
                _logger.LogError("Unable to find recognized phrases in Azure response. Available properties: {Properties}",
                    string.Join(", ", azureData.EnumerateObject().Select(p => p.Name)));
                throw new InvalidOperationException($"Unable to find recognized phrases in Azure response. Available properties: {string.Join(", ", azureData.EnumerateObject().Select(p => p.Name))}");
            }
            
            var segments = new List<SpeakerSegment>();
            var fullText = new StringBuilder();

            foreach (var phrase in combinedResults.EnumerateArray())
            {
                var channel = phrase.GetProperty("channel").GetInt32();
                var speakerId = $"Speaker {channel + 1}";
                var text = phrase.GetProperty("lexical").GetString() ?? "";
                
                // Note: Azure batch transcription doesn't provide individual segment timing
                // in this format, so we use sequential positioning
                var segmentIndex = segments.Count;
                var estimatedStart = segmentIndex * 1.0; // Rough estimate: 1 second per segment
                var estimatedEnd = estimatedStart + 1.0;

                var segment = new SpeakerSegment
                {
                    Speaker = speakerId,
                    Text = text,
                    Start = estimatedStart,
                    End = estimatedEnd,
                    Confidence = phrase.TryGetProperty("confidence", out var conf) ? conf.GetDouble() : 0.95
                };

                segments.Add(segment);
                fullText.AppendLine($"{speakerId}: {text}");
            }

            // Calculate duration from segments
            var durationSeconds = segments.Any() ? segments.Max(s => s.End) : 0.0;

            return new TranscriptionResult
            {
                Text = fullText.ToString().Trim(),
                Segments = segments,
                DetectedLanguage = "en-US", // Default for batch processing
                Duration = durationSeconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Azure transcription results");
            _logger.LogError("Azure JSON content (first 2000 chars): {JsonContent}", 
                azureResultsJson.Length > 2000 ? azureResultsJson[..2000] + "..." : azureResultsJson);
            throw new InvalidOperationException("Failed to parse Azure transcription results", ex);
        }
    }
}
