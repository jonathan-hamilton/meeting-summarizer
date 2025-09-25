namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Configuration options for Stripe payment processing
/// </summary>
public class StripeOptions
{
    /// <summary>
    /// Configuration section name
    /// </summary>
    public const string SectionName = "Stripe";

    /// <summary>
    /// Stripe secret key (server-side)
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Stripe publishable key (client-side)
    /// </summary>
    public string PublishableKey { get; set; } = string.Empty;

    /// <summary>
    /// Webhook secret for signature validation
    /// </summary>
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>
    /// Whether to use Stripe test mode (true) or live mode (false)
    /// </summary>
    public bool IsTestMode { get; set; } = false;

    /// <summary>
    /// Whether to use Azure Key Vault for secrets (production only)
    /// </summary>
    public bool UseKeyVault { get; set; } = false;

    /// <summary>
    /// Key Vault secret name for Stripe secret key
    /// </summary>
    public string? SecretKeyVaultName { get; set; }

    /// <summary>
    /// Key Vault secret name for Stripe publishable key
    /// </summary>
    public string? PublishableKeyVaultName { get; set; }

    /// <summary>
    /// Key Vault secret name for webhook secret
    /// </summary>
    public string? WebhookSecretVaultName { get; set; }

    /// <summary>
    /// Validate that required configuration is present
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrEmpty(SecretKey) && 
               !string.IsNullOrEmpty(PublishableKey) && 
               !string.IsNullOrEmpty(WebhookSecret);
    }

    /// <summary>
    /// Get environment-appropriate description
    /// </summary>
    public string GetEnvironmentDescription()
    {
        return IsTestMode ? "Stripe Test Mode (Sandbox)" : "Stripe Live Mode (Production)";
    }
}