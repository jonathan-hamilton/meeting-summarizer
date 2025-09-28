using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Storage;

/// <summary>
/// Interface for user-specific storage operations with per-user isolation
/// </summary>
public interface IUserStorageService
{
    /// <summary>
    /// Upload an audio file to user-specific blob storage
    /// </summary>
    /// <param name="userId">User identifier for storage isolation</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="fileStream">Audio file stream</param>
    /// <param name="contentType">MIME type of the audio file</param>
    /// <returns>Storage metadata including blob URL and storage tier</returns>
    Task<StorageUploadResult> UploadAudioFileAsync(Guid userId, string fileName, Stream fileStream, string contentType);

    /// <summary>
    /// Upload meeting artifacts (transcription, summary, etc.) to user storage
    /// </summary>
    /// <param name="userId">User identifier for storage isolation</param>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="artifactType">Type of artifact (transcript, summary, etc.)</param>
    /// <param name="content">Text content to store</param>
    /// <returns>Storage metadata for the artifact</returns>
    Task<StorageUploadResult> UploadMeetingArtifactAsync(Guid userId, Guid meetingId, string artifactType, string content);

    /// <summary>
    /// Retrieve an audio file from user storage
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="blobUrl">Blob URL or identifier</param>
    /// <returns>File stream and metadata</returns>
    Task<StorageDownloadResult> GetAudioFileAsync(Guid userId, string blobUrl);

    /// <summary>
    /// Retrieve meeting artifact from user storage
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="artifactType">Type of artifact to retrieve</param>
    /// <returns>Content and metadata</returns>
    Task<StorageDownloadResult> GetMeetingArtifactAsync(Guid userId, Guid meetingId, string artifactType);

    /// <summary>
    /// List all files in user's storage with optional filtering
    /// </summary>
    /// <param name="userId">User identifier for storage isolation</param>
    /// <param name="prefix">Optional prefix filter (e.g., "meetings/", "audio/")</param>
    /// <param name="maxResults">Maximum number of results to return</param>
    /// <returns>List of storage items with metadata</returns>
    Task<IEnumerable<StorageItemInfo>> ListUserFilesAsync(Guid userId, string? prefix = null, int maxResults = 100);

    /// <summary>
    /// Delete a specific file from user storage
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="blobUrl">Blob URL or identifier to delete</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteFileAsync(Guid userId, string blobUrl);

    /// <summary>
    /// Delete all data for a user (GDPR compliance)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Number of files deleted</returns>
    Task<int> DeleteAllUserDataAsync(Guid userId);

    /// <summary>
    /// Move files between storage tiers based on age and access patterns
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="blobUrl">Blob URL to move</param>
    /// <param name="targetTier">Target storage tier (Hot, Cool, Archive)</param>
    /// <returns>True if tier change was successful</returns>
    Task<bool> ChangeStorageTierAsync(Guid userId, string blobUrl, StorageTier targetTier);

    /// <summary>
    /// Get storage usage statistics for a user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Storage usage information</returns>
    Task<UserStorageStats> GetStorageStatsAsync(Guid userId);

    /// <summary>
    /// Generate secure, time-limited access URL for file sharing
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="blobUrl">Blob URL to generate access for</param>
    /// <param name="expiryHours">Hours until URL expires (default: 24)</param>
    /// <returns>Secure access URL with expiration</returns>
    Task<string> GenerateSecureAccessUrlAsync(Guid userId, string blobUrl, int expiryHours = 24);

    // Transcript-specific storage methods for S6.4 optimization

    /// <summary>
    /// Store large transcript JSON in compressed blob storage
    /// </summary>
    /// <param name="userId">User identifier for storage isolation</param>
    /// <param name="jobId">Fast transcription job identifier</param>
    /// <param name="transcriptJson">Large transcript JSON content</param>
    /// <returns>Storage result with blob URL and compression stats</returns>
    Task<TranscriptStorageResult> StoreTranscriptAsync(Guid userId, Guid jobId, string transcriptJson);

    /// <summary>
    /// Retrieve and decompress transcript JSON from blob storage
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="blobUrl">Blob URL of compressed transcript</param>
    /// <returns>Decompressed transcript JSON content</returns>
    Task<string> RetrieveTranscriptAsync(Guid userId, string blobUrl);

    /// <summary>
    /// Delete transcript blob when job is cleaned up
    /// </summary>
    /// <param name="userId">User identifier for access validation</param>
    /// <param name="blobUrl">Blob URL to delete</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteTranscriptAsync(Guid userId, string blobUrl);
}
