namespace MeetingSummarizer.Api.Models;

/// <summary>
/// CORS configuration options for different environments
/// </summary>
public class CorsOptions
{
    public const string SectionName = "Cors";

    /// <summary>
    /// Allowed origins for CORS requests
    /// </summary>
    public List<string> AllowedOrigins { get; set; } = new();

    /// <summary>
    /// Allowed methods for CORS requests
    /// </summary>
    public List<string> AllowedMethods { get; set; } = new() 
    { 
        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH" 
    };

    /// <summary>
    /// Allowed headers for CORS requests
    /// </summary>
    public List<string> AllowedHeaders { get; set; } = new() 
    { 
        "Content-Type", "Authorization", "X-Requested-With" 
    };

    /// <summary>
    /// Whether to allow credentials in CORS requests
    /// </summary>
    public bool AllowCredentials { get; set; } = true;

    /// <summary>
    /// Maximum age for preflight requests cache (in seconds)
    /// </summary>
    public int MaxAge { get; set; } = 3600;

    /// <summary>
    /// Validation for CORS configuration
    /// </summary>
    public bool IsValid()
    {
        return AllowedOrigins.Any() && AllowedOrigins.All(o => !string.IsNullOrWhiteSpace(o));
    }

    /// <summary>
    /// Get validation errors
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();

        if (!AllowedOrigins.Any())
            errors.Add("At least one allowed origin must be specified");

        var invalidOrigins = AllowedOrigins.Where(o => string.IsNullOrWhiteSpace(o)).ToList();
        if (invalidOrigins.Any())
            errors.Add($"Invalid origins found: {string.Join(", ", invalidOrigins)}");

        return errors;
    }
}
