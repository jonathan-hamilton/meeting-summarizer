namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Environment configuration model for multi-environment deployment
/// </summary>
public class EnvironmentOptions
{
    public const string SectionName = "Environment";

    /// <summary>
    /// Environment name (Development, Staging, Production)
    /// </summary>
    public string Name { get; set; } = "Development";

    /// <summary>
    /// Human-readable display name for the environment
    /// </summary>
    public string DisplayName { get; set; } = "Development Environment";

    /// <summary>
    /// Whether this is the production environment
    /// </summary>
    public bool IsProduction { get; set; } = false;

    /// <summary>
    /// Whether test features and endpoints should be enabled
    /// </summary>
    public bool AllowTestFeatures { get; set; } = true;

    /// <summary>
    /// Environment-specific feature flags
    /// </summary>
    public Dictionary<string, bool> FeatureFlags { get; set; } = new();

    /// <summary>
    /// Environment validation
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(Name) && 
               !string.IsNullOrWhiteSpace(DisplayName);
    }

    /// <summary>
    /// Get validation errors for logging
    /// </summary>
    public IEnumerable<string> GetValidationErrors()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Name))
            errors.Add("Environment Name is required");

        if (string.IsNullOrWhiteSpace(DisplayName))
            errors.Add("Environment DisplayName is required");

        return errors;
    }

    /// <summary>
    /// Check if a specific feature is enabled
    /// </summary>
    public bool IsFeatureEnabled(string featureName)
    {
        return FeatureFlags.TryGetValue(featureName, out var enabled) && enabled;
    }

    /// <summary>
    /// Environment-specific settings
    /// </summary>
    public bool IsDevelopment => Name.Equals("Development", StringComparison.OrdinalIgnoreCase);
    public bool IsStaging => Name.Equals("Staging", StringComparison.OrdinalIgnoreCase);
    public bool ShouldEnableDetailedErrors => !IsProduction;
    public bool ShouldEnableSwagger => !IsProduction || AllowTestFeatures;
    public bool ShouldLogSensitiveData => !IsProduction;
}
