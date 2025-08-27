using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.FileProcessing;

/// <summary>
/// Enhanced file processing service for audio files with content validation and streaming support
/// Implements S4.3: Enhanced File Processing (REQ-FPO-1 to REQ-FPO-6)
/// </summary>
public interface IFileProcessingService
{
    /// <summary>
    /// Performs comprehensive validation of an audio file including content analysis (REQ-FPO-1)
    /// </summary>
    /// <param name="audioFile">The uploaded audio file</param>
    /// <param name="progressCallback">Optional callback for progress updates (REQ-FPO-4)</param>
    /// <param name="cancellationToken">Cancellation token for long-running operations</param>
    /// <returns>Comprehensive file processing result</returns>
    Task<FileProcessingResult> ValidateAudioFileAsync(
        IFormFile audioFile,
        IProgress<ProcessingProgress>? progressCallback = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates audio file content by analyzing headers and stream data (REQ-FPO-1)
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Audio content analysis result</returns>
    Task<AudioContentAnalysis> AnalyzeAudioContentAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes large files using streaming to minimize memory usage (REQ-FPO-2)
    /// </summary>
    /// <param name="audioFile">Large audio file</param>
    /// <param name="progressCallback">Progress tracking callback (REQ-FPO-4)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processing result with memory usage metrics</returns>
    Task<FileProcessingResult> ProcessLargeFileStreamingAsync(
        IFormFile audioFile,
        IProgress<ProcessingProgress> progressCallback,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates file security to detect potential threats (REQ-FPO-3)
    /// </summary>
    /// <param name="audioStream">Audio file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Security validation result</returns>
    Task<SecurityValidation> ValidateFileSecurityAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks format compatibility with Azure Speech Services and provides recommendations (REQ-FPO-6)
    /// </summary>
    /// <param name="audioFile">Audio file to check</param>
    /// <param name="contentAnalysis">Previous content analysis result</param>
    /// <returns>Format compatibility information</returns>
    Task<FormatCompatibility> CheckFormatCompatibilityAsync(
        IFormFile audioFile,
        AudioContentAnalysis contentAnalysis);

    /// <summary>
    /// Estimates processing time for operations that may exceed normal timeouts (REQ-FPO-4)
    /// </summary>
    /// <param name="fileSizeBytes">File size in bytes</param>
    /// <param name="operationType">Type of operation to estimate</param>
    /// <returns>Estimated processing time</returns>
    TimeSpan EstimateProcessingTime(long fileSizeBytes, ProcessingOperationType operationType);

    /// <summary>
    /// Gets current memory usage and limits for concurrent operations (REQ-FPO-2)
    /// </summary>
    /// <returns>Memory usage information</returns>
    MemoryUsageInfo GetMemoryUsageInfo();
}

/// <summary>
/// Memory usage information for resource management (REQ-FPO-2)
/// </summary>
public class MemoryUsageInfo
{
    /// <summary>
    /// Current memory usage in bytes
    /// </summary>
    public long CurrentUsageBytes { get; }

    /// <summary>
    /// Maximum allowed memory usage
    /// </summary>
    public long MaxAllowedBytes { get; }

    /// <summary>
    /// Number of concurrent operations
    /// </summary>
    public int ConcurrentOperations { get; }

    /// <summary>
    /// Whether new large file operations should be queued
    /// </summary>
    public bool ShouldQueue { get; }

    /// <summary>
    /// Available memory percentage
    /// </summary>
    public double AvailablePercentage => Math.Max(0, 100.0 * (MaxAllowedBytes - CurrentUsageBytes) / MaxAllowedBytes);

    public MemoryUsageInfo(long currentUsageBytes, long maxAllowedBytes, int concurrentOperations)
    {
        CurrentUsageBytes = currentUsageBytes;
        MaxAllowedBytes = maxAllowedBytes;
        ConcurrentOperations = concurrentOperations;
        ShouldQueue = AvailablePercentage < 20; // Queue if less than 20% memory available
    }
}
