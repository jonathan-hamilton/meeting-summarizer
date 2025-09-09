using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using MeetingSummarizer.Api.Data.Enums;

namespace MeetingSummarizer.Api.Attributes;

/// <summary>
/// Authorization attribute that requires JWT authentication
/// </summary>
public class JwtAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    private readonly UserRole[] _allowedRoles;

    public JwtAuthorizeAttribute(params UserRole[] allowedRoles)
    {
        _allowedRoles = allowedRoles ?? new[] { UserRole.User, UserRole.Admin, UserRole.SuperAdmin };
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Check if user is authenticated
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Authentication required" });
            return;
        }

        // Get user ID from claims
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out _))
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Invalid authentication token" });
            return;
        }

        // Check role-based authorization if roles are specified
        if (_allowedRoles.Length > 0)
        {
            var roleClaim = user.FindFirst(ClaimTypes.Role);
            if (roleClaim == null || !Enum.TryParse<UserRole>(roleClaim.Value, out var userRole))
            {
                context.Result = new ForbiddenObjectResult(new { message = "Insufficient permissions" });
                return;
            }

            if (!_allowedRoles.Contains(userRole))
            {
                context.Result = new ForbiddenObjectResult(new { message = "Insufficient permissions" });
                return;
            }
        }
    }
}

/// <summary>
/// Authorization attribute for admin-only endpoints
/// </summary>
public class AdminOnlyAttribute : JwtAuthorizeAttribute
{
    public AdminOnlyAttribute() : base(UserRole.Admin, UserRole.SuperAdmin)
    {
    }
}

/// <summary>
/// Result for forbidden access
/// </summary>
public class ForbiddenObjectResult : ObjectResult
{
    public ForbiddenObjectResult(object value) : base(value)
    {
        StatusCode = 403;
    }
}
