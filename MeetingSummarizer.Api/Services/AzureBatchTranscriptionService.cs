using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// High-level service for managing Azure Batch Transcription jobs
/// Provides orchestration, polling, and result processing capabilities
/// </summary>
public class AzureBatchTranscriptionService
{
    private readonly AzureBatchTranscriptionClient _client;
    private readonly AzureSpeechOptions _options;
    private readonly ILogger<AzureBatchTranscriptionService> _logger;

    public AzureBatchTranscriptionService(
        AzureBatchTranscriptionClient client,
        IOptions<AzureSpeechOptions> options,
        ILogger<AzureBatchTranscriptionService> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Submit a batch transcription job and wait for completion
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Completed transcription result</returns>
    public async Task<TranscriptionResult> ProcessBatchTranscriptionAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting batch transcription process for file: {FileName}", fileName);

        try
        {
            // Step 1: Upload audio file (placeholder for now)
            var audioUrl = await UploadAudioFileAsync(audioStream, fileName, cancellationToken);

            // Step 2: Submit batch transcription job
            var job = await SubmitBatchJobAsync(audioUrl, fileName, cancellationToken);

            // Step 3: Monitor job until completion
            var completedJob = await WaitForJobCompletionAsync(job.Id, cancellationToken);

            // Step 4: Download and process results
            var result = await DownloadAndProcessResultsAsync(completedJob, fileName, cancellationToken);

            // Step 5: Cleanup job (optional)
            if (_options.BatchTranscription.EnableJobCleanup)
            {
                _ = Task.Run(async () => await CleanupJobAsync(job.Id), CancellationToken.None);
            }

            _logger.LogInformation("Batch transcription completed successfully for file: {FileName}", fileName);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Batch transcription failed for file: {FileName}", fileName);
            throw;
        }
    }

    /// <summary>
    /// Submit a batch transcription job
    /// </summary>
    /// <param name="audioUrl">URL of the uploaded audio file</param>
    /// <param name="fileName">Original filename for display purposes</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Submitted batch transcription job</returns>
    private async Task<BatchTranscriptionResponse> SubmitBatchJobAsync(
        string audioUrl,
        string fileName,
        CancellationToken cancellationToken)
    {
        var request = new BatchTranscriptionRequest
        {
            DisplayName = $"Meeting Transcription - {fileName}",
            Description = $"Batch transcription for meeting audio file: {fileName}",
            ContentUrls = new[] { audioUrl },
            Locale = _options.Language ?? "en-US",
            Properties = new BatchTranscriptionProperties
            {
                DiarizationEnabled = _options.EnableSpeakerDiarization,
                MaxSpeakers = 10, // Set a reasonable maximum for meeting scenarios
                WordLevelTimestampsEnabled = true,
                PunctuationMode = "DictatedAndAutomatic",
                ProfanityFilterMode = "Masked",
                Channels = new[] { 0 } // Explicitly specify mono channel processing
            }
        };

        _logger.LogInformation("Submitting batch transcription job for file: {FileName} with diarization: {Diarization}, maxSpeakers: {MaxSpeakers}", 
            fileName, _options.EnableSpeakerDiarization, 10);
        return await _client.SubmitTranscriptionJobAsync(request, cancellationToken);
    }

    /// <summary>
    /// Wait for batch transcription job to complete using polling with exponential backoff
    /// </summary>
    /// <param name="jobId">Job identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Completed batch transcription job</returns>
    private async Task<BatchTranscriptionResponse> WaitForJobCompletionAsync(
        string jobId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Monitoring batch transcription job: {JobId}", jobId);

        var startTime = DateTime.UtcNow;
        var maxDuration = TimeSpan.FromSeconds(_options.BatchTranscription.MaxPollingTimeoutSeconds);
        var currentDelay = _options.BatchTranscription.BaseDelayMilliseconds;
        var maxDelay = _options.BatchTranscription.MaxDelayMilliseconds;

        while (DateTime.UtcNow - startTime < maxDuration)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                var jobStatus = await _client.GetTranscriptionJobStatusAsync(jobId, cancellationToken);
                var status = jobStatus.GetStatusEnum();

                _logger.LogDebug("Batch job {JobId} status: {Status}", jobId, status);

                switch (status)
                {
                    case BatchTranscriptionStatus.Succeeded:
                        _logger.LogInformation("Batch transcription job completed successfully: {JobId}", jobId);
                        return jobStatus;

                    case BatchTranscriptionStatus.Failed:
                        var errorMessage = jobStatus.Error?.Message ?? "Unknown error";
                        _logger.LogError("Batch transcription job failed: {JobId}, Error: {Error}", jobId, errorMessage);
                        throw new InvalidOperationException($"Batch transcription failed: {errorMessage}");

                    case BatchTranscriptionStatus.Cancelled:
                        _logger.LogWarning("Batch transcription job was cancelled: {JobId}", jobId);
                        throw new OperationCanceledException("Batch transcription job was cancelled");

                    case BatchTranscriptionStatus.NotStarted:
                    case BatchTranscriptionStatus.Running:
                        // Continue polling
                        break;

                    default:
                        _logger.LogWarning("Unknown batch transcription status: {Status} for job {JobId}", status, jobId);
                        break;
                }

                // Wait before next poll with exponential backoff
                await Task.Delay(currentDelay, cancellationToken);
                currentDelay = Math.Min(currentDelay * 2, maxDelay);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Batch transcription polling cancelled for job: {JobId}", jobId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking batch transcription status for job: {JobId}", jobId);
                
