namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration options for Azure Blob Storage
/// </summary>
public class AzureStorageOptions
{
    public const string SectionName = "AzureStorage";

    /// <summary>
    /// Azure Storage account connection string
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Name of the blob container for audio files
    /// </summary>
    public string ContainerName { get; set; } = "audio-files";

    /// <summary>
    /// SAS token expiration time in hours (default: 24 hours)
    /// </summary>
    public int SasExpirationHours { get; set; } = 24;

    /// <summary>
    /// Validate the Azure Storage configuration
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(ConnectionString) &&
               !string.IsNullOrWhiteSpace(ContainerName);
    }

    /// <summary>
    /// Get masked connection string for logging
    /// </summary>
    public string GetMaskedConnectionString()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            return "Not configured";

        // Mask the AccountKey portion
        var parts = ConnectionString.Split(';');
        var maskedParts = new List<string>();

        foreach (var part in parts)
        {
            if (part.StartsWith("AccountKey=", StringComparison.OrdinalIgnoreCase))
            {
                maskedParts.Add("AccountKey=***masked***");
            }
            else
            {
                maskedParts.Add(part);
            }
        }

        return string.Join(";", maskedParts);
    }
}
