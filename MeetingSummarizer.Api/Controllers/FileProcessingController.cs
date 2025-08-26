using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services;
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
    private readonly IFileProcessingService _fileProcessingService;

    public FileProcessingController(
        ILogger<FileProcessingController> logger,
        IFileProcessingService fileProcessingService)
    {
        _logger = logger;
        _fileProcessingService = fileProcessingService;
    }

    /// <summary>
    /// Perform comprehensive validation of an audio file (REQ-FPO-1, REQ-FPO-3)
    /// </summary>
    /// <param name="audioFile">The audio file to validate</param>
    /// <returns>Detailed validation results</returns>
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateAudioFile([FromForm] IFormFile audioFile)
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
            var result = await _fileProcessingService.ValidateAudioFileAsync(audioFile);

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
    /// Large file processing endpoint (STUBBED - REQ-FPO-2)
    /// Note: Azure Real-time transcription has limits (~45 min max, ~200MB)
    /// Large file processing would require batch transcription which is not implemented
    /// </summary>
    /// <param name="audioFile">The large audio file to process</param>
    /// <returns>Stubbed response explaining limitations</returns>
    [HttpPost("process-large")]
    public async Task<IActionResult> ProcessLargeFile([FromForm] IFormFile audioFile)
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

        // Real-time transcription limitations
        const long maxRealTimeFileSize = 200 * 1024 * 1024; // 200MB
        const double maxRealTimeDurationMinutes = 45; // ~45 minutes

        await Task.CompletedTask; // Placeholder for async pattern

        return BadRequest(new
        {
            Status = "NotSupported",
            Message = "Large file processing is not supported with Real-time transcription",
            CorrelationId = correlationId,
            Timestamp = DateTime.UtcNow,
            Limitations = new
            {
                MaxFileSizeMB = maxRealTimeFileSize / (1024 * 1024),
                MaxDurationMinutes = maxRealTimeDurationMinutes,
                CurrentFileSizeMB = Math.Round(audioFile.Length / (1024.0 * 1024), 2),
                Recommendation = "For files larger than 200MB or longer than 45 minutes, " +
                               "consider using audio editing software to split the file into smaller segments"
            },
            AlternativeEndpoints = new
            {
                Validation = "/api/FileProcessing/validate - For comprehensive file validation",
                Transcription = "/api/Summary/audio - For files under 200MB"
            }
        });
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
            var memoryInfo = _fileProcessingService.GetMemoryUsageInfo();

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
            var estimatedTime = _fileProcessingService.EstimateProcessingTime(fileSizeBytes, opType);

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
