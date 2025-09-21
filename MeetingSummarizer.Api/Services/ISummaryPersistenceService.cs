using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Service interface for summary persistence operations
/// </summary>
public interface ISummaryPersistenceService
{
    /// <summary>
    /// Save a new summary for a user
    /// </summary>
    /// <param name="userId">User who owns the summary</param>
    /// <param name="request">Summary data to save</param>
    /// <returns>Saved summary DTO</returns>
    Task<SavedSummaryDto> SaveSummaryAsync(Guid userId, SaveSummaryRequest request);
    
    /// <summary>
    /// Get all summaries for a user
    /// </summary>
    /// <param name="userId">User ID to get summaries for</param>
    /// <returns>List of user's saved summaries</returns>
    Task<List<SavedSummaryDto>> GetUserSummariesAsync(Guid userId);
    
    /// <summary>
    /// Get a specific summary by ID
    /// </summary>
    /// <param name="summaryId">Summary ID to retrieve</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>Summary DTO or null if not found/not owned</returns>
    Task<SavedSummaryDto?> GetSummaryAsync(Guid summaryId, Guid userId);
    
    /// <summary>
    /// Update an existing summary
    /// </summary>
    /// <param name="summaryId">Summary ID to update</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Update data</param>
    /// <returns>Updated summary DTO or null if not found/not owned</returns>
    Task<SavedSummaryDto?> UpdateSummaryAsync(Guid summaryId, Guid userId, UpdateSavedSummaryRequest request);
    
    /// <summary>
    /// Delete a summary
    /// </summary>
    /// <param name="summaryId">Summary ID to delete</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>True if deleted, false if not found/not owned</returns>
    Task<bool> DeleteSummaryAsync(Guid summaryId, Guid userId);
    
    /// <summary>
    /// Add an action item to a summary
    /// </summary>
    /// <param name="summaryId">Summary ID to add action item to</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Action item data</param>
    /// <returns>Created action item DTO or null if summary not found/not owned</returns>
    Task<SavedActionItemDto?> AddActionItemAsync(Guid summaryId, Guid userId, SaveActionItemRequest request);
    
    /// <summary>
    /// Update an action item
    /// </summary>
    /// <param name="summaryId">Summary ID that owns the action item</param>
    /// <param name="actionItemId">Action item ID to update</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Update data</param>
    /// <returns>Updated action item DTO or null if not found/not owned</returns>
    Task<SavedActionItemDto?> UpdateActionItemAsync(Guid summaryId, Guid actionItemId, Guid userId, UpdateSavedActionItemRequest request);
    
    /// <summary>
    /// Delete an action item
    /// </summary>
    /// <param name="summaryId">Summary ID that owns the action item</param>
    /// <param name="actionItemId">Action item ID to delete</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>True if deleted, false if not found/not owned</returns>
    Task<bool> DeleteActionItemAsync(Guid summaryId, Guid actionItemId, Guid userId);
    
    /// <summary>
    /// Update the last accessed timestamp for a summary
    /// </summary>
    /// <param name="summaryId">Summary ID to update</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>Task</returns>
    Task UpdateLastAccessedAsync(Guid summaryId, Guid userId);
}