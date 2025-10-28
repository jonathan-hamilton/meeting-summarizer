using Microsoft.AspNetCore.Mvc;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for version and environment information
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class VersionController : ControllerBase
{
    private readonly ILogger<VersionController> _logger;

    public VersionController(ILogger<VersionController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get current deployment version and environment info
    /// </summary>
    [HttpGet]
    public IActionResult GetVersion()
    {
        try
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var hostname = Request.Host.ToString();
            
            // Get version from assembly (consistent across all environments)
            var assembly = System.Reflection.Assembly.GetExecutingAssembly();
            var assemblyVersion = assembly.GetName().Version;
            var baseVersion = assemblyVersion?.ToString() ?? "1.2.0.0";
            
            // For container environments, append container revision if available
            var containerRevision = Environment.GetEnvironmentVariable("CONTAINER_APP_REVISION");
            var revision = !string.IsNullOrEmpty(containerRevision) 
                ? $"{baseVersion}-{containerRevision}" 
                : baseVersion;
            
            return Ok(new
            {
                revision = revision,
                environment = environment,
                hostname = hostname,
                timestamp = DateTime.UtcNow,
                version = baseVersion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get version information");
            return Ok(new
            {
                revision = "Error",
                environment = "Unknown",
                hostname = "Unknown",
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }
    }
}