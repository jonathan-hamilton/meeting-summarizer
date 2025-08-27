using System.ComponentModel.DataAnnotations;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Email;

/// <summary>
/// SendGrid implementation of the email service
/// </summary>
public class SendGridEmailService : IEmailService
{
    private readonly ISendGridClient _sendGridClient;
    private readonly SendGridOptions _options;
    private readonly ILogger<SendGridEmailService> _logger;

    public SendGridEmailService(
        ISendGridClient sendGridClient,
        IOptions<SendGridOptions> options,
        ILogger<SendGridEmailService> logger)
    {
        _sendGridClient = sendGridClient ?? throw new ArgumentNullException(nameof(sendGridClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        // Validate configuration on startup
        ValidateConfiguration();
    }

    /// <summary>
    /// Send an email using SendGrid
    /// </summary>
    public async Task<SendEmailResponse> SendEmailAsync(SendEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Attempting to send email to {RecipientCount} recipients", request.Recipients.Count);
            
            // Validate email addresses
            var validation = ValidateEmailAddresses(request.Recipients);
            if (!validation.IsValid)
            {
                var errorMessage = $"Invalid email addresses: {string.Join(", ", validation.InvalidEmails)}";
                _logger.LogWarning("Email validation failed: {ErrorMessage}", errorMessage);
                return new SendEmailResponse
                {
                    Success = false,
                    Message = errorMessage,
                    ErrorDetails = "Email validation failed"
                };
            }

            // Create SendGrid message
            var from = new EmailAddress(_options.FromEmail, _options.FromName);
            var msg = new SendGridMessage
            {
                From = from,
                Subject = request.Subject,
                HtmlContent = request.Content,
                PlainTextContent = request.PlainTextContent ?? ConvertToPlainText(request.Content)
            };

            // Add recipients
            foreach (var recipient in request.Recipients)
            {
                msg.AddTo(new EmailAddress(recipient.Trim()));
            }

            // Add tracking and delivery settings
            msg.SetClickTracking(false, false);
            msg.SetOpenTracking(false);
            msg.SetGoogleAnalytics(false);
            msg.SetSubscriptionTracking(false);

            // Send the email
            var response = await _sendGridClient.SendEmailAsync(msg);
            
            if (response.IsSuccessStatusCode)
            {
                var messageId = response.Headers?.GetValues("X-Message-Id")?.FirstOrDefault();
                _logger.LogInformation("Email sent successfully to {RecipientCount} recipients. MessageId: {MessageId}", 
                    request.Recipients.Count, messageId);
                
                return new SendEmailResponse
                {
                    Success = true,
                    Message = "Email sent successfully",
                    MessageId = messageId,
                    RecipientsCount = request.Recipients.Count,
                    SentAt = DateTime.UtcNow
                };
            }
            else
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                _logger.LogError("SendGrid API error: {StatusCode} - {ErrorBody}", response.StatusCode, errorBody);
                
                return new SendEmailResponse
                {
                    Success = false,
                    Message = "Failed to send email",
                    ErrorDetails = $"SendGrid API error: {response.StatusCode} - {errorBody}"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending email");
            return new SendEmailResponse
            {
                Success = false,
                Message = "An unexpected error occurred while sending the email",
                ErrorDetails = ex.Message
            };
        }
    }

    /// <summary>
    /// Generate a professional HTML email template for meeting summaries
    /// </summary>
    public string GenerateMeetingSummaryTemplate(MeetingSummary summary, List<Models.SpeakerMapping>? speakerMappings = null)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("    <meta charset=\"UTF-8\">");
        sb.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        sb.AppendLine("    <title>Meeting Summary</title>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }");
        sb.AppendLine("        .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
        sb.AppendLine("        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }");
        sb.AppendLine("        .content { padding: 30px; }");
        sb.AppendLine("        .section { margin-bottom: 30px; }");
        sb.AppendLine("        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; font-size: 22px; margin-bottom: 15px; }");
        sb.AppendLine("        .section h3 { color: #34495e; font-size: 18px; margin-bottom: 10px; }");
        sb.AppendLine("        .summary-text { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; }");
        sb.AppendLine("        .key-points { background-color: #e8f5e8; padding: 20px; border-radius: 4px; margin: 15px 0; }");
        sb.AppendLine("        .action-items { background-color: #fff3cd; padding: 20px; border-radius: 4px; margin: 15px 0; }");
        sb.AppendLine("        .participants { background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin: 15px 0; }");
        sb.AppendLine("        ul { padding-left: 20px; }");
        sb.AppendLine("        li { margin-bottom: 8px; }");
        sb.AppendLine("        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }");
        sb.AppendLine("        .metadata { font-size: 14px; color: #7f8c8d; margin-bottom: 20px; }");
        sb.AppendLine("        .speaker { font-weight: bold; color: #2c3e50; }");
        sb.AppendLine("    </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("    <div class=\"container\">");
        
        // Header
        sb.AppendLine("        <div class=\"header\">");
        sb.AppendLine("            <h1>📋 Meeting Summary</h1>");
        sb.AppendLine("        </div>");
        
        // Content
        sb.AppendLine("        <div class=\"content\">");
        
        // Metadata
        sb.AppendLine("            <div class=\"metadata\">");
        sb.AppendLine($"                <strong>Generated:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC<br>");
        if (summary.TranscriptionId != null)
        {
            sb.AppendLine($"                <strong>Transcription ID:</strong> {summary.TranscriptionId}");
        }
        sb.AppendLine("            </div>");
        
        // Main Summary
        if (!string.IsNullOrWhiteSpace(summary.MeetingOverview))
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>📝 Meeting Overview</h2>");
            sb.AppendLine("                <div class=\"summary-text\">");
            sb.AppendLine($"                    {FormatTextForHtml(summary.MeetingOverview)}");
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        // Action Items by Role
        if (summary.ActionItemsByRole != null && summary.ActionItemsByRole.Any())
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>✅ Action Items by Role</h2>");
            foreach (var roleGroup in summary.ActionItemsByRole)
            {
                if (roleGroup.ActionItems != null && roleGroup.ActionItems.Any())
                {
                    sb.AppendLine("                <div class=\"action-items\">");
                    sb.AppendLine($"                    <h3>{FormatTextForHtml($"{roleGroup.SpeakerName} ({roleGroup.SpeakerRole})")}</h3>");
                    sb.AppendLine("                    <ul>");
                    foreach (var item in roleGroup.ActionItems)
                    {
                        sb.AppendLine($"                        <li>{FormatTextForHtml(item.Description)}</li>");
                    }
                    sb.AppendLine("                    </ul>");
                    sb.AppendLine("                </div>");
                }
            }
            sb.AppendLine("            </div>");
        }
        
        // Unassigned Action Items
        if (summary.UnassignedActionItems != null && summary.UnassignedActionItems.Any())
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>📋 Unassigned Action Items</h2>");
            sb.AppendLine("                <div class=\"action-items\">");
            sb.AppendLine("                    <ul>");
            foreach (var item in summary.UnassignedActionItems)
            {
                sb.AppendLine($"                        <li>{FormatTextForHtml(item.Description)}</li>");
            }
            sb.AppendLine("                    </ul>");
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        // Participants (if speaker mappings provided)
        if (speakerMappings != null && speakerMappings.Any())
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>👥 Meeting Participants</h2>");
            sb.AppendLine("                <div class=\"participants\">");
            foreach (var speaker in speakerMappings.Where(s => !string.IsNullOrWhiteSpace(s.Name)))
            {
                sb.AppendLine($"                    <div class=\"speaker\">{FormatTextForHtml(speaker.Name)}");
                if (!string.IsNullOrWhiteSpace(speaker.Email))
                {
                    sb.AppendLine($" ({FormatTextForHtml(speaker.Email)})");
                }
                sb.AppendLine("</div>");
            }
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        sb.AppendLine("        </div>");
        
        // Footer
        sb.AppendLine("        <div class=\"footer\">");
        sb.AppendLine("            <p>This meeting summary was automatically generated by Meeting Summarizer.</p>");
        sb.AppendLine("            <p>If you have any questions about this summary, please contact the meeting organizer.</p>");
        sb.AppendLine("        </div>");
        
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// Convert HTML content to plain text
    /// </summary>
    public string ConvertToPlainText(string htmlContent)
    {
        if (string.IsNullOrWhiteSpace(htmlContent))
            return string.Empty;
        
        // Remove HTML tags
        var plainText = Regex.Replace(htmlContent, "<.*?>", string.Empty);
        
        // Decode HTML entities
        plainText = System.Net.WebUtility.HtmlDecode(plainText);
        
        // Clean up whitespace
        plainText = Regex.Replace(plainText, @"\s+", " ");
        plainText = plainText.Trim();
        
        return plainText;
    }

    /// <summary>
    /// Validate email addresses
    /// </summary>
    public (bool IsValid, List<string> InvalidEmails) ValidateEmailAddresses(List<string> emailAddresses)
    {
        var invalidEmails = new List<string>();
        
        foreach (var email in emailAddresses)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                invalidEmails.Add("(empty)");
                continue;
            }
            
            try
            {
                var addr = new MailAddress(email.Trim());
                // Additional validation - check for valid format
                if (!IsValidEmailFormat(addr.Address))
                {
                    invalidEmails.Add(email.Trim());
                }
            }
            catch
            {
                invalidEmails.Add(email.Trim());
            }
        }
        
        return (invalidEmails.Count == 0, invalidEmails);
    }

    /// <summary>
    /// Validate configuration on startup
    /// </summary>
    private void ValidateConfiguration()
    {
        var context = new ValidationContext(_options);
        var results = new List<ValidationResult>();
        
        if (!Validator.TryValidateObject(_options, context, results, true))
        {
            var errors = string.Join(", ", results.Select(r => r.ErrorMessage));
            throw new InvalidOperationException($"SendGrid configuration is invalid: {errors}");
        }
    }

    /// <summary>
    /// Additional email format validation
    /// </summary>
    private static bool IsValidEmailFormat(string email)
    {
        const string emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
        return Regex.IsMatch(email, emailPattern);
    }

    /// <summary>
    /// Format text for HTML display (escape and handle line breaks)
    /// </summary>
    private static string FormatTextForHtml(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;
        
        // HTML encode to prevent XSS
        var encoded = System.Net.WebUtility.HtmlEncode(text);
        
        // Convert line breaks to HTML
        encoded = encoded.Replace("\r\n", "<br>").Replace("\n", "<br>").Replace("\r", "<br>");
        
        return encoded;
    }
}
