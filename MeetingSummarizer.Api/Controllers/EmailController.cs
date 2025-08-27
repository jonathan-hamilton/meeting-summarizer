using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Email;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for email functionality
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, ILogger<EmailController> logger)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Send an email with meeting summary
    /// </summary>
    /// <param name="request">Email request with recipients, subject, and content</param>
    /// <returns>Email send response</returns>
    [HttpPost("send")]
    public async Task<ActionResult<SendEmailResponse>> SendEmailAsync([FromBody] SendEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Received email send request for {RecipientCount} recipients", request.Recipients?.Count ?? 0);

            // Validate request
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                    
                _logger.LogWarning("Email request validation failed: {Errors}", string.Join(", ", errors));
                
                return BadRequest(new SendEmailResponse
                {
                    Success = false,
                    Message = "Validation failed",
                    ErrorDetails = string.Join(", ", errors)
                });
            }

            // Send email
            var response = await _emailService.SendEmailAsync(request);
            
            if (response.Success)
            {
                _logger.LogInformation("Email sent successfully to {RecipientCount} recipients", response.RecipientsCount);
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Email sending failed: {Message}", response.Message);
                return BadRequest(response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in email send endpoint");
            
            return StatusCode(500, new SendEmailResponse
            {
                Success = false,
                Message = "An unexpected error occurred while sending the email",
                ErrorDetails = ex.Message
            });
        }
    }

    /// <summary>
    /// Generate HTML email template for meeting summary
    /// </summary>
    /// <param name="request">Meeting summary data</param>
    /// <returns>Generated HTML email template</returns>
    [HttpPost("template")]
    public ActionResult<string> GenerateEmailTemplate([FromBody] GenerateTemplateRequest request)
    {
        try
        {
            _logger.LogInformation("Generating email template for meeting summary");

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                    
                return BadRequest($"Validation failed: {string.Join(", ", errors)}");
            }

            var template = _emailService.GenerateMeetingSummaryTemplate(request.Summary, request.SpeakerMappings);
            
            _logger.LogInformation("Email template generated successfully");
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating email template");
            return StatusCode(500, $"Error generating email template: {ex.Message}");
        }
    }

    /// <summary>
    /// Validate email addresses
    /// </summary>
    /// <param name="request">Email addresses to validate</param>
    /// <returns>Validation result</returns>
    [HttpPost("validate")]
    public ActionResult<EmailValidationResponse> ValidateEmails([FromBody] EmailValidationRequest request)
    {
        try
        {
            _logger.LogInformation("Validating {EmailCount} email addresses", request.EmailAddresses?.Count ?? 0);

            if (request.EmailAddresses == null || !request.EmailAddresses.Any())
            {
                return BadRequest(new EmailValidationResponse
                {
                    IsValid = false,
                    InvalidEmails = new List<string>(),
                    Message = "No email addresses provided"
                });
            }

            var validation = _emailService.ValidateEmailAddresses(request.EmailAddresses);
            
            var response = new EmailValidationResponse
            {
                IsValid = validation.IsValid,
                InvalidEmails = validation.InvalidEmails,
                ValidEmailCount = request.EmailAddresses.Count - validation.InvalidEmails.Count,
                Message = validation.IsValid 
                    ? "All email addresses are valid" 
                    : $"{validation.InvalidEmails.Count} invalid email address(es) found"
            };

            _logger.LogInformation("Email validation completed: {ValidCount} valid, {InvalidCount} invalid",
                response.ValidEmailCount, validation.InvalidEmails.Count);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating email addresses");
            return StatusCode(500, $"Error validating email addresses: {ex.Message}");
        }
    }
}

/// <summary>
/// Request model for generating email templates
/// </summary>
public class GenerateTemplateRequest
{
    /// <summary>
    /// Meeting summary data
    /// </summary>
    public MeetingSummary Summary { get; set; } = new();

    /// <summary>
    /// Speaker mappings for context
    /// </summary>
    public List<SpeakerMapping>? SpeakerMappings { get; set; }
}

/// <summary>
/// Request model for email validation
/// </summary>
public class EmailValidationRequest
{
    /// <summary>
    /// Email addresses to validate
    /// </summary>
    public List<string> EmailAddresses { get; set; } = new();
}

/// <summary>
/// Response model for email validation
/// </summary>
public class EmailValidationResponse
{
    /// <summary>
    /// Whether all emails are valid
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// List of invalid email addresses
    /// </summary>
    public List<string> InvalidEmails { get; set; } = new();

    /// <summary>
    /// Number of valid email addresses
    /// </summary>
    public int ValidEmailCount { get; set; }

    /// <summary>
    /// Validation message
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
