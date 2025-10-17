namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration model for Azure Key Vault integration
/// </summary>
public class KeyVaultOptions
{
    public const string SectionName = "KeyVault";
    
    /// <summary>
    /// Azure Key Vault URL (e.g., https://myvault.vault.azure.net/)
    /// </summary>
    public string VaultUri { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether Key Vault is enabled for this environment
    /// </summary>
    public bool Enabled { get; set; } = false;
    
    /// <summary>
    /// Client ID for service principal authentication (optional, uses managed identity if not provided)
    /// </summary>
    public string? ClientId { get; set; }
    
    /// <summary>
    /// Client secret for service principal authentication (optional, uses managed identity if not provided)
    /// </summary>
    public string? ClientSecret { get; set; }
    
    /// <summary>
    /// Tenant ID for authentication (optional, uses managed identity if not provided)
    /// </summary>
    public string? TenantId { get; set; }
    
    /// <summary>
    /// Whether to check environment variables for ClientSecret if not provided in config
    /// </summary>
    public bool UseEnvironmentVariable { get; set; } = false;
    
    /// <summary>
    /// Validates that required Key Vault configuration is present
    /// </summary>
    public bool IsValid()
    {
        if (!Enabled) return true; // If disabled, no validation needed
        
        return !string.IsNullOrWhiteSpace(VaultUri) && 
               Uri.TryCreate(VaultUri, UriKind.Absolute, out _);
    }
    
    /// <summary>
    /// Gets validation errors for Key Vault configuration
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();
        
        if (Enabled)
        {
            if (string.IsNullOrWhiteSpace(VaultUri))
            {
                errors.Add("Key Vault URI is required when Key Vault is enabled");
            }
            else if (!Uri.TryCreate(VaultUri, UriKind.Absolute, out _))
            {
                errors.Add("Key Vault URI must be a valid absolute URI");
            }
        }
        
        return errors;
    }
    
    /// <summary>
    /// Indicates whether to use managed identity (true) or service principal (false)
    /// </summary>
    public bool UseManagedIdentity => string.IsNullOrWhiteSpace(ClientId);
}
