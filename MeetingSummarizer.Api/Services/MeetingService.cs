using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models.Responses;
using MeetingSummarizer.Api.Services.Interfaces;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service implementation for managing persistent meeting records
/// Provides CRUD operations with user isolation for S6.5 implementation
/// </summary>
public class MeetingService : IMeetingService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<MeetingService> _logger;

    public MeetingService(MeetingSummarizerDbContext context, ILogger<MeetingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Meeting> CreateMeetingAsync(
        Guid userId,
        string title,
        string? description,
        string originalFileName,
        long fileSizeBytes,
        int durationSeconds,
        string blobStoragePath,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating meeting for user {UserId}: {Title}", userId, title);

        var meeting = new Meeting
        {
            UserId = userId,
            Title = title.Trim(),
            Description = description?.Trim(),
            OriginalFileName = originalFileName,
            FileSizeBytes = fileSizeBytes,
            DurationSeconds = durationSeconds,
            BlobStoragePath = blobStoragePath,
            Status = MeetingStatus.Uploaded,
            CreatedAt = DateTime.UtcNow,
            LastAccessedAt = DateTime.UtcNow,
            // Set automatic deletion to 365 days from creation (configurable later)
            ScheduledDeletionAt = DateTime.UtcNow.AddDays(365)
        };

        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created meeting {MeetingId} for user {UserId}", meeting.Id, userId);
        return meeting;
    }

    public async Task<Meeting?> GetMeetingAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var meeting = await _context.Meetings
            .Where(m => m.Id == meetingId && m.UserId == userId && m.Status != MeetingStatus.Deleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (meeting != null)
        {
            // Update last accessed timestamp
            meeting.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return meeting;
    }

    public async Task<PaginatedResult<MeetingListItem>> GetUserMeetingsAsync(
        Guid userId,
        string? searchTerm = null,
        MeetingStatus? status = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting meetings for user {UserId}, search: {SearchTerm}, status: {Status}", 
            userId, searchTerm, status);

        var query = _context.Meetings
            .Where(m => m.UserId == userId && m.Status != MeetingStatus.Deleted);

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(m => 
                m.Title.ToLower().Contains(searchLower) || 
                (m.Description != null && m.Description.ToLower().Contains(searchLower)) ||
                m.OriginalFileName.ToLower().Contains(searchLower));
        }

        // Apply status filter
        if (status.HasValue)
        {
            query = query.Where(m => m.Status == status.Value);
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var meetings = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MeetingListItem
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                OriginalFileName = m.OriginalFileName,
                FileSizeBytes = m.FileSizeBytes,
                DurationSeconds = m.DurationSeconds,
                Status = m.Status,
                SpeakerCount = m.SpeakerCount,
                TokensConsumed = m.TokensConsumed,
                CreatedAt = m.CreatedAt,
                CompletedAt = m.CompletedAt,
                LastAccessedAt = m.LastAccessedAt
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Returning {Count} meetings to user {UserId} (total: {TotalCount}, page: {Page}/{PageSize})", 
            meetings.Count, userId, totalCount, pageNumber, pageSize);

        return new PaginatedResult<MeetingListItem>
        {
            Items = meetings,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<Meeting?> UpdateMeetingStatusAsync(
        Guid meetingId,
        MeetingStatus status,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating meeting {MeetingId} status to {Status}", meetingId, status);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found for status update", meetingId);
            return null;
        }

        meeting.Status = status;
        
        // Set completion timestamp if status is Completed
        if (status == MeetingStatus.Completed && meeting.CompletedAt == null)
        {
            meeting.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated meeting {MeetingId} status to {Status}", meetingId, status);
        
        return meeting;
    }

    public async Task<Meeting?> UpdateMeetingTranscriptionAsync(
        Guid meetingId,
        string transcriptionJson,
        string? speakerMappingsJson = null,
        decimal tokensConsumed = 0,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating meeting {MeetingId} with transcription data", meetingId);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found for transcription update", meetingId);
            return null;
        }

        meeting.TranscriptionJson = transcriptionJson;
        meeting.SpeakerMappingsJson = speakerMappingsJson;
        meeting.TokensConsumed += tokensConsumed;
        meeting.Status = MeetingStatus.Transcribed;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated meeting {MeetingId} with transcription, tokens: {Tokens}", 
            meetingId, tokensConsumed);
        
        return meeting;
    }

    public async Task<Meeting?> UpdateMeetingSpeakerCountAsync(
        Guid meetingId,
        int speakerCount,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating meeting {MeetingId} with speaker count: {SpeakerCount}", meetingId, speakerCount);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found for speaker count update", meetingId);
            return null;
        }

        meeting.SpeakerCount = speakerCount;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated meeting {MeetingId} speaker count to {SpeakerCount}", 
            meetingId, speakerCount);
        
        return meeting;
    }

    public async Task<Meeting?> UpdateMeetingSummaryAsync(
        Guid meetingId,
        string summaryJson,
        string? actionItemsJson = null,
        decimal tokensConsumed = 0,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating meeting {MeetingId} with summary data", meetingId);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found for summary update", meetingId);
            return null;
        }

        meeting.SummaryJson = summaryJson;
        meeting.ActionItemsJson = actionItemsJson;
        meeting.TokensConsumed += tokensConsumed;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated meeting {MeetingId} with summary, tokens: {Tokens}", 
            meetingId, tokensConsumed);
        
        return meeting;
    }

    public async Task<Meeting?> UpdateMeetingMetadataAsync(
        Guid meetingId,
        Guid userId,
        string title,
        string? description,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating meeting {MeetingId} metadata for user {UserId}", meetingId, userId);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId && m.UserId == userId && m.Status != MeetingStatus.Deleted, 
                cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", 
                meetingId, userId);
            return null;
        }

        meeting.Title = title.Trim();
        meeting.Description = description?.Trim();

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated meeting {MeetingId} metadata", meetingId);
        
        return meeting;
    }

    public async Task<Meeting?> CompleteMeetingAsync(
        Guid meetingId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Completing meeting {MeetingId}", meetingId);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found for completion", meetingId);
            return null;
        }

        meeting.Status = MeetingStatus.Completed;
        meeting.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Completed meeting {MeetingId}", meetingId);
        
        return meeting;
    }

    public async Task<bool> UpdateLastAccessedAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId && m.UserId == userId && m.Status != MeetingStatus.Deleted, 
                cancellationToken);

        if (meeting == null)
        {
            return false;
        }

        meeting.LastAccessedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        
        return true;
    }

    public async Task<bool> DeleteMeetingAsync(
        Guid meetingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting meeting {MeetingId} for user {UserId}", meetingId, userId);

        var meeting = await _context.Meetings
            .FirstOrDefaultAsync(m => m.Id == meetingId && m.UserId == userId && m.Status != MeetingStatus.Deleted, 
                cancellationToken);

        if (meeting == null)
        {
            _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", 
                meetingId, userId);
            return false;
        }

        // Soft delete - mark as deleted rather than removing from database
        meeting.Status = MeetingStatus.Deleted;
        
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Soft deleted meeting {MeetingId}", meetingId);
        
        return true;
    }


}