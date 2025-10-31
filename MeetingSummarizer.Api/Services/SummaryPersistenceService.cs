using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service implementation for summary persistence operations
/// </summary>
public class SummaryPersistenceService : ISummaryPersistenceService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<SummaryPersistenceService> _logger;
    
    /// <summary>
    /// JSON serialization options that match the Web API configuration
    /// </summary>
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public SummaryPersistenceService(
        MeetingSummarizerDbContext context, 
        ILogger<SummaryPersistenceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<SavedSummaryDto> SaveSummaryAsync(Guid userId, SaveSummaryRequest request)
    {
        _logger.LogInformation("Saving summary for user {UserId} with title '{Title}'", userId, request.Title);

        var summary = new SavedSummary
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MeetingId = request.MeetingId,
            Title = request.Title,
            Description = request.Description,
            SummaryData = JsonSerializer.Serialize(request.SummaryData, JsonOptions),
            TranscriptFileName = request.TranscriptFileName,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        _context.SavedSummaries.Add(summary);
        await _context.SaveChangesAsync();

        // Add action items if provided
        if (request.ActionItems.Any())
        {
            var actionItems = request.ActionItems.Select((item, index) => new SavedActionItem
            {
                Id = Guid.NewGuid(),
                SummaryId = summary.Id,
                Description = item.Description,
                AssignedTo = item.AssignedTo,
                Confidence = item.Confidence,
                IsExplicitAssignment = item.IsExplicitAssignment,
                SortOrder = item.SortOrder != 0 ? item.SortOrder : index,
                IsCompleted = item.IsCompleted,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            }).ToList();

            _context.SavedActionItems.AddRange(actionItems);
            await _context.SaveChangesAsync();
            
            summary.ActionItems = actionItems;
        }

        _logger.LogInformation("Successfully saved summary {SummaryId} for user {UserId}", summary.Id, userId);
        return MapToDto(summary);
    }

    /// <inheritdoc/>
    public async Task<List<SavedSummaryDto>> GetUserSummariesAsync(Guid userId)
    {
        _logger.LogInformation("Getting summaries for user {UserId}", userId);

        var summaries = await _context.SavedSummaries
            .Include(s => s.ActionItems)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.LastAccessedAt ?? s.CreatedAt)
            .ToListAsync();

        _logger.LogInformation("Found {Count} summaries for user {UserId}", summaries.Count, userId);
        return summaries.Select(MapToDto).ToList();
    }

    /// <inheritdoc/>
    public async Task<SavedSummaryDto?> GetSummaryAsync(Guid summaryId, Guid userId)
    {
        _logger.LogInformation("Getting summary {SummaryId} for user {UserId}", summaryId, userId);

        var summary = await _context.SavedSummaries
            .Include(s => s.ActionItems.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == summaryId && s.UserId == userId);

        if (summary == null)
        {
            _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", summaryId, userId);
            return null;
        }

        // Update last accessed timestamp
        await UpdateLastAccessedAsync(summaryId, userId);

        return MapToDto(summary);
    }

    /// <inheritdoc/>
    public async Task<SavedSummaryDto?> UpdateSummaryAsync(Guid summaryId, Guid userId, UpdateSavedSummaryRequest request)
    {
        _logger.LogInformation("Updating summary {SummaryId} for user {UserId}", summaryId, userId);

        var summary = await _context.SavedSummaries
            .Include(s => s.ActionItems)
            .FirstOrDefaultAsync(s => s.Id == summaryId && s.UserId == userId);

        if (summary == null)
        {
            _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", summaryId, userId);
            return null;
        }

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(request.Title))
            summary.Title = request.Title;
        
        if (request.Description != null)
            summary.Description = request.Description;
        
        if (request.SummaryData != null)
            summary.SummaryData = JsonSerializer.Serialize(request.SummaryData, JsonOptions);

        // Update action items if provided (replaces all existing action items)
        if (request.ActionItems != null)
        {
            _logger.LogInformation("Updating {ActionItemCount} action items for summary {SummaryId}", 
                request.ActionItems.Count, summaryId);

            // Remove all existing action items
            _context.SavedActionItems.RemoveRange(summary.ActionItems);

            // Add new action items
            foreach (var (actionItemRequest, index) in request.ActionItems.Select((item, idx) => (item, idx)))
            {
                var actionItem = new SavedActionItem
                {
                    Id = Guid.NewGuid(),
                    SummaryId = summaryId,
                    Description = actionItemRequest.Description,
                    AssignedTo = actionItemRequest.AssignedTo,
                    Confidence = (decimal)actionItemRequest.Confidence,
                    IsExplicitAssignment = actionItemRequest.IsExplicitAssignment,
                    SortOrder = actionItemRequest.SortOrder,
                    IsCompleted = actionItemRequest.IsCompleted,
                    CreatedAt = DateTime.UtcNow,
                    LastModifiedAt = DateTime.UtcNow
                };

                _context.SavedActionItems.Add(actionItem);
            }
        }

        summary.LastModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully updated summary {SummaryId} for user {UserId}", summaryId, userId);
        return MapToDto(summary);
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteSummaryAsync(Guid summaryId, Guid userId)
    {
        _logger.LogInformation("Deleting summary {SummaryId} for user {UserId}", summaryId, userId);

        var summary = await _context.SavedSummaries
            .FirstOrDefaultAsync(s => s.Id == summaryId && s.UserId == userId);

        if (summary == null)
        {
            _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", summaryId, userId);
            return false;
        }

        _context.SavedSummaries.Remove(summary);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully deleted summary {SummaryId} for user {UserId}", summaryId, userId);
        return true;
    }

    /// <inheritdoc/>
    public async Task<SavedActionItemDto?> AddActionItemAsync(Guid summaryId, Guid userId, SaveActionItemRequest request)
    {
        _logger.LogInformation("Adding action item to summary {SummaryId} for user {UserId}", summaryId, userId);

        // Verify summary ownership
        var summaryExists = await _context.SavedSummaries
            .AnyAsync(s => s.Id == summaryId && s.UserId == userId);

        if (!summaryExists)
        {
            _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", summaryId, userId);
            return null;
        }

        var actionItem = new SavedActionItem
        {
            Id = Guid.NewGuid(),
            SummaryId = summaryId,
            Description = request.Description,
            AssignedTo = request.AssignedTo,
            Confidence = request.Confidence,
            IsExplicitAssignment = request.IsExplicitAssignment,
            SortOrder = request.SortOrder,
            IsCompleted = request.IsCompleted,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        _context.SavedActionItems.Add(actionItem);
        
        // Update summary modified timestamp
        var summary = await _context.SavedSummaries.FirstAsync(s => s.Id == summaryId);
        summary.LastModifiedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully added action item {ActionItemId} to summary {SummaryId}", actionItem.Id, summaryId);
        return MapToDto(actionItem);
    }

    /// <inheritdoc/>
    public async Task<SavedActionItemDto?> UpdateActionItemAsync(Guid summaryId, Guid actionItemId, Guid userId, UpdateSavedActionItemRequest request)
    {
        _logger.LogInformation("Updating action item {ActionItemId} in summary {SummaryId} for user {UserId}", actionItemId, summaryId, userId);

        var actionItem = await _context.SavedActionItems
            .Include(a => a.Summary)
            .FirstOrDefaultAsync(a => a.Id == actionItemId && 
                                   a.SummaryId == summaryId && 
                                   a.Summary.UserId == userId);

        if (actionItem == null)
        {
            _logger.LogWarning("Action item {ActionItemId} not found in summary {SummaryId} for user {UserId}", actionItemId, summaryId, userId);
            return null;
        }

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(request.Description))
            actionItem.Description = request.Description;
        
        if (!string.IsNullOrWhiteSpace(request.AssignedTo))
            actionItem.AssignedTo = request.AssignedTo;
        
        if (request.Confidence.HasValue)
            actionItem.Confidence = request.Confidence.Value;
        
        if (request.IsExplicitAssignment.HasValue)
            actionItem.IsExplicitAssignment = request.IsExplicitAssignment.Value;
        
        if (request.SortOrder.HasValue)
            actionItem.SortOrder = request.SortOrder.Value;
        
        if (request.IsCompleted.HasValue)
            actionItem.IsCompleted = request.IsCompleted.Value;

        actionItem.LastModifiedAt = DateTime.UtcNow;
        
        // Update summary modified timestamp
        actionItem.Summary.LastModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully updated action item {ActionItemId} in summary {SummaryId}", actionItemId, summaryId);
        return MapToDto(actionItem);
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteActionItemAsync(Guid summaryId, Guid actionItemId, Guid userId)
    {
        _logger.LogInformation("Deleting action item {ActionItemId} from summary {SummaryId} for user {UserId}", actionItemId, summaryId, userId);

        var actionItem = await _context.SavedActionItems
            .Include(a => a.Summary)
            .FirstOrDefaultAsync(a => a.Id == actionItemId && 
                                   a.SummaryId == summaryId && 
                                   a.Summary.UserId == userId);

        if (actionItem == null)
        {
            _logger.LogWarning("Action item {ActionItemId} not found in summary {SummaryId} for user {UserId}", actionItemId, summaryId, userId);
            return false;
        }

        _context.SavedActionItems.Remove(actionItem);
        
        // Update summary modified timestamp
        actionItem.Summary.LastModifiedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully deleted action item {ActionItemId} from summary {SummaryId}", actionItemId, summaryId);
        return true;
    }

    /// <inheritdoc/>
    public async Task UpdateLastAccessedAsync(Guid summaryId, Guid userId)
    {
        var summary = await _context.SavedSummaries
            .FirstOrDefaultAsync(s => s.Id == summaryId && s.UserId == userId);

        if (summary != null)
        {
            summary.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Map SavedSummary entity to DTO
    /// </summary>
    private static SavedSummaryDto MapToDto(SavedSummary summary)
    {
        return new SavedSummaryDto
        {
            Id = summary.Id,
            UserId = summary.UserId,
            MeetingId = summary.MeetingId,
            Title = summary.Title,
            Description = summary.Description,
            SummaryData = JsonSerializer.Deserialize<object>(summary.SummaryData, JsonOptions) ?? new(),
            TranscriptFileName = summary.TranscriptFileName,
            CreatedAt = summary.CreatedAt,
            LastModifiedAt = summary.LastModifiedAt,
            LastAccessedAt = summary.LastAccessedAt,
            ActionItems = summary.ActionItems.Select(MapToDto).ToList()
        };
    }

    /// <summary>
    /// Map SavedActionItem entity to DTO
    /// </summary>
    private static SavedActionItemDto MapToDto(SavedActionItem actionItem)
    {
        return new SavedActionItemDto
        {
            Id = actionItem.Id,
            SummaryId = actionItem.SummaryId,
            Description = actionItem.Description,
            AssignedTo = actionItem.AssignedTo,
            Confidence = actionItem.Confidence,
            IsExplicitAssignment = actionItem.IsExplicitAssignment,
            SortOrder = actionItem.SortOrder,
            IsCompleted = actionItem.IsCompleted,
            CreatedAt = actionItem.CreatedAt,
            LastModifiedAt = actionItem.LastModifiedAt
        };
    }
}