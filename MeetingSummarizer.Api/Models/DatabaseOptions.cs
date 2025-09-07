namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Configuration model for database connection settings
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "Database";
    
    /// <summary>
    /// SQL Server connection string for user data
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether to automatically run migrations on startup
    /// </summary>
    public bool AutoMigrate { get; set; } = false;
    
    /// <summary>
    /// Command timeout for database operations (seconds)
    /// </summary>
    public int CommandTimeoutSeconds { get; set; } = 30;
    
    /// <summary>
    /// Maximum retry attempts for transient failures
    /// </summary>
    public int MaxRetryCount { get; set; } = 3;
    
    /// <summary>
    /// Validates that required database configuration is present
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(ConnectionString);
    }
    
    /// <summary>
    /// Gets validation errors for database configuration
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();
        
        if (string.IsNullOrWhiteSpace(ConnectionString))
        {
            errors.Add("Database connection string is required");
        }
        
        if (CommandTimeoutSeconds <= 0)
        {
            errors.Add("Command timeout must be greater than 0");
        }
        
        if (MaxRetryCount < 0)
        {
            errors.Add("Max retry count cannot be negative");
        }
        
        return errors;
    }
}
