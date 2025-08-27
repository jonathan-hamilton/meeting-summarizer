using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.Validation;

/// <summary>
/// Service for validating application configuration at startup and runtime
/// Implements S4.3: Configuration Validation & System Reliability Improvements
/// </summary>
public interface IConfigurationValidationService
{
    /// <summary>
    /// Validates all critical configuration at application startup
    /// </summary>
    /// <returns>Comprehensive validation result</returns>
    Task<ConfigurationValidationResult> ValidateStartupConfigurationAsync();

    /// <summary>
    /// Validates Azure Speech Services connectivity and configuration
    /// </summary>
    /// <returns>Azure Speech Services validation result</returns>
    Task<ServiceValidationResult> ValidateAzureSpeechServicesAsync();

    /// <summary>
    /// Validates consistency between frontend and backend supported file types
    /// </summary>
    /// <returns>File type consistency validation result</returns>
    Task<ServiceValidationResult> ValidateFileTypeConsistencyAsync();

    /// <summary>
    /// Validates that all required Azure service dependencies are properly configured
    /// </summary>
    /// <returns>Dependencies validation result</returns>
    Task<ServiceValidationResult> ValidateAzureDependenciesAsync();
}
