using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Linq;
using System.Text;

namespace MeetingSummarizer.Api.Services.Storage;

/// <summary>
/// Azure Blob Storage implementation with per-user isolation
/// </summary>
public class UserStorageService : IUserStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly IAzureConfigurationService _configService;
    private readonly ILogger<UserStorageService> _logger;
    private readonly AzureStorageOptions _storageOptions;

    // Container naming pattern: user-{userId} (lowercase, Azure requirement)
    private const string UserContainerPrefix = "user-";
    private const string AudioFolderName = "audio";
    private const string MeetingsFolderName = "meetings";
    private const int MaxFileNameLength = 100;

    public UserStorageService(
        BlobServiceClient blobServiceClient,
        IAzureConfigurationService configService,
        ILogger<UserStorageService> logger,
        IOptions<AzureStorageOptions> storageOptions)
    {
        _blobServiceClient = blobServiceClient;
        _configService = configService;
        _logger = logger;
        _storageOptions = storageOptions.Value;
    }

    public async Task<StorageUploadResult> UploadAudioFileAsync(Guid userId, string fileName, Stream fileStream, string contentType)
    {
        try
        {
            var containerClient = await GetUserContainerAsync(userId);
            var sanitizedFileName = SanitizeFileName(fileName);
            var blobName = $"{AudioFolderName}/{DateTime.UtcNow:yyyy/MM/dd}/{sanitizedFileName}";
            
            var blobClient = containerClient.GetBlobClient(blobName);
            
            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "private, max-age=86400" // 24 hours
                },
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = userId.ToString(),
                    ["originalFileName"] = fileName,
                    ["uploadedAt"] = DateTime.UtcNow.ToString("O"),
                    ["contentCategory"] = "audio"
                },
                AccessTier = AccessTier.Hot // Start in hot tier for new uploads
            };

            // Upload with progress tracking
            var response = await blobClient.UploadAsync(fileStream, uploadOptions);
            
            _logger.LogInformation("Uploaded audio file for user {UserId}: {FileName} ({Size} bytes)", 
                userId, fileName, fileStream.Length);

            // Generate SAS token for Azure Speech Services access (24 hour expiry)
            var sasUrl = await GenerateSecureAccessUrlAsync(userId, blobClient.Uri.ToString(), 24);

            return new StorageUploadResult
            {
                BlobUrl = sasUrl, // Use SAS URL instead of direct URL
                FileName = sanitizedFileName,
                FileSizeBytes = fileStream.Length,
                ContentType = contentType,
                StorageTier = StorageTier.Hot,
                UploadedAt = DateTime.UtcNow,
                ETag = response.Value.ETag.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload audio file for user {UserId}: {FileName}", userId, fileName);
            throw;
        }
    }

    public async Task<StorageUploadResult> UploadMeetingArtifactAsync(Guid userId, Guid meetingId, string artifactType, string content)
    {
        try
        {
            var containerClient = await GetUserContainerAsync(userId);
            var fileName = $"{artifactType}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.txt";
            var blobName = $"{MeetingsFolderName}/{meetingId}/{fileName}";
            
            var blobClient = containerClient.GetBlobClient(blobName);
            var contentBytes = Encoding.UTF8.GetBytes(content);
            
            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = "text/plain; charset=utf-8",
                    CacheControl = "private, max-age=2592000" // 30 days
                },
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = userId.ToString(),
                    ["meetingId"] = meetingId.ToString(),
                    ["artifactType"] = artifactType,
                    ["uploadedAt"] = DateTime.UtcNow.ToString("O"),
                    ["contentCategory"] = "meeting-artifact"
                },
                AccessTier = AccessTier.Hot
            };

            using var contentStream = new MemoryStream(contentBytes);
            var response = await blobClient.UploadAsync(contentStream, uploadOptions);
            
            _logger.LogInformation("Uploaded meeting artifact for user {UserId}, meeting {MeetingId}: {ArtifactType}", 
                userId, meetingId, artifactType);

            return new StorageUploadResult
            {
                BlobUrl = blobClient.Uri.ToString(),
                FileName = fileName,
                FileSizeBytes = contentBytes.Length,
                ContentType = "text/plain; charset=utf-8",
                StorageTier = StorageTier.Hot,
                UploadedAt = DateTime.UtcNow,
                ETag = response.Value.ETag.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload meeting artifact for user {UserId}, meeting {MeetingId}: {ArtifactType}", 
                userId, meetingId, artifactType);
            throw;
        }
    }

    public async Task<StorageDownloadResult> GetAudioFileAsync(Guid userId, string blobUrl)
    {
        try
        {
            var blobClient = await GetBlobClientFromUrlAsync(userId, blobUrl);
            var response = await blobClient.DownloadStreamingAsync();
            
            return new StorageDownloadResult
            {
                Content = response.Value.Content,
                FileName = ExtractFileNameFromUrl(blobUrl),
                ContentType = response.Value.Details.ContentType,
                ContentLength = response.Value.Details.ContentLength,
                LastModified = response.Value.Details.LastModified.DateTime,
                ETag = response.Value.Details.ETag.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download audio file for user {UserId}: {BlobUrl}", userId, blobUrl);
            throw;
        }
    }

    public async Task<StorageDownloadResult> GetMeetingArtifactAsync(Guid userId, Guid meetingId, string artifactType)
    {
        try
        {
            var containerClient = await GetUserContainerAsync(userId);
            var blobPrefix = $"{MeetingsFolderName}/{meetingId}/{artifactType}";
            
            // Find the most recent artifact of this type
            var blobItems = new List<BlobItem>();
            await foreach (var blob in containerClient.GetBlobsAsync(prefix: blobPrefix))
            {
                blobItems.Add(blob);
            }
            
            var latestBlob = blobItems
                .OrderByDescending(b => b.Properties.LastModified)
                .FirstOrDefault();
            
            if (latestBlob == null)
            {
                throw new FileNotFoundException($"No {artifactType} artifact found for meeting {meetingId}");
            }
            
            var blobClient = containerClient.GetBlobClient(latestBlob.Name);
            var response = await blobClient.DownloadStreamingAsync();
            
            return new StorageDownloadResult
            {
                Content = response.Value.Content,
                FileName = Path.GetFileName(latestBlob.Name),
                ContentType = response.Value.Details.ContentType,
                ContentLength = response.Value.Details.ContentLength,
                LastModified = response.Value.Details.LastModified.DateTime,
                ETag = response.Value.Details.ETag.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download meeting artifact for user {UserId}, meeting {MeetingId}: {ArtifactType}", 
                userId, meetingId, artifactType);
            throw;
        }
    }

    public async Task<IEnumerable<StorageItemInfo>> ListUserFilesAsync(Guid userId, string? prefix = null, int maxResults = 100)
    {
        try
        {
            var containerClient = await GetUserContainerAsync(userId);
            var blobs = new List<StorageItemInfo>();
            
            var blobPages = containerClient.GetBlobsAsync(prefix: prefix).AsPages(pageSizeHint: maxResults);
            
            await foreach (var page in blobPages)
            {
                foreach (var blob in page.Values)
                {
                    blobs.Add(new StorageItemInfo
                    {
                        BlobUrl = containerClient.GetBlobClient(blob.Name).Uri.ToString(),
                        FileName = Path.GetFileName(blob.Name),
                        FileSizeBytes = blob.Properties.ContentLength ?? 0,
                        ContentType = blob.Properties.ContentType ?? "application/octet-stream",
                        StorageTier = MapAccessTierToStorageTier(blob.Properties.AccessTier),
                        CreatedAt = blob.Properties.CreatedOn?.DateTime ?? DateTime.UtcNow,
                        LastModified = blob.Properties.LastModified?.DateTime ?? DateTime.UtcNow,
                        LastAccessedAt = blob.Properties.LastAccessedOn?.DateTime,
                        ETag = blob.Properties.ETag?.ToString() ?? ""
                    });
                    
                    if (blobs.Count >= maxResults)
                        break;
                }
                
                if (blobs.Count >= maxResults)
                    break;
            }
            
            return blobs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list files for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(Guid userId, string blobUrl)
    {
        try
        {
            var blobClient = await GetBlobClientFromUrlAsync(userId, blobUrl);
            var response = await blobClient.DeleteIfExistsAsync();
            
            if (response.Value)
            {
                _logger.LogInformation("Deleted file for user {UserId}: {BlobUrl}", userId, blobUrl);
            }
            
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file for user {UserId}: {BlobUrl}", userId, blobUrl);
            throw;
        }
    }

    public async Task<int> DeleteAllUserDataAsync(Guid userId)
    {
        try
        {
            var containerClient = await GetUserContainerAsync(userId);
            var deletedCount = 0;
            
            var blobs = containerClient.GetBlobsAsync();
            await foreach (var blob in blobs)
            {
                await containerClient.DeleteBlobIfExistsAsync(blob.Name);
                deletedCount++;
            }
            
            // Delete the container itself
            await containerClient.DeleteIfExistsAsync();
            
            _logger.LogWarning("GDPR: Deleted all data for user {UserId}: {DeletedCount} files", userId, deletedCount);
            return deletedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete all data for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> ChangeStorageTierAsync(Guid userId, string blobUrl, StorageTier targetTier)
    {
        try
        {
            var blobClient = await GetBlobClientFromUrlAsync(userId, blobUrl);
            var azureTier = MapStorageTierToAccessTier(targetTier);
            
            await blobClient.SetAccessTierAsync(azureTier);
            
            _logger.LogInformation("Changed storage tier for user {UserId}, blob {BlobUrl} to {Tier}", 
                userId, blobUrl, targetTier);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to change storage tier for user {UserId}, blob {BlobUrl} to {Tier}", 
                userId, blobUrl, targetTier);
            return false;
        }
    }

    public async Task<UserStorageStats> GetStorageStatsAsync(Guid userId)
    {
        try
        {
            var files = await ListUserFilesAsync(userId, maxResults: int.MaxValue);
            var stats = new UserStorageStats
            {
                UserId = userId,
                LastUpdated = DateTime.UtcNow
            };
            
            foreach (var file in files)
            {
                stats.TotalFilesCount++;
                stats.TotalSizeBytes += file.FileSizeBytes;
                
                // By tier
                switch (file.StorageTier)
                {
                    case StorageTier.Hot:
                        stats.HotTierSizeBytes += file.FileSizeBytes;
                        break;
                    case StorageTier.Cool:
                        stats.CoolTierSizeBytes += file.FileSizeBytes;
                        break;
                    case StorageTier.Archive:
                        stats.ArchiveTierSizeBytes += file.FileSizeBytes;
                        break;
                }
                
                // By content type
                if (file.ContentType.StartsWith("audio/"))
                {
                    stats.AudioFilesSizeBytes += file.FileSizeBytes;
                }
                else
                {
                    stats.MeetingArtifactsSizeBytes += file.FileSizeBytes;
                }
            }
            
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get storage stats for user {UserId}", userId);
            throw;
        }
    }

    public async Task<string> GenerateSecureAccessUrlAsync(Guid userId, string blobUrl, int expiryHours = 24)
    {
        try
        {
            var originalBlobClient = await GetBlobClientFromUrlAsync(userId, blobUrl);
            
            // Get a fresh blob client from the service client to ensure SAS generation works
            var containerClient = _blobServiceClient.GetBlobContainerClient(originalBlobClient.BlobContainerName);
            var blobClient = containerClient.GetBlobClient(originalBlobClient.Name);
            
            if (!blobClient.CanGenerateSasUri)
            {
                // Fallback: return the direct URL (less secure)
                _logger.LogWarning("Cannot generate SAS token for blob {BlobUrl}, returning direct URL", blobUrl);
                return blobUrl;
            }
            
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = blobClient.BlobContainerName,
                BlobName = blobClient.Name,
                Resource = "b", // blob
                ExpiresOn = DateTimeOffset.UtcNow.AddHours(expiryHours)
            };
            
            sasBuilder.SetPermissions(BlobSasPermissions.Read);
            
            var sasUri = blobClient.GenerateSasUri(sasBuilder);
            _logger.LogInformation("Generated SAS token for blob {BlobUrl}, expires in {Hours} hours", blobUrl, expiryHours);
            return sasUri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate secure access URL for user {UserId}, blob {BlobUrl}", userId, blobUrl);
            throw;
        }
    }

    // Transcript-specific storage methods for S6.4 optimization

    public async Task<TranscriptStorageResult> StoreTranscriptAsync(Guid userId, Guid jobId, string transcriptJson)
    {
        try
        {
            if (string.IsNullOrEmpty(transcriptJson))
                throw new ArgumentException("Transcript JSON cannot be null or empty", nameof(transcriptJson));

            var originalSize = Encoding.UTF8.GetByteCount(transcriptJson);
            
            // Only compress if content is above threshold (default: 10KB)
            bool shouldCompress = CompressionUtils.ShouldCompress(originalSize);
            
            var containerClient = await GetUserContainerAsync(userId);
            var blobName = $"transcripts/{jobId:N}/{DateTime.UtcNow:yyyyMMdd-HHmmss}" + (shouldCompress ? ".json.gz" : ".json");
            var blobClient = containerClient.GetBlobClient(blobName);

            Stream contentStream;
            long compressedSize;
            string contentType;
            
            if (shouldCompress)
            {
                contentStream = CompressionUtils.CompressJsonToStream(transcriptJson);
                compressedSize = contentStream.Length;
                contentType = "application/gzip";
                
                _logger.LogInformation("Compressed transcript for job {JobId}: {OriginalSize} -> {CompressedSize} bytes ({Ratio}%)",
                    jobId, originalSize, compressedSize, 
                    CompressionUtils.CalculateCompressionRatio(originalSize, compressedSize));
            }
            else
            {
                contentStream = new MemoryStream(Encoding.UTF8.GetBytes(transcriptJson));
                compressedSize = originalSize;
                contentType = "application/json";
                
                _logger.LogInformation("Storing uncompressed transcript for job {JobId}: {Size} bytes (below compression threshold)",
                    jobId, originalSize);
            }

            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "private, max-age=3600", // 1 hour cache for transcripts
                    ContentEncoding = shouldCompress ? "gzip" : null
                },
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = userId.ToString(),
                    ["jobId"] = jobId.ToString(),
                    ["originalSize"] = originalSize.ToString(),
                    ["compressed"] = shouldCompress.ToString().ToLowerInvariant(),
                    ["uploadedAt"] = DateTime.UtcNow.ToString("O"),
                    ["contentCategory"] = "transcript"
                },
                AccessTier = AccessTier.Hot // Start in hot tier for recent transcripts
            };

            var response = await blobClient.UploadAsync(contentStream, uploadOptions);
            
            _logger.LogInformation("Stored transcript for user {UserId}, job {JobId}: {CompressedSize} bytes", 
                userId, jobId, compressedSize);

            return new TranscriptStorageResult
            {
                BlobUrl = blobClient.Uri.ToString(),
                OriginalSizeBytes = originalSize,
                CompressedSizeBytes = compressedSize,
                CompressionRatio = CompressionUtils.CalculateCompressionRatio(originalSize, compressedSize),
                StoredAt = DateTime.UtcNow,
                ETag = response.Value.ETag.ToString(),
                StorageTier = StorageTier.Hot
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store transcript for user {UserId}, job {JobId}", userId, jobId);
            throw;
        }
        finally
        {
            // Ensure streams are disposed
        }
    }

    public async Task<string> RetrieveTranscriptAsync(Guid userId, string blobUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(blobUrl))
                throw new ArgumentException("Blob URL cannot be null or empty", nameof(blobUrl));

            // Validate that the blob belongs to the user's container
            var containerName = GetUserContainerName(userId);
            if (!blobUrl.Contains($"/{containerName}/"))
            {
                throw new UnauthorizedAccessException("Blob URL does not belong to the specified user");
            }

            // Extract blob name from URL and get client via container
            var uri = new Uri(blobUrl);
            var blobName = uri.Segments.Skip(2).Aggregate((a, b) => a + b).TrimStart('/'); // Skip account and container segments
            var containerClient = await GetUserContainerAsync(userId);
            var blobClient = containerClient.GetBlobClient(blobName);
            
            // Check if blob exists and get metadata
            var propertiesResponse = await blobClient.GetPropertiesAsync();
            var isCompressed = propertiesResponse.Value.Metadata.TryGetValue("compressed", out var compressedFlag) 
                               && bool.Parse(compressedFlag);

            // Download the blob content
            var downloadResponse = await blobClient.DownloadStreamingAsync();
            
            if (isCompressed)
            {
                // Decompress GZip content
                var decompressedJson = await CompressionUtils.DecompressStreamToJsonAsync(downloadResponse.Value.Content);
                _logger.LogInformation("Retrieved and decompressed transcript from {BlobUrl}", blobUrl);
                return decompressedJson;
            }
            else
            {
                // Read uncompressed content directly
                using var reader = new StreamReader(downloadResponse.Value.Content);
                var json = await reader.ReadToEndAsync();
                _logger.LogInformation("Retrieved uncompressed transcript from {BlobUrl}", blobUrl);
                return json;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve transcript for user {UserId} from {BlobUrl}", userId, blobUrl);
            throw;
        }
    }

    public async Task<bool> DeleteTranscriptAsync(Guid userId, string blobUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(blobUrl))
                return false;

            // Validate that the blob belongs to the user's container
            var containerName = GetUserContainerName(userId);
            if (!blobUrl.Contains($"/{containerName}/"))
            {
                _logger.LogWarning("Attempted to delete blob that doesn't belong to user {UserId}: {BlobUrl}", userId, blobUrl);
                return false;
            }

            // Extract blob name from URL and get client via container
            var uri = new Uri(blobUrl);
            var blobName = uri.Segments.Skip(2).Aggregate((a, b) => a + b).TrimStart('/'); // Skip account and container segments
            var containerClient = await GetUserContainerAsync(userId);
            var blobClient = containerClient.GetBlobClient(blobName);
            
            var response = await blobClient.DeleteIfExistsAsync();
            
            if (response.Value)
            {
                _logger.LogInformation("Deleted transcript blob for user {UserId}: {BlobUrl}", userId, blobUrl);
            }
            else
            {
                _logger.LogWarning("Transcript blob not found for deletion, user {UserId}: {BlobUrl}", userId, blobUrl);
            }
            
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete transcript for user {UserId} from {BlobUrl}", userId, blobUrl);
            return false;
        }
    }

    // Private helper methods
    
    private async Task<BlobContainerClient> GetUserContainerAsync(Guid userId)
    {
        var containerName = GetUserContainerName(userId);
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        
        // Create container if it doesn't exist with private access
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
        
        return containerClient;
    }

    private Task<BlobClient> GetBlobClientFromUrlAsync(Guid userId, string blobUrl)
    {
        // Validate that the blob belongs to the user's container
        var expectedContainerName = GetUserContainerName(userId);
        var uri = new Uri(blobUrl);
        var blobClient = new BlobClient(uri);
        
        if (!blobClient.BlobContainerName.Equals(expectedContainerName, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException($"Access denied: Blob does not belong to user {userId}");
        }
        
        return Task.FromResult(blobClient);
    }

    private static string GetUserContainerName(Guid userId)
    {
        return $"{UserContainerPrefix}{userId:N}".ToLowerInvariant();
    }

    private static string SanitizeFileName(string fileName)
    {
        // Remove or replace invalid characters
        var sanitized = Path.GetFileNameWithoutExtension(fileName);
        var extension = Path.GetExtension(fileName);
        
        // Replace invalid characters with underscores
        var invalidChars = Path.GetInvalidFileNameChars().Concat(new char[] { ' ', '#', '%' });
        foreach (var c in invalidChars)
        {
            sanitized = sanitized.Replace(c, '_');
        }
        
        // Limit length
        if (sanitized.Length > MaxFileNameLength - extension.Length)
        {
            sanitized = sanitized[..(MaxFileNameLength - extension.Length)];
        }
        
        return sanitized + extension;
    }

    private static string ExtractFileNameFromUrl(string blobUrl)
    {
        var uri = new Uri(blobUrl);
        return Path.GetFileName(uri.LocalPath);
    }

    private static StorageTier MapAccessTierToStorageTier(AccessTier? accessTier)
    {
        if (accessTier == null) return StorageTier.Hot;
        
        if (accessTier.Value == AccessTier.Cool)
            return StorageTier.Cool;
        else if (accessTier.Value == AccessTier.Archive)
            return StorageTier.Archive;
        else
            return StorageTier.Hot;
    }

    private static AccessTier MapStorageTierToAccessTier(StorageTier storageTier)
    {
        if (storageTier == StorageTier.Cool)
            return AccessTier.Cool;
        else if (storageTier == StorageTier.Archive)
            return AccessTier.Archive;
        else
            return AccessTier.Hot;
    }
}
