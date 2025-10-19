using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration options for Azure Communication Services email service
/// </summary>
public class AzureCommunicationEmailOptions
{
    public const string SectionName = "AzureCommunicationServices";
    
    /// <summary>
    /// Whether to use Azure Key Vault for connection string
    /// </summary>
    public bool UseKeyVault { get; set; } = true;
    
    /// <summary>
    /// Key Vault secret name for ACS connection string
    /// </summary>
    public string ConnectionStringSecretName { get; set; } = "ACS--ConnectionString";
    
    /// <summary>
    /// Azure Communication Services connection string
    /// </summary>
    [Required(ErrorMessage = "ACS Connection String is required")]
    public string ConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// Default "From" email address
    /// </summary>
    [Required(ErrorMessage = "From email is required")]
    [EmailAddress(ErrorMessage = "Invalid from email format")]
    public string FromEmail { get; set; } = "noreply@meeting-summary.io";
    
    /// <summary>
    /// Default "From" name for emails
    /// </summary>
    [Required(ErrorMessage = "From name is required")]
    public string FromName { get; set; } = "Meeting Summary";
    
    /// <summary>
    /// Maximum number of retry attempts for failed email sends
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;
    
    /// <summary>
    /// Delay between retry attempts in seconds
    /// </summary>
    public int RetryDelaySeconds { get; set; } = 2;
}