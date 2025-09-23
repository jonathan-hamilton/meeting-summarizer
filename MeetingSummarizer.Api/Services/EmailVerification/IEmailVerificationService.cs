using System;
using System.Threading.Tasks;

namespace MeetingSummarizer.Api.Services.EmailVerification
{
    /// <summary>
    /// Service interface for email verification operations
    /// Handles secure token generation, validation, expiration, and rate limiting
    /// </summary>
    public interface IEmailVerificationService
    {
        /// <summary>
        /// Generates a cryptographically secure verification token for a user
        /// </summary>
        /// <param name="userId">The user ID to generate a token for</param>
        /// <returns>The verification token string</returns>
        Task<string> GenerateVerificationTokenAsync(Guid userId);

        /// <summary>
        /// Verifies an email verification token and marks the user's email as verified
        /// </summary>
        /// <param name="token">The verification token to validate</param>
        /// <returns>True if verification successful, false if token invalid/expired</returns>
        Task<bool> VerifyEmailTokenAsync(string token);

        /// <summary>
        /// Checks if a verification token has expired
        /// </summary>
        /// <param name="token">The token to check</param>
        /// <returns>True if token is expired, false if still valid</returns>
        Task<bool> IsTokenExpiredAsync(string token);

        /// <summary>
        /// Invalidates a verification token (single-use enforcement)
        /// </summary>
        /// <param name="token">The token to invalidate</param>
        /// <returns>True if invalidation successful</returns>
        Task<bool> InvalidateTokenAsync(string token);

        /// <summary>
        /// Checks if a user can request a new verification token (rate limiting)
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>True if user can request new token, false if rate limited</returns>
        Task<bool> CanRequestNewTokenAsync(Guid userId);

        /// <summary>
        /// Gets the current verification status for a user
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>True if user's email is verified, false otherwise</returns>
        Task<bool> IsEmailVerifiedAsync(Guid userId);

        /// <summary>
        /// Gets the verification token expiry time for a user
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>The expiry DateTime if token exists, null otherwise</returns>
        Task<DateTime?> GetTokenExpiryAsync(Guid userId);

        /// <summary>
        /// Generates and sends a verification email to the user
        /// </summary>
        /// <param name="userId">The user ID to send verification email to</param>
        /// <returns>True if email was sent successfully, false otherwise</returns>
        Task<bool> SendVerificationEmailAsync(Guid userId);
    }
}