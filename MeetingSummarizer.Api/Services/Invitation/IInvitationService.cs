using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Services.Invitation;

/// <summary>
/// Service interface for managing invitation codes in development environment
/// </summary>
public interface IInvitationService
{
    /// <summary>
    /// Generates a new invitation code
    /// </summary>
    /// <param name="email">Email restriction - only this email can use the code</param>
    /// <param name="createdByUserId">ID of the user creating the invitation</param>
    /// <param name="expirationDays">How many days until the code expires (default: 7)</param>
    /// <returns>The generated invitation code</returns>
    Task<InvitationCode> GenerateInvitationCodeAsync(string email, int createdByUserId, int expirationDays = 7);
    
    /// <summary>
    /// Validates an invitation code for use during registration
    /// </summary>
    /// <param name="code">The invitation code to validate</param>
    /// <param name="email">The email attempting to use the code</param>
    /// <returns>The valid invitation code if found and valid, null otherwise</returns>
    Task<InvitationCode?> ValidateInvitationCodeAsync(string code, string email);
    
    /// <summary>
    /// Marks an invitation code as used by a specific user
    /// </summary>
    /// <param name="code">The invitation code to mark as used</param>
    /// <param name="userId">The ID of the user who used the code</param>
    /// <returns>True if successfully marked as used, false otherwise</returns>
    Task<bool> MarkInvitationCodeAsUsedAsync(string code, Guid userId);
    
    /// <summary>
    /// Cleans up expired invitation codes
    /// </summary>
    /// <returns>Number of expired codes cleaned up</returns>
    Task<int> CleanupExpiredCodesAsync();
}