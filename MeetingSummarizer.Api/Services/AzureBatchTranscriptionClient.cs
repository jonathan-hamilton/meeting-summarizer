using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// HTTP client wrapper for Azure Batch Transcription REST API v3.1
/// Handles direct communication with Azure Speech Services batch endpoints
/// </summary>
public class AzureBatchTranscriptionClient
{
    private readonly HttpClient _httpClient;
    private readonly AzureSpeechOptions _options;
    private readonly AzureStorageOptions _storageOptions;
    private readonly ILogger<AzureBatchTranscriptionClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>
    /// Base URL for Azure Speech Services batch transcription API
    /// </summary>
    private string BaseUrl => $"https://{_options.Region}.api.cognitive.microsoft.com/speechtotext/v3.2";

    public AzureBatchTranscriptionClient(
        HttpClient httpClient,
        IOptions<AzureSpeechOptions> options,
        IOptions<AzureStorageOptions> storageOptions,
        ILogger<AzureBatchTranscriptionClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _storageOptions = storageOptions.Value;
        _logger = logger;

        // Configure JSON serialization options
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        // Configure HTTP client with authentication
        ConfigureHttpClient();
    }

    /// <summary>
    /// Configure HTTP client with Azure authentication and headers
    /// </summary>
    private void ConfigureHttpClient()
    {
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _options.Key);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        _httpClient.Timeout = TimeSpan.FromSeconds(_options.BatchTranscription.MaxPollingTimeoutSeconds);
    }

    /// <summary>
    /// Submit a new batch transcription job
    /// </summary>
    /// <param name="request">Transcription request with audio file URLs</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Batch transcription response with job details</returns>
    public async Task<BatchTranscriptionResponse> SubmitTranscriptionJobAsync(
        BatchTranscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Submitting batch transcription job: {DisplayName}", request.DisplayName);

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            _logger.LogInformation("Azure batch transcription request JSON: {RequestJson}", json);
            
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{BaseUrl}/transcriptions", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to submit batch transcription job. Status: {StatusCode}, Content: {Content}",
                    response.StatusCode, errorContent);
                throw new HttpRequestException($"Failed to submit batch transcription job: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            
            var result = JsonSerializer.Deserialize<BatchTranscriptionResponse>(responseJson, _jsonOptions);

            if (result == null)
            {
                throw new InvalidOperationException("Failed to deserialize batch transcription response");
            }

            _logger.LogInformation("Successfully submitted batch transcription job. ID: {JobId}, Status: {Status}",
                result.Id, result.Status);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting batch transcription job for: {DisplayName}", request.DisplayName);
            throw;
        }
    }

    /// <summary>
    /// Get the status of a batch transcription job
    /// </summary>
    /// <param name="jobId">Unique identifier of the transcription job</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Current job status and details</returns>
    public async Task<BatchTranscriptionResponse> GetTranscriptionJobStatusAsync(
        string jobId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting status for batch transcription job: {JobId}", jobId);

            var response = await _httpClient.GetAsync($"{BaseUrl}/transcriptions/{jobId}", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to get batch transcription job status. JobId: {JobId}, Status: {StatusCode}, Content: {Content}",
                    jobId, response.StatusCode, errorContent);
                throw new HttpRequestException($"Failed to get job status: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<BatchTranscriptionResponse>(responseJson, _jsonOptions);

            if (result == null)
            {
                throw new InvalidOperationException($"Failed to deserialize job status response for job: {jobId}");
            }

            _logger.LogDebug("Batch transcription job {JobId} status: {Status}", jobId, result.Status);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status for batch transcription job: {JobId}", jobId);
            throw;
        }
    }

    /// <summary>
    /// Get the result files for a completed batch transcription job
    /// </summary>
    /// <param name="jobId">Unique identifier of the completed transcription job</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of result files available for download</returns>
    public async Task<BatchTranscriptionFilesResponse> GetTranscriptionJobFilesAsync(
        string jobId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting result files for batch transcription job: {JobId}", jobId);

            var response = await _httpClient.GetAsync($"{BaseUrl}/transcriptions/{jobId}/files", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to get batch transcription job files. JobId: {JobId}, Status: {StatusCode}, Content: {Content}",
                    jobId, response.StatusCode, errorContent);
                throw new HttpRequestException($"Failed to get job files: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<BatchTranscriptionFilesResponse>(responseJson, _jsonOptions);

            if (result == null)
            {
                throw new InvalidOperationException($"Failed to deserialize job files response for job: {jobId}");
            }

            _logger.LogInformation("Found {FileCount} result files for batch transcription job: {JobId}",
                result.Values.Length, jobId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting files for batch transcription job: {JobId}", jobId);
            throw;
        }
    }

    /// <summary>
    /// Download the content of a transcription result file
    /// </summary>
    /// <param name="contentUrl">URL to download the file content</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>File content as string</returns>
    public async Task<string> DownloadTranscriptionResultAsync(
        string contentUrl,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Downloading transcription result from: {ContentUrl}", contentUrl);

            var response = await _httpClient.GetAsync(contentUrl, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to download transcription result. Url: {ContentUrl}, Status: {StatusCode}, Content: {Content}",
                    contentUrl, response.StatusCode, errorContent);
                throw new HttpRequestException($"Failed to download result: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogDebug("Successfully downloaded transcription result. Size: {Size} characters", content.Length);

            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading transcription result from: {ContentUrl}", contentUrl);
            throw;
        }
    }

    /// <summary>
    /// Delete a batch transcription job and its associated files
    /// </summary>
    /// <param name="jobId">Unique identifier of the transcription job to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deletion was successful</returns>
    public async Task<bool> DeleteTranscriptionJobAsync(
        string jobId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting batch transcription job: {JobId}", jobId);

            var response = await _httpClient.DeleteAsync($"{BaseUrl}/transcriptions/{jobId}", cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully deleted batch transcription job: {JobId}", jobId);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to delete batch transcription job. JobId: {JobId}, Status: {StatusCode}, Content: {Content}",
                    jobId, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting batch transcription job: {JobId}", jobId);
            return false;
        }
    }

    /// <summary>
    /// Upload audio file to Azure Storage and get the URL for batch transcription
    /// Note: This is a placeholder - actual implementation depends on Azure Storage setup
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>URL where the file can be accessed by Azure Speech Services</returns>
    public async Task<string> UploadAudioFileForBatchProcessingAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Uploading audio file to Azure Blob Storage: {FileName} ({Size} bytes)", fileName, audioStream.Length);
        
        try
        {
            // Create a unique filename with timestamp
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var uniqueFileName = $"{timestamp}_{fileName}";
            
            // Create BlobServiceClient using the connection string from configuration
            var blobServiceClient = new BlobServiceClient(_storageOptions.ConnectionString);
            
            // Get container client
            var containerClient = blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
            
            // Create container if it doesn't exist
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
            
            // Get blob client
            var blobClient = containerClient.GetBlobClient(uniqueFileName);
            
            // Reset stream position
            if (audioStream.CanSeek)
            {
                audioStream.Seek(0, SeekOrigin.Begin);
            }
            
            // Upload the file
            await blobClient.UploadAsync(audioStream, overwrite: true, cancellationToken: cancellationToken);
            
            // Generate SAS URL for Azure Speech Services to access
            var sasUri = GenerateSasUri(blobClient, DateTime.UtcNow.AddHours(24));
            
            _logger.LogInformation("Audio file uploaded successfully: {FileName} -> {BlobUrl}", fileName, sasUri);
            
            return sasUri;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload audio file to Azure Blob Storage: {FileName}", fileName);
            throw;
        }
    }
    
    /// <summary>
    /// Generate a SAS (Shared Access Signature) URI for the blob
    /// </summary>
    private string GenerateSasUri(BlobClient blobClient, DateTime expiresOn)
    {
        if (blobClient.CanGenerateSasUri)
        {
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = blobClient.BlobContainerName,
                BlobName = blobClient.Name,
                Resource = "b",
                ExpiresOn = expiresOn
            };
            
            sasBuilder.SetPermissions(BlobSasPermissions.Read);
            
            return blobClient.GenerateSasUri(sasBuilder).ToString();
        }
        else
        {
            // Fallback: return the blob URI without SAS (will work if blob is public)
            return blobClient.Uri.ToString();
        }
    }

    /// <summary>
    /// Check if the Azure Batch Transcription service is available
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // Test service availability by making a simple GET request to the transcriptions endpoint
            var response = await _httpClient.GetAsync($"{BaseUrl}/transcriptions?top=1", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Batch Transcription service availability check failed");
            return false;
        }
    }
}
