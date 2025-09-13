namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of file upload operation
/// </summary>
public class StorageUploadResult
{
    public string BlobUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public StorageTier StorageTier { get; set; }
    public DateTime UploadedAt { get; set; }
    public string ETag { get; set; } = string.Empty;
}

/// <summary>
/// Result of file download operation
/// </summary>
public class StorageDownloadResult
{
    public Stream Content { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long ContentLength { get; set; }
    public DateTime LastModified { get; set; }
    public string ETag { get; set; } = string.Empty;
}

/// <summary>
/// Information about a stored file
/// </summary>
public class StorageItemInfo
{
    public string BlobUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public StorageTier StorageTier { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastModified { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public string ETag { get; set; } = string.Empty;
}

/// <summary>
/// User storage usage statistics
/// </summary>
public class UserStorageStats
{
    public Guid UserId { get; set; }
    public long TotalFilesCount { get; set; }
    public long TotalSizeBytes { get; set; }
    
    // By storage tier
    public long HotTierSizeBytes { get; set; }
    public long CoolTierSizeBytes { get; set; }
    public long ArchiveTierSizeBytes { get; set; }
    
    // By content type
    public long AudioFilesSizeBytes { get; set; }
    public long MeetingArtifactsSizeBytes { get; set; }
    
    public DateTime LastUpdated { get; set; }
    
    // Calculated properties
    public decimal TotalSizeMB => Math.Round(TotalSizeBytes / 1024.0m / 1024.0m, 2);
    public decimal MonthlyEstimatedCostUSD => CalculateEstimatedCost();
    
    private decimal CalculateEstimatedCost()
    {
        // Azure Blob Storage pricing (approximate)
        // Hot tier: $0.018 per GB/month
        // Cool tier: $0.01 per GB/month  
        // Archive tier: $0.00099 per GB/month
        
        var hotGB = HotTierSizeBytes / 1024.0m / 1024.0m / 1024.0m;
        var coolGB = CoolTierSizeBytes / 1024.0m / 1024.0m / 1024.0m;
        var archiveGB = ArchiveTierSizeBytes / 1024.0m / 1024.0m / 1024.0m;
        
        return Math.Round(
            (hotGB * 0.018m) + 
            (coolGB * 0.01m) + 
            (archiveGB * 0.00099m), 4);
    }
}

/// <summary>
/// Result of transcript compression and storage operation
/// </summary>
public class TranscriptStorageResult
{
    /// <summary>
    /// Blob URL where compressed transcript is stored
    /// </summary>
    public string BlobUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// Original transcript size in bytes (before compression)
    /// </summary>
    public long OriginalSizeBytes { get; set; }
    
    /// <summary>
    /// Compressed size in bytes (after GZip compression)
    /// </summary>
    public long CompressedSizeBytes { get; set; }
    
    /// <summary>
    /// Compression ratio as percentage (compressed/original * 100)
    /// </summary>
    public double CompressionRatio { get; set; }
    
    /// <summary>
    /// When the transcript was stored
    /// </summary>
    public DateTime StoredAt { get; set; }
    
    /// <summary>
    /// ETag for optimistic concurrency control
    /// </summary>
    public string ETag { get; set; } = string.Empty;
    
    /// <summary>
    /// Storage tier used for the transcript blob
    /// </summary>
    public StorageTier StorageTier { get; set; } = StorageTier.Hot;
}

/// <summary>
/// Storage tier options for cost optimization
/// </summary>
public enum StorageTier
{
    /// <summary>
    /// Hot tier for frequently accessed data (0-30 days)
    /// Higher storage cost, lower access cost
    /// </summary>
    Hot,
    
    /// <summary>
    /// Cool tier for infrequently accessed data (30-180 days)
    /// Lower storage cost, higher access cost
    /// </summary>
    Cool,
    
    /// <summary>
    /// Archive tier for rarely accessed data (180+ days)
    /// Lowest storage cost, highest access cost
    /// </summary>
    Archive
}
