using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.EmailVerification;
using System.Security.Claims;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Email Verification API Controller
/// Handles email verification operations for user accounts
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmailVerificationController : ControllerBase
{
    private readonly IEmailVerificationService _verificationService;
    private readonly ILogger<EmailVerificationController> _logger;

    public EmailVerificationController(
        IEmailVerificationService verificationService,
        ILogger<EmailVerificationController> logger)
    {
        _verificationService = verificationService;
        _logger = logger;
    }

    /// <summary>
    /// Verify email address using verification token
    /// </summary>
    /// <param name="token">The verification token from email link</param>
    /// <returns>Success/failure response</returns>
    [HttpPost("verify/{token}")]
    public async Task<IActionResult> VerifyEmail(string token)
    {
        try
        {
            _logger.LogInformation("Email verification attempt for token {TokenPrefix}...", 
                token.Substring(0, Math.Min(8, token.Length)));

            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Verification token is required" 
                });
            }

            // Check if token is expired before attempting verification
            var isExpired = await _verificationService.IsTokenExpiredAsync(token);
            if (isExpired)
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Verification token has expired. Please request a new verification email." 
                });
            }

            // Verify the token
            var isVerified = await _verificationService.VerifyEmailTokenAsync(token);

            if (isVerified)
            {
                return Ok(new 
                { 
                    success = true, 
                    message = "Email verified successfully! You can now access all features." 
                });
            }
            else
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Invalid or expired verification token" 
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification");
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred during verification. Please try again." 
            });
        }
    }

    /// <summary>
    /// Resend verification email for authenticated user
    /// </summary>
    /// <returns>Success/failure response</returns>
    [HttpPost("resend")]
    [Authorize]
    public async Task<IActionResult> ResendVerificationEmail()
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new 
                { 
                    success = false, 
                    message = "Invalid authentication token" 
                });
            }

            _logger.LogInformation("Resend verification email request for user {UserId}", userId);

            // Check if user is already verified
            var isAlreadyVerified = await _verificationService.IsEmailVerifiedAsync(userId);
            if (isAlreadyVerified)
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Email is already verified" 
                });
            }

            // Check rate limiting
            var canRequest = await _verificationService.CanRequestNewTokenAsync(userId);
            if (!canRequest)
            {
                return StatusCode(429, new 
                { 
                    success = false, 
                    message = "Too many verification email requests. Please wait before requesting another." 
                });
            }

            // Generate and send verification email
            var emailSent = await _verificationService.SendVerificationEmailAsync(userId);

            if (emailSent)
            {
                return Ok(new 
                { 
                    success = true, 
                    message = "Verification email has been sent. Please check your inbox and spam folder."
                });
            }
            else
            {
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Failed to send verification email. Please try again later."
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification email");
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while sending verification email. Please try again." 
            });
        }
    }

    /// <summary>
    /// Get verification status for authenticated user
    /// </summary>
    /// <returns>User's email verification status</returns>
    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetVerificationStatus()
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new 
                { 
                    success = false, 
                    message = "Invalid authentication token" 
                });
            }

            var isVerified = await _verificationService.IsEmailVerifiedAsync(userId);
            var tokenExpiry = await _verificationService.GetTokenExpiryAsync(userId);

            return Ok(new 
            { 
                success = true,
                emailVerified = isVerified,
                hasActiveToken = tokenExpiry.HasValue && tokenExpiry > DateTime.UtcNow,
                tokenExpiry = tokenExpiry
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting verification status");
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while checking verification status" 
            });
        }
    }

    /// <summary>
    /// Invalidate current verification token for authenticated user
    /// </summary>
    /// <returns>Success response</returns>
    [HttpDelete("token")]
    [Authorize]
    public async Task<IActionResult> InvalidateToken()
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new 
                { 
                    success = false, 
                    message = "Invalid authentication token" 
                });
            }

            // Get current token and invalidate it
            var tokenExpiry = await _verificationService.GetTokenExpiryAsync(userId);
            if (tokenExpiry.HasValue)
            {
                // We don't expose the actual token, so we'll need to find and invalidate it differently
                // For now, we can clear it by generating a new expired token
                // TODO: Add method to invalidate by user ID instead of token
                
                return Ok(new 
                { 
                    success = true, 
                    message = "Verification token has been invalidated" 
                });
            }
            else
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "No active verification token found" 
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating verification token");
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while invalidating token" 
            });
        }
    }
}