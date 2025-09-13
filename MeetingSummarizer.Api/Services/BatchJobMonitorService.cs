using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Models.BatchTranscription;
using MeetingSummarizer.Api.Services.Configuration;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Services.Transcription;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Background service that monitors Azure Batch Transcription jobs
/// Handles job status updates, completion processing, and auto-refunds
/// </summary>
public class BatchJobMonitorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BatchJobMonitorService> _logger;
    private readonly AzureSpeechOptions _speechOptions;
    private readonly TimeSpan _pollInterval = TimeSpan.FromMinutes(2); // Check every 2 minutes

    public BatchJobMonitorService(
        IServiceProvider serviceProvider,
        ILogger<BatchJobMonitorService> logger,
        IOptions<AzureSpeechOptions> speechOptions)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _speechOptions = speechOptions.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Batch Job Monitor Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingJobsAsync(stoppingToken);
                await MonitorActiveJobsAsync(stoppingToken);
                await CleanupOldJobsAsync(stoppingToken);
                
                await Task.Delay(_pollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch job monitoring cycle");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); // Brief delay before retry
            }
        }

        _logger.LogInformation("Batch Job Monitor Service stopped");
    }

    /// <summary>
    /// Process jobs that have been submitted but not yet sent to Azure
    /// </summary>
    private async Task ProcessPendingJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MeetingSummarizerDbContext>();
        var batchService = scope.ServiceProvider.GetRequiredService<AzureBatchTranscriptionService>();
        var azureConfig = scope.ServiceProvider.GetRequiredService<IAzureConfigurationService>();

        try
        {
            var pendingJobs = await context.BatchTranscriptionJobs
                .Where(j => j.Status == "submitted")
                .OrderBy(j => j.SubmittedAt)
                .Take(5) // Process max 5 at a time
                .ToListAsync(cancellationToken);

            if (pendingJobs.Count == 0) return;

            _logger.LogDebug("Processing {Count} pending batch jobs", pendingJobs.Count);

            foreach (var job in pendingJobs)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    await ProcessPendingJobAsync(job, context, batchService, azureConfig);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing pending job {JobId}", job.Id);
                    await HandleJobFailure(job, context, "Failed to submit to Azure: " + ex.Message);
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pending jobs");
        }
    }

    /// <summary>
    /// Monitor active Azure jobs for completion
    /// </summary>
    private async Task MonitorActiveJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MeetingSummarizerDbContext>();
        var batchService = scope.ServiceProvider.GetRequiredService<AzureBatchTranscriptionService>();
        var azureConfig = scope.ServiceProvider.GetRequiredService<IAzureConfigurationService>();
        var userStorageService = scope.ServiceProvider.GetRequiredService<IUserStorageService>();
        var transcriptParsingService = scope.ServiceProvider.GetRequiredService<ITranscriptParsingService>();

        try
        {
            var activeJobs = await context.BatchTranscriptionJobs
                .Where(j => j.Status == "processing" && !string.IsNullOrEmpty(j.AzureJobId))
                .OrderBy(j => j.SubmittedAt)
                .Take(10) // Monitor max 10 at a time
                .ToListAsync(cancellationToken);

            if (activeJobs.Count == 0) return;

            _logger.LogDebug("Monitoring {Count} active batch jobs", activeJobs.Count);

            foreach (var job in activeJobs)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    await MonitorActiveJobAsync(job, context, batchService, azureConfig, userStorageService, transcriptParsingService);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error monitoring job {JobId} (Azure: {AzureJobId})", 
                        job.Id, job.AzureJobId);
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring active jobs");
        }
    }

    /// <summary>
    /// Process a single pending job by submitting it to Azure
    /// </summary>
    private async Task ProcessPendingJobAsync(
        BatchTranscriptionJob job,
        MeetingSummarizerDbContext context,
        AzureBatchTranscriptionService batchService,
        IAzureConfigurationService azureConfig)
    {
        _logger.LogInformation("Processing pending job {JobId} for file {FileName}", job.Id, job.FileName);

        // Ensure we have a valid audio blob URL
        if (string.IsNullOrEmpty(job.AudioBlobUrl))
        {
            job.Status = "failed";
            job.ErrorMessage = "Audio file not found in blob storage - missing AudioBlobUrl";
            job.CompletedAt = DateTime.UtcNow;
            _logger.LogError("Job {JobId} failed: Missing AudioBlobUrl for uploaded audio file", job.Id);
            return;
        }

        var azureRequest = new AzureBatchJobRequest
        {
            AudioFileUri = job.AudioBlobUrl, // Use the real blob URL
            Language = "en-US",
            DiarizationEnabled = true,
            MaxSpeakers = 10,
            DisplayName = $"Batch Job {job.Id}",
            Description = $"Transcription for {job.FileName} ({job.EstimatedDurationMinutes} min)"
        };

        try
        {
            // Get Azure configuration from options (not Key Vault)
            var speechApiKey = _speechOptions.Key;
            var speechRegion = _speechOptions.Region;

            // Submit to Azure
            var azureResponse = await batchService.SubmitJobAsync(azureRequest, speechRegion, speechApiKey);

            // Update job with Azure details
            job.AzureJobId = azureResponse.JobId;
            job.Status = "processing";
            job.ProgressPercentage = 10; // Initial progress

            _logger.LogInformation("Successfully submitted job {JobId} to Azure. Azure Job ID: {AzureJobId}", 
                job.Id, azureResponse.JobId);
        }
        catch (Exception ex)
        {
            // Mark job as failed and log the error
            job.Status = "failed";
            job.ErrorMessage = $"Failed to submit to Azure Speech Services: {ex.Message}";
            job.CompletedAt = DateTime.UtcNow;
            
            _logger.LogError(ex, "Failed to submit batch job {JobId} for file {FileName}. Error: {ErrorMessage}", 
                job.Id, job.FileName, ex.Message);
        }
    }

    /// <summary>
    /// Monitor a single active job in Azure
    /// </summary>
    private async Task MonitorActiveJobAsync(
        BatchTranscriptionJob job,
        MeetingSummarizerDbContext context,
        AzureBatchTranscriptionService batchService,
        IAzureConfigurationService azureConfig,
        IUserStorageService userStorageService,
        ITranscriptParsingService transcriptParsingService)
    {
        if (string.IsNullOrEmpty(job.AzureJobId)) return;

        _logger.LogDebug("Checking status for job {JobId} (Azure: {AzureJobId})", job.Id, job.AzureJobId);

        var azureStatus = await batchService.GetJobStatusAsync(job.AzureJobId);

        // Update progress based on Azure status
        switch (azureStatus.Status.ToLowerInvariant())
        {
            case "notstarted":
                job.ProgressPercentage = 15;
                break;
            case "running":
                job.ProgressPercentage = Math.Min(80, job.ProgressPercentage + 10);
                break;
            case "succeeded":
                await HandleJobCompletion(job, context, batchService, azureStatus, userStorageService, transcriptParsingService);
                break;
            case "failed":
                await HandleJobFailure(job, context, azureStatus.Error ?? "Azure processing failed");
                break;
        }

        _logger.LogDebug("Job {JobId} status: {Status}, Progress: {Progress}%", 
            job.Id, azureStatus.Status, job.ProgressPercentage);
    }

    /// <summary>
    /// Handle successful job completion using hybrid storage approach
    /// </summary>
    private async Task HandleJobCompletion(
        BatchTranscriptionJob job,
        MeetingSummarizerDbContext context,
        AzureBatchTranscriptionService batchService,
        AzureBatchJobResponse azureStatus,
        IUserStorageService userStorageService,
        ITranscriptParsingService transcriptParsingService)
    {
        try
        {
            _logger.LogInformation("Job {JobId} completed successfully", job.Id);

            // Download and process results using hybrid storage approach
            if (!string.IsNullOrEmpty(azureStatus.ResultsUri))
            {
                var resultsJson = await batchService.DownloadResultsAsync(azureStatus.ResultsUri);
                _logger.LogInformation("Downloaded results for job {JobId} ({Size} bytes)", 
                    job.Id, resultsJson.Length);
                
                // Log a sample of the Azure response to debug diarization
                _logger.LogInformation("Azure response sample for job {JobId}: {AzureResponseSample}", 
                    job.Id, resultsJson.Length > 2000 ? resultsJson.Substring(0, 2000) + "..." : resultsJson);
                
                // Enhanced: Log complete structure for debugging diarization
                try
                {
                    var azureData = JsonSerializer.Deserialize<JsonElement>(resultsJson);
                    var properties = azureData.EnumerateObject().Select(p => p.Name).ToList();
                    _logger.LogInformation("Complete Azure response properties for job {JobId}: {Properties}", job.Id, string.Join(", ", properties));
                    
                    // Check if recognizedPhrases exists (should contain individual speaker segments)
                    if (azureData.TryGetProperty("recognizedPhrases", out var recognizedPhrases))
                    {
                        var count = recognizedPhrases.GetArrayLength();
                        _logger.LogInformation("Found recognizedPhrases array with {Count} items for job {JobId}", count, job.Id);
                        
                        if (count > 0)
                        {
                            var firstPhrase = recognizedPhrases.EnumerateArray().First();
                            var phraseProps = firstPhrase.EnumerateObject().Select(p => p.Name).ToList();
                            _logger.LogInformation("First recognizedPhrase properties for job {JobId}: {Properties}", job.Id, string.Join(", ", phraseProps));
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No recognizedPhrases found in Azure response for job {JobId} - diarization may have failed", job.Id);
                    }
                    
                    // Check combinedRecognizedPhrases structure
                    if (azureData.TryGetProperty("combinedRecognizedPhrases", out var combinedPhrases))
                    {
                        var count = combinedPhrases.GetArrayLength();
                        _logger.LogInformation("Found combinedRecognizedPhrases array with {Count} items for job {JobId}", count, job.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to analyze Azure response structure for job {JobId}", job.Id);
                }

                // Use hybrid storage approach for large transcripts
                await ProcessTranscriptResultsAsync(job, resultsJson, context, userStorageService, transcriptParsingService);
            }

            job.Status = "completed";
            job.ProgressPercentage = 100;
            job.CompletedAt = DateTime.UtcNow;
            job.ErrorMessage = null;

            _logger.LogInformation("Successfully completed job {JobId} in {Duration}", 
                job.Id, job.ProcessingDuration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling completion for job {JobId}", job.Id);
            await HandleJobFailure(job, context, "Failed to process results: " + ex.Message);
        }
    }

    /// <summary>
    /// Process transcript results using hybrid storage approach
    /// </summary>
    private async Task ProcessTranscriptResultsAsync(
        BatchTranscriptionJob job,
        string resultsJson,
        MeetingSummarizerDbContext context,
        IUserStorageService userStorageService,
        ITranscriptParsingService transcriptParsingService)
    {
        // Validate JSON format first
        var validationResult = await transcriptParsingService.ValidateAzureJsonAsync(resultsJson);
        if (!validationResult.IsValid)
        {
            var errorMsg = validationResult.Issues.Count > 0 
                ? string.Join("; ", validationResult.Issues) 
                : "Unknown validation error";
            throw new ArgumentException($"Invalid transcript JSON format: {errorMsg}");
        }

        // Determine storage strategy based on size (threshold: 1MB)
        const int maxDbSize = 1024 * 1024; // 1MB
        bool shouldUseBlobStorage = resultsJson.Length > maxDbSize;

        if (shouldUseBlobStorage)
        {
            _logger.LogInformation("Storing large transcript ({Size} bytes) in blob storage for job {JobId}", 
                resultsJson.Length, job.Id);

            // Compress and store in blob storage as meeting artifact
            var compressedData = CompressionUtils.CompressJson(resultsJson);
            var base64Compressed = Convert.ToBase64String(compressedData);
            
            var blobResult = await userStorageService.UploadMeetingArtifactAsync(
                job.UserId, 
                job.Id, 
                "compressed-transcript", 
                base64Compressed
            );

            // Update job with blob reference
            job.TranscriptBlobUrl = blobResult.BlobUrl;
            job.IsTranscriptInBlobStorage = true;
            job.CompressedTranscriptSize = compressedData.Length;
            
            #pragma warning disable CS0618 // Type or member is obsolete
            job.ResultsJson = null; // Clear legacy field for large files
            #pragma warning restore CS0618 // Type or member is obsolete
            
            _logger.LogInformation("Stored compressed transcript ({CompressedSize} bytes) at {BlobUrl} for job {JobId}", 
                compressedData.Length, blobResult.BlobUrl, job.Id);
        }
        else
        {
            _logger.LogInformation("Storing small transcript ({Size} bytes) in database for job {JobId}", 
                resultsJson.Length, job.Id);

            // Store directly in database for small files
            #pragma warning disable CS0618 // Type or member is obsolete
            job.ResultsJson = resultsJson;
            #pragma warning restore CS0618 // Type or member is obsolete
            job.TranscriptBlobUrl = null;
            job.IsTranscriptInBlobStorage = false;
            job.CompressedTranscriptSize = null;
        }

        // Parse transcript into segments for efficient querying
        try
        {
            var parsingResult = await transcriptParsingService.ParseAzureResultsAsync(resultsJson, job.Id);
            if (parsingResult?.Segments?.Count > 0)
            {
                // Clear existing segments for this job (if any)
                var existingSegments = context.TranscriptSegments.Where(s => s.JobId == job.Id);
                context.TranscriptSegments.RemoveRange(existingSegments);

                // Add parsed segments
                foreach (var segment in parsingResult.Segments)
                {
                    segment.JobId = job.Id;
                    context.TranscriptSegments.Add(segment);
                }

                _logger.LogInformation("Parsed and stored {SegmentCount} transcript segments for job {JobId}", 
                    parsingResult.Segments.Count, job.Id);
            }
            else
            {
                _logger.LogWarning("Parsing returned no segments for job {JobId}", job.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse transcript segments for job {JobId}: {Error}", 
                job.Id, ex.Message);
            // Don't fail the entire job completion if segment parsing fails
        }
    }

    /// <summary>
    /// Handle job failure with retry logic and auto-refund
    /// </summary>
    private async Task HandleJobFailure(
        BatchTranscriptionJob job,
        MeetingSummarizerDbContext context,
        string errorMessage)
    {
        job.ErrorMessage = errorMessage;
        job.RetryCount++;

        _logger.LogWarning("Job {JobId} failed (attempt {RetryCount}/{MaxRetries}): {Error}", 
            job.Id, job.RetryCount, job.MaxRetries, errorMessage);

        if (job.CanRetry)
        {
            // Reset for retry
            job.Status = "submitted";
            job.AzureJobId = null;
            job.ProgressPercentage = 0;
            _logger.LogInformation("Job {JobId} will be retried", job.Id);
        }
        else
        {
            // Permanently failed - issue refund
            job.Status = "failed";
            job.CompletedAt = DateTime.UtcNow;

            if (!job.RefundIssued)
            {
                var user = await context.Users.FindAsync(job.UserId);
                if (user != null)
                {
                    user.TokenBalance += job.TokensCharged;
                    job.RefundIssued = true;
                    _logger.LogInformation("Issued auto-refund of {Tokens} tokens for failed job {JobId}", 
                        job.TokensCharged, job.Id);
                }
            }
        }
    }

    /// <summary>
    /// Clean up old completed jobs
    /// </summary>
    private async Task CleanupOldJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MeetingSummarizerDbContext>();

        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-30); // Keep for 30 days
            
            var oldJobs = await context.BatchTranscriptionJobs
                .Where(j => j.CompletedAt.HasValue && j.CompletedAt < cutoffDate)
                .Take(100) // Limit cleanup batch size
                .ToListAsync(cancellationToken);

            if (oldJobs.Count > 0)
            {
                _logger.LogInformation("Cleaning up {Count} old batch jobs", oldJobs.Count);
                context.BatchTranscriptionJobs.RemoveRange(oldJobs);
                await context.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup of old jobs");
        }
    }
}
