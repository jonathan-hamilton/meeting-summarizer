using System.ComponentModel.DataAnnotations;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Data.Enums;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Request model for creating a new user account
/// </summary>
public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    public bool IsPaidUser { get; set; } = false;

    [Range(0, 99999.99)]
    public decimal InitialTokenBalance { get; set; } = 0;

    [Required]
    public bool HasConsentedToDataProcessing { get; set; }

    /// <summary>
    /// Password for user authentication (optional for demo users)
    /// </summary>
    [StringLength(100, MinimumLength = 6)]
    public string? Password { get; set; }

    /// <summary>
    /// User role - defaults to User. Admin/SuperAdmin roles should be set explicitly.
    /// </summary>
    public UserRole Role { get; set; } = UserRole.User;
}

/// <summary>
/// Request model for updating user information
/// </summary>
public class UpdateUserRequest
{
    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    public bool? HasConsentedToDataProcessing { get; set; }
}

/// <summary>
/// Request model for creating a new meeting record
/// </summary>
public class CreateMeetingRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? AudioFileBlobUrl { get; set; }

    public long? FileSizeBytes { get; set; }

    public int? DurationSeconds { get; set; }
}

/// <summary>
/// Request model for updating meeting information
/// </summary>
public class UpdateMeetingRequest
{
    [StringLength(200)]
    public string? Title { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    public string? TranscriptionText { get; set; }

    public string? SummaryText { get; set; }

    public MeetingStatus? Status { get; set; }
}

/// <summary>
/// Request model for adding tokens to a user account
/// </summary>
public class AddTokensRequest
{
    [Required]
    [Range(0.01, 9999.99)]
    public decimal TokenAmount { get; set; }

    [StringLength(255)]
    public string? TransactionReference { get; set; }
}

/// <summary>
/// Response model for user information
/// </summary>
public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsPaidUser { get; set; }
    public decimal TokenBalance { get; set; }
    public bool HasConsentedToDataProcessing { get; set; }
    public DateTime? ConsentDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public int TotalMeetings { get; set; }
    public UserRole Role { get; set; }
}

/// <summary>
/// Response model for meeting information
/// </summary>
public class MeetingResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string? AudioFileBlobUrl { get; set; }
    public long? FileSizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public MeetingStatus Status { get; set; }
    public string? TranscriptionText { get; set; }
    public string? SummaryText { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessingStartedAt { get; set; }
    public DateTime? ProcessingCompletedAt { get; set; }
    
    // S6.5: Batch job progress information
    public Guid? BatchJobId { get; set; }
    public string? BatchJobStatus { get; set; }
    public int? ProgressPercentage { get; set; }
    public DateTime? ScheduledDeletionAt { get; set; }
}

/// <summary>
/// Response model for paginated meeting history
/// </summary>
public class MeetingHistoryResponse
{
    public IEnumerable<MeetingResponse> Meetings { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

/// <summary>
/// Response model for user statistics
/// </summary>
public class UserStatsResponse
{
    public Guid UserId { get; set; }
    public decimal TokenBalance { get; set; }
    public bool IsPaidUser { get; set; }
    public int TotalMeetings { get; set; }
    public int CompletedMeetings { get; set; }
    public int PendingMeetings { get; set; }
    public long TotalStorageUsed { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime AccountCreatedAt { get; set; }
}
