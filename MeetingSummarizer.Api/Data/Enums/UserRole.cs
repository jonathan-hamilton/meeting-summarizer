using System.ComponentModel;

namespace MeetingSummarizer.Api.Data.Enums;

/// <summary>
/// Defines the role levels for system users
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Regular user with standard permissions
    /// </summary>
    [Description("Regular User")]
    User = 0,
    
    /// <summary>
    /// Administrator with full system access
    /// </summary>
    [Description("Administrator")]
    Admin = 1,
    
    /// <summary>
    /// Super administrator with all permissions (for system management)
    /// </summary>
    [Description("Super Administrator")]
    SuperAdmin = 2
}
