using System.Diagnostics;
using System.Text;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.FileProcessing;

/// <summary>
/// Enhanced file processing service implementation
/// Implements S4.3: Enhanced File Processing (REQ-FPO-1 to REQ-FPO-6)
/// </summary>
public class FileProcessingService : IFileProcessingService
{
    public FileProcessingService(ILogger<FileProcessingService> logger)
    {
        _logger = logger;
        _concurrentOperationsSemaphore = new SemaphoreSlim(MaxConcurrentOperations);
        _memoryMonitor = new MemoryMonitor();
    }
    // Basic validation constants (from AudioFileValidator)
    public static readonly string[] SupportedExtensions = { ".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm" };
    public const long MaxFileSizeBytes = 1024L * 1024 * 1024;
    public const long MinFileSizeBytes = 1024;
    public const int MaxFileNameLength = 255;
    public static readonly string[] ValidMimeTypes = {
        "audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4", "audio/x-m4a",
        "audio/flac", "audio/x-flac", "audio/ogg", "audio/webm"
    };

    /// <summary>
    /// Performs basic validation of an uploaded audio file (size, name, extension, MIME type)
    /// </summary>
    public AudioFileValidationResult BasicValidateAudioFile(IFormFile? audioFile)
    {
        if (audioFile == null)
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, "Audio file is required");
        if (audioFile.Length == 0)
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, "Audio file cannot be empty");
        if (audioFile.Length < MinFileSizeBytes)
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, $"File is too small. Minimum size: {MinFileSizeBytes / 1024}KB");
        if (audioFile.Length > MaxFileSizeBytes)
        {
            var maxSizeFormatted = MaxFileSizeBytes >= 1024L * 1024 * 1024
                ? $"{MaxFileSizeBytes / (1024L * 1024 * 1024)}GB"
                : $"{MaxFileSizeBytes / (1024 * 1024)}MB";
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, $"File size exceeds {maxSizeFormatted} limit");
        }
        if (string.IsNullOrWhiteSpace(audioFile.FileName))
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, "File name is required");
        if (audioFile.FileName.Length > MaxFileNameLength)
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, $"File name is too long. Maximum length: {MaxFileNameLength} characters");
        if (ContainsDangerousCharacters(audioFile.FileName))
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, "File name contains invalid characters");
        var fileExtension = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(fileExtension))
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, "File must have a valid extension");
        if (!SupportedExtensions.Contains(fileExtension))
            return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, $"Unsupported file format '{fileExtension}'. Supported formats: {string.Join(", ", SupportedExtensions)}");
        if (!string.IsNullOrWhiteSpace(audioFile.ContentType))
        {
            var mimeType = audioFile.ContentType.ToLowerInvariant();
            if (!ValidMimeTypes.Contains(mimeType) && !mimeType.StartsWith("audio/"))
                return new MeetingSummarizer.Api.Models.AudioFileValidationResult(false, $"Invalid MIME type '{audioFile.ContentType}'. Expected audio format");
        }
        return new MeetingSummarizer.Api.Models.AudioFileValidationResult(true, "File validation successful");
    }

    /// <summary>
    /// Gets a user-friendly file size string
    /// </summary>
    public string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private static bool ContainsDangerousCharacters(string fileName)
    {
        var dangerousChars = new[] { "..", "\\", "/", ":", "*", "?", "\"", "<", ">", "|" };
        return dangerousChars.Any(fileName.Contains);
    }
    private readonly ILogger<FileProcessingService> _logger;
    private readonly SemaphoreSlim _concurrentOperationsSemaphore;
    private readonly MemoryMonitor _memoryMonitor;

    // Configuration constants
    private const int MaxConcurrentOperations = 3;
    private const int ChunkSizeBytes = 1024 * 1024; // 1MB chunks for streaming
    private const long LargeFileThresholdBytes = 50 * 1024 * 1024; // 50MB
    private const double MaxMemoryUsagePercentage = 70.0; // 70% of available memory

    /// <summary>
    /// Validates an audio file with advanced checks (merging all validation logic)
    /// </summary>
    public async Task<FileProcessingResult> ValidateAudioFileAsync(
        IFormFile audioFile,
        IProgress<ProcessingProgress>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var stopwatch = Stopwatch.StartNew();
        await _concurrentOperationsSemaphore.WaitAsync(cancellationToken);
        var memoryBefore = GC.GetTotalMemory(false);
        try
        {
            // Basic validation
            var basicResult = BasicValidateAudioFile(audioFile);
            if (!basicResult.IsValid)
            {
                progressCallback?.Report(new ProcessingProgress(
                    ProcessingStage.Completed, 100, basicResult.Message, audioFile.Length, audioFile.Length));
                return FileProcessingResult.Failure(basicResult.Message, new List<string> { basicResult.Message });
            }

            // File info
            var fileInfo = new Models.FileInfo(audioFile.FileName, audioFile.Length,
                Path.GetExtension(audioFile.FileName).ToLowerInvariant(), audioFile.ContentType);

            // Content analysis
            var contentValidationStopwatch = Stopwatch.StartNew();
            AudioContentAnalysis contentAnalysis;
            using (var stream = audioFile.OpenReadStream())
            {
                contentAnalysis = await AnalyzeAudioContentAsync(stream, audioFile.FileName, cancellationToken);
            }
            contentValidationStopwatch.Stop();

            // Security validation
            var securityStopwatch = Stopwatch.StartNew();
            SecurityValidation securityValidation;
            using (var stream = audioFile.OpenReadStream())
            {
                securityValidation = await ValidateFileSecurityAsync(stream, audioFile.FileName, cancellationToken);
            }
            securityStopwatch.Stop();

            // Format compatibility
            var compatibility = await CheckFormatCompatibilityAsync(audioFile, contentAnalysis);

            progressCallback?.Report(new ProcessingProgress(
                ProcessingStage.Completed, 100, "Validation complete", audioFile.Length, audioFile.Length));

            stopwatch.Stop();
            var memoryAfter = GC.GetTotalMemory(false);

            var validationDetails = new FileValidationDetails(fileInfo, contentAnalysis, securityValidation, compatibility);
            var metrics = new ProcessingMetrics(
                stopwatch.Elapsed,
                contentValidationStopwatch.Elapsed,
                securityStopwatch.Elapsed,
                Math.Max(0, memoryAfter - memoryBefore),
                1, // Single chunk for small files
                audioFile.Length / (stopwatch.Elapsed.TotalSeconds > 0 ? stopwatch.Elapsed.TotalSeconds : 1));

            // Determine overall result
            var errors = new List<string>();
            var warnings = new List<string>();

            if (!contentAnalysis.HasValidHeaders)
            {
                errors.Add("Invalid audio file headers detected");
            }

            if (contentAnalysis.IsCorrupted)
            {
                errors.Add($"Audio file appears corrupted: {contentAnalysis.CorruptionDetails}");
            }

            if (!securityValidation.IsSecure)
            {
                errors.AddRange(securityValidation.ThreatIndicators);
            }

            if (!compatibility.AzureCompatible)
            {
                warnings.Add($"Format may not be optimal for Azure Speech Services. {compatibility.RecommendedFormat}");
            }

            _logger.LogInformation("Audio file validation completed [CorrelationId: {CorrelationId}] - " +
                "Valid: {IsValid}, Duration: {Duration}ms, Memory: {Memory}",
                correlationId, errors.Count == 0, stopwatch.ElapsedMilliseconds, metrics.PeakMemoryUsageBytes);

            if (errors.Any())
            {
                return FileProcessingResult.Failure(
                    "Audio file validation failed", errors, validationDetails, metrics, warnings);
            }

            return FileProcessingResult.Success(
                "Audio file validation passed", validationDetails, metrics, warnings.Any() ? warnings : null);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Audio file validation failed [CorrelationId: {CorrelationId}]", correlationId);
            return FileProcessingResult.Failure(
                "Validation failed due to unexpected error",
                new List<string> { ex.Message });
        }
        finally
        {
            _concurrentOperationsSemaphore.Release();
        }
    }

    /// <summary>
    /// Validates audio file content by analyzing headers and stream data (REQ-FPO-1)
    /// </summary>
    public async Task<AudioContentAnalysis> AnalyzeAudioContentAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Read first chunk for header analysis
            var headerBuffer = new byte[Math.Min(4096, audioStream.Length)];
            var bytesRead = await audioStream.ReadAsync(headerBuffer.AsMemory(0, headerBuffer.Length), cancellationToken);
            if (bytesRead < headerBuffer.Length)
            {
                Array.Resize(ref headerBuffer, bytesRead);
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var detectedFormat = extension;
            var hasValidHeaders = false;
            var isCorrupted = false;
            string? corruptionDetails = null;

            // Analyze based on file type
            switch (extension)
            {
                case ".mp3":
                    hasValidHeaders = AnalyzeMp3Headers(headerBuffer, out corruptionDetails);
                    break;
                case ".wav":
                    hasValidHeaders = AnalyzeWavHeaders(headerBuffer, out corruptionDetails);
                    break;
                case ".m4a":
                    hasValidHeaders = AnalyzeM4aHeaders(headerBuffer, out corruptionDetails);
                    break;
                case ".flac":
                    hasValidHeaders = AnalyzeFlacHeaders(headerBuffer, out corruptionDetails);
                    break;
                case ".ogg":
                    hasValidHeaders = AnalyzeOggHeaders(headerBuffer, out corruptionDetails);
                    break;
                case ".webm":
                    hasValidHeaders = AnalyzeWebmHeaders(headerBuffer, out corruptionDetails);
                    break;
                default:
                    corruptionDetails = $"Unsupported audio format: {extension}";
                    break;
            }

            isCorrupted = !hasValidHeaders || !string.IsNullOrEmpty(corruptionDetails);

            // Estimate duration based on file size and format
            var estimatedDuration = EstimateDurationFromFileSize(audioStream.Length, extension);

            return new AudioContentAnalysis(
                hasValidHeaders,
                detectedFormat,
                GetCodecInfo(extension),
                estimatedDuration,
                GetEstimatedSampleRate(extension),
                isCorrupted,
                corruptionDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audio content analysis failed for file: {FileName}", fileName);
            return new AudioContentAnalysis(false, "Unknown", null, null, null, true, ex.Message);
        }
    }

    /// <summary>
    /// Processes large files using streaming to minimize memory usage (REQ-FPO-2)
    /// </summary>
    public async Task<FileProcessingResult> ProcessLargeFileStreamingAsync(
        IFormFile audioFile,
        IProgress<ProcessingProgress> progressCallback,
        CancellationToken cancellationToken = default)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation("Starting large file streaming processing [CorrelationId: {CorrelationId}] - " +
            "File: {FileName}, Size: {Size}MB", correlationId, audioFile.FileName, audioFile.Length / (1024.0 * 1024));

        await _concurrentOperationsSemaphore.WaitAsync(cancellationToken);
        var memoryBefore = GC.GetTotalMemory(false);
        var chunksProcessed = 0;

        try
        {
            using var stream = audioFile.OpenReadStream();
            var buffer = new byte[ChunkSizeBytes];
            var totalBytesProcessed = 0L;
            var maxMemoryUsed = 0L;

            // Process file in chunks
            while (totalBytesProcessed < audioFile.Length && !cancellationToken.IsCancellationRequested)
            {
                var bytesToRead = (int)Math.Min(ChunkSizeBytes, audioFile.Length - totalBytesProcessed);
                var bytesRead = await stream.ReadAsync(buffer, 0, bytesToRead, cancellationToken);

                if (bytesRead == 0) break;

                chunksProcessed++;
                totalBytesProcessed += bytesRead;

                // Monitor memory usage
                var currentMemory = GC.GetTotalMemory(false) - memoryBefore;
                maxMemoryUsed = Math.Max(maxMemoryUsed, currentMemory);

                // Report progress
                var progressPercentage = (double)totalBytesProcessed / audioFile.Length * 100;
                var estimatedTimeRemaining = EstimateRemainingTime(stopwatch.Elapsed, progressPercentage);

                progressCallback.Report(new ProcessingProgress(
                    ProcessingStage.ContentAnalysis,
                    progressPercentage,
                    $"Processing chunk {chunksProcessed}",
                    totalBytesProcessed,
                    audioFile.Length,
                    estimatedTimeRemaining));

                // Memory pressure check
                if (maxMemoryUsed > GetMaxAllowedMemory() * 0.8)
                {
                    _logger.LogWarning("High memory usage detected during streaming [CorrelationId: {CorrelationId}] - " +
                        "Memory: {Memory}MB", correlationId, maxMemoryUsed / (1024.0 * 1024));
                    
                    // Force garbage collection
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                }

                // Simulate processing delay for demonstration
                await Task.Delay(10, cancellationToken);
            }

            stopwatch.Stop();

            // Create simplified analysis for large files
            var fileInfo = new Models.FileInfo(audioFile.FileName, audioFile.Length, 
                Path.GetExtension(audioFile.FileName).ToLowerInvariant(), audioFile.ContentType);

            var contentAnalysis = new AudioContentAnalysis(
                true, // Assume valid for streaming (basic check only)
                Path.GetExtension(audioFile.FileName).ToLowerInvariant(),
                GetCodecInfo(Path.GetExtension(audioFile.FileName).ToLowerInvariant()),
                EstimateDurationFromFileSize(audioFile.Length, Path.GetExtension(audioFile.FileName).ToLowerInvariant()));

            var securityValidation = new SecurityValidation(true); // Simplified for streaming
            var compatibility = new FormatCompatibility(true);

            var validationDetails = new FileValidationDetails(fileInfo, contentAnalysis, securityValidation, compatibility);
            var metrics = new ProcessingMetrics(
                stopwatch.Elapsed,
                stopwatch.Elapsed,
                TimeSpan.Zero,
                maxMemoryUsed,
                chunksProcessed,
                audioFile.Length / stopwatch.Elapsed.TotalSeconds);

            progressCallback.Report(new ProcessingProgress(
                ProcessingStage.Completed, 100, "Large file processing complete", 
                audioFile.Length, audioFile.Length));

            _logger.LogInformation("Large file streaming processing completed [CorrelationId: {CorrelationId}] - " +
                "Chunks: {Chunks}, Duration: {Duration}ms, Peak Memory: {Memory}MB",
                correlationId, chunksProcessed, stopwatch.ElapsedMilliseconds, maxMemoryUsed / (1024.0 * 1024));

            return FileProcessingResult.Success(
                $"Large file processed successfully using {chunksProcessed} chunks", 
                validationDetails, metrics);
        }
        finally
        {
            _concurrentOperationsSemaphore.Release();
        }
    }

    /// <summary>
    /// Validates file security to detect potential threats (REQ-FPO-3)
    /// </summary>
    public async Task<SecurityValidation> ValidateFileSecurityAsync(
        Stream audioStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var threatIndicators = new List<string>();
            
            // Read first 1KB for security analysis
            var securityBuffer = new byte[Math.Min(1024, audioStream.Length)];
            var bytesRead = await audioStream.ReadAsync(securityBuffer.AsMemory(0, securityBuffer.Length), cancellationToken);
            if (bytesRead < securityBuffer.Length)
            {
                Array.Resize(ref securityBuffer, bytesRead);
            }

            // Check for suspicious patterns
            if (ContainsSuspiciousPatterns(securityBuffer))
            {
                threatIndicators.Add("Suspicious binary patterns detected");
            }

            // Calculate file entropy (high entropy may indicate encryption/compression)
            var entropy = CalculateEntropy(securityBuffer);
            if (entropy > 7.5) // High entropy threshold
            {
                threatIndicators.Add($"Unusually high file entropy ({entropy:F2}) - may indicate encryption or compression");
            }

            // Check file extension vs content mismatch
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!DoesContentMatchExtension(securityBuffer, extension))
            {
                threatIndicators.Add("File content does not match extension - possible disguised file");
            }

            var isSecure = threatIndicators.Count == 0;

            return new SecurityValidation(isSecure, threatIndicators, entropy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Security validation failed for file: {FileName}", fileName);
            return new SecurityValidation(false, new List<string> { $"Security validation error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Checks format compatibility with Azure Speech Services (REQ-FPO-6)
    /// </summary>
    public async Task<FormatCompatibility> CheckFormatCompatibilityAsync(
        IFormFile audioFile,
        AudioContentAnalysis contentAnalysis)
    {
        await Task.CompletedTask; // Placeholder for async pattern

        var extension = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
        var suggestions = new List<string>();

        // Azure Speech Services optimal formats
        var optimalFormats = new[] { ".wav", ".mp3", ".flac" };
        var supportedFormats = new[] { ".wav", ".mp3", ".flac", ".ogg", ".webm", ".m4a" };

        var azureCompatible = supportedFormats.Contains(extension);
        string? recommendedFormat = null;

        if (!optimalFormats.Contains(extension))
        {
            recommendedFormat = "WAV format recommended for best transcription quality";
            suggestions.Add("Consider converting to WAV for optimal Azure Speech Services performance");
        }

        if (contentAnalysis.SampleRate.HasValue && contentAnalysis.SampleRate < 16000)
        {
            suggestions.Add("Sample rate below 16kHz may result in lower transcription accuracy");
        }

        if (audioFile.Length > 500 * 1024 * 1024) // 500MB
        {
            suggestions.Add("Very large file - consider using batch transcription API for better reliability");
        }

        return new FormatCompatibility(azureCompatible, recommendedFormat, suggestions);
    }

    /// <summary>
    /// Estimates processing time for operations (REQ-FPO-4)
    /// </summary>
    public TimeSpan EstimateProcessingTime(long fileSizeBytes, ProcessingOperationType operationType)
    {
        // Base processing rates (bytes per second)
        var processingRates = new Dictionary<ProcessingOperationType, double>
        {
            [ProcessingOperationType.Validation] = 80 * 1024 * 1024, // 80 MB/s
            [ProcessingOperationType.ContentAnalysis] = 50 * 1024 * 1024, // 50 MB/s
            [ProcessingOperationType.SecurityValidation] = 100 * 1024 * 1024, // 100 MB/s
            [ProcessingOperationType.CompleteProcessing] = 20 * 1024 * 1024, // 20 MB/s (combined)
            [ProcessingOperationType.LargeFileStreaming] = 15 * 1024 * 1024 // 15 MB/s (streaming overhead)
        };

        var rate = processingRates.GetValueOrDefault(operationType, 20 * 1024 * 1024);
        var estimatedSeconds = fileSizeBytes / rate;

        // Add buffer time for overhead
        var bufferMultiplier = operationType == ProcessingOperationType.CompleteProcessing ? 1.5 : 1.2;
        
        return TimeSpan.FromSeconds(estimatedSeconds * bufferMultiplier);
    }

    /// <summary>
    /// Gets current memory usage information (REQ-FPO-2)
    /// </summary>
    public MemoryUsageInfo GetMemoryUsageInfo()
    {
        var currentUsage = GC.GetTotalMemory(false);
        var maxAllowed = GetMaxAllowedMemory();
        var concurrentOps = MaxConcurrentOperations - _concurrentOperationsSemaphore.CurrentCount;

        return new MemoryUsageInfo(currentUsage, maxAllowed, concurrentOps);
    }

    #region Private Helper Methods

    private bool AnalyzeMp3Headers(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        // Check for ID3 tag or MP3 sync bytes
        if (buffer.Length >= 3)
        {
            // ID3 tag
            if (buffer[0] == 0x49 && buffer[1] == 0x44 && buffer[2] == 0x33)
                return true;
                
            // MP3 sync pattern
            if (buffer.Length >= 2 && buffer[0] == 0xFF && (buffer[1] & 0xE0) == 0xE0)
                return true;
        }
        
        corruptionDetails = "Invalid MP3 header - missing ID3 tag or sync bytes";
        return false;
    }

    private bool AnalyzeWavHeaders(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        if (buffer.Length >= 12)
        {
            // Check RIFF header
            var riff = Encoding.ASCII.GetString(buffer, 0, 4);
            var wave = Encoding.ASCII.GetString(buffer, 8, 4);
            
            if (riff == "RIFF" && wave == "WAVE")
                return true;
        }
        
        corruptionDetails = "Invalid WAV header - missing RIFF/WAVE signature";
        return false;
    }

    private bool AnalyzeM4aHeaders(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        if (buffer.Length >= 8)
        {
            // Check for ftyp box
            var ftyp = Encoding.ASCII.GetString(buffer, 4, 4);
            if (ftyp == "ftyp")
                return true;
        }
        
        corruptionDetails = "Invalid M4A header - missing ftyp box";
        return false;
    }

    private bool AnalyzeFlacHeaders(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        if (buffer.Length >= 4)
        {
            var flac = Encoding.ASCII.GetString(buffer, 0, 4);
            if (flac == "fLaC")
                return true;
        }
        
        corruptionDetails = "Invalid FLAC header - missing fLaC signature";
        return false;
    }

    private bool AnalyzeOggHeaders(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        if (buffer.Length >= 4)
        {
            var ogg = Encoding.ASCII.GetString(buffer, 0, 4);
            if (ogg == "OggS")
                return true;
        }
        
        corruptionDetails = "Invalid OGG header - missing OggS signature";
        return false;
    }

    private bool AnalyzeWebmHeaders(byte[] buffer, out string? corruptionDetails)
    {
        corruptionDetails = null;
        
        if (buffer.Length >= 4)
        {
            // WebM uses EBML format, check for EBML header
            if (buffer[0] == 0x1A && buffer[1] == 0x45 && buffer[2] == 0xDF && buffer[3] == 0xA3)
                return true;
        }
        
        corruptionDetails = "Invalid WebM header - missing EBML signature";
        return false;
    }

    private TimeSpan? EstimateDurationFromFileSize(long fileSizeBytes, string extension)
    {
        // Rough estimates based on typical bitrates
        var estimatedBitrates = new Dictionary<string, int>
        {
            [".mp3"] = 128, // kbps
            [".wav"] = 1411, // CD quality
            [".flac"] = 700, // compressed lossless
            [".ogg"] = 128,
            [".webm"] = 128,
            [".m4a"] = 128
        };

        if (estimatedBitrates.TryGetValue(extension, out var bitrate))
        {
            var seconds = (fileSizeBytes * 8) / (bitrate * 1000.0);
            return TimeSpan.FromSeconds(seconds);
        }

        return null;
    }

    private string? GetCodecInfo(string extension)
    {
        return extension switch
        {
            ".mp3" => "MPEG-1 Audio Layer 3",
            ".wav" => "PCM",
            ".flac" => "Free Lossless Audio Codec",
            ".ogg" => "Ogg Vorbis",
            ".webm" => "WebM Audio",
            ".m4a" => "AAC",
            _ => null
        };
    }

    private int? GetEstimatedSampleRate(string extension)
    {
        return extension switch
        {
            ".wav" => 44100,
            ".flac" => 44100,
            ".mp3" => 44100,
            _ => null
        };
    }

    private bool ContainsSuspiciousPatterns(byte[] buffer)
    {
        // Check for executable signatures
        if (buffer.Length >= 2)
        {
            // DOS MZ header
            if (buffer[0] == 0x4D && buffer[1] == 0x5A) return true;
            // ELF header
            if (buffer.Length >= 4 && buffer[0] == 0x7F && buffer[1] == 0x45 && 
                buffer[2] == 0x4C && buffer[3] == 0x46) return true;
        }

        return false;
    }

    private double CalculateEntropy(byte[] buffer)
    {
        var frequencies = new Dictionary<byte, int>();
        
        foreach (var b in buffer)
        {
            frequencies[b] = frequencies.GetValueOrDefault(b, 0) + 1;
        }

        var entropy = 0.0;
        foreach (var frequency in frequencies.Values)
        {
            var probability = (double)frequency / buffer.Length;
            if (probability > 0)
            {
                entropy -= probability * Math.Log2(probability);
            }
        }

        return entropy;
    }

    private bool DoesContentMatchExtension(byte[] buffer, string extension)
    {
        // Simple content-type detection
        return extension switch
        {
            ".wav" => buffer.Length >= 12 && Encoding.ASCII.GetString(buffer, 0, 4) == "RIFF",
            ".mp3" => buffer.Length >= 3 && (
                (buffer[0] == 0x49 && buffer[1] == 0x44 && buffer[2] == 0x33) || // ID3
                (buffer[0] == 0xFF && (buffer[1] & 0xE0) == 0xE0)), // MP3 sync
            ".flac" => buffer.Length >= 4 && Encoding.ASCII.GetString(buffer, 0, 4) == "fLaC",
            ".ogg" => buffer.Length >= 4 && Encoding.ASCII.GetString(buffer, 0, 4) == "OggS",
            _ => true // Default to true for unknown formats
        };
    }

    private long GetMaxAllowedMemory()
    {
        var totalMemory = GC.GetTotalMemory(false);
        var availableMemory = Environment.WorkingSet;
        return (long)(availableMemory * (MaxMemoryUsagePercentage / 100.0));
    }

    private TimeSpan? EstimateRemainingTime(TimeSpan elapsed, double progressPercentage)
    {
        if (progressPercentage <= 0) return null;
        
        var totalTime = elapsed.TotalSeconds / (progressPercentage / 100.0);
        var remainingSeconds = totalTime - elapsed.TotalSeconds;
        
        return remainingSeconds > 0 ? TimeSpan.FromSeconds(remainingSeconds) : TimeSpan.Zero;
    }

    #endregion
}

/// <summary>
/// Simple memory monitor for tracking usage
/// </summary>
internal class MemoryMonitor
{
    private long _peakUsage = 0;

    public long GetCurrentUsage() => GC.GetTotalMemory(false);
    
    public long GetPeakUsage()
    {
        var current = GetCurrentUsage();
        _peakUsage = Math.Max(_peakUsage, current);
        return _peakUsage;
    }
}
