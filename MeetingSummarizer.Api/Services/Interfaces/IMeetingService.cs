using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models.Requests;
using MeetingSummarizer.Api.Models.Responses;

namespace MeetingSummarizer.Api.Services.Interfaces;

/// <summary>
/// Service interface for managing persistent meeting records
/// Provides CRUD operations with user isolation for S6.5 implementation
/// </summary>
public interface IMeetingService
{
    /// <summary>
    /// Create a new meeting record from upload information
    /// </summary>
    /// <param name="userId">ID of the user creating the meeting</param>
    /// <param name="title">Meeting title</param>
    /// <param name="description">Optional meeting description</param>
    /// <param name="originalFileName">Original uploaded file name</param>
    /// <param name="fileSizeBytes">File size in bytes</param>
    /// <param name="durationSeconds">Audio duration in seconds</param>
    /// <param name="blobStoragePath">Azure Blob Storage path</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created meeting entity</returns>
    Task<Meeting> CreateMeetingAsync(
        Guid userId,
        string title,
        string? description,
        string originalFileName,
        long fileSizeBytes,
        int durationSeconds,
        string blobStoragePath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a meeting by ID with user access validation
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="userId">User ID for access validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Meeting if found and accessible, null otherwise</returns>
    Task<Meeting?> GetMeetingAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user's meeting history with filtering and pagination
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="searchTerm">Optional search term for title/description</param>
    /// <param name="status">Optional status filter</param>
    /// <param name="pageNumber">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated meeting list</returns>
    Task<PaginatedResult<MeetingListItem>> GetUserMeetingsAsync(
        Guid userId,
        string? searchTerm = null,
        MeetingStatus? status = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update meeting processing status
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="status">New status</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> UpdateMeetingStatusAsync(
        Guid meetingId,
        MeetingStatus status,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update meeting with transcription results
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="transcriptionJson">Transcription JSON data</param>
    /// <param name="speakerMappingsJson">Speaker mappings JSON data</param>
    /// <param name="tokensConsumed">Tokens consumed for transcription</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> UpdateMeetingTranscriptionAsync(
        Guid meetingId,
        string transcriptionJson,
        string? speakerMappingsJson = null,
        decimal tokensConsumed = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update meeting speaker count
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="speakerCount">Number of speakers detected</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> UpdateMeetingSpeakerCountAsync(
        Guid meetingId,
        int speakerCount,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update meeting with summary and action items
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="summaryJson">Summary JSON data</param>
    /// <param name="actionItemsJson">Action items JSON data</param>
    /// <param name="tokensConsumed">Additional tokens consumed for summarization</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> UpdateMeetingSummaryAsync(
        Guid meetingId,
        string summaryJson,
        string? actionItemsJson = null,
        decimal tokensConsumed = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update meeting metadata (title, description)
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="userId">User ID for access validation</param>
    /// <param name="title">New title</param>
    /// <param name="description">New description</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> UpdateMeetingMetadataAsync(
        Guid meetingId,
        Guid userId,
        string title,
        string? description,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark meeting as completed with processing timestamp
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated meeting if successful</returns>
    Task<Meeting?> CompleteMeetingAsync(
        Guid meetingId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update last accessed timestamp for storage tier management
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="userId">User ID for access validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if updated successfully</returns>
    Task<bool> UpdateLastAccessedAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft delete a meeting (mark as deleted)
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="userId">User ID for access validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteMeetingAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default);


}