using Microsoft.AspNetCore.Mvc;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Health check controller for monitoring API status
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private static bool _isOpenAIEnabled = true; // Static toggle for OpenAI service

    public HealthController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

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
            Environment = _environment.EnvironmentName
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
            Environment = _environment.EnvironmentName,
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

    /// <summary>
    /// Get OpenAI service toggle status
    /// </summary>
    /// <returns>Current OpenAI service status</returns>
    [HttpGet("openai-status")]
    public ActionResult<object> GetOpenAIStatus()
    {
        return Ok(new
        {
            IsEnabled = _isOpenAIEnabled,
            ServiceType = _isOpenAIEnabled ? "OpenAI" : "Mock",
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Toggle OpenAI service on/off (Development only)
    /// </summary>
    /// <param name="enabled">Whether OpenAI should be enabled</param>
    /// <returns>Updated OpenAI service status</returns>
    [HttpPost("toggle-openai")]
    public ActionResult<object> ToggleOpenAI([FromBody] bool enabled)
    {
        if (!_environment.IsDevelopment())
        {
            return BadRequest(new { Error = "OpenAI toggle is only available in development mode" });
        }

        _isOpenAIEnabled = enabled;

        return Ok(new
        {
            IsEnabled = _isOpenAIEnabled,
            ServiceType = _isOpenAIEnabled ? "OpenAI" : "Mock",
            Message = $"OpenAI service {(_isOpenAIEnabled ? "enabled" : "disabled")}",
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get the current OpenAI toggle status for dependency injection
    /// </summary>
    /// <returns>Whether OpenAI is currently enabled</returns>
    public static bool IsOpenAIEnabled => _isOpenAIEnabled;
}
