namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of enhanced audio file processing and validation
/// Implements S4.3: Enhanced File Processing (REQ-FPO-1 to REQ-FPO-6)
/// </summary>
public class FileProcessingResult
{
    /// <summary>
    /// Whether the file processing was successful
    /// </summary>
    public bool IsValid { get; }

    /// <summary>
    /// Primary processing message
    /// </summary>
    public string Message { get; }

    /// <summary>
    /// Detailed validation results
    /// </summary>
    public FileValidationDetails ValidationDetails { get; }

    /// <summary>
    /// Processing performance metrics
    /// </summary>
    public ProcessingMetrics Metrics { get; }

    /// <summary>
    /// Collection of error messages if processing failed
    /// </summary>
    public IReadOnlyList<string> Errors { get; }

    /// <summary>
    /// Collection of warning messages
    /// </summary>
    public IReadOnlyList<string> Warnings { get; }

    public FileProcessingResult(
        bool isValid,
        string message,
        FileValidationDetails validationDetails,
        ProcessingMetrics metrics,
        IReadOnlyList<string>? errors = null,
        IReadOnlyList<string>? warnings = null)
    {
        IsValid = isValid;
        Message = message;
        ValidationDetails = validationDetails;
        Metrics = metrics;
        Errors = errors ?? new List<string>();
        Warnings = warnings ?? new List<string>();
    }

    /// <summary>
    /// Create a successful processing result
    /// </summary>
    public static FileProcessingResult Success(
        string message, 
        FileValidationDetails validationDetails, 
        ProcessingMetrics metrics,
        IReadOnlyList<string>? warnings = null)
    {
        return new FileProcessingResult(true, message, validationDetails, metrics, null, warnings);
    }

    /// <summary>
    /// Create a failed processing result
    /// </summary>
    public static FileProcessingResult Failure(
        string message, 
        IReadOnlyList<string> errors, 
        FileValidationDetails? validationDetails = null,
        ProcessingMetrics? metrics = null,
        IReadOnlyList<string>? warnings = null)
    {
        return new FileProcessingResult(
            false, 
            message, 
            validationDetails ?? FileValidationDetails.Empty, 
            metrics ?? ProcessingMetrics.Empty, 
            errors, 
            warnings);
    }
}

/// <summary>
/// Detailed audio file validation information
/// </summary>
public class FileValidationDetails
{
    /// <summary>
    /// Original file information
    /// </summary>
    public FileInfo FileInfo { get; }

    /// <summary>
    /// Audio content analysis results
    /// </summary>
    public AudioContentAnalysis ContentAnalysis { get; }

    /// <summary>
    /// Security validation results
    /// </summary>
    public SecurityValidation Security { get; }

    /// <summary>
    /// File format compatibility
    /// </summary>
    public FormatCompatibility Compatibility { get; }

    public FileValidationDetails(
        FileInfo fileInfo,
        AudioContentAnalysis contentAnalysis,
        SecurityValidation security,
        FormatCompatibility compatibility)
    {
        FileInfo = fileInfo;
        ContentAnalysis = contentAnalysis;
        Security = security;
        Compatibility = compatibility;
    }

    /// <summary>
    /// Empty validation details for failed cases
    /// </summary>
    public static FileValidationDetails Empty => new(
        Models.FileInfo.Empty,
        AudioContentAnalysis.Empty,
        SecurityValidation.Empty,
        FormatCompatibility.Empty);
}

/// <summary>
/// Basic file information
/// </summary>
public class FileInfo
{
    public string FileName { get; }
    public long SizeBytes { get; }
    public string Extension { get; }
    public string MimeType { get; }
    public DateTime ProcessedAt { get; }

    public FileInfo(string fileName, long sizeBytes, string extension, string mimeType)
    {
        FileName = fileName;
        SizeBytes = sizeBytes;
        Extension = extension;
        MimeType = mimeType;
        ProcessedAt = DateTime.UtcNow;
    }

    public static FileInfo Empty => new("", 0, "", "");
}

/// <summary>
/// Audio content analysis results (REQ-FPO-1)
/// </summary>
public class AudioContentAnalysis
{
    /// <summary>
    /// Whether the file has valid audio headers
    /// </summary>
    public bool HasValidHeaders { get; }

    /// <summary>
    /// Detected audio format from content analysis
    /// </summary>
    public string DetectedFormat { get; }

    /// <summary>
    /// Audio codec information
    /// </summary>
    public string? CodecInfo { get; }

    /// <summary>
    /// Estimated duration from file analysis
    /// </summary>
    public TimeSpan? EstimatedDuration { get; }

    /// <summary>
    /// Sample rate if detectable
    /// </summary>
    public int? SampleRate { get; }

    /// <summary>
    /// Whether the audio stream appears corrupted
    /// </summary>
    public bool IsCorrupted { get; }

    /// <summary>
    /// Corruption details if found
    /// </summary>
    public string? CorruptionDetails { get; }

    public AudioContentAnalysis(
        bool hasValidHeaders,
        string detectedFormat,
        string? codecInfo = null,
        TimeSpan? estimatedDuration = null,
        int? sampleRate = null,
        bool isCorrupted = false,
        string? corruptionDetails = null)
    {
        HasValidHeaders = hasValidHeaders;
        DetectedFormat = detectedFormat;
        CodecInfo = codecInfo;
        EstimatedDuration = estimatedDuration;
        SampleRate = sampleRate;
        IsCorrupted = isCorrupted;
        CorruptionDetails = corruptionDetails;
    }

    public static AudioContentAnalysis Empty => new(false, "Unknown");
}

