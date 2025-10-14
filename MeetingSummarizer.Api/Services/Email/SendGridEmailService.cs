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

            // Generate content based on request type (S6.5 Phase 3)
            _logger.LogInformation("Email request debug - HasMeetingSummary: {HasSummary}, HasContent: {HasContent}, HasTranscript: {HasTranscript}, IncludeTranscript: {IncludeTranscript}", 
                request.MeetingSummary != null, !string.IsNullOrEmpty(request.Content), request.TranscriptData != null, request.IncludeTranscript);
            
            if (request.MeetingSummary != null) 
            {
                _logger.LogInformation("MeetingSummary details - ID: {SummaryId}, Overview length: {OverviewLength}", 
                    request.MeetingSummary.SummaryId, request.MeetingSummary.MeetingOverview?.Length ?? 0);
            }
            
            string htmlContent;
            string plainTextContent;
            
            _logger.LogInformation("Email routing decision - IncludeTranscript: {IncludeTranscript}, TranscriptData null: {TranscriptNull}, MeetingSummary null: {SummaryNull}",
                request.IncludeTranscript, request.TranscriptData == null, request.MeetingSummary == null);
            
            if (request.IncludeTranscript && request.TranscriptData != null)
            {
                if (request.MeetingSummary != null)
                {
                    // Summary + Transcript scenario
                    _logger.LogInformation("Generating email with Summary + Transcript template");
                    htmlContent = GenerateSummaryWithTranscriptTemplate(request.MeetingSummary, request.SpeakerMappings, request.TranscriptData);
                }
                else
                {
                    // Transcript-only scenario
                    _logger.LogInformation("Generating email with Transcript-only template");
                    htmlContent = GenerateTranscriptOnlyTemplate(request.TranscriptData, request.SpeakerMappings);
                }
            }
            else if (request.MeetingSummary != null)
            {
                // Summary-only scenario - PRIORITIZE this over provided content
                _logger.LogInformation("Generating email with Summary-only HTML template (MeetingSummary provided)");
                htmlContent = GenerateMeetingSummaryTemplate(request.MeetingSummary, request.SpeakerMappings);
            }
            else if (!string.IsNullOrEmpty(request.Content))
            {
                // Use provided content for non-summary emails (fallback)
                _logger.LogInformation("Using provided content (plain text/markdown) for email (no MeetingSummary)");
                
                // Check if content is already formatted HTML (starts with <!DOCTYPE html>)
                if (request.Content.TrimStart().StartsWith("<!DOCTYPE html>", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Content is already formatted HTML, using as-is");
                    htmlContent = request.Content;
                }
                // Check if content contains transcript text and format it properly
                else if (request.Content.Contains("--- Full Meeting Transcript ---") || 
                    request.Content.Length > 500) // Likely transcript content
                {
                    _logger.LogInformation("Content appears to be transcript data, applying HTML formatting");
                    htmlContent = FormatContentAsHtml(request.Content);
                }
                else
                {
                    htmlContent = FormatTextForHtml(request.Content);
                }
            }
            else
            {
                throw new ArgumentException("No content provided for email");
            }

            plainTextContent = request.PlainTextContent ?? ConvertToPlainText(htmlContent);

            _logger.LogInformation("Email content generation complete. HTML length: {HtmlLength}, PlainText length: {PlainTextLength}", 
                htmlContent?.Length ?? 0, plainTextContent?.Length ?? 0);

            // Create SendGrid message
            var from = new EmailAddress(_options.FromEmail, _options.FromName);
            var msg = new SendGridMessage
            {
                From = from,
                Subject = request.Subject,
                HtmlContent = htmlContent,
                PlainTextContent = plainTextContent
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
        sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f4f4f4; }");
        sb.AppendLine("        .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
        sb.AppendLine("        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; color: white; }");
        sb.AppendLine("        .content { padding: 30px; background-color: #ffffff; color: #000000; }");
        sb.AppendLine("        .section { margin-bottom: 30px; }");
        sb.AppendLine("        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; font-size: 22px; margin-bottom: 15px; }");
        sb.AppendLine("        .section h3 { color: #34495e; font-size: 18px; margin-bottom: 10px; }");
        sb.AppendLine("        .summary-text { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .key-points { background-color: #e8f5e8; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        .action-items { background-color: #fff3cd; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        .participants { background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        ul { padding-left: 20px; }");
        sb.AppendLine("        li { margin-bottom: 8px; color: #000000; }");
        sb.AppendLine("        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }");
        sb.AppendLine("        .metadata { font-size: 14px; color: #7f8c8d; margin-bottom: 20px; }");
        sb.AppendLine("        .speaker { font-weight: bold; color: #2c3e50; }");
        sb.AppendLine("        p { color: #000000; }");
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
        sb.AppendLine($"                <strong>Generated:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC");
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
        sb.AppendLine("            <p>This meeting summary was automatically generated by Meeting-Summary.io.</p>");
        sb.AppendLine("            <p>If you have any questions about this summary, please contact the meeting organizer.</p>");
        sb.AppendLine("        </div>");
        
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// S6.5 Phase 3: Generate HTML template for transcript-only emails
    /// </summary>
    public string GenerateTranscriptOnlyTemplate(TranscriptEmailData transcriptData, List<Models.SpeakerMapping>? speakerMappings = null)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("    <meta charset=\"UTF-8\">");
        sb.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        sb.AppendLine("    <title>Meeting Transcript</title>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f4f4f4; }");
        sb.AppendLine("        .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
        sb.AppendLine("        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; color: white; }");
        sb.AppendLine("        .content { padding: 30px; background-color: #ffffff; color: #000000; }");
        sb.AppendLine("        .section { margin-bottom: 30px; }");
        sb.AppendLine("        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; font-size: 22px; margin-bottom: 15px; }");
        sb.AppendLine("        .section h3 { color: #34495e; font-size: 18px; margin-bottom: 10px; }");
        sb.AppendLine("        .participants { background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        .transcript { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .speaker-segment { margin-bottom: 15px; padding: 15px; background-color: #ffffff; border-radius: 4px; border-left: 3px solid #27ae60; color: #000000; }");
        sb.AppendLine("        .speaker-name { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }");
        sb.AppendLine("        .speaker-text { margin-left: 15px; color: #000000; line-height: 1.5; }");
        sb.AppendLine("        .metadata { font-size: 14px; color: #7f8c8d; margin-bottom: 20px; }");
        sb.AppendLine("        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }");
        sb.AppendLine("        .speaker { font-weight: bold; color: #2c3e50; }");
        sb.AppendLine("        ul { padding-left: 20px; color: #000000; }");
        sb.AppendLine("        li { margin-bottom: 8px; color: #000000; }");
        sb.AppendLine("        p { color: #000000; }");
        sb.AppendLine("    </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("    <div class=\"container\">");
        
        // Header
        sb.AppendLine("        <div class=\"header\">");
        sb.AppendLine("            <h1>🎤 Meeting Transcript</h1>");
        sb.AppendLine("        </div>");
        
        // Content
        sb.AppendLine("        <div class=\"content\">");
        
        // Metadata
        sb.AppendLine("            <div class=\"metadata\">");
        sb.AppendLine($"                <strong>File:</strong> {FormatTextForHtml(transcriptData.FileName)}<br>");
        sb.AppendLine($"                <strong>Generated:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC<br>");
        sb.AppendLine($"                <strong>Transcript ID:</strong> {transcriptData.TranscriptionId}");
        sb.AppendLine("            </div>");
        
        // Participants
        if (speakerMappings != null && speakerMappings.Count > 0)
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>👥 Meeting Participants</h2>");
            sb.AppendLine("                <div class=\"participants\">");
            sb.AppendLine("                    <ul>");
            
            foreach (var speaker in speakerMappings)
            {
                var displayName = !string.IsNullOrEmpty(speaker.Name) ? speaker.Name : speaker.SpeakerId;
                var role = !string.IsNullOrEmpty(speaker.Role) ? $" - {speaker.Role}" : "";
                sb.AppendLine($"                        <li><strong>{FormatTextForHtml(displayName)}</strong>{FormatTextForHtml(role)}</li>");
            }
            
            sb.AppendLine("                    </ul>");
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        // Transcript Content
        sb.AppendLine("            <div class=\"section\">");
        sb.AppendLine("                <h2>📄 Full Transcript</h2>");
        sb.AppendLine("                <div class=\"transcript\">");
        
        if (transcriptData.SpeakerSegments != null && transcriptData.SpeakerSegments.Count > 0)
        {
            // Format with speaker segments (one speaker per line/block)
            foreach (var segment in transcriptData.SpeakerSegments)
            {
                var speakerMapping = speakerMappings?.FirstOrDefault(m => m.SpeakerId == segment.Speaker);
                var speakerName = speakerMapping?.Name ?? segment.Speaker ?? "Unknown Speaker";
                
                sb.AppendLine("                    <div class=\"speaker-segment\">");
                sb.AppendLine($"                        <div class=\"speaker-name\">{FormatTextForHtml(speakerName)}:</div>");
                sb.AppendLine($"                        <div class=\"speaker-text\">{FormatTextForHtml(segment.Text)}</div>");
                sb.AppendLine("                    </div>");
            }
        }
        else if (!string.IsNullOrEmpty(transcriptData.TranscribedText))
        {
            // Fallback to formatted plain text - remove "Speaker X:" labels and format nicely
            var formattedText = FormatTranscriptText(transcriptData.TranscribedText);
            sb.AppendLine($"                    {formattedText}");
        }
        else
        {
            sb.AppendLine("                    <p><em>No transcript content available.</em></p>");
        }
        
        sb.AppendLine("                </div>");
        sb.AppendLine("            </div>");
        
        // Footer
        sb.AppendLine("            <div class=\"footer\">");
        sb.AppendLine("                <p><strong>Meeting-Summary.io</strong> | AI-Powered Meeting Transcription</p>");
        sb.AppendLine("                <p><em>This transcript was generated by AI and may require review for accuracy.</em></p>");
        sb.AppendLine("            </div>");
        
        sb.AppendLine("        </div>");
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// S6.5 Phase 3: Generate HTML template for summary + transcript emails
    /// </summary>
    public string GenerateSummaryWithTranscriptTemplate(MeetingSummary summary, List<Models.SpeakerMapping>? speakerMappings = null, TranscriptEmailData? transcriptData = null)
    {
        // Start with the existing summary template
        var summaryHtml = GenerateMeetingSummaryTemplate(summary, speakerMappings);
        
        // If no transcript data, return summary only
        if (transcriptData?.SpeakerSegments == null || transcriptData.SpeakerSegments.Count == 0)
        {
            return summaryHtml;
        }
        
        // Insert transcript section before the closing footer
        var footerIndex = summaryHtml.LastIndexOf("<div class=\"footer\">");
        if (footerIndex == -1)
        {
            footerIndex = summaryHtml.LastIndexOf("</div></body>");
        }
        
        if (footerIndex != -1)
        {
            var sb = new StringBuilder();
            sb.Append(summaryHtml.Substring(0, footerIndex));
            
            // Add transcript section
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>📄 Full Transcript</h2>");
            sb.AppendLine("                <div style=\"background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; color: #000000;\">");
            
            foreach (var segment in transcriptData.SpeakerSegments)
            {
                var speakerMapping = speakerMappings?.FirstOrDefault(m => m.SpeakerId == segment.Speaker);
                var speakerName = speakerMapping?.Name ?? segment.Speaker ?? "Unknown Speaker";
                
                sb.AppendLine("                    <div style=\"margin-bottom: 15px; padding: 10px; background-color: #fff; border-radius: 4px; border-left: 3px solid #27ae60; color: #000000;\">");
                sb.AppendLine($"                        <div style=\"font-weight: bold; color: #2c3e50; margin-bottom: 5px;\">{FormatTextForHtml(speakerName)}:</div>");
                sb.AppendLine($"                        <div style=\"margin-left: 15px; color: #000000;\">{FormatTextForHtml(segment.Text)}</div>");
                sb.AppendLine("                    </div>");
            }
            
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
            
            // Add the rest of the original template
            sb.Append(summaryHtml.Substring(footerIndex));
            
            return sb.ToString();
        }
        
        // Fallback: return original summary if insertion fails
        return summaryHtml;
    }

    /// <summary>
    /// Convert HTML content to plain text with preserved formatting
    /// </summary>
    public string ConvertToPlainText(string htmlContent)
    {
        if (string.IsNullOrWhiteSpace(htmlContent))
            return string.Empty;
        
        var plainText = htmlContent;
        
        // Replace headers with formatted equivalents
        plainText = Regex.Replace(plainText, @"<h[1-6][^>]*>(.*?)</h[1-6]>", "\n\n$1\n" + new string('=', 50) + "\n", RegexOptions.IgnoreCase);
        
        // Replace paragraph breaks with double line breaks
        plainText = Regex.Replace(plainText, @"</p>\s*<p[^>]*>", "\n\n", RegexOptions.IgnoreCase);
        plainText = Regex.Replace(plainText, @"</?p[^>]*>", "\n", RegexOptions.IgnoreCase);
        
        // Replace div breaks with line breaks
        plainText = Regex.Replace(plainText, @"</div>\s*<div[^>]*>", "\n", RegexOptions.IgnoreCase);
        plainText = Regex.Replace(plainText, @"</?div[^>]*>", "\n", RegexOptions.IgnoreCase);
        
        // Replace line breaks with actual line breaks
        plainText = Regex.Replace(plainText, @"<br\s*/?>\s*", "\n", RegexOptions.IgnoreCase);
        
        // Replace list items with bullets
        plainText = Regex.Replace(plainText, @"<li[^>]*>(.*?)</li>", "  • $1\n", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        plainText = Regex.Replace(plainText, @"</?[uo]l[^>]*>", "\n", RegexOptions.IgnoreCase);
        
        // Add spacing around sections
        plainText = Regex.Replace(plainText, @"<div[^>]*class=[""']section[""'][^>]*>", "\n\n", RegexOptions.IgnoreCase);
        
        // Remove remaining HTML tags
        plainText = Regex.Replace(plainText, "<.*?>", string.Empty);
        
        // Decode HTML entities
        plainText = System.Net.WebUtility.HtmlDecode(plainText);
        
        // Clean up excessive whitespace while preserving intentional line breaks
        plainText = Regex.Replace(plainText, @"[ \t]+", " "); // Replace multiple spaces/tabs with single space
        plainText = Regex.Replace(plainText, @"\n[ \t]+", "\n"); // Remove leading spaces on lines
        plainText = Regex.Replace(plainText, @"[ \t]+\n", "\n"); // Remove trailing spaces on lines
        plainText = Regex.Replace(plainText, @"\n{3,}", "\n\n"); // Replace 3+ newlines with 2
        
        return plainText.Trim();
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
    /// Format text for HTML display with improved paragraph structure
    /// </summary>
    private static string FormatTextForHtml(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;
        
        // HTML encode to prevent XSS
        var encoded = System.Net.WebUtility.HtmlEncode(text);
        
        // Convert line breaks to HTML
        encoded = encoded.Replace("\r\n", "<br>").Replace("\n", "<br>").Replace("\r", "<br>");
        
        // If it's a long paragraph without structure, try to break it up intelligently
        if (encoded.Length > 300 && !encoded.Contains("<br>"))
        {
            // Look for sentence boundaries that might indicate topic changes
            var sentences = encoded.Split(new[] { ". " }, StringSplitOptions.RemoveEmptyEntries);
            var result = new StringBuilder();
            var currentParagraph = new StringBuilder();
            
            foreach (var sentence in sentences)
            {
                var trimmedSentence = sentence.Trim();
                if (string.IsNullOrEmpty(trimmedSentence)) continue;
                
                // Add period back if it doesn't end with punctuation
                if (!trimmedSentence.EndsWith(".") && !trimmedSentence.EndsWith("!") && !trimmedSentence.EndsWith("?"))
                {
                    trimmedSentence += ".";
                }
                
                // Check if this sentence indicates a topic change
                bool isTopicTransition = trimmedSentence.StartsWith("The ", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Additionally", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Furthermore", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("In terms of", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Operational", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Technical", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Risks", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Finally", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Other", StringComparison.OrdinalIgnoreCase) ||
                                       trimmedSentence.StartsWith("Particular", StringComparison.OrdinalIgnoreCase);
                
                if (isTopicTransition && currentParagraph.Length > 0)
                {
                    // Close current paragraph and start new one
                    result.Append("<p>").Append(currentParagraph.ToString().Trim()).Append("</p>");
                    currentParagraph.Clear();
                }
                
                if (currentParagraph.Length > 0)
                {
                    currentParagraph.Append(" ");
                }
                currentParagraph.Append(trimmedSentence);
                
                // Also break on very long paragraphs (>400 chars)
                if (currentParagraph.Length > 400)
                {
                    result.Append("<p>").Append(currentParagraph.ToString().Trim()).Append("</p>");
                    currentParagraph.Clear();
                }
            }
            
            // Add any remaining content
            if (currentParagraph.Length > 0)
            {
                result.Append("<p>").Append(currentParagraph.ToString().Trim()).Append("</p>");
            }
            
            return result.Length > 0 ? result.ToString() : $"<p>{encoded}</p>";
        }
        
        return encoded;
    }

    /// <summary>
    /// Format transcript text by removing "Speaker X:" labels and improving readability
    /// </summary>
    private string FormatTranscriptText(string transcriptText)
    {
        if (string.IsNullOrWhiteSpace(transcriptText))
            return string.Empty;

        // Remove "Speaker X:" labels at the beginning of lines/sentences
        var lines = transcriptText.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        var formattedLines = new List<string>();

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrEmpty(trimmedLine)) continue;

            // Remove "Speaker X:" pattern at the beginning of the line
            var speakerPattern = @"^Speaker\s+\d+:\s*";
            var cleanedLine = Regex.Replace(trimmedLine, speakerPattern, "", RegexOptions.IgnoreCase);
            
            if (!string.IsNullOrWhiteSpace(cleanedLine))
            {
                formattedLines.Add(cleanedLine.Trim());
            }
        }

        // Join lines into paragraphs - break into new paragraphs every 2-3 sentences or logical breaks
        var result = new StringBuilder();
        var currentParagraph = new StringBuilder();
        var sentenceCount = 0;

        foreach (var line in formattedLines)
        {
            if (currentParagraph.Length > 0)
            {
                currentParagraph.Append(" ");
            }
            currentParagraph.Append(line);

            // Count sentences in this line
            var sentences = line.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);
            sentenceCount += sentences.Length;

            // Break into new paragraph after 2-3 sentences or if line ends with clear break indicators
            if (sentenceCount >= 3 || currentParagraph.Length > 300 || 
                line.EndsWith("?") || line.Contains("Yeah.") || line.Contains("Okay."))
            {
                if (currentParagraph.Length > 0)
                {
                    result.Append("<p>").Append(FormatTextForHtml(currentParagraph.ToString().Trim())).Append("</p>");
                    currentParagraph.Clear();
                    sentenceCount = 0;
                }
            }
        }

        // Add any remaining content
        if (currentParagraph.Length > 0)
        {
            result.Append("<p>").Append(FormatTextForHtml(currentParagraph.ToString().Trim())).Append("</p>");
        }

        return result.ToString();
    }

    /// <summary>
    /// Format content (especially transcript content) as HTML with proper structure
    /// </summary>
    private string FormatContentAsHtml(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        var sb = new StringBuilder();
        
        // Basic HTML structure for email
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("    <meta charset=\"UTF-8\">");
        sb.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        sb.AppendLine("    <title>Meeting Transcript</title>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f4f4f4; }");
        sb.AppendLine("        .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
        sb.AppendLine("        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; color: white; }");
        sb.AppendLine("        .content { padding: 30px; background-color: #ffffff; color: #000000; }");
        sb.AppendLine("        .transcript { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; color: #000000; font-size: 14px; }");
        sb.AppendLine("        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }");
        sb.AppendLine("        p { margin-bottom: 15px; color: #000000; font-size: 14px; }");
        sb.AppendLine("        .speaker-segment { margin-bottom: 15px; color: #000000; font-size: 14px; }");
        sb.AppendLine("        .speaker-label { font-weight: bold; color: #2c3e50; font-size: 14px; }");
        sb.AppendLine("        h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; font-size: 18px; }");
        sb.AppendLine("    </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("    <div class=\"container\">");
        
        // Header
        sb.AppendLine("        <div class=\"header\">");
        sb.AppendLine("            <h1>🎤 Meeting Transcript</h1>");
        sb.AppendLine("        </div>");
        
        // Content
        sb.AppendLine("        <div class=\"content\">");
        sb.AppendLine("            <div class=\"transcript\">");
        
        // Split content into sections and format
        var content_text = content;
        
        // First, handle section headers separately
        var sections = content_text.Split(new[] { "---" }, StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var section in sections)
        {
            var sectionText = section.Trim();
            if (string.IsNullOrEmpty(sectionText)) continue;
            
            // Check if this is a header section
            if (sectionText.Contains("Full Meeting Transcript") || sectionText.Contains("Meeting Information"))
            {
                sb.AppendLine($"                <h2>{FormatTextForHtml(sectionText)}</h2>");
                continue;
            }
            
            // Now split by speaker changes - look for any pattern like "Speaker X:" or "Name:"
            var speakerPattern = @"(?=(?:Speaker\s+\d+:|[A-Za-z]+\s*:))";
            var speakerSegments = System.Text.RegularExpressions.Regex.Split(sectionText, speakerPattern, 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToArray();
            
            foreach (var segment in speakerSegments)
            {
                var trimmedSegment = segment.Trim();
                if (string.IsNullOrEmpty(trimmedSegment)) continue;
                
                // Check if this segment starts with a speaker identifier
                var speakerMatch = System.Text.RegularExpressions.Regex.Match(trimmedSegment, 
                    @"^((?:Speaker\s+\d+|[A-Za-z]+)\s*:)\s*(.*)", 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Singleline);
                
                if (speakerMatch.Success)
                {
                    var speakerLabel = speakerMatch.Groups[1].Value.Trim();
                    var speakerText = speakerMatch.Groups[2].Value.Trim();
                    
                    if (!string.IsNullOrEmpty(speakerText))
                    {
                        sb.AppendLine($"                <p class=\"speaker-segment\"><span class=\"speaker-label\">{FormatTextForHtml(speakerLabel)}</span> {FormatTextForHtml(speakerText)}</p>");
                    }
                }
                else
                {
                    // Handle non-speaker content
                    sb.AppendLine($"                <p>{FormatTextForHtml(trimmedSegment)}</p>");
                }
            }
        }
        
        sb.AppendLine("            </div>");
        sb.AppendLine("        </div>");
        
        // Footer
        sb.AppendLine("        <div class=\"footer\">");
        sb.AppendLine("            <p><strong>Meeting-Summary.io</strong> | AI-Powered Meeting Transcription</p>");
        sb.AppendLine("            <p><em>This transcript was generated by AI and may require review for accuracy.</em></p>");
        sb.AppendLine("        </div>");
        
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// Format speaker text by highlighting the speaker label
    /// </summary>
    private string FormatSpeakerText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        // Use regex to find and format speaker labels
        var speakerPattern = @"(Speaker\s+\d+:)";
        var formatted = System.Text.RegularExpressions.Regex.Replace(text, speakerPattern, 
            "<span class=\"speaker-label\">$1</span>", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        return FormatTextForHtml(formatted);
    }
}
