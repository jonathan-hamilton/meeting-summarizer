using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Services.Authentication;

/// <summary>
/// Interface for JWT authentication operations
/// </summary>
public interface IJwtAuthenticationService
{
    /// <summary>
    /// Generate JWT access token for authenticated user
    /// </summary>
    /// <param name="user">User to generate token for</param>
    /// <returns>JWT access token string</returns>
    string GenerateAccessToken(User user);
    
    /// <summary>
    /// Generate JWT refresh token for user session management
    /// </summary>
    /// <param name="user">User to generate refresh token for</param>
    /// <returns>JWT refresh token string</returns>
    string GenerateRefreshToken(User user);
    
    /// <summary>
    /// Validate JWT token and extract user information
    /// </summary>
    /// <param name="token">JWT token to validate</param>
    /// <returns>User ID if valid, null if invalid</returns>
    Guid? ValidateToken(string token);
    
    /// <summary>
    /// Hash password with bcrypt for secure storage
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <returns>Tuple containing (passwordHash, salt)</returns>
    (string passwordHash, string salt) HashPassword(string password);
    
    /// <summary>
    /// Verify password against stored hash
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <param name="passwordHash">Stored password hash</param>
    /// <param name="salt">Stored salt (optional for bcrypt)</param>
    /// <returns>True if password matches, false otherwise</returns>
    bool VerifyPassword(string password, string passwordHash, string? salt = null);
}