/// <summary>
/// Security validation results
/// </summary>
public class SecurityValidation
{
    /// <summary>
    /// Whether the file passes security checks
    /// </summary>
    public bool IsSecure { get; }

    /// <summary>
    /// Security threats detected (if any)
    /// </summary>
    public IReadOnlyList<string> ThreatIndicators { get; }

    /// <summary>
    /// File entropy analysis (helps detect encrypted/compressed malware)
    /// </summary>
    public double? FileEntropy { get; }

    public SecurityValidation(bool isSecure, IReadOnlyList<string>? threatIndicators = null, double? fileEntropy = null)
    {
        IsSecure = isSecure;
        ThreatIndicators = threatIndicators ?? new List<string>();
        FileEntropy = fileEntropy;
    }

    public static SecurityValidation Empty => new(false);
}

/// <summary>
/// Format compatibility information
/// </summary>
public class FormatCompatibility
{
    /// <summary>
    /// Whether the format is supported by Azure Speech Services
    /// </summary>
    public bool AzureCompatible { get; }

    /// <summary>
    /// Recommended format for optimal processing
    /// </summary>
    public string? RecommendedFormat { get; }

    /// <summary>
    /// Conversion suggestions if needed
    /// </summary>
    public IReadOnlyList<string> ConversionSuggestions { get; }

    public FormatCompatibility(
        bool azureCompatible, 
        string? recommendedFormat = null, 
        IReadOnlyList<string>? conversionSuggestions = null)
    {
        AzureCompatible = azureCompatible;
        RecommendedFormat = recommendedFormat;
        ConversionSuggestions = conversionSuggestions ?? new List<string>();
    }

    public static FormatCompatibility Empty => new(false);
}

/// <summary>
/// Processing performance metrics (REQ-FPO-4)
/// </summary>
public class ProcessingMetrics
{
    /// <summary>
    /// Total processing time
    /// </summary>
    public TimeSpan TotalProcessingTime { get; }

    /// <summary>
    /// Content validation time
    /// </summary>
    public TimeSpan ContentValidationTime { get; }

    /// <summary>
    /// Security validation time
    /// </summary>
    public TimeSpan SecurityValidationTime { get; }

    /// <summary>
    /// Peak memory usage during processing
    /// </summary>
    public long PeakMemoryUsageBytes { get; }

    /// <summary>
    /// Number of chunks processed (for streaming)
    /// </summary>
    public int ChunksProcessed { get; }

    /// <summary>
    /// Processing throughput (bytes per second)
    /// </summary>
    public double ThroughputBytesPerSecond { get; }

    public ProcessingMetrics(
        TimeSpan totalProcessingTime,
        TimeSpan contentValidationTime,
        TimeSpan securityValidationTime,
        long peakMemoryUsageBytes,
        int chunksProcessed,
        double throughputBytesPerSecond)
    {
        TotalProcessingTime = totalProcessingTime;
        ContentValidationTime = contentValidationTime;
        SecurityValidationTime = securityValidationTime;
        PeakMemoryUsageBytes = peakMemoryUsageBytes;
        ChunksProcessed = chunksProcessed;
        ThroughputBytesPerSecond = throughputBytesPerSecond;
    }

    public static ProcessingMetrics Empty => new(
        TimeSpan.Zero, TimeSpan.Zero, TimeSpan.Zero, 0, 0, 0);
}

/// <summary>
/// Progress tracking for long-running operations (REQ-FPO-4)
/// </summary>
public class ProcessingProgress
{
    /// <summary>
    /// Current processing stage
    /// </summary>
    public ProcessingStage Stage { get; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public double ProgressPercentage { get; }

    /// <summary>
    /// Current operation description
    /// </summary>
    public string CurrentOperation { get; }

    /// <summary>
    /// Estimated time remaining
    /// </summary>
    public TimeSpan? EstimatedTimeRemaining { get; }

    /// <summary>
    /// Bytes processed so far
    /// </summary>
    public long BytesProcessed { get; }

    /// <summary>
    /// Total bytes to process
    /// </summary>
    public long TotalBytes { get; }

    public ProcessingProgress(
        ProcessingStage stage,
        double progressPercentage,
        string currentOperation,
        long bytesProcessed,
        long totalBytes,
        TimeSpan? estimatedTimeRemaining = null)
    {
        Stage = stage;
        ProgressPercentage = Math.Max(0, Math.Min(100, progressPercentage));
        CurrentOperation = currentOperation;
        BytesProcessed = bytesProcessed;
        TotalBytes = totalBytes;
        EstimatedTimeRemaining = estimatedTimeRemaining;
    }
}

/// <summary>
/// Processing stages for progress tracking
/// </summary>
public enum ProcessingStage
{
    /// <summary>
    /// Initial file validation
    /// </summary>
    InitialValidation,

    /// <summary>
    /// Content analysis in progress
    /// </summary>
    ContentAnalysis,

    /// <summary>
    /// Security validation
    /// </summary>
    SecurityValidation,

    /// <summary>
    /// Upload to Azure Blob Storage
    /// </summary>
    BlobStorageUpload,

    /// <summary>
    /// Final processing
    /// </summary>
    Finalizing,

    /// <summary>
    /// Processing completed
    /// </summary>
    Completed,

    /// <summary>
    /// Processing failed
    /// </summary>
    Failed
}

/// <summary>
/// Types of processing operations for time estimation
/// </summary>
public enum ProcessingOperationType
{
    Validation,
    ContentAnalysis,
    SecurityValidation,
    CompleteProcessing,
    LargeFileStreaming
}
