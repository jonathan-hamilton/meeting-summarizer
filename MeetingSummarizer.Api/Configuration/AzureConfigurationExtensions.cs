using Azure.Core;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Storage.Blobs;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Configuration;
using Microsoft.Extensions.Azure;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for configuring Azure services
/// </summary>
public static class AzureConfigurationExtensions
{
    /// <summary>
    /// Adds Azure Key Vault configuration if enabled
    /// </summary>
    public static IConfigurationBuilder AddAzureKeyVault(
        this IConfigurationBuilder builder,
        IConfiguration configuration)
    {
        var keyVaultOptions = new KeyVaultOptions();
        configuration.GetSection(KeyVaultOptions.SectionName).Bind(keyVaultOptions);
        
        if (keyVaultOptions.Enabled && keyVaultOptions.IsValid())
        {
            TokenCredential credential;
            
            if (keyVaultOptions.UseManagedIdentity)
            {
                credential = new DefaultAzureCredential();
            }
            else
            {
                credential = new ClientSecretCredential(
                    keyVaultOptions.TenantId,
                    keyVaultOptions.ClientId,
                    keyVaultOptions.ClientSecret);
            }
            
            builder.AddAzureKeyVault(new Uri(keyVaultOptions.VaultUri), credential);
        }
        
        return builder;
    }
    
    /// <summary>
    /// Adds Azure configuration services to the service collection
    /// </summary>
    public static IServiceCollection AddAzureConfigurationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure options
        services.Configure<KeyVaultOptions>(
            configuration.GetSection(KeyVaultOptions.SectionName));
        
        services.Configure<AzureStorageOptions>(
            configuration.GetSection(AzureStorageOptions.SectionName));
        
        // Register Azure configuration service
        services.AddScoped<IAzureConfigurationService, AzureConfigurationService>();
        
        return services;
    }
    
    /// <summary>
    /// Updates database connection string from Key Vault if configured
    /// </summary>
    public static async Task<string> GetDatabaseConnectionStringAsync(
        this IAzureConfigurationService azureConfig,
        IConfiguration fallbackConfiguration,
        string keyVaultSecretName = "DatabaseConnectionString")
    {
        if (azureConfig.IsKeyVaultEnabled())
        {
            var connectionString = await azureConfig.GetSecretAsync(keyVaultSecretName);
            if (!string.IsNullOrEmpty(connectionString))
            {
                return connectionString;
            }
        }
        
        // Fallback to configuration
        return fallbackConfiguration.GetConnectionString("DefaultConnection") ?? string.Empty;
    }
    
    /// <summary>
    /// Validates Azure configuration during startup
    /// </summary>
    public static async Task ValidateAzureConfigurationAsync(
        this IServiceScope scope,
        ILogger logger)
    {
        try
        {
            var azureConfig = scope.ServiceProvider.GetService<IAzureConfigurationService>();
            if (azureConfig?.IsKeyVaultEnabled() == true)
            {
                var isValid = await azureConfig.ValidateKeyVaultAccessAsync();
                if (isValid)
                {
                    logger.LogInformation("✅ Azure Key Vault access validated successfully");
                }
                else
                {
                    logger.LogWarning("⚠️ Azure Key Vault access validation failed - using fallback configuration");
                }
            }
            
            var keyVaultOptions = scope.ServiceProvider.GetService<Microsoft.Extensions.Options.IOptions<KeyVaultOptions>>();
            if (keyVaultOptions?.Value.Enabled == true)
            {
                var errors = keyVaultOptions.Value.GetValidationErrors().ToList();
                if (errors.Any())
                {
                    logger.LogError("❌ Key Vault configuration errors: {Errors}", string.Join("; ", errors));
                }
            }
            
            var storageOptions = scope.ServiceProvider.GetService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>();
            if (storageOptions != null)
            {
                var errors = storageOptions.Value.GetValidationErrors().ToList();
                if (errors.Any())
                {
                    logger.LogError("❌ Azure Storage configuration errors: {Errors}", string.Join("; ", errors));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to validate Azure configuration");
        }
    }

    /// <summary>
    /// Adds Azure Blob Storage client with managed identity support
    /// </summary>
    public static IServiceCollection AddAzureBlobStorage(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var azureStorageOptions = new AzureStorageOptions();
        configuration.GetSection("AzureStorage").Bind(azureStorageOptions);

        if (string.IsNullOrEmpty(azureStorageOptions.ConnectionString) && 
            string.IsNullOrEmpty(azureStorageOptions.AccountName))
        {
            // No storage configuration - register a placeholder that will log warnings
            services.AddSingleton<BlobServiceClient>(provider =>
            {
                var logger = provider.GetService<ILogger<BlobServiceClient>>();
                logger?.LogWarning("Azure Blob Storage is not configured. User storage features will not be available.");
                // Return a client that will fail gracefully
                return new BlobServiceClient("UseDevelopmentStorage=true"); // Azure Storage Emulator
            });
        }
        else if (!string.IsNullOrEmpty(azureStorageOptions.ConnectionString))
        {
            // Use connection string (development/testing) with extended timeouts for large files
            services.AddSingleton<BlobServiceClient>(provider =>
            {
                var options = new BlobClientOptions()
                {
                    Retry = {
                        NetworkTimeout = TimeSpan.FromMinutes(10), // 10 minutes for large file uploads
                        MaxRetries = 3,
                        Delay = TimeSpan.FromSeconds(30),
                        MaxDelay = TimeSpan.FromMinutes(2)
                    }
                };
                return new BlobServiceClient(azureStorageOptions.ConnectionString, options);
            });
        }
        else
        {
            // Use managed identity (production) with extended timeouts for large files
            var storageUri = $"https://{azureStorageOptions.AccountName}.blob.core.windows.net";
            services.AddSingleton<BlobServiceClient>(provider =>
            {
                var options = new BlobClientOptions()
                {
                    Retry = {
                        NetworkTimeout = TimeSpan.FromMinutes(10), // 10 minutes for large file uploads
                        MaxRetries = 3,
                        Delay = TimeSpan.FromSeconds(30),
                        MaxDelay = TimeSpan.FromMinutes(2)
                    }
                };
                return new BlobServiceClient(new Uri(storageUri), new DefaultAzureCredential(), options);
            });
        }

        return services;
    }
}
