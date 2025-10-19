using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.RegularExpressions;
using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Email;

/// <summary>
/// Azure Communication Services implementation of the email service
/// </summary>
public class AzureCommunicationEmailService : IEmailService
{
    private readonly EmailClient _emailClient;
    private readonly AzureCommunicationEmailOptions _options;
    private readonly ILogger<AzureCommunicationEmailService> _logger;

    public AzureCommunicationEmailService(
        EmailClient emailClient,
        IOptions<AzureCommunicationEmailOptions> options,
        ILogger<AzureCommunicationEmailService> logger)
    {
        _emailClient = emailClient ?? throw new ArgumentNullException(nameof(emailClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        // Validate configuration on startup
        ValidateConfiguration();
    }

    /// <summary>
    /// Send an email using Azure Communication Services
    /// </summary>
    public async Task<SendEmailResponse> SendEmailAsync(SendEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Attempting to send email to {RecipientCount} recipients via ACS", request.Recipients.Count);
            
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

            // Generate content based on request type (same logic as SendGrid)
            _logger.LogInformation("Email request debug - HasMeetingSummary: {HasSummary}, HasContent: {HasContent}, HasTranscript: {HasTranscript}, IncludeTranscript: {IncludeTranscript}", 
                request.MeetingSummary != null, !string.IsNullOrEmpty(request.Content), request.TranscriptData != null, request.IncludeTranscript);
            
            if (request.MeetingSummary != null) 
            {
                _logger.LogInformation("MeetingSummary details - ID: {SummaryId}, Overview length: {OverviewLength}", 
                    request.MeetingSummary.SummaryId, request.MeetingSummary.MeetingOverview?.Length ?? 0);
            }
            
            string htmlContent;
            string plainTextContent;

            // Generate content using existing template logic
            if (request.MeetingSummary != null && request.TranscriptData != null && request.IncludeTranscript)
            {
                // Summary + Transcript scenario
                _logger.LogInformation("Generating email with Summary + Transcript template");
                htmlContent = GenerateSummaryWithTranscriptTemplate(request.MeetingSummary, request.SpeakerMappings, request.TranscriptData);
            }
            else if (request.TranscriptData != null)
            {
                // Transcript-only scenario
                if (request.MeetingSummary != null)
                {
                    _logger.LogInformation("Generating email with Summary + Transcript template (transcript prioritized)");
                    htmlContent = GenerateSummaryWithTranscriptTemplate(request.MeetingSummary, request.SpeakerMappings, request.TranscriptData);
                }
                else
                {
                    _logger.LogInformation("Generating email with Transcript-only template");
                    htmlContent = GenerateTranscriptOnlyTemplate(request.TranscriptData, request.SpeakerMappings);
                }
            }
            else if (request.MeetingSummary != null)
            {
                // Summary-only scenario
                _logger.LogInformation("Generating email with Summary-only HTML template (MeetingSummary provided)");
                htmlContent = GenerateMeetingSummaryTemplate(request.MeetingSummary, request.SpeakerMappings);
            }
            else if (!string.IsNullOrEmpty(request.Content))
            {
                // Use provided content for non-summary emails (fallback)
                _logger.LogInformation("Using provided content (plain text/markdown) for email (no MeetingSummary)");
                if (request.Content.Contains("<html>") || request.Content.Contains("<body>"))
                {
                    htmlContent = request.Content;
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

            // Create ACS email message
            var emailContent = new EmailContent(request.Subject)
            {
                Html = htmlContent,
                PlainText = plainTextContent
            };

            var emailRecipients = new EmailRecipients(
                to: request.Recipients.Select(email => new EmailAddress(email)).ToList()
            );

            var emailMessage = new EmailMessage(
                senderAddress: _options.FromEmail,
                content: emailContent,
                recipients: emailRecipients
            );

            // Send the email with retry logic
            var response = await SendWithRetryAsync(emailMessage);
            
            if (response != null)
            {
                var messageId = response.ToString(); // Fallback to string representation
                _logger.LogInformation("Email sent successfully via ACS to {RecipientCount} recipients. Response: {Response}", 
                    request.Recipients.Count, messageId);
                
                return new SendEmailResponse
                {
                    Success = true,
                    Message = "Email sent successfully via Azure Communication Services",
                    MessageId = messageId,
                    RecipientsCount = request.Recipients.Count,
                    SentAt = DateTime.UtcNow
                };
            }
            else
            {
                var errorMessage = "ACS email send failed - no response received";
                _logger.LogError("ACS email send failed: {ErrorMessage}", errorMessage);
                
                return new SendEmailResponse
                {
                    Success = false,
                    Message = "Email send failed",
                    ErrorDetails = errorMessage
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email via Azure Communication Services");
            return new SendEmailResponse
            {
                Success = false,
                Message = "Email send failed due to an error",
                ErrorDetails = ex.Message
            };
        }
    }

    /// <summary>
    /// Send email with retry logic
    /// </summary>
    private async Task<Azure.Communication.Email.EmailSendResult?> SendWithRetryAsync(EmailMessage emailMessage)
    {
        for (int attempt = 1; attempt <= _options.MaxRetryAttempts; attempt++)
        {
            try
            {
                var operation = await _emailClient.SendAsync(WaitUntil.Completed, emailMessage);
                return operation.Value;
            }
            catch (RequestFailedException ex) when (attempt < _options.MaxRetryAttempts)
            {
                _logger.LogWarning("ACS email send attempt {Attempt} failed: {Error}. Retrying in {Delay} seconds...", 
                    attempt, ex.Message, _options.RetryDelaySeconds);
                await Task.Delay(TimeSpan.FromSeconds(_options.RetryDelaySeconds));
            }
        }
        return null;
    }

    /// <summary>
    /// Generate a professional HTML email template for meeting summaries
    /// Copied from SendGrid implementation to maintain compatibility
    /// </summary>
    public string GenerateMeetingSummaryTemplate(MeetingSummary summary, List<Models.SpeakerMapping>? speakerMappings = null)
    {
        var sb = new StringBuilder();
        
        // Build the HTML email template (exact copy from SendGrid service)
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("    <meta charset=\"UTF-8\">");
        sb.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        sb.AppendLine("    <title>Meeting Summary</title>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f4f4f4; }");
        sb.AppendLine("        .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
        sb.AppendLine("        .header { background-color: #3498db; color: #ffffff; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }");
        sb.AppendLine("        .content { padding: 30px; }");
        sb.AppendLine("        .metadata { background-color: #ecf0f1; padding: 20px; border-radius: 4px; margin-bottom: 25px; color: #000000; }");
        sb.AppendLine("        .section { margin-bottom: 30px; }");
        sb.AppendLine("        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; font-size: 22px; margin-bottom: 15px; }");
        sb.AppendLine("        .section h3 { color: #34495e; font-size: 18px; margin-bottom: 10px; }");
        sb.AppendLine("        .participants { background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        .participants ul { margin: 0; padding-left: 20px; }");
        sb.AppendLine("        .discussion { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .action-items { background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .action-items ul { margin: 0; padding-left: 20px; }");
        sb.AppendLine("        .decisions { background-color: #d1ecf1; padding: 20px; border-left: 4px solid #17a2b8; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .decisions ul { margin: 0; padding-left: 20px; }");
        sb.AppendLine("        .footer { background-color: #34495e; color: #ffffff; padding: 20px; text-align: center; font-size: 14px; }");
        sb.AppendLine("        .disclaimer { background-color: #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; color: #000000; font-size: 14px; }");
        sb.AppendLine("        ul, ol { margin: 10px 0; }");
        sb.AppendLine("        li { margin: 5px 0; }");
        sb.AppendLine("        p { margin: 10px 0; }");
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
        sb.AppendLine($"                <strong>Meeting:</strong> {FormatTextForHtml("Meeting Summary")}<br>");
        sb.AppendLine($"                <strong>Generated:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC<br>");
        if (summary.Metadata.Duration.HasValue)
        {
            sb.AppendLine($"                <strong>Duration:</strong> {FormatDuration(summary.Metadata.Duration.Value)}<br>");
        }
        sb.AppendLine("            </div>");
        
        // Meeting Overview
        if (!string.IsNullOrEmpty(summary.MeetingOverview))
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>📝 Meeting Overview</h2>");
            sb.AppendLine($"                <div class=\"discussion\">{FormatTextForHtml(summary.MeetingOverview)}</div>");
            sb.AppendLine("            </div>");
        }
        
        // Participants
        if (summary.Metadata.Participants?.Any() == true)
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>👥 Participants</h2>");
            sb.AppendLine("                <div class=\"participants\">");
            
            // Apply speaker mappings if available
            var participantsList = summary.Metadata.Participants.ToList();
            if (speakerMappings?.Any() == true)
            {
                participantsList = ApplySpeakerMappings(participantsList, speakerMappings);
            }
            
            sb.AppendLine("                    <ul>");
            foreach (var participant in participantsList)
            {
                sb.AppendLine($"                        <li>{FormatTextForHtml(participant)}</li>");
            }
            sb.AppendLine("                    </ul>");
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        // Action Items (new model structure)
        if (summary.ActionItemsByRole?.Any() == true || summary.UnassignedActionItems?.Any() == true)
        {
            sb.AppendLine("            <div class=\"section\">");
            sb.AppendLine("                <h2>✅ Action Items</h2>");
            sb.AppendLine("                <div class=\"action-items\">");
            
            // Action items by role
            if (summary.ActionItemsByRole != null)
            {
                foreach (var roleGroup in summary.ActionItemsByRole)
                {
                if (roleGroup.ActionItems?.Any() == true)
                {
                    var displayName = !string.IsNullOrEmpty(roleGroup.SpeakerName) ? roleGroup.SpeakerName : roleGroup.SpeakerId;
                    sb.AppendLine($"                    <h4>{FormatTextForHtml(displayName)}</h4>");
                    sb.AppendLine("                    <ul>");
                    foreach (var item in roleGroup.ActionItems)
                    {
                        sb.AppendLine($"                        <li>{FormatTextForHtml(item.Description)}</li>");
                    }
                    sb.AppendLine("                    </ul>");
                }
            }
            
            // Unassigned action items
            if (summary.UnassignedActionItems?.Any() == true)
            {
                sb.AppendLine("                    <h4>Unassigned Items</h4>");
                sb.AppendLine("                    <ul>");
                foreach (var item in summary.UnassignedActionItems)
                {
                    sb.AppendLine($"                        <li>{FormatTextForHtml(item.Description)}</li>");
                }
                sb.AppendLine("                    </ul>");
            }
            }
            
            sb.AppendLine("                </div>");
            sb.AppendLine("            </div>");
        }
        
        // AI Disclaimer
        sb.AppendLine("            <div class=\"disclaimer\">");
        sb.AppendLine("                <strong>⚠️ AI-Generated Content Notice:</strong> This summary was automatically generated using artificial intelligence. ");
        sb.AppendLine("                Please review for accuracy and completeness. Important details may require verification.");
        sb.AppendLine("            </div>");
        
        sb.AppendLine("        </div>");
        
        // Footer
        sb.AppendLine("        <div class=\"footer\">");
        sb.AppendLine("            <p>Generated by Meeting-Summary.io | Powered by Azure Communication Services</p>");
        sb.AppendLine("        </div>");
        
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// Generate HTML template for transcript-only emails
    /// Copied from SendGrid implementation to maintain compatibility
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
        sb.AppendLine("        .header { background-color: #6c5ce7; color: #ffffff; padding: 30px; text-align: center; }");
        sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }");
        sb.AppendLine("        .content { padding: 30px; }");
        sb.AppendLine("        .metadata { background-color: #ecf0f1; padding: 20px; border-radius: 4px; margin-bottom: 25px; color: #000000; }");
        sb.AppendLine("        .participants { background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin: 15px 0; color: #000000; }");
        sb.AppendLine("        .transcript { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 4px; color: #000000; }");
        sb.AppendLine("        .speaker { font-weight: bold; color: #2c3e50; margin-top: 15px; }");
        sb.AppendLine("        .timestamp { color: #7f8c8d; font-size: 12px; }");
        sb.AppendLine("        .footer { background-color: #34495e; color: #ffffff; padding: 20px; text-align: center; font-size: 14px; }");
        sb.AppendLine("        .disclaimer { background-color: #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; color: #000000; font-size: 14px; }");
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
        sb.AppendLine("            </div>");
        
        // Transcript content
        if (transcriptData.SpeakerSegments?.Any() == true)
        {
            sb.AppendLine("            <div class=\"transcript\">");
            sb.AppendLine("                <h3>📝 Transcript</h3>");
            
            foreach (var segment in transcriptData.SpeakerSegments)
            {
                var speakerName = GetMappedSpeakerName(segment.Speaker, speakerMappings) ?? segment.Speaker;
                sb.AppendLine($"                <div class=\"speaker\">{FormatTextForHtml(speakerName)}</div>");
                sb.AppendLine($"                <div>{FormatTextForHtml(segment.Text)}</div>");
            }
            
            sb.AppendLine("            </div>");
        }
        else if (!string.IsNullOrEmpty(transcriptData.TranscribedText))
        {
            sb.AppendLine("            <div class=\"transcript\">");
            sb.AppendLine("                <h3>📝 Transcript</h3>");
            sb.AppendLine($"                <div>{FormatTextForHtml(transcriptData.TranscribedText)}</div>");
            sb.AppendLine("            </div>");
        }
        
        // AI Disclaimer
        sb.AppendLine("            <div class=\"disclaimer\">");
        sb.AppendLine("                <strong>⚠️ AI-Generated Content Notice:</strong> This transcript was automatically generated using artificial intelligence. ");
        sb.AppendLine("                Please review for accuracy and completeness. Important details may require verification.");
        sb.AppendLine("            </div>");
        
        sb.AppendLine("        </div>");
        
        // Footer
        sb.AppendLine("        <div class=\"footer\">");
        sb.AppendLine("            <p>Generated by Meeting-Summary.io | Powered by Azure Communication Services</p>");
        sb.AppendLine("        </div>");
        
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }

    /// <summary>
    /// Generate HTML template for summary + transcript emails
    /// Copied from SendGrid implementation to maintain compatibility
    /// </summary>
    public string GenerateSummaryWithTranscriptTemplate(MeetingSummary summary, List<Models.SpeakerMapping>? speakerMappings = null, TranscriptEmailData? transcriptData = null)
    {
        // DEBUG: Log the summary content details
        _logger.LogInformation("DEBUG GenerateSummaryWithTranscriptTemplate - MeetingOverview: '{Overview}', Participants count: {ParticipantCount}, ActionItemsByRole count: {ActionItemsCount}, UnassignedActionItems count: {UnassignedCount}", 
            summary.MeetingOverview ?? "NULL", 
            summary.Metadata?.Participants?.Count ?? 0,
            summary.ActionItemsByRole?.Count ?? 0,
            summary.UnassignedActionItems?.Count ?? 0);
        
        if (transcriptData != null)
        {
            _logger.LogInformation("DEBUG TranscriptData - SpeakerSegments count: {SegmentCount}",
                transcriptData.SpeakerSegments?.Count ?? 0);
        }

        // Use the SendGrid approach - start with the existing summary template and insert transcript
        var summaryHtml = GenerateMeetingSummaryTemplate(summary, speakerMappings);

        // If no transcript data, return summary only
        if (transcriptData?.SpeakerSegments == null || transcriptData.SpeakerSegments.Count == 0)
        {
            _logger.LogInformation("DEBUG No transcript data - returning summary only");
            return summaryHtml;
        }

        // Insert transcript section before the closing footer/disclaimer
        var footerIndex = summaryHtml.LastIndexOf("<div class=\"footer\">");
        if (footerIndex == -1)
        {
            footerIndex = summaryHtml.LastIndexOf("<div class=\"disclaimer\">");
        }
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
            sb.AppendLine("                <h2>🎤 Full Transcript</h2>");
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

            // Add the rest of the original template (footer, disclaimer, etc.)
            sb.Append(summaryHtml.Substring(footerIndex));

            var result = sb.ToString();
            _logger.LogInformation("DEBUG Final template length: {Length} characters", result.Length);
            return result;
        }

        // Fallback: return summary template only
        _logger.LogWarning("DEBUG Could not find footer insertion point - returning summary only");
        return summaryHtml;
    }

    /// <summary>
    /// Convert HTML content to plain text with preserved formatting
    /// Copied from SendGrid implementation to maintain compatibility
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
        plainText = Regex.Replace(plainText, @"</?div[^>]*>", "\n", RegexOptions.IgnoreCase);
        
        // Replace line breaks
        plainText = Regex.Replace(plainText, @"<br\s*/?>\s*", "\n", RegexOptions.IgnoreCase);
        
        // Replace list items
        plainText = Regex.Replace(plainText, @"<li[^>]*>(.*?)</li>", "• $1\n", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        
        // Remove remaining HTML tags
        plainText = Regex.Replace(plainText, @"<[^>]+>", "", RegexOptions.IgnoreCase);
        
        // Decode HTML entities
        plainText = System.Net.WebUtility.HtmlDecode(plainText);
        
        // Clean up multiple line breaks
        plainText = Regex.Replace(plainText, @"\n\s*\n\s*\n", "\n\n");
        plainText = Regex.Replace(plainText, @"^\s+", "", RegexOptions.Multiline);
        
        return plainText.Trim();
    }

    /// <summary>
    /// Validate email addresses
    /// Copied from SendGrid implementation to maintain compatibility
    /// </summary>
    public (bool IsValid, List<string> InvalidEmails) ValidateEmailAddresses(List<string> emailAddresses)
    {
        var invalidEmails = new List<string>();
        
        foreach (var email in emailAddresses)
        {
            if (string.IsNullOrWhiteSpace(email) || !IsValidEmailFormat(email))
            {
                invalidEmails.Add(email);
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
            throw new InvalidOperationException($"Azure Communication Services configuration is invalid: {errors}");
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
    /// Format text for HTML display
    /// </summary>
    private static string FormatTextForHtml(string text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;
            
        return System.Net.WebUtility.HtmlEncode(text)
            .Replace("\n", "<br>")
            .Replace("\r", "");
    }

    /// <summary>
    /// Parse participants from text
    /// </summary>
    private static List<string> ParseParticipants(string participants)
    {
        if (string.IsNullOrEmpty(participants))
            return new List<string>();
        
        return participants.Split(new[] { '\n', '\r', ',' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim())
            .Where(p => !string.IsNullOrEmpty(p))
            .ToList();
    }

    /// <summary>
    /// Apply speaker mappings to participant list
    /// </summary>
    private static List<string> ApplySpeakerMappings(List<string> participants, List<Models.SpeakerMapping> speakerMappings)
    {
        var mappedParticipants = new List<string>();
        
        foreach (var participant in participants)
        {
            var mapping = speakerMappings.FirstOrDefault(m => 
                string.Equals(m.SpeakerId, participant, StringComparison.OrdinalIgnoreCase));
            
            if (mapping != null && !string.IsNullOrEmpty(mapping.Name))
            {
                mappedParticipants.Add(mapping.Name);
            }
            else
            {
                mappedParticipants.Add(participant);
            }
        }
        
        return mappedParticipants;
    }

    /// <summary>
    /// Get mapped speaker name
    /// </summary>
    private static string? GetMappedSpeakerName(string speakerId, List<Models.SpeakerMapping>? speakerMappings)
    {
        if (speakerMappings?.Any() != true)
            return null;
        
        var mapping = speakerMappings.FirstOrDefault(m => 
            string.Equals(m.SpeakerId, speakerId, StringComparison.OrdinalIgnoreCase));
        
        return mapping?.Name;
    }

    /// <summary>
    /// Format duration for display
    /// </summary>
    private static string FormatDuration(TimeSpan duration)
    {
        if (duration.TotalHours >= 1)
        {
            return $"{(int)duration.TotalHours}h {duration.Minutes}m";
        }
        else if (duration.TotalMinutes >= 1)
        {
            return $"{(int)duration.TotalMinutes}m {duration.Seconds}s";
        }
        else
        {
            return $"{duration.Seconds}s";
        }
    }
}