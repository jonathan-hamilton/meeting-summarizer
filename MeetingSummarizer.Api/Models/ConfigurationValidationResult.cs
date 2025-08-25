namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of configuration validation operations
/// Used in S4.3: Configuration Validation & System Reliability Improvements
/// </summary>
public class ConfigurationValidationResult
{
    /// <summary>
    /// Overall validation status
    /// </summary>
    public bool IsValid { get; }

    /// <summary>
    /// Collection of individual service validation results
    /// </summary>
    public IReadOnlyList<ServiceValidationResult> ServiceResults { get; }

    /// <summary>
    /// Summary message describing overall validation status
    /// </summary>
    public string Summary { get; }

    /// <summary>
    /// Timestamp when validation was performed
    /// </summary>
    public DateTime ValidatedAt { get; }

    /// <summary>
    /// Total time taken for all validations
    /// </summary>
    public TimeSpan ValidationDuration { get; }

    public ConfigurationValidationResult(
        bool isValid,
        IReadOnlyList<ServiceValidationResult> serviceResults,
        string summary,
        TimeSpan validationDuration)
    {
        IsValid = isValid;
        ServiceResults = serviceResults;
        Summary = summary;
        ValidatedAt = DateTime.UtcNow;
        ValidationDuration = validationDuration;
    }

    /// <summary>
    /// Get all errors from failed service validations
    /// </summary>
    public IEnumerable<string> GetAllErrors()
    {
        return ServiceResults
            .Where(r => !r.IsValid)
            .SelectMany(r => r.Errors);
    }

    /// <summary>
    /// Get all warnings from service validations
    /// </summary>
    public IEnumerable<string> GetAllWarnings()
    {
        return ServiceResults
            .SelectMany(r => r.Warnings);
    }
}

/// <summary>
/// Result of individual service validation
/// </summary>
public class ServiceValidationResult
{
    /// <summary>
    /// Name of the service being validated
    /// </summary>
    public string ServiceName { get; }

    /// <summary>
    /// Whether the service validation passed
    /// </summary>
    public bool IsValid { get; }

    /// <summary>
    /// Primary validation message
    /// </summary>
    public string Message { get; }

    /// <summary>
    /// Collection of error messages if validation failed
    /// </summary>
    public IReadOnlyList<string> Errors { get; }

    /// <summary>
    /// Collection of warning messages
    /// </summary>
    public IReadOnlyList<string> Warnings { get; }

    /// <summary>
    /// Additional details about the validation
    /// </summary>
    public Dictionary<string, object> Details { get; }

    /// <summary>
    /// Time taken to validate this service
    /// </summary>
    public TimeSpan ValidationTime { get; }

    public ServiceValidationResult(
        string serviceName,
        bool isValid,
        string message,
        IReadOnlyList<string>? errors = null,
        IReadOnlyList<string>? warnings = null,
        Dictionary<string, object>? details = null,
        TimeSpan validationTime = default)
    {
        ServiceName = serviceName;
        IsValid = isValid;
        Message = message;
        Errors = errors ?? new List<string>();
        Warnings = warnings ?? new List<string>();
        Details = details ?? new Dictionary<string, object>();
        ValidationTime = validationTime;
    }

    /// <summary>
    /// Create a successful validation result
    /// </summary>
    public static ServiceValidationResult Success(string serviceName, string message, Dictionary<string, object>? details = null, TimeSpan validationTime = default)
    {
        return new ServiceValidationResult(serviceName, true, message, null, null, details, validationTime);
    }

    /// <summary>
    /// Create a failed validation result
    /// </summary>
    public static ServiceValidationResult Failure(string serviceName, string message, IReadOnlyList<string> errors, IReadOnlyList<string>? warnings = null, TimeSpan validationTime = default)
    {
        return new ServiceValidationResult(serviceName, false, message, errors, warnings, null, validationTime);
    }

    /// <summary>
    /// Create a validation result with warnings but overall success
    /// </summary>
    public static ServiceValidationResult Warning(string serviceName, string message, IReadOnlyList<string> warnings, Dictionary<string, object>? details = null, TimeSpan validationTime = default)
    {
        return new ServiceValidationResult(serviceName, true, message, null, warnings, details, validationTime);
    }
}
