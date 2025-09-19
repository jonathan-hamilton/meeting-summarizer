using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Email;
using System.Security.Claims;
using System.Text.Json;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for email functionality
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // S6.5 Phase 3: Require authentication for all email endpoints
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;
    private readonly MeetingSummarizerDbContext _context; // S6.5 Phase 3: For transcript data access

    public EmailController(
        IEmailService emailService, 
        ILogger<EmailController> logger,
        MeetingSummarizerDbContext context)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _context = context ?? throw new ArgumentNullException(nameof(context));
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

    /// <summary>
    /// S6.5 Phase 3: Send transcript via email for authenticated users
    /// </summary>
    /// <param name="id">Meeting/Transcript ID</param>
    /// <param name="request">Email request with recipients and optional subject</param>
    /// <returns>Email send response</returns>
    [HttpPost("transcript/{id}")]
    public async Task<ActionResult<SendEmailResponse>> SendTranscriptEmailAsync(
        string id, 
        [FromBody] SendTranscriptEmailRequest request)
    {
        try
        {
            // Get current user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogWarning("Transcript email request without valid user ID");
                return Unauthorized("User authentication required");
            }

            _logger.LogInformation("Transcript email request for meeting {MeetingId} by user {UserId}", 
                id, userIdClaim);

            // Validate request
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                    
                _logger.LogWarning("Transcript email request validation failed: {Errors}", string.Join(", ", errors));
                
                return BadRequest(new SendEmailResponse
                {
                    Success = false,
                    Message = "Validation failed",
                    ErrorDetails = string.Join(", ", errors)
                });
            }

            // Parse meeting ID
            if (!Guid.TryParse(id, out var meetingId))
            {
                _logger.LogWarning("Invalid meeting ID format: {MeetingId}", id);
                return BadRequest("Invalid meeting ID format");
            }

            // Parse user ID
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid user ID in claims: {UserId}", userIdClaim);
                return Unauthorized("Invalid user authentication");
            }

            // Get meeting and verify user ownership
            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(m => m.Id == meetingId && m.UserId == userId);
                
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found or access denied for user {UserId}", 
                    id, userIdClaim);
                return NotFound("Meeting not found or access denied");
            }

            // Parse transcript data from meeting
            TranscriptEmailData? transcriptData = null;
            List<SpeakerMapping>? speakerMappings = null;
            
            if (!string.IsNullOrEmpty(meeting.TranscriptionJson))
            {
                try
                {
                    // Parse transcription JSON similar to DocumentService
                    var transcriptionDoc = JsonDocument.Parse(meeting.TranscriptionJson);
                    var speakerSegments = new List<TranscriptSpeakerSegment>();
                    
                    if (transcriptionDoc.RootElement.TryGetProperty("combinedRecognizedPhrases", out var phrasesElement))
                    {
                        foreach (var phrase in phrasesElement.EnumerateArray())
                        {
                            if (phrase.TryGetProperty("recognitionResult", out var result))
                            {
                                var speaker = result.TryGetProperty("speaker", out var spk) ? spk.GetString() ?? "Unknown" : "Unknown";
                                var text = result.TryGetProperty("displayText", out var txt) ? txt.GetString() ?? "" : "";
                                
                                if (!string.IsNullOrEmpty(text))
                                {
                                    speakerSegments.Add(new TranscriptSpeakerSegment
                                    {
                                        Speaker = speaker,
                                        Text = text
                                    });
                                }
                            }
                        }
                    }

                    transcriptData = new TranscriptEmailData
                    {
                        TranscriptionId = meeting.Id.ToString(),
                        FileName = meeting.OriginalFileName ?? meeting.Title,
                        TranscribedText = "", // Will be constructed from speaker segments
                        SpeakerSegments = speakerSegments
                    };
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to parse transcript JSON for meeting {MeetingId}", id);
                }
            }

            // Parse speaker mappings
            if (!string.IsNullOrEmpty(meeting.SpeakerMappingsJson))
            {
                try
                {
                    speakerMappings = JsonSerializer.Deserialize<List<SpeakerMapping>>(meeting.SpeakerMappingsJson);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to parse speaker mappings for meeting {MeetingId}", id);
                }
            }

            if (transcriptData == null)
            {
                return BadRequest(new SendEmailResponse
                {
                    Success = false,
                    Message = "No transcript data found for this meeting"
                });
            }

            // Create email request
            var emailRequest = new SendEmailRequest
            {
                Recipients = request.Recipients,
                Subject = request.Subject ?? $"Meeting Transcript - {transcriptData.FileName}",
                Content = "", // Will be generated by email service
                IncludeTranscript = true,
                TranscriptData = transcriptData,
                SpeakerMappings = speakerMappings
            };

            // Send email
            var response = await _emailService.SendEmailAsync(emailRequest);
            
            if (response.Success)
            {
                _logger.LogInformation("Transcript email sent successfully to {RecipientCount} recipients for meeting {MeetingId}", 
                    response.RecipientsCount, id);
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Transcript email sending failed for meeting {MeetingId}: {Message}", 
                    id, response.Message);
                return BadRequest(response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in transcript email endpoint for meeting {MeetingId}", id);
            
            return StatusCode(500, new SendEmailResponse
            {
                Success = false,
                Message = "An unexpected error occurred while sending the transcript email",
                ErrorDetails = ex.Message
            });
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
