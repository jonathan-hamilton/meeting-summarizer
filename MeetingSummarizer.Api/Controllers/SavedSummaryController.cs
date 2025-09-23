using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using MeetingSummarizer.Api.Attributes;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for saved summary persistence operations (S6.10)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SavedSummaryController : ControllerBase
{
    private readonly ISummaryPersistenceService _summaryService;
    private readonly ILogger<SavedSummaryController> _logger;

    public SavedSummaryController(
        ISummaryPersistenceService summaryService,
        ILogger<SavedSummaryController> logger)
    {
        _summaryService = summaryService;
        _logger = logger;
    }

    /// <summary>
    /// Get all saved summaries for a user
    /// </summary>
    /// <param name="userId">User ID to get summaries for</param>
    /// <returns>List of user's saved summaries</returns>
    /// <response code="200">Returns the user's saved summaries</response>
    /// <response code="400">Invalid user ID format</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("user/{userId}")]
    [Authorize]
    [RequireEmailVerification]
    [ProducesResponseType(typeof(List<SavedSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<SavedSummaryDto>>> GetUserSummaries(
        [Required] Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting summaries for user {UserId}", userId);
            
            var summaries = await _summaryService.GetUserSummariesAsync(userId);
            
            _logger.LogInformation("Retrieved {Count} summaries for user {UserId}", summaries.Count, userId);
            return Ok(summaries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting summaries for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving summaries");
        }
    }

    /// <summary>
    /// Get a specific saved summary by ID
    /// </summary>
    /// <param name="id">Summary ID to retrieve</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>The requested saved summary</returns>
    /// <response code="200">Returns the saved summary</response>
    /// <response code="400">Invalid ID format or missing user ID</response>
    /// <response code="404">Summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SavedSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SavedSummaryDto>> GetSummary(
        [Required] Guid id,
        [FromQuery, Required] Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting summary {SummaryId} for user {UserId}", id, userId);
            
            var summary = await _summaryService.GetSummaryAsync(id, userId);
            
            if (summary == null)
            {
                _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", id, userId);
                return NotFound("Summary not found or access denied");
            }

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting summary {SummaryId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while retrieving the summary");
        }
    }

    /// <summary>
    /// Save a new summary
    /// </summary>
    /// <param name="userId">User ID who owns the summary</param>
    /// <param name="request">Summary data to save</param>
    /// <returns>The saved summary</returns>
    /// <response code="201">Summary saved successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("user/{userId}")]
    [Authorize]
    [RequireEmailVerification]
    [ProducesResponseType(typeof(SavedSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SavedSummaryDto>> SaveSummary(
        [Required] Guid userId,
        [FromBody, Required] SaveSummaryRequest request)
    {
        try
        {
            _logger.LogInformation("Saving summary for user {UserId} with title '{Title}'", userId, request.Title);
            
            var savedSummary = await _summaryService.SaveSummaryAsync(userId, request);
            
            _logger.LogInformation("Successfully saved summary {SummaryId} for user {UserId}", savedSummary.Id, userId);
            
            return CreatedAtAction(
                nameof(GetSummary), 
                new { id = savedSummary.Id, userId }, 
                savedSummary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving summary for user {UserId}", userId);
            return StatusCode(500, "An error occurred while saving the summary");
        }
    }

    /// <summary>
    /// Update an existing summary
    /// </summary>
    /// <param name="id">Summary ID to update</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Update data</param>
    /// <returns>The updated summary</returns>
    /// <response code="200">Summary updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="404">Summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(SavedSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SavedSummaryDto>> UpdateSummary(
        [Required] Guid id,
        [FromQuery, Required] Guid userId,
        [FromBody, Required] UpdateSavedSummaryRequest request)
    {
        try
        {
            _logger.LogInformation("Updating summary {SummaryId} for user {UserId}", id, userId);
            
            var updatedSummary = await _summaryService.UpdateSummaryAsync(id, userId, request);
            
            if (updatedSummary == null)
            {
                _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", id, userId);
                return NotFound("Summary not found or access denied");
            }

            return Ok(updatedSummary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating summary {SummaryId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while updating the summary");
        }
    }

    /// <summary>
    /// Delete a summary
    /// </summary>
    /// <param name="id">Summary ID to delete</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>No content on success</returns>
    /// <response code="204">Summary deleted successfully</response>
    /// <response code="400">Invalid ID format or missing user ID</response>
    /// <response code="404">Summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> DeleteSummary(
        [Required] Guid id,
        [FromQuery, Required] Guid userId)
    {
        try
        {
            _logger.LogInformation("Deleting summary {SummaryId} for user {UserId}", id, userId);
            
            var deleted = await _summaryService.DeleteSummaryAsync(id, userId);
            
            if (!deleted)
            {
                _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", id, userId);
                return NotFound("Summary not found or access denied");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting summary {SummaryId} for user {UserId}", id, userId);
            return StatusCode(500, "An error occurred while deleting the summary");
        }
    }

    // ============================================================================
    // Action Item Management Endpoints
    // ============================================================================

    /// <summary>
    /// Add an action item to a summary
    /// </summary>
    /// <param name="summaryId">Summary ID to add action item to</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Action item data</param>
    /// <returns>The created action item</returns>
    /// <response code="201">Action item added successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="404">Summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("{summaryId}/actionitems")]
    [ProducesResponseType(typeof(SavedActionItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SavedActionItemDto>> AddActionItem(
        [Required] Guid summaryId,
        [FromQuery, Required] Guid userId,
        [FromBody, Required] SaveActionItemRequest request)
    {
        try
        {
            _logger.LogInformation("Adding action item to summary {SummaryId} for user {UserId}", summaryId, userId);
            
            var actionItem = await _summaryService.AddActionItemAsync(summaryId, userId, request);
            
            if (actionItem == null)
            {
                _logger.LogWarning("Summary {SummaryId} not found for user {UserId}", summaryId, userId);
                return NotFound("Summary not found or access denied");
            }

            return CreatedAtAction(
                nameof(GetSummary), 
                new { id = summaryId, userId }, 
                actionItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding action item to summary {SummaryId} for user {UserId}", summaryId, userId);
            return StatusCode(500, "An error occurred while adding the action item");
        }
    }

    /// <summary>
    /// Update an action item
    /// </summary>
    /// <param name="summaryId">Summary ID that owns the action item</param>
    /// <param name="itemId">Action item ID to update</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <param name="request">Update data</param>
    /// <returns>The updated action item</returns>
    /// <response code="200">Action item updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="404">Action item or summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpPut("{summaryId}/actionitems/{itemId}")]
    [ProducesResponseType(typeof(SavedActionItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SavedActionItemDto>> UpdateActionItem(
        [Required] Guid summaryId,
        [Required] Guid itemId,
        [FromQuery, Required] Guid userId,
        [FromBody, Required] UpdateSavedActionItemRequest request)
    {
        try
        {
            _logger.LogInformation("Updating action item {ActionItemId} in summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
            
            var actionItem = await _summaryService.UpdateActionItemAsync(summaryId, itemId, userId, request);
            
            if (actionItem == null)
            {
                _logger.LogWarning("Action item {ActionItemId} not found in summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
                return NotFound("Action item not found or access denied");
            }

            return Ok(actionItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating action item {ActionItemId} in summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
            return StatusCode(500, "An error occurred while updating the action item");
        }
    }

    /// <summary>
    /// Delete an action item
    /// </summary>
    /// <param name="summaryId">Summary ID that owns the action item</param>
    /// <param name="itemId">Action item ID to delete</param>
    /// <param name="userId">User ID for ownership verification</param>
    /// <returns>No content on success</returns>
    /// <response code="204">Action item deleted successfully</response>
    /// <response code="400">Invalid ID format or missing user ID</response>
    /// <response code="404">Action item or summary not found or not owned by user</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{summaryId}/actionitems/{itemId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> DeleteActionItem(
        [Required] Guid summaryId,
        [Required] Guid itemId,
        [FromQuery, Required] Guid userId)
    {
        try
        {
            _logger.LogInformation("Deleting action item {ActionItemId} from summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
            
            var deleted = await _summaryService.DeleteActionItemAsync(summaryId, itemId, userId);
            
            if (!deleted)
            {
                _logger.LogWarning("Action item {ActionItemId} not found in summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
                return NotFound("Action item not found or access denied");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting action item {ActionItemId} from summary {SummaryId} for user {UserId}", itemId, summaryId, userId);
            return StatusCode(500, "An error occurred while deleting the action item");
        }
    }
}