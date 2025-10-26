using Microsoft.AspNetCore.Mvc;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for iOS Safari debugging and tracking
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class IOSSafariDebugController : ControllerBase
{
    private readonly ILogger<IOSSafariDebugController> _logger;

    public IOSSafariDebugController(ILogger<IOSSafariDebugController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Track page loads from iOS Safari
    /// </summary>
    [HttpPost("pageload")]
    public IActionResult TrackPageLoad([FromBody] PageLoadRequest request)
    {
        var userAgent = Request.Headers["User-Agent"].ToString();
        var isIOSSafari = userAgent.Contains("iPhone") || userAgent.Contains("iPad");
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        
        _logger.LogInformation("🍎 iOS Safari Debug - Page Load [CorrelationId: {CorrelationId}] - Page: {Page}, UserAgent: {UserAgent}, IsIOSSafari: {IsIOSSafari}, ComponentDetected: {ComponentDetected}",
            correlationId, request.Page, userAgent, isIOSSafari, request.ComponentDetected);
            
        return Ok(new { correlationId, isIOSSafari, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Track file input interactions from iOS Safari
    /// </summary>
    [HttpPost("fileinput")]
    public IActionResult TrackFileInput([FromBody] FileInputRequest request)
    {
        var userAgent = Request.Headers["User-Agent"].ToString();
        var isIOSSafari = userAgent.Contains("iPhone") || userAgent.Contains("iPad");
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        
        _logger.LogInformation("🍎 iOS Safari Debug - File Input Event [CorrelationId: {CorrelationId}] - Event: {Event}, UserAgent: {UserAgent}, IsIOSSafari: {IsIOSSafari}, AcceptAttribute: {AcceptAttribute}",
            correlationId, request.Event, userAgent, isIOSSafari, request.AcceptAttribute);
            
        return Ok(new { correlationId, isIOSSafari, timestamp = DateTime.UtcNow });
    }
}

public class PageLoadRequest
{
    public string Page { get; set; } = string.Empty;
    public bool ComponentDetected { get; set; }
}

public class FileInputRequest
{
    public string Event { get; set; } = string.Empty;
    public string? AcceptAttribute { get; set; }
}