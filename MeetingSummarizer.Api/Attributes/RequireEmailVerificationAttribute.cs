using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using MeetingSummarizer.Api.Services.EmailVerification;

namespace MeetingSummarizer.Api.Attributes;

/// <summary>
/// Authorization filter that requires email verification for access
/// Must be used in combination with [Authorize] or JwtAuthorize attributes
/// </summary>
public class RequireEmailVerificationAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Check if user is authenticated (should be handled by [Authorize] first)
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new 
            { 
                success = false,
                message = "Authentication required",
                code = "AUTH_REQUIRED"
            });
            return;
        }

        // Get user ID from claims
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            context.Result = new UnauthorizedObjectResult(new 
            { 
                success = false,
                message = "Invalid authentication token",
                code = "INVALID_TOKEN"
            });
            return;
        }

        // Get email verification service from DI container
        var verificationService = context.HttpContext.RequestServices
            .GetService<IEmailVerificationService>();

        if (verificationService == null)
        {
            context.Result = new ObjectResult(new 
            { 
                success = false,
                message = "Email verification service unavailable",
                code = "SERVICE_UNAVAILABLE"
            })
            {
                StatusCode = 500
            };
            return;
        }

        try
        {
            // Check if user's email is verified
            var isEmailVerified = await verificationService.IsEmailVerifiedAsync(userId);

            if (!isEmailVerified)
            {
                // Get token expiry to provide helpful information
                var tokenExpiry = await verificationService.GetTokenExpiryAsync(userId);
                var hasActiveToken = tokenExpiry.HasValue && tokenExpiry > DateTime.UtcNow;

                context.Result = new ObjectResult(new 
                { 
                    success = false,
                    message = "Email verification required to access this feature",
                    code = "EMAIL_VERIFICATION_REQUIRED",
                    details = new
                    {
                        emailVerified = false,
                        hasActiveToken = hasActiveToken,
                        tokenExpiry = tokenExpiry,
                        actions = new
                        {
                            resendEmail = "/api/emailverification/resend",
                            checkStatus = "/api/emailverification/status"
                        }
                    }
                })
                {
                    StatusCode = 403
                };
                return;
            }

            // User is verified, allow access to continue
        }
        catch (Exception ex)
        {
            // Log error but don't expose internal details to client
            var logger = context.HttpContext.RequestServices
                .GetService<ILogger<RequireEmailVerificationAttribute>>();
            
            logger?.LogError(ex, "Error checking email verification status for user {UserId}", userId);

            context.Result = new ObjectResult(new 
            { 
                success = false,
                message = "Unable to verify email status. Please try again.",
                code = "VERIFICATION_CHECK_FAILED"
            })
            {
                StatusCode = 500
            };
            return;
        }
    }
}