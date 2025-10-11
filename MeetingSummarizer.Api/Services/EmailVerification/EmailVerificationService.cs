using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using System.Collections.Concurrent;
using MeetingSummarizer.Api.Services.Email;
using MeetingSummarizer.Api.Models;
using System.Text;

namespace MeetingSummarizer.Api.Services.EmailVerification
{
    /// <summary>
    /// Service for handling email verification operations with secure token management
    /// </summary>
    public class EmailVerificationService : IEmailVerificationService
    {
        private readonly MeetingSummarizerDbContext _context;
        private readonly ILogger<EmailVerificationService> _logger;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        
        // Rate limiting: Track verification email requests per user
        private static readonly ConcurrentDictionary<Guid, List<DateTime>> _requestHistory = new();
        private const int MaxRequestsPerHour = 3;
        private const int TokenExpiryHours = 24;

        public EmailVerificationService(
            MeetingSummarizerDbContext context,
            ILogger<EmailVerificationService> logger,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _configuration = configuration;
        }

        /// <summary>
        /// Generates a cryptographically secure verification token for a user
        /// </summary>
        public async Task<string> GenerateVerificationTokenAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Generating verification token for user {UserId}", userId);

                // Generate cryptographically secure token (32 bytes = 256 bits)
                var tokenBytes = new byte[32];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(tokenBytes);
                }
                var token = Convert.ToBase64String(tokenBytes);

                // Set expiration to 24 hours from now
                var expiry = DateTime.UtcNow.AddHours(TokenExpiryHours);

                // Update user with new token
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found when generating verification token", userId);
                    throw new InvalidOperationException($"User {userId} not found");
                }

                // Invalidate existing token and set new one
                user.EmailVerificationToken = token;
                user.EmailVerificationExpiry = expiry;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Verification token generated successfully for user {UserId}, expires at {Expiry}", 
                    userId, expiry);

                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating verification token for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Verifies an email verification token and marks the user's email as verified
        /// </summary>
        public async Task<bool> VerifyEmailTokenAsync(string token)
        {
            try
            {
                _logger.LogInformation("Verifying email token: {TokenPrefix}...", token.Substring(0, Math.Min(8, token.Length)));

                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("Empty token provided for verification");
                    return false;
                }

                // Find user with this token
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

                if (user == null)
                {
                    _logger.LogWarning("No user found with verification token {TokenPrefix}...", 
                        token.Substring(0, Math.Min(8, token.Length)));
                    return false;
                }

                // Check if token has expired
                if (user.EmailVerificationExpiry == null || user.EmailVerificationExpiry < DateTime.UtcNow)
                {
                    _logger.LogWarning("Verification token expired for user {UserId}. Expiry: {Expiry}", 
                        user.Id, user.EmailVerificationExpiry);
                    return false;
                }

                // Verify email and invalidate token (single-use)
                user.EmailVerified = true;
                user.EmailVerificationToken = null;
                user.EmailVerificationExpiry = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Email verification successful for user {UserId} ({Email})", 
                    user.Id, user.Email);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email token");
                return false;
            }
        }

        /// <summary>
        /// Checks if a verification token has expired
        /// </summary>
        public async Task<bool> IsTokenExpiredAsync(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return true;

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

                if (user == null || user.EmailVerificationExpiry == null)
                    return true;

                return user.EmailVerificationExpiry < DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking token expiration for token {TokenPrefix}...", 
                    token.Substring(0, Math.Min(8, token.Length)));
                return true; // Assume expired on error for security
            }
        }

        /// <summary>
        /// Invalidates a verification token (single-use enforcement)
        /// </summary>
        public async Task<bool> InvalidateTokenAsync(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return false;

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

                if (user == null)
                    return false;

                user.EmailVerificationToken = null;
                user.EmailVerificationExpiry = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Verification token invalidated for user {UserId}", user.Id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating token");
                return false;
            }
        }

        /// <summary>
        /// Checks if a user can request a new verification token (rate limiting)
        /// </summary>
        public Task<bool> CanRequestNewTokenAsync(Guid userId)
        {
            try
            {
                var now = DateTime.UtcNow;
                var oneHourAgo = now.AddHours(-1);

                // Get or create request history for this user
                var requests = _requestHistory.GetOrAdd(userId, _ => new List<DateTime>());

                // Clean up old requests (older than 1 hour)
                lock (requests)
                {
                    requests.RemoveAll(r => r < oneHourAgo);

                    // Check if user has exceeded rate limit
                    if (requests.Count >= MaxRequestsPerHour)
                    {
                        _logger.LogWarning("Rate limit exceeded for user {UserId}. Requests in last hour: {Count}", 
                            userId, requests.Count);
                        return Task.FromResult(false);
                    }

                    // Add current request
                    requests.Add(now);
                }

                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking rate limit for user {UserId}", userId);
                return Task.FromResult(false); // Deny on error for security
            }
        }

        /// <summary>
        /// Gets the current verification status for a user
        /// </summary>
        public async Task<bool> IsEmailVerifiedAsync(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                return user?.EmailVerified ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking verification status for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Gets the verification token expiry time for a user
        /// </summary>
        public async Task<DateTime?> GetTokenExpiryAsync(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                return user?.EmailVerificationExpiry;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting token expiry for user {UserId}", userId);
                return null;
            }
        }

        /// <summary>
        /// Generates and sends a verification email to the user
        /// </summary>
        public async Task<bool> SendVerificationEmailAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Sending verification email for user {UserId}", userId);

                // Get user details
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found when sending verification email", userId);
                    return false;
                }

                // Check if already verified
                if (user.EmailVerified)
                {
                    _logger.LogInformation("User {UserId} email already verified, skipping send", userId);
                    return true; // Consider this success since user is already verified
                }

                // Generate new verification token
                var token = await GenerateVerificationTokenAsync(userId);

                // Create verification URL using configured frontend base URL
                // URL encode the token to handle Base64 characters (+, /, =)
                var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "https://meeting-summary.io";
                var encodedToken = Uri.EscapeDataString(token);
                var verificationUrl = $"{frontendBaseUrl}/verify-email/{encodedToken}";

                // Generate email content
                var htmlContent = GenerateVerificationEmailTemplate(user.FirstName, user.LastName, verificationUrl);
                var plainTextContent = GenerateVerificationEmailPlainText(user.FirstName, user.LastName, verificationUrl);

                // Create email request
                var emailRequest = new SendEmailRequest
                {
                    Recipients = new List<string> { user.Email },
                    Subject = "Verify Your Meeting-Summary.io Account",
                    Content = htmlContent,
                    PlainTextContent = plainTextContent
                };

                // Send email
                var response = await _emailService.SendEmailAsync(emailRequest);

                if (response.Success)
                {
                    _logger.LogInformation("Verification email sent successfully to user {UserId} ({Email})", 
                        userId, user.Email);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send verification email to user {UserId}: {Error}", 
                        userId, response.Message);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending verification email for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Generates professional HTML email template for email verification
        /// </summary>
        private string GenerateVerificationEmailTemplate(string firstName, string lastName, string verificationUrl)
        {
            var sb = new StringBuilder();
            
            sb.AppendLine("<!DOCTYPE html>");
            sb.AppendLine("<html lang=\"en\">");
            sb.AppendLine("<head>");
            sb.AppendLine("    <meta charset=\"UTF-8\">");
            sb.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
            sb.AppendLine("    <title>Verify Your Email Address</title>");
            sb.AppendLine("    <style>");
            sb.AppendLine("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }");
            sb.AppendLine("        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }");
            sb.AppendLine("        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }");
            sb.AppendLine("        .header h1 { margin: 0; font-size: 28px; font-weight: 300; color: white; }");
            sb.AppendLine("        .content { padding: 30px; color: #333333; }");
            sb.AppendLine("        .welcome { font-size: 18px; margin-bottom: 20px; color: #2c3e50; font-weight: bold; }");
            sb.AppendLine("        .message { margin-bottom: 30px; line-height: 1.8; color: #333333; }");
            sb.AppendLine("        .message ul { color: #333333; }");
            sb.AppendLine("        .message li { color: #333333; margin: 8px 0; }");
            sb.AppendLine("        .cta-button { background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0; }");
            sb.AppendLine("        .cta-button:hover { background-color: #2980b9; }");
            sb.AppendLine("        .alt-link { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; word-break: break-all; color: #333333; }");
            sb.AppendLine("        .security-notice { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; color: #333333; }");
            sb.AppendLine("        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }");
            sb.AppendLine("    </style>");
            sb.AppendLine("</head>");
            sb.AppendLine("<body>");
            sb.AppendLine("    <div class=\"container\">");
            
            // Header - Make sure this is Email Verification, not Meeting Transcript
            sb.AppendLine("        <div class=\"header\">");
            sb.AppendLine("            <h1>📧 Email Verification</h1>");
            sb.AppendLine("        </div>");
            
            // Content
            sb.AppendLine("        <div class=\"content\">");
            sb.AppendLine($"            <div class=\"welcome\">Welcome to Meeting-Summary.io, {firstName}!</div>");
            
            sb.AppendLine("            <div class=\"message\">");
            sb.AppendLine("                Thank you for creating your account. To ensure the security of your account and enable all features, please verify your email address by clicking the button below:");
            sb.AppendLine("            </div>");
            
            // CTA Button
            sb.AppendLine("            <div style=\"text-align: center;\">");
            sb.AppendLine($"                <a href=\"{verificationUrl}\" class=\"cta-button\">✅ Verify Email Address</a>");
            sb.AppendLine("            </div>");
            
            sb.AppendLine("            <div class=\"message\">");
            sb.AppendLine("                Once verified, you'll be able to:");
            sb.AppendLine("                <ul>");
            sb.AppendLine("                    <li>Upload and process meeting recordings</li>");
            sb.AppendLine("                    <li>Purchase tokens for transcription services</li>");
            sb.AppendLine("                    <li>Save and manage your meeting summaries</li>");
            sb.AppendLine("                    <li>Access your complete meeting history</li>");
            sb.AppendLine("                </ul>");
            sb.AppendLine("            </div>");
            
            // Alternative link
            sb.AppendLine("            <div class=\"alt-link\">");
            sb.AppendLine("                <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>");
            sb.AppendLine($"                <span style=\"color: #0066cc;\">{verificationUrl}</span>");
            sb.AppendLine("            </div>");
            
            // Security notice
            sb.AppendLine("            <div class=\"security-notice\">");
            sb.AppendLine("                <strong>🔒 Security Notice:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with Meeting-Summary.io, please ignore this email.");
            sb.AppendLine("            </div>");
            
            sb.AppendLine("        </div>");
            
            // Footer
            sb.AppendLine("        <div class=\"footer\">");
            sb.AppendLine("            Need help? Contact us at support@meeting-summary.io<br>");
            sb.AppendLine("            Meeting-Summary.io - Transform your meetings into actionable insights");
            sb.AppendLine("        </div>");
            
            sb.AppendLine("    </div>");
            sb.AppendLine("</body>");
            sb.AppendLine("</html>");
            
            return sb.ToString();
        }

        /// <summary>
        /// Generates plain text version of verification email
        /// </summary>
        private string GenerateVerificationEmailPlainText(string firstName, string lastName, string verificationUrl)
        {
            var sb = new StringBuilder();
            
            sb.AppendLine($"Welcome to Meeting-Summary.io, {firstName}!");
            sb.AppendLine();
            sb.AppendLine("Thank you for creating your account. To ensure the security of your account and enable all features, please verify your email address.");
            sb.AppendLine();
            sb.AppendLine("Verify your email by visiting this link:");
            sb.AppendLine(verificationUrl);
            sb.AppendLine();
            sb.AppendLine("Once verified, you'll be able to:");
            sb.AppendLine("• Upload and process meeting recordings");
            sb.AppendLine("• Purchase tokens for transcription services");
            sb.AppendLine("• Save and manage your meeting summaries");
            sb.AppendLine("• Access your complete meeting history");
            sb.AppendLine();
            sb.AppendLine("SECURITY NOTICE: This verification link will expire in 24 hours for your security. If you didn't create an account with Meeting-Summary.io, please ignore this email.");
            sb.AppendLine();
            sb.AppendLine("Need help? Contact us at support@meeting-summary.io");
            sb.AppendLine("Meeting-Summary.io - Transform your meetings into actionable insights");
            
            return sb.ToString();
        }
    }
}