using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.FileProcessing;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for enhanced file processing operations
/// Implements S4.3: Enhanced File Processing (REQ-FPO-1 to REQ-FPO-6)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FileProcessingController : ControllerBase
{
    private readonly ILogger<FileProcessingController> _logger;
    private readonly IFilePreProcessingService _filePreProcessingService;

    public FileProcessingController(
        ILogger<FileProcessingController> logger,
        IFilePreProcessingService filePreProcessingService)
    {
        _logger = logger;
        _filePreProcessingService = filePreProcessingService;
    }

    /// <summary>
    /// Perform comprehensive validation of an audio file (REQ-FPO-1, REQ-FPO-3)
    /// </summary>
    /// <param name="audioFile">The audio file to validate</param>
    /// <returns>Detailed validation results</returns>
    [HttpPost("validate")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ValidateAudioFile(IFormFile audioFile)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("Audio file validation requested [CorrelationId: {CorrelationId}] - File: {FileName}, Size: {Size}",
            correlationId, audioFile?.FileName, audioFile?.Length);

        if (audioFile == null || audioFile.Length == 0)
        {
            return BadRequest(new
            {
                Status = "Invalid",
                Message = "No audio file provided",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow
            });
        }

        try
        {
            var result = await _filePreProcessingService.ValidateAudioFileAsync(audioFile);

            var response = new
            {
                Status = result.IsValid ? "Valid" : "Invalid",
                Message = result.Message,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                ValidationDetails = new
                {
                    FileInfo = new
                    {
                        result.ValidationDetails.FileInfo.FileName,
                        FileSizeMB = Math.Round(result.ValidationDetails.FileInfo.SizeBytes / (1024.0 * 1024), 2),
                        result.ValidationDetails.FileInfo.Extension,
                        result.ValidationDetails.FileInfo.MimeType,
                        result.ValidationDetails.FileInfo.ProcessedAt
                    },
                    AudioContent = new
                    {
                        result.ValidationDetails.ContentAnalysis.HasValidHeaders,
                        result.ValidationDetails.ContentAnalysis.DetectedFormat,
                        result.ValidationDetails.ContentAnalysis.CodecInfo,
                        EstimatedDurationSeconds = result.ValidationDetails.ContentAnalysis.EstimatedDuration?.TotalSeconds,
                        result.ValidationDetails.ContentAnalysis.SampleRate,
                        result.ValidationDetails.ContentAnalysis.IsCorrupted,
                        result.ValidationDetails.ContentAnalysis.CorruptionDetails
                    },
                    Security = new
                    {
                        result.ValidationDetails.Security.IsSecure,
                        result.ValidationDetails.Security.ThreatIndicators,
                        result.ValidationDetails.Security.FileEntropy
                    },
                    Compatibility = new
                    {
                        result.ValidationDetails.Compatibility.AzureCompatible,
                        result.ValidationDetails.Compatibility.RecommendedFormat,
                        result.ValidationDetails.Compatibility.ConversionSuggestions
                    }
                },
                Performance = new
                {
                    TotalProcessingTimeMs = result.Metrics.TotalProcessingTime.TotalMilliseconds,
                    ContentValidationTimeMs = result.Metrics.ContentValidationTime.TotalMilliseconds,
                    SecurityValidationTimeMs = result.Metrics.SecurityValidationTime.TotalMilliseconds,
                    PeakMemoryUsageMB = Math.Round(result.Metrics.PeakMemoryUsageBytes / (1024.0 * 1024), 2),
                    result.Metrics.ChunksProcessed,
                    ThroughputMBps = Math.Round(result.Metrics.ThroughputBytesPerSecond / (1024.0 * 1024), 2)
                },
                result.Errors,
                result.Warnings
            };

            return result.IsValid ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audio file validation failed [CorrelationId: {CorrelationId}]", correlationId);

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Validation failed due to internal error",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Process a large audio file with streaming (REQ-FPO-2, REQ-FPO-4)
    /// </summary>
    /// <param name="audioFile">The large audio file to process</param>
    /// <returns>Processing results with progress information</returns>
    [HttpPost("process-large")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ProcessLargeFile(IFormFile audioFile)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("Large file processing requested [CorrelationId: {CorrelationId}] - File: {FileName}, Size: {Size}MB",
            correlationId, audioFile?.FileName, audioFile?.Length / (1024.0 * 1024));

        if (audioFile == null || audioFile.Length == 0)
        {
            return BadRequest(new
            {
                Status = "Invalid",
                Message = "No audio file provided",
                CorrelationId = correlationId
            });
        }

        if (audioFile.Length < 50 * 1024 * 1024) // 50MB threshold
        {
            return BadRequest(new
            {
                Status = "Invalid",
                Message = "File size below large file threshold (50MB). Use /validate endpoint instead.",
                CorrelationId = correlationId,
                FileSizeMB = Math.Round(audioFile.Length / (1024.0 * 1024), 2)
            });
        }

        try
        {
            var progressList = new List<ProcessingProgress>();
            var progress = new Progress<ProcessingProgress>(p => progressList.Add(p));

            var result = await _filePreProcessingService.ProcessLargeFileStreamingAsync(audioFile, progress);

            var response = new
            {
                Status = result.IsValid ? "Success" : "Failed",
                Message = result.Message,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                ProcessingDetails = new
                {
                    ChunksProcessed = result.Metrics.ChunksProcessed,
                    TotalProcessingTimeMs = result.Metrics.TotalProcessingTime.TotalMilliseconds,
                    PeakMemoryUsageMB = Math.Round(result.Metrics.PeakMemoryUsageBytes / (1024.0 * 1024), 2),
                    ThroughputMBps = Math.Round(result.Metrics.ThroughputBytesPerSecond / (1024.0 * 1024), 2),
                    FileSizeMB = Math.Round(audioFile.Length / (1024.0 * 1024), 2)
                },
                ProgressHistory = progressList.Select(p => new
                {
                    Stage = p.Stage.ToString(),
                    ProgressPercentage = Math.Round(p.ProgressPercentage, 1),
                    p.CurrentOperation,
                    BytesProcessedMB = Math.Round(p.BytesProcessed / (1024.0 * 1024), 2),
                    TotalBytesMB = Math.Round(p.TotalBytes / (1024.0 * 1024), 2),
                    EstimatedTimeRemainingSeconds = p.EstimatedTimeRemaining?.TotalSeconds
                }).ToList(),
                result.Errors,
                result.Warnings
            };

            return result.IsValid ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Large file processing failed [CorrelationId: {CorrelationId}]", correlationId);

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Processing failed due to internal error",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get memory usage information for the file processing service (REQ-FPO-2)
    /// </summary>
    /// <returns>Current memory usage statistics</returns>
    [HttpGet("memory-status")]
    public IActionResult GetMemoryStatus()
    {
        try
        {
            var memoryInfo = _filePreProcessingService.GetMemoryUsageInfo();

            var response = new
            {
                Status = "Active",
                Timestamp = DateTime.UtcNow,
                Memory = new
                {
                    CurrentUsageMB = Math.Round(memoryInfo.CurrentUsageBytes / (1024.0 * 1024), 2),
                    MaxAllowedMB = Math.Round(memoryInfo.MaxAllowedBytes / (1024.0 * 1024), 2),
                    AvailablePercentage = Math.Round(memoryInfo.AvailablePercentage, 1),
                    memoryInfo.ConcurrentOperations,
                    memoryInfo.ShouldQueue
                },
                Recommendations = GetMemoryRecommendations(memoryInfo)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get memory status");

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Failed to retrieve memory status",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Estimate processing time for different operations (REQ-FPO-4)
    /// </summary>
    /// <param name="fileSizeMB">File size in megabytes</param>
    /// <param name="operationType">Type of operation to estimate</param>
    /// <returns>Processing time estimates</returns>
    [HttpGet("estimate-time")]
    public IActionResult EstimateProcessingTime([FromQuery] double fileSizeMB, [FromQuery] string operationType = "CompleteProcessing")
    {
        try
        {
            if (!Enum.TryParse<Models.ProcessingOperationType>(operationType, out var opType))
            {
                return BadRequest(new
                {
                    Status = "Invalid",
                    Message = $"Invalid operation type. Valid values: {string.Join(", ", Enum.GetNames<Models.ProcessingOperationType>())}",
                    Timestamp = DateTime.UtcNow
                });
            }

            var fileSizeBytes = (long)(fileSizeMB * 1024 * 1024);
            var estimatedTime = _filePreProcessingService.EstimateProcessingTime(fileSizeBytes, opType);

            var response = new
            {
                Status = "Success",
                Timestamp = DateTime.UtcNow,
                Estimation = new
                {
                    FileSizeMB = fileSizeMB,
                    OperationType = opType.ToString(),
                    EstimatedTimeSeconds = Math.Round(estimatedTime.TotalSeconds, 1),
                    EstimatedTimeFormatted = $"{(int)estimatedTime.TotalMinutes:D2}:{estimatedTime.Seconds:D2}",
                    IsLargeFile = fileSizeBytes > 50 * 1024 * 1024,
                    RecommendedApproach = GetRecommendedApproach(fileSizeBytes)
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to estimate processing time");

            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Failed to estimate processing time",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    #region Private Helper Methods

    private List<string> GetMemoryRecommendations(MemoryUsageInfo memoryInfo)
    {
        var recommendations = new List<string>();

        if (memoryInfo.AvailablePercentage < 20)
        {
            recommendations.Add("Memory usage is high. Consider processing smaller files or reducing concurrent operations.");
        }

        if (memoryInfo.ConcurrentOperations >= 3)
        {
            recommendations.Add("Maximum concurrent operations reached. New operations will be queued.");
        }

        if (memoryInfo.ShouldQueue)
        {
            recommendations.Add("New large file operations should be queued to prevent memory pressure.");
        }

        if (recommendations.Count == 0)
        {
            recommendations.Add("Memory usage is optimal for file processing operations.");
        }

        return recommendations;
    }

    private string GetRecommendedApproach(long fileSizeBytes)
    {
        return fileSizeBytes switch
        {
            < 10 * 1024 * 1024 => "Standard validation recommended",
            < 50 * 1024 * 1024 => "Standard validation with progress monitoring",
            < 500 * 1024 * 1024 => "Large file streaming processing recommended",
            _ => "Large file streaming with batch transcription API recommended"
        };
    }

    #endregion
}
