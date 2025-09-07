namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Enhanced Azure Storage configuration with Key Vault integration
/// </summary>
public class AzureStorageOptions
{
    public const string SectionName = "AzureStorage";
    
    /// <summary>
    /// Azure Storage connection string (can be Key Vault secret name if using Key Vault)
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// Azure Storage account name (for managed identity authentication)
    /// </summary>
    public string AccountName { get; set; } = string.Empty;
    
    /// <summary>
    /// Default container name for audio files
    /// </summary>
    public string ContainerName { get; set; } = "audio-files";
    
    /// <summary>
    /// Container name for user-specific data (paid users)
    /// </summary>
    public string UserDataContainer { get; set; } = "user-data";
    
    /// <summary>
    /// Whether to use Key Vault for connection string
    /// </summary>
    public bool UseKeyVault { get; set; } = false;
    
    /// <summary>
    /// Key Vault secret name for storage connection string
    /// </summary>
    public string KeyVaultSecretName { get; set; } = "AzureStorageConnectionString";
    
    /// <summary>
    /// Storage tier lifecycle configuration
    /// </summary>
    public StorageTierOptions TierManagement { get; set; } = new();
    
    /// <summary>
    /// Validates Azure Storage configuration
    /// </summary>
    public bool IsValid()
    {
        return (!string.IsNullOrWhiteSpace(ConnectionString) ||
                !string.IsNullOrWhiteSpace(AccountName)) &&
               !string.IsNullOrWhiteSpace(ContainerName) &&
               !string.IsNullOrWhiteSpace(UserDataContainer);
    }
    
    /// <summary>
    /// Gets validation errors for Azure Storage configuration
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();
        
        if (string.IsNullOrWhiteSpace(ConnectionString))
        {
            errors.Add("Azure Storage connection string is required");
        }
        
        if (string.IsNullOrWhiteSpace(ContainerName))
        {
            errors.Add("Container name is required");
        }
        
        if (string.IsNullOrWhiteSpace(UserDataContainer))
        {
            errors.Add("User data container name is required");
        }
        
        if (UseKeyVault && string.IsNullOrWhiteSpace(KeyVaultSecretName))
        {
            errors.Add("Key Vault secret name is required when using Key Vault");
        }
        
        errors.AddRange(TierManagement.GetValidationErrors());
        
        return errors;
    }
}

/// <summary>
/// Configuration for Azure Blob Storage tier management
/// </summary>
public class StorageTierOptions
{
    /// <summary>
    /// Days after which to move blobs from Hot to Cool tier
    /// </summary>
    public int HotToCoolDays { get; set; } = 30;
    
    /// <summary>
    /// Days after which to move blobs from Cool to Archive tier
    /// </summary>
    public int CoolToArchiveDays { get; set; } = 180;
    
    /// <summary>
    /// Whether to enable automatic tier management
    /// </summary>
    public bool EnableAutoTiering { get; set; } = true;
    
    /// <summary>
    /// Validates storage tier configuration
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();
        
        if (HotToCoolDays <= 0)
        {
            errors.Add("Hot to Cool tier transition days must be greater than 0");
        }
        
        if (CoolToArchiveDays <= HotToCoolDays)
        {
            errors.Add("Cool to Archive tier transition days must be greater than Hot to Cool days");
        }
        
        return errors;
    }
}
