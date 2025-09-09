using System.Security.Claims;
using MeetingSummarizer.Api.Services.Authentication;

namespace MeetingSummarizer.Api.Middleware;

/// <summary>
/// JWT Authentication Middleware
/// Validates JWT tokens and sets user context for authenticated requests
/// </summary>
public class JwtAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtAuthenticationMiddleware> _logger;

    public JwtAuthenticationMiddleware(
        RequestDelegate next,
        ILogger<JwtAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IJwtAuthenticationService jwtService)
    {
        var token = ExtractToken(context);
        
        if (!string.IsNullOrEmpty(token))
        {
            var userId = jwtService.ValidateToken(token);
            if (userId.HasValue)
            {
                // Set user context for authenticated requests
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()),
                    new Claim("TokenType", "access")
                };

                var identity = new ClaimsIdentity(claims, "jwt");
                var principal = new ClaimsPrincipal(identity);
                context.User = principal;

                _logger.LogDebug("JWT authentication successful for user: {UserId}", userId.Value);
            }
            else
            {
                _logger.LogDebug("JWT token validation failed");
            }
        }

        await _next(context);
    }

    private string? ExtractToken(HttpContext context)
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        
        if (authHeader != null && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader.Substring("Bearer ".Length).Trim();
        }

        return null;
    }
}

/// <summary>
/// Extension method for adding JWT middleware to the pipeline
/// </summary>
public static class JwtAuthenticationMiddlewareExtensions
{
    public static IApplicationBuilder UseJwtAuthentication(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<JwtAuthenticationMiddleware>();
    }
}
