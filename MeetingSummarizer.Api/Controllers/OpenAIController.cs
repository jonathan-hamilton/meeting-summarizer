using Microsoft.AspNetCore.Mvc;

namespace MeetingSummarizer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OpenAIController : ControllerBase
{
    private static bool _isOpenAIEnabled = true; // Simple in-memory toggle
    private readonly ILogger<OpenAIController> _logger;

    public OpenAIController(ILogger<OpenAIController> logger)
    {
        _logger = logger;
    }

    [HttpGet("status")]
    public ActionResult<object> GetOpenAIStatus()
    {
        return Ok(new
        {
            isEnabled = _isOpenAIEnabled,
            mode = _isOpenAIEnabled ? "OpenAI" : "Mock"
        });
    }

    [HttpPost("toggle")]
    public ActionResult<object> ToggleOpenAI([FromBody] bool enabled)
    {
        _isOpenAIEnabled = enabled;
        _logger.LogInformation($"OpenAI mode toggled to: {(_isOpenAIEnabled ? "Enabled" : "Disabled")}");

        return Ok(new
        {
            isEnabled = _isOpenAIEnabled,
            mode = _isOpenAIEnabled ? "OpenAI" : "Mock",
            message = $"OpenAI {(_isOpenAIEnabled ? "enabled" : "disabled")} successfully"
        });
    }

    public static bool IsOpenAIEnabled => _isOpenAIEnabled;
}
