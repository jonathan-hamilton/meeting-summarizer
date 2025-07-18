using Microsoft.AspNetCore.Mvc;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Health check controller for monitoring API status
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Basic health check endpoint
    /// </summary>
    /// <returns>API status and version information</returns>
    [HttpGet]
    public ActionResult<object> GetHealth()
    {
        var healthStatus = new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0",
            Service = "MeetingSummarizer API",
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        };

        return Ok(healthStatus);
    }

    /// <summary>
    /// Detailed health check endpoint
    /// </summary>
    /// <returns>Detailed API status information</returns>
    [HttpGet("detailed")]
    public ActionResult<object> GetDetailedHealth()
    {
        var detailedHealth = new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0",
            Service = "MeetingSummarizer API",
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            UpTime = Environment.TickCount64,
            MachineName = Environment.MachineName,
            ProcessorCount = Environment.ProcessorCount,
            WorkingSet = Environment.WorkingSet,
            Dependencies = new
            {
                OpenAI = "Not yet configured", // Will be updated in future increments
                Database = "Not yet configured" // Will be updated in future increments
            }
        };

        return Ok(detailedHealth);
    }
}
