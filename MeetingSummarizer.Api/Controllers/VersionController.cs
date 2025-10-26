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
            // Get revision from environment variable (set during deployment)
            var revision = Environment.GetEnvironmentVariable("CONTAINER_APP_REVISION") ?? "Unknown";
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown";
            var hostname = Request.Host.ToString();
            
            return Ok(new
            {
                revision = revision,
                environment = environment,
                hostname = hostname,
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
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