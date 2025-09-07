using Azure.Core;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using MeetingSummarizer.Api.Models;
using Microsoft.Extensions.Options;

namespace MeetingSummarizer.Api.Services.Configuration;

/// <summary>
/// Service interface for Azure configuration management
/// </summary>
public interface IAzureConfigurationService
{
    Task<string> GetSecretAsync(string secretName);
    Task<string> GetStorageConnectionStringAsync();
    Task<bool> ValidateKeyVaultAccessAsync();
    bool IsKeyVaultEnabled();
}

/// <summary>
/// Service for managing Azure Key Vault configuration and secrets
/// </summary>
public class AzureConfigurationService : IAzureConfigurationService
{
    private readonly KeyVaultOptions _keyVaultOptions;
    private readonly AzureStorageOptions _storageOptions;
    private readonly ILogger<AzureConfigurationService> _logger;
    private readonly SecretClient? _secretClient;
    
    public AzureConfigurationService(
        IOptions<KeyVaultOptions> keyVaultOptions,
        IOptions<AzureStorageOptions> storageOptions,
        ILogger<AzureConfigurationService> logger)
    {
        _keyVaultOptions = keyVaultOptions.Value;
        _storageOptions = storageOptions.Value;
        _logger = logger;
        
        if (_keyVaultOptions.Enabled && _keyVaultOptions.IsValid())
        {
            try
            {
                var credential = CreateCredential();
                _secretClient = new SecretClient(new Uri(_keyVaultOptions.VaultUri), credential);
                _logger.LogInformation("Azure Key Vault client initialized for vault: {VaultUri}", _keyVaultOptions.VaultUri);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Key Vault client for vault: {VaultUri}", _keyVaultOptions.VaultUri);
                // Don't throw - allow graceful degradation
            }
        }
    }
    
    /// <summary>
    /// Retrieves a secret from Azure Key Vault
    /// </summary>
    public async Task<string> GetSecretAsync(string secretName)
    {
        if (_secretClient == null || !_keyVaultOptions.Enabled)
        {
            _logger.LogWarning("Key Vault is not available, cannot retrieve secret: {SecretName}", secretName);
            return string.Empty;
        }
        
        try
        {
            var response = await _secretClient.GetSecretAsync(secretName);
            _logger.LogDebug("Successfully retrieved secret: {SecretName}", secretName);
            return response.Value.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve secret from Key Vault: {SecretName}", secretName);
            return string.Empty;
        }
    }
    
    /// <summary>
    /// Gets Azure Storage connection string, from Key Vault if configured
    /// </summary>
    public async Task<string> GetStorageConnectionStringAsync()
    {
        if (_storageOptions.UseKeyVault && _keyVaultOptions.Enabled)
        {
            var connectionString = await GetSecretAsync(_storageOptions.KeyVaultSecretName);
            if (!string.IsNullOrEmpty(connectionString))
            {
                _logger.LogDebug("Retrieved storage connection string from Key Vault");
                return connectionString;
            }
            
            _logger.LogWarning("Failed to retrieve storage connection string from Key Vault, falling back to configuration");
        }
        
        return _storageOptions.ConnectionString;
    }
    
    /// <summary>
    /// Validates that Key Vault is accessible
    /// </summary>
    public async Task<bool> ValidateKeyVaultAccessAsync()
    {
        if (_secretClient == null || !_keyVaultOptions.Enabled)
        {
            return false;
        }
        
        try
        {
            // Try to list secrets to validate access (minimal permission test)
            var secrets = _secretClient.GetPropertiesOfSecretsAsync();
            await foreach (var secret in secrets)
            {
                // Just getting the first secret property is enough to validate access
                _logger.LogDebug("Key Vault access validated successfully");
                return true;
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Key Vault access validation failed");
            return false;
        }
    }
    
    /// <summary>
    /// Indicates whether Key Vault is enabled and configured
    /// </summary>
    public bool IsKeyVaultEnabled()
    {
        return _keyVaultOptions.Enabled && _secretClient != null;
    }
    
    /// <summary>
    /// Creates appropriate Azure credential based on configuration
    /// </summary>
    private TokenCredential CreateCredential()
    {
        if (_keyVaultOptions.UseManagedIdentity)
        {
            _logger.LogDebug("Using Managed Identity for Key Vault authentication");
            return new DefaultAzureCredential();
        }
        else
        {
            _logger.LogDebug("Using Service Principal for Key Vault authentication");
            return new ClientSecretCredential(
                _keyVaultOptions.TenantId,
                _keyVaultOptions.ClientId,
                _keyVaultOptions.ClientSecret);
        }
    }
}
