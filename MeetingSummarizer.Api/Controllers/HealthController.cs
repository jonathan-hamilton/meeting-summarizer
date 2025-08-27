using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.Validation;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Health check controller for monitoring API status and Azure services
/// Enhanced for S4.3: Configuration Validation & System Reliability Improvements
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfigurationValidationService? _validationService;
    private static bool _isOpenAIEnabled = true; // Static toggle for OpenAI service

    public HealthController(
        IWebHostEnvironment environment,
        IConfigurationValidationService? validationService = null)
    {
        _environment = environment;
        _validationService = validationService;
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
    /// Get comprehensive Azure services health status (S4.3)
    /// </summary>
    /// <returns>Complete Azure services validation results</returns>
    [HttpGet("azure")]
    public async Task<IActionResult> GetAzureServicesHealth()
    {
        if (_validationService == null)
        {
            return StatusCode(501, new
            {
                Status = "Not Implemented",
                Message = "Configuration validation service not available",
                Timestamp = DateTime.UtcNow
            });
        }

        var correlationId = Guid.NewGuid().ToString("N")[..8];

        try
        {
            var validationResult = await _validationService.ValidateStartupConfigurationAsync();

            var healthStatus = new
            {
                Status = validationResult.IsValid ? "Healthy" : "Unhealthy",
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId,
                ValidationDuration = validationResult.ValidationDuration.TotalMilliseconds,
                Services = validationResult.ServiceResults.Select(s => new
                {
                    Name = s.ServiceName,
                    Status = s.IsValid ? "Healthy" : "Unhealthy",
                    Message = s.Message,
                    ValidationTime = s.ValidationTime.TotalMilliseconds,
                    WarningCount = s.Warnings.Count,
                    ErrorCount = s.Errors.Count
                }),
                Summary = validationResult.Summary
            };

            return validationResult.IsValid ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Status = "Error",
                Message = "Azure services health check failed",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Azure Speech Services health status (S4.3)
    /// </summary>
    /// <returns>Azure Speech Services validation details</returns>
    [HttpGet("azure/speech")]
    public async Task<IActionResult> GetAzureSpeechHealth()
    {
        if (_validationService == null)
        {
            return StatusCode(501, new
            {
                Status = "Not Implemented",
                Message = "Configuration validation service not available",
                Timestamp = DateTime.UtcNow
            });
        }

        var correlationId = Guid.NewGuid().ToString("N")[..8];

        try
        {
            var result = await _validationService.ValidateAzureSpeechServicesAsync();

            var healthStatus = new
            {
                ServiceName = result.ServiceName,
                Status = result.IsValid ? "Healthy" : "Unhealthy",
                Message = result.Message,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId,
                ValidationTime = result.ValidationTime.TotalMilliseconds,
                Details = result.Details,
                Warnings = result.Warnings,
                Errors = result.Errors
            };

            return result.IsValid ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                ServiceName = "Azure Speech Services",
                Status = "Error",
                Message = "Health check failed",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Azure Blob Storage health status (S4.3)
    /// </summary>
    /// <returns>Azure Blob Storage validation details</returns>
    [HttpGet("azure/storage")]
    public async Task<IActionResult> GetAzureStorageHealth()
    {
        if (_validationService == null)
        {
            return StatusCode(501, new
            {
                Status = "Not Implemented",
                Message = "Configuration validation service not available",
                Timestamp = DateTime.UtcNow
            });
        }

        var correlationId = Guid.NewGuid().ToString("N")[..8];

        try
        {
            var result = await _validationService.ValidateAzureSpeechServicesAsync();

            var healthStatus = new
            {
                ServiceName = result.ServiceName,
                Status = result.IsValid ? "Healthy" : "Unhealthy",
                Message = result.Message,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId,
                ValidationTime = result.ValidationTime.TotalMilliseconds,
                Details = result.Details,
                Warnings = result.Warnings,
                Errors = result.Errors
            };

            return result.IsValid ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                ServiceName = "Azure Blob Storage",
                Status = "Error",
                Message = "Health check failed",
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
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
