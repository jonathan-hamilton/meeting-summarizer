using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.UserManagement;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// User Management API Controller
/// Handles user account operations, token management, and meeting history
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userService;
    private readonly IUserStorageService _storageService;
    private readonly ILogger<UserManagementController> _logger;

    public UserManagementController(
        IUserManagementService userService,
        IUserStorageService storageService,
        ILogger<UserManagementController> logger)
    {
        _userService = userService;
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new user account
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserResponse>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request);
            var response = MapToUserResponse(user);
            
            _logger.LogInformation("Created new user: {UserId} ({Email})", user.Id, user.Email);
            return CreatedAtAction(nameof(GetUser), new { userId = user.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("User creation failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user account");
            return StatusCode(500, new { message = "An error occurred while creating the user account" });
        }
    }

    /// <summary>
    /// Get user information by ID
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserResponse>> GetUser(Guid userId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userService.UpdateUserActivityAsync(userId);
            return Ok(MapToUserResponse(user));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving user information" });
        }
    }

    /// <summary>
    /// Get user information by email
    /// </summary>
    [HttpGet("email/{email}")]
    public async Task<ActionResult<UserResponse>> GetUserByEmail(string email)
    {
        try
        {
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userService.UpdateUserActivityAsync(user.Id);
            return Ok(MapToUserResponse(user));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by email {Email}", email);
            return StatusCode(500, new { message = "An error occurred while retrieving user information" });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{userId:guid}")]
    public async Task<ActionResult<UserResponse>> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _userService.UpdateUserAsync(userId, request);
            return Ok(MapToUserResponse(user));
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while updating user information" });
        }
    }

    /// <summary>
    /// Add tokens to user account
    /// </summary>
    [HttpPost("{userId:guid}/tokens")]
    public async Task<ActionResult<UserResponse>> AddTokens(Guid userId, [FromBody] AddTokensRequest request)
    {
        try
        {
            var user = await _userService.AddTokensAsync(userId, request.TokenAmount);
            
            _logger.LogInformation("Added {TokenAmount} tokens to user {UserId}. Reference: {Reference}", 
                request.TokenAmount, userId, request.TransactionReference);
            
            return Ok(MapToUserResponse(user));
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding tokens to user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while adding tokens" });
        }
    }

    /// <summary>
    /// Get user account statistics
    /// </summary>
    [HttpGet("{userId:guid}/stats")]
    public async Task<ActionResult<UserStatsResponse>> GetUserStats(Guid userId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Get storage statistics
            var storageStats = await _storageService.GetStorageStatsAsync(userId);
            
            var stats = new UserStatsResponse
            {
                UserId = user.Id,
                TokenBalance = user.TokenBalance,
                IsPaidUser = user.IsPaidUser,
                TotalMeetings = user.Meetings.Count,
                CompletedMeetings = user.Meetings.Count(m => m.Status == MeetingStatus.Completed),
                PendingMeetings = user.Meetings.Count(m => m.Status != MeetingStatus.Completed),
                TotalStorageUsed = storageStats.TotalSizeBytes,
                LastActivityAt = user.LastActivityAt,
                AccountCreatedAt = user.CreatedAt
            };

            await _userService.UpdateUserActivityAsync(userId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user stats for {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving user statistics" });
        }
    }

    /// <summary>
    /// Get user's meeting history
    /// </summary>
    [HttpGet("{userId:guid}/meetings")]
    public async Task<ActionResult<MeetingHistoryResponse>> GetMeetingHistory(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 50)
    {
        try
        {
            if (pageSize > 100) pageSize = 100; // Limit page size
            if (page < 1) page = 1;

            var meetings = await _userService.GetUserMeetingHistoryAsync(userId, pageSize, page);
            var meetingResponses = meetings.Select(meeting =>
            {
                return MapToMeetingResponse(meeting);
            });

            // Get total count for pagination
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var totalCount = user.Meetings.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var response = new MeetingHistoryResponse
            {
                Meetings = meetingResponses,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };

            await _userService.UpdateUserActivityAsync(userId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving meeting history for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving meeting history" });
        }
    }

    /// <summary>
    /// Create a new meeting record
    /// </summary>
    [HttpPost("{userId:guid}/meetings")]
    public async Task<ActionResult<MeetingResponse>> CreateMeeting(
        Guid userId, 
        [FromBody] CreateUserMeetingRequest request)
    {
        try
        {
            var meeting = await _userService.CreateMeetingAsync(userId, request);
            var response = MapToMeetingResponse(meeting);
            
            return CreatedAtAction(nameof(GetMeeting), 
                new { userId = userId, meetingId = meeting.Id }, response);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating meeting for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while creating the meeting record" });
        }
    }

    /// <summary>
    /// Get specific meeting information
    /// </summary>
    [HttpGet("{userId:guid}/meetings/{meetingId:guid}")]
    public async Task<ActionResult<MeetingResponse>> GetMeeting(Guid userId, Guid meetingId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var meeting = user.Meetings.FirstOrDefault(m => m.Id == meetingId);
            if (meeting == null)
            {
                return NotFound(new { message = "Meeting not found" });
            }

            await _userService.UpdateUserActivityAsync(userId);
            return Ok(MapToMeetingResponse(meeting));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving meeting {MeetingId} for user {UserId}", meetingId, userId);
            return StatusCode(500, new { message = "An error occurred while retrieving meeting information" });
        }
    }

    /// <summary>
    /// Update meeting information
    /// </summary>
    [HttpPut("{userId:guid}/meetings/{meetingId:guid}")]
    public async Task<ActionResult<MeetingResponse>> UpdateMeeting(
        Guid userId, 
        Guid meetingId, 
        [FromBody] UpdateMeetingRequest request)
    {
        try
        {
            var meeting = await _userService.UpdateMeetingAsync(userId, meetingId, request);
            return Ok(MapToMeetingResponse(meeting));
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating meeting {MeetingId} for user {UserId}", meetingId, userId);
            return StatusCode(500, new { message = "An error occurred while updating meeting information" });
        }
    }

    /// <summary>
    /// Delete user account and all associated data (GDPR compliance)
    /// </summary>
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeleteUserAccount(Guid userId)
    {
        try
        {
            // First delete all user's blob storage data
            await _storageService.DeleteAllUserDataAsync(userId);
            
            // Then delete database records
            var deleted = await _userService.DeleteUserAccountAsync(userId);
            
            if (!deleted)
            {
                return NotFound(new { message = "User not found" });
            }

            _logger.LogWarning("GDPR: Deleted user account and all associated data: {UserId}", userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user account {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while deleting the user account" });
        }
    }

    /// <summary>
    /// Check if user can afford a transaction (token validation)
    /// </summary>
    [HttpPost("{userId:guid}/validate-tokens")]
    public async Task<ActionResult<bool>> ValidateTokenBalance(Guid userId, [FromBody] decimal requiredTokens)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var canAfford = user.TokenBalance >= requiredTokens;
            return Ok(new { canAfford, currentBalance = user.TokenBalance, requiredTokens });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token balance for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while validating token balance" });
        }
    }

    /// <summary>
    /// Deduct tokens from user account (for processing operations)
    /// </summary>
    [HttpPost("{userId:guid}/deduct-tokens")]
    public async Task<ActionResult<UserResponse>> DeductTokens(Guid userId, [FromBody] decimal tokenAmount)
    {
        try
        {
            var success = await _userService.DeductTokensAsync(userId, tokenAmount);
            if (!success)
            {
                return BadRequest(new { message = "Insufficient tokens" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            return Ok(MapToUserResponse(user!));
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deducting tokens from user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while deducting tokens" });
        }
    }

    #region Helper Methods

    private static UserResponse MapToUserResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsPaidUser = user.IsPaidUser,
            TokenBalance = user.TokenBalance,
            HasConsentedToDataProcessing = user.HasConsentedToDataProcessing,
            ConsentDate = user.ConsentDate,
            CreatedAt = user.CreatedAt,
            LastActivityAt = user.LastActivityAt,
            TotalMeetings = user.Meetings?.Count ?? 0,
            Role = user.Role
        };
    }

    private static MeetingResponse MapToMeetingResponse(Meeting meeting)
    {
        // Get the most recent batch job for this meeting (for progress tracking)
        var latestBatchJob = meeting.BatchTranscriptionJobs?
            .OrderByDescending(bj => bj.SubmittedAt)
            .FirstOrDefault();

        return new MeetingResponse
        {
            Id = meeting.Id,
            UserId = meeting.UserId,
            Title = meeting.Title,
            Description = meeting.Description,
            OriginalFileName = meeting.OriginalFileName,
            AudioFileBlobUrl = meeting.BlobStoragePath,
            FileSizeBytes = meeting.FileSizeBytes,
            DurationSeconds = meeting.DurationSeconds,
            Status = meeting.Status,
            TranscriptionText = meeting.TranscriptionJson,
            SummaryText = meeting.SummaryJson,
            CreatedAt = meeting.CreatedAt,
            ProcessingStartedAt = latestBatchJob?.SubmittedAt,
            ProcessingCompletedAt = meeting.CompletedAt,
            
            // S6.5: Include batch job progress information
            BatchJobId = latestBatchJob?.Id,
            BatchJobStatus = latestBatchJob?.Status,
            ProgressPercentage = latestBatchJob?.ProgressPercentage,
            ScheduledDeletionAt = meeting.ScheduledDeletionAt
        };
    }

    #endregion
}