                // Wait before retrying
                await Task.Delay(currentDelay, cancellationToken);
                currentDelay = Math.Min(currentDelay * 2, maxDelay);
            }
        }

        // Timeout reached
        _logger.LogError("Batch transcription job timed out after {Duration} for job: {JobId}", maxDuration, jobId);
        throw new TimeoutException($"Batch transcription job timed out after {maxDuration}");
    }

    /// <summary>
    /// Download and process batch transcription results
    /// </summary>
    /// <param name="completedJob">Completed batch transcription job</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processed transcription result</returns>
    private async Task<TranscriptionResult> DownloadAndProcessResultsAsync(
        BatchTranscriptionResponse completedJob,
        string fileName,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Downloading results for batch job: {JobId}", completedJob.Id);

        // Get list of result files
        var filesResponse = await _client.GetTranscriptionJobFilesAsync(completedJob.Id, cancellationToken);
        
        // Find the transcription result file
        var transcriptionFile = filesResponse.Values
            .FirstOrDefault(f => f.Kind.Equals("Transcription", StringComparison.OrdinalIgnoreCase));

        if (transcriptionFile == null)
        {
            throw new InvalidOperationException("No transcription result file found in batch job results");
        }

        // Download the transcription content
        var resultContent = await _client.DownloadTranscriptionResultAsync(
            transcriptionFile.Links.ContentUrl, 
            cancellationToken);

        // Parse the batch transcription result
        var batchResult = JsonSerializer.Deserialize<BatchTranscriptionResult>(resultContent);
        if (batchResult == null)
        {
            throw new InvalidOperationException("Failed to parse batch transcription result");
        }

        // Debug: Log what we received from Azure
        _logger.LogInformation("Batch result received - RecognitionResults count: {Count}", batchResult.RecognitionResults?.Length ?? 0);
        _logger.LogInformation("Batch result received - RecognizedPhrases count: {Count}", batchResult.RecognizedPhrases?.Length ?? 0);
        _logger.LogInformation("Batch result received - CombinedRecognizedPhrases count: {Count}", batchResult.CombinedRecognizedPhrases?.Length ?? 0);
        
        // Use RecognizedPhrases if available (v3.2 format), otherwise fall back to RecognitionResults (v3.1 format)
        var recognitionResults = batchResult.RecognizedPhrases?.Length > 0 ? batchResult.RecognizedPhrases : batchResult.RecognitionResults;
        
        if (recognitionResults?.Length > 0)
        {
            var firstResult = recognitionResults[0];
            _logger.LogInformation("First recognition result - NBest count: {Count}", firstResult.NBest?.Length ?? 0);
            if (firstResult.NBest?.Length > 0)
            {
                var firstNBest = firstResult.NBest[0];
                _logger.LogInformation("First NBest - Speaker: {Speaker}, Words count: {WordsCount}, Display: {Display}", 
                    firstNBest.Speaker, firstNBest.Words?.Length ?? 0, firstNBest.Display?.Substring(0, Math.Min(100, firstNBest.Display?.Length ?? 0)));
            }
        }

        // Convert batch result to our standard TranscriptionResult format
        return ConvertBatchResultToTranscriptionResult(batchResult, fileName);
    }

    /// <summary>
    /// Convert Azure batch transcription result to our standard TranscriptionResult format
    /// </summary>
    /// <param name="batchResult">Azure batch transcription result</param>
    /// <param name="fileName">Original filename</param>
    /// <returns>Standard transcription result</returns>
    private TranscriptionResult ConvertBatchResultToTranscriptionResult(
        BatchTranscriptionResult batchResult,
        string fileName)
    {
        var segments = new List<SpeakerSegment>();
        var speakers = new Dictionary<int, string>();

        // Use RecognizedPhrases if available (v3.2 format), otherwise fall back to RecognitionResults (v3.1 format)
        var recognitionResults = batchResult.RecognizedPhrases?.Length > 0 ? batchResult.RecognizedPhrases : batchResult.RecognitionResults;

        // Process recognition results to extract segments with speaker information
        foreach (var recognitionResult in recognitionResults)
        {
            _logger.LogDebug("Processing recognition result with {NBestCount} NBest entries", recognitionResult.NBest?.Length ?? 0);
            
            foreach (var nBest in recognitionResult.NBest)
            {
                _logger.LogDebug("Processing NBest - Speaker: {Speaker}, Text: {Text}", nBest.Speaker, nBest.Display);
                
                // Create speaker entry if not exists
                var speakerId = nBest.Speaker;
                if (!speakers.ContainsKey(speakerId))
                {
                    speakers[speakerId] = $"Speaker {speakerId + 1}";
                    _logger.LogInformation("Added new speaker: {SpeakerId} -> {SpeakerName}", speakerId, speakers[speakerId]);
                }

                // Calculate timing from first and last words
                if (nBest.Words.Length > 0)
                {
                    var firstWord = nBest.Words.First();
                    var lastWord = nBest.Words.Last();
                    
                    var startTimeSeconds = TimeSpan.FromTicks((long)firstWord.OffsetInTicks).TotalSeconds;
                    var endTimeSeconds = TimeSpan.FromTicks((long)(lastWord.OffsetInTicks + lastWord.DurationInTicks)).TotalSeconds;

                    var segment = new SpeakerSegment
                    {
                        Speaker = speakers[speakerId],
                        Text = nBest.Display.Trim(),
                        Start = startTimeSeconds,
                        End = endTimeSeconds,
                        Confidence = nBest.Confidence
                    };

                    segments.Add(segment);
                }
            }
        }

        // Sort segments by start time
        segments = segments.OrderBy(s => s.Start).ToList();

        // Hybrid approach: If only one speaker detected, try text-based speaker parsing
        if (speakers.Count <= 1 && segments.Count > 0)
        {
            _logger.LogInformation("Only {SpeakerCount} speaker detected by Azure. Attempting text-based speaker parsing...", speakers.Count);
            segments = ApplyTextBasedSpeakerDetection(segments);
            
            // Rebuild speakers dictionary from updated segments
            speakers = segments.GroupBy(s => s.Speaker)
                              .ToDictionary(g => segments.FindIndex(s => s.Speaker == g.Key), g => g.Key);
        }

        _logger.LogInformation("Processed batch results - Total segments: {SegmentCount}, Unique speakers: {SpeakerCount}", 
            segments.Count, speakers.Count);
        
        foreach (var speaker in speakers)
        {
            var speakerSegments = segments.Where(s => s.Speaker == speaker.Value).ToList();
            _logger.LogInformation("Speaker {SpeakerName} has {SegmentCount} segments", speaker.Value, speakerSegments.Count);
        }

        // Get combined text from batch result
        var combinedText = string.Join(" ", batchResult.CombinedRecognizedPhrases.Select(p => p.Display));
        if (string.IsNullOrEmpty(combinedText) && segments.Any())
        {
            combinedText = string.Join(" ", segments.Select(s => s.Text));
        }

        return new TranscriptionResult
        {
            Text = combinedText,
            Segments = segments,
            DetectedLanguage = "en-US", // Could be derived from job properties  
            Duration = segments.Any() ? segments.Max(s => s.End) : null
        };
    }

    /// <summary>
    /// Upload audio file for batch processing (placeholder implementation)
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>URL where file can be accessed by Azure</returns>
    private async Task<string> UploadAudioFileAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        // For now, delegate to the client's placeholder method
        // This will be replaced with actual Azure Storage implementation in a future increment
        return await _client.UploadAudioFileForBatchProcessingAsync(audioStream, fileName, cancellationToken);
    }

    /// <summary>
    /// Clean up completed batch transcription job
    /// </summary>
    /// <param name="jobId">Job identifier</param>
    private async Task CleanupJobAsync(string jobId)
    {
        try
        {
            // Wait for retention period before cleanup
            await Task.Delay(TimeSpan.FromHours(_options.BatchTranscription.JobRetentionHours));

            var deleted = await _client.DeleteTranscriptionJobAsync(jobId);
            if (deleted)
            {
                _logger.LogInformation("Successfully cleaned up batch transcription job: {JobId}", jobId);
            }
            else
            {
                _logger.LogWarning("Failed to clean up batch transcription job: {JobId}", jobId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error during batch transcription job cleanup: {JobId}", jobId);
        }
    }

    /// <summary>
    /// Check if the batch transcription service is available
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        return await _client.IsServiceAvailableAsync(cancellationToken);
    }

    /// <summary>
    /// Get estimated processing time for a batch transcription job
    /// </summary>
    /// <param name="audioDurationSeconds">Duration of audio in seconds</param>
    /// <returns>Estimated processing time</returns>
    public TimeSpan GetEstimatedProcessingTime(double audioDurationSeconds)
    {
        // Batch transcription typically takes 1/3 to 1/2 of the audio duration
        // Add base processing overhead and queue time
        var baseProcessingTime = TimeSpan.FromSeconds(audioDurationSeconds * 0.4);
        var queueTime = TimeSpan.FromMinutes(2); // Estimated queue time
        var overhead = TimeSpan.FromMinutes(1); // Processing overhead

        return baseProcessingTime + queueTime + overhead;
    }

    /// <summary>
    /// Apply text-based speaker detection when Azure's acoustic diarization fails
    /// Looks for patterns like "Speaker 1", "Speaker 2", etc. in the transcript
    /// </summary>
    /// <param name="segments">Original segments from Azure</param>
    /// <returns>Updated segments with proper speaker assignments</returns>
    private List<SpeakerSegment> ApplyTextBasedSpeakerDetection(List<SpeakerSegment> segments)
    {
        _logger.LogInformation("Applying text-based speaker detection to {SegmentCount} segments", segments.Count);
        
        var updatedSegments = new List<SpeakerSegment>();
        var currentSpeaker = "Speaker 1";
        
        // Regex patterns to detect speaker transitions
        var speakerPatterns = new[]
        {
            @"(?:^|\.\s*)Speaker\s+(\w+)(?:\s*,?\s*([^.]*?))?\.", // "Speaker One, Scrum Master." or "Speaker 2, back end developer."
            @"(?:^|\.\s*)Speaker\s+(\d+)(?:\s*,?\s*([^.]*?))?\.", // "Speaker 1," or "Speaker 2,"
        };
        
        foreach (var segment in segments)
        {
            var segmentText = segment.Text;
            var foundSpeaker = false;
            
            // Check for speaker patterns in the segment text
            foreach (var pattern in speakerPatterns)
            {
                var matches = System.Text.RegularExpressions.Regex.Matches(segmentText, pattern, 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                
                foreach (System.Text.RegularExpressions.Match match in matches)
                {
                    var speakerIdentifier = match.Groups[1].Value;
                    var speakerRole = match.Groups.Count > 2 ? match.Groups[2].Value : "";
                    
                    // Convert number words to numbers
                    var speakerNumber = speakerIdentifier.ToLower() switch
                    {
                        "one" or "1" => "1",
                        "two" or "2" => "2", 
                        "three" or "3" => "3",
                        "four" or "4" => "4",
                        "five" or "5" => "5",
                        _ => speakerIdentifier
                    };
                    
                    // Create speaker name with role if available
                    if (!string.IsNullOrWhiteSpace(speakerRole))
                    {
                        currentSpeaker = $"Speaker {speakerNumber} ({speakerRole.Trim()})";
                    }
                    else
                    {
                        currentSpeaker = $"Speaker {speakerNumber}";
                    }
                    
                    foundSpeaker = true;
                    _logger.LogDebug("Found speaker transition: {SpeakerName} at {StartTime}s", currentSpeaker, segment.Start);
                    break;
                }
                
                if (foundSpeaker) break;
            }
            
            // Create updated segment with current speaker
            var updatedSegment = new SpeakerSegment
            {
                Speaker = currentSpeaker,
                Text = segment.Text,
                Start = segment.Start,
                End = segment.End,
                Confidence = segment.Confidence
            };
            
            updatedSegments.Add(updatedSegment);
        }
        
        var uniqueSpeakers = updatedSegments.Select(s => s.Speaker).Distinct().Count();
        _logger.LogInformation("Text-based speaker detection completed. Found {SpeakerCount} unique speakers", uniqueSpeakers);
        
        return updatedSegments;
    }
}
