using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Email;

/// <summary>
/// Interface for email service operations
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Send an email with the specified content
    /// </summary>
    /// <param name="request">Email request containing recipients, subject, and content</param>
    /// <returns>Response with send status and details</returns>
    Task<SendEmailResponse> SendEmailAsync(SendEmailRequest request);
    
    /// <summary>
    /// Generate a professional HTML email template for meeting summaries
    /// </summary>
    /// <param name="summary">Meeting summary data</param>
    /// <param name="speakerMappings">Speaker mapping information</param>
    /// <returns>HTML email content</returns>
    string GenerateMeetingSummaryTemplate(MeetingSummary summary, List<Models.SpeakerMapping>? speakerMappings = null);
    
    /// <summary>
    /// Convert HTML content to plain text for email clients that don't support HTML
    /// </summary>
    /// <param name="htmlContent">HTML content to convert</param>
    /// <returns>Plain text version</returns>
    string ConvertToPlainText(string htmlContent);
    
    /// <summary>
    /// Validate email addresses
    /// </summary>
    /// <param name="emailAddresses">List of email addresses to validate</param>
    /// <returns>Validation result with any invalid addresses</returns>
    (bool IsValid, List<string> InvalidEmails) ValidateEmailAddresses(List<string> emailAddresses);
}
