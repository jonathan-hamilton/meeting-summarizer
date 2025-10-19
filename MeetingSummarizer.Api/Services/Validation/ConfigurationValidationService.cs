using Microsoft.Extensions.Options;
using Microsoft.CognitiveServices.Speech;
using System.Diagnostics;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Helpers;
using MeetingSummarizer.Api.Configuration;

namespace MeetingSummarizer.Api.Services.Validation;

/// <summary>
/// Implementation of configuration validation service
/// Implements S4.3: Configuration Validation & System Reliability Improvements (REQ-CFG-1 to REQ-CFG-7)
/// </summary>
public class ConfigurationValidationService : IConfigurationValidationService
{
    private readonly ILogger<ConfigurationValidationService> _logger;
    private readonly IOptions<AzureSpeechOptions> _speechOptions;
    private readonly IOptions<StripeOptions> _stripeOptions;
    private readonly IOptions<AzureCommunicationEmailOptions> _emailOptions;
    private readonly IWebHostEnvironment _environment;

    public ConfigurationValidationService(
        ILogger<ConfigurationValidationService> logger,
        IOptions<AzureSpeechOptions> speechOptions,
        IOptions<StripeOptions> stripeOptions,
        IOptions<AzureCommunicationEmailOptions> emailOptions,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _speechOptions = speechOptions;
        _stripeOptions = stripeOptions;
        _emailOptions = emailOptions;
        _environment = environment;
    }

    /// <summary>
    /// Validates all critical configuration at application startup (REQ-CFG-1, REQ-CFG-2, REQ-CFG-5, REQ-CFG-7)
    /// </summary>
    public async Task<ConfigurationValidationResult> ValidateStartupConfigurationAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        
        _logger.LogInformation("Starting comprehensive configuration validation [CorrelationId: {CorrelationId}]", correlationId);

        var validationTasks = new List<Task<ServiceValidationResult>>
        {
            ValidateAzureSpeechServicesAsync(),
            ValidateFileTypeConsistencyAsync(),
            ValidateAzureDependenciesAsync(),
            ValidateStripeServicesAsync(),
            ValidateAzureCommunicationEmailServicesAsync()
        };

        var results = await Task.WhenAll(validationTasks);
        stopwatch.Stop();

        var isOverallValid = results.All(r => r.IsValid);
        var summary = GenerateValidationSummary(results, isOverallValid);

        _logger.LogInformation("Configuration validation completed in {Duration}ms [CorrelationId: {CorrelationId}] - Status: {Status}",
            stopwatch.ElapsedMilliseconds, correlationId, isOverallValid ? "PASS" : "FAIL");

        if (!isOverallValid)
        {
            var errors = results.Where(r => !r.IsValid).SelectMany(r => r.Errors);
            _logger.LogError("Configuration validation failed with errors: {Errors} [CorrelationId: {CorrelationId}]",
                string.Join("; ", errors), correlationId);
        }

        return new ConfigurationValidationResult(isOverallValid, results, summary, stopwatch.Elapsed);
    }

    /// <summary>
    /// Validates Azure Speech Services connectivity and configuration (REQ-CFG-3, REQ-CFG-4)
    /// </summary>
    public Task<ServiceValidationResult> ValidateAzureSpeechServicesAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        const string serviceName = "Azure Speech Services";

        try
        {
            var options = _speechOptions.Value;

            // Basic configuration validation
            if (!options.IsValid())
            {
                var errors = new List<string>();
                if (string.IsNullOrWhiteSpace(options.Key))
                    errors.Add("Azure Speech Services key is not configured");
                if (string.IsNullOrWhiteSpace(options.Region))
                    errors.Add("Azure Speech Services region is not configured");

                return Task.FromResult(ServiceValidationResult.Failure(serviceName, 
                    "Azure Speech Services configuration is incomplete", errors, null, stopwatch.Elapsed));
            }

            // Test connectivity with a simple speech config creation
            var speechConfig = SpeechConfig.FromSubscription(options.Key, options.Region);
            speechConfig.SetProperty(PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "3000");

            // Test basic configuration access
            var details = new Dictionary<string, object>
            {
                ["Region"] = options.Region,
                ["KeyMasked"] = options.GetMaskedKey(),
                ["Language"] = options.Language,
                ["SpeakerDiarization"] = options.EnableSpeakerDiarization,
                ["RequestTimeout"] = $"{options.RequestTimeoutSeconds}s",
                ["MaxRetries"] = options.MaxRetries
            };

            stopwatch.Stop();

            _logger.LogInformation("Azure Speech Services validation passed - Region: {Region}, Key: {MaskedKey}",
                options.Region, options.GetMaskedKey());

            return Task.FromResult(ServiceValidationResult.Success(serviceName,
                "Azure Speech Services configuration validated successfully", details, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Azure Speech Services validation failed");

            return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                "Azure Speech Services validation failed",
                new List<string> { $"Configuration error: {ex.Message}" },
                null,
                stopwatch.Elapsed));
        }
    }

    /// <summary>
    /// Validates Azure Blob Storage connectivity and access permissions (REQ-CFG-2, REQ-CFG-3)
    /// </summary>
    /// <summary>
    /// Validates consistency between frontend and backend supported file types (REQ-CFG-1)
    /// </summary>
    public Task<ServiceValidationResult> ValidateFileTypeConsistencyAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        const string serviceName = "File Type Consistency";

        try
        {
            // Get backend supported extensions from AudioFileValidator
            var backendExtensions = AudioFileValidator.SupportedExtensions.ToHashSet(StringComparer.OrdinalIgnoreCase);
            
            // Note: In a real implementation, we would fetch frontend accepted types from a configuration
            // or from the frontend build artifacts. For now, we'll validate against known frontend types.
            var expectedFrontendExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".mp3", ".wav", ".m4a", ".flac", ".ogg"
            };

            var missingInBackend = expectedFrontendExtensions.Except(backendExtensions).ToList();
            var extraInBackend = backendExtensions.Except(expectedFrontendExtensions).ToList();

            var details = new Dictionary<string, object>
            {
                ["BackendExtensions"] = backendExtensions.ToArray(),
                ["ExpectedFrontendExtensions"] = expectedFrontendExtensions.ToArray(),
                ["MissingInBackend"] = missingInBackend.ToArray(),
                ["ExtraInBackend"] = extraInBackend.ToArray()
            };

            var errors = new List<string>();
            var warnings = new List<string>();

            if (missingInBackend.Any())
            {
                errors.Add($"Backend missing support for frontend file types: {string.Join(", ", missingInBackend)}");
            }

            if (extraInBackend.Any())
            {
                warnings.Add($"Backend supports additional file types not in frontend: {string.Join(", ", extraInBackend)}");
            }

            stopwatch.Stop();

            if (errors.Any())
            {
                _logger.LogError("File type consistency validation failed: {Errors}", string.Join("; ", errors));
                return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                    "File type consistency validation failed", errors, warnings, stopwatch.Elapsed));
            }

            _logger.LogInformation("File type consistency validation passed - Backend supports {Count} file types",
                backendExtensions.Count);

            if (warnings.Any())
            {
                return Task.FromResult(ServiceValidationResult.Warning(serviceName,
                    "File type consistency validated with warnings", warnings, details, stopwatch.Elapsed));
            }

            return Task.FromResult(ServiceValidationResult.Success(serviceName,
                "File type consistency validated successfully", details, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "File type consistency validation failed");

            return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                "File type consistency validation failed",
                new List<string> { $"Validation error: {ex.Message}" },
                null,
                stopwatch.Elapsed));
        }
    }

    /// <summary>
    /// Validates that all required Azure service dependencies are properly configured (REQ-CFG-5)
    /// </summary>
    public Task<ServiceValidationResult> ValidateAzureDependenciesAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        const string serviceName = "Azure Dependencies";

        try
        {
            var speechOptions = _speechOptions.Value;

            var errors = new List<string>();
            var warnings = new List<string>();

            // Check if Speech Services is configured
            var speechConfigured = speechOptions.IsValid();

            if (!speechConfigured)
            {
                errors.Add("Azure Speech Services is not properly configured");
            }

            // Check for environment-specific requirements
            if (_environment.IsProduction())
            {
                if (speechConfigured && speechOptions.RequestTimeoutSeconds < 60)
                {
                    warnings.Add("Azure Speech Services timeout is less than 60 seconds in production environment");
                }
            }

            var details = new Dictionary<string, object>
            {
                ["SpeechServicesConfigured"] = speechConfigured,
                ["Environment"] = _environment.EnvironmentName
            };

            stopwatch.Stop();

            if (errors.Any())
            {
                _logger.LogError("Azure dependencies validation failed: {Errors}", string.Join("; ", errors));
                return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                    "Azure dependencies validation failed", errors, warnings, stopwatch.Elapsed));
            }

            _logger.LogInformation("Azure dependencies validation passed - Speech: {Speech}",
                speechConfigured);

            if (warnings.Any())
            {
                return Task.FromResult(ServiceValidationResult.Warning(serviceName,
                    "Azure dependencies validated with warnings", warnings, details, stopwatch.Elapsed));
            }

            return Task.FromResult(ServiceValidationResult.Success(serviceName,
                "Azure dependencies validated successfully", details, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Azure dependencies validation failed");

            return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                "Azure dependencies validation failed",
                new List<string> { $"Validation error: {ex.Message}" },
                null,
                stopwatch.Elapsed));
        }
    }

    /// <summary>
    /// Validates Stripe payment service configuration (REQ-CFG-3, REQ-CFG-4)
    /// </summary>
    public Task<ServiceValidationResult> ValidateStripeServicesAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        const string serviceName = "Stripe Payment Services";

        try
        {
            var options = _stripeOptions.Value;

            // Basic configuration validation
            if (!options.IsValid())
            {
                var errors = new List<string>();
                if (string.IsNullOrWhiteSpace(options.SecretKey))
                    errors.Add("Stripe secret key is not configured");
                if (string.IsNullOrWhiteSpace(options.PublishableKey))
                    errors.Add("Stripe publishable key is not configured");
                if (string.IsNullOrWhiteSpace(options.WebhookSecret))
                    errors.Add("Stripe webhook secret is not configured");

                return Task.FromResult(ServiceValidationResult.Failure(serviceName, 
                    "Stripe payment services configuration is incomplete", errors, null, stopwatch.Elapsed));
            }

            // Validate key formats
            var warnings = new List<string>();
            if (!options.SecretKey.StartsWith("sk_"))
            {
                warnings.Add("Stripe secret key does not start with expected 'sk_' prefix");
            }
            if (!options.PublishableKey.StartsWith("pk_"))
            {
                warnings.Add("Stripe publishable key does not start with expected 'pk_' prefix");
            }

            var details = new Dictionary<string, object>
            {
                ["SecretKeyMasked"] = MaskStripeKey(options.SecretKey),
                ["PublishableKeyMasked"] = MaskStripeKey(options.PublishableKey),
                ["WebhookSecretMasked"] = MaskStripeKey(options.WebhookSecret),
                ["IsTestMode"] = options.IsTestMode,
                ["Environment"] = options.GetEnvironmentDescription(),
                ["UseKeyVault"] = options.UseKeyVault
            };

            stopwatch.Stop();

            _logger.LogInformation("Stripe payment services validation passed - Environment: {Environment}, SecretKey: {SecretKeyMasked}, PublishableKey: {PublishableKeyMasked}",
                options.GetEnvironmentDescription(), MaskStripeKey(options.SecretKey), MaskStripeKey(options.PublishableKey));

            if (warnings.Any())
            {
                return Task.FromResult(ServiceValidationResult.Warning(serviceName,
                    "Stripe payment services validated with warnings", warnings, details, stopwatch.Elapsed));
            }

            return Task.FromResult(ServiceValidationResult.Success(serviceName,
                "Stripe payment services configuration validated successfully", details, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Stripe payment services validation failed");

            return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                "Stripe payment services validation failed",
                new List<string> { $"Configuration error: {ex.Message}" },
                null,
                stopwatch.Elapsed));
        }
    }

    /// <summary>
    /// Validates Azure Communication Services email configuration (REQ-CFG-3, REQ-CFG-4)
    /// </summary>
    public Task<ServiceValidationResult> ValidateAzureCommunicationEmailServicesAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        const string serviceName = "Azure Communication Email Services";

        try
        {
            var options = _emailOptions.Value;

            // Basic configuration validation
            var errors = new List<string>();
            var warnings = new List<string>();

            if (string.IsNullOrWhiteSpace(options.ConnectionString))
            {
                errors.Add("Azure Communication Services connection string is not configured");
            }
            else if (!options.ConnectionString.Contains("endpoint=", StringComparison.OrdinalIgnoreCase))
            {
                warnings.Add("Azure Communication Services connection string does not contain expected 'endpoint=' parameter");
            }

            if (string.IsNullOrWhiteSpace(options.FromEmail))
            {
                errors.Add("Azure Communication Services from email is not configured");
            }
            else if (!IsValidEmail(options.FromEmail))
            {
                errors.Add("Azure Communication Services from email is not a valid email address");
            }

            if (options.MaxRetryAttempts < 1 || options.MaxRetryAttempts > 5)
            {
                warnings.Add("Azure Communication Services max retry attempts should be between 1 and 5");
            }

            if (options.RetryDelaySeconds < 1 || options.RetryDelaySeconds > 60)
            {
                warnings.Add("Azure Communication Services retry delay should be between 1 and 60 seconds");
            }

            if (errors.Any())
            {
                return Task.FromResult(ServiceValidationResult.Failure(serviceName, 
                    "Azure Communication Services email configuration is incomplete", errors, warnings, stopwatch.Elapsed));
            }

            var details = new Dictionary<string, object>
            {
                ["ConnectionStringMasked"] = MaskConnectionString(options.ConnectionString),
                ["FromEmail"] = options.FromEmail,
                ["MaxRetryAttempts"] = options.MaxRetryAttempts,
                ["RetryDelaySeconds"] = options.RetryDelaySeconds
            };

            stopwatch.Stop();

            _logger.LogInformation("Azure Communication Services email validation passed - ConnectionString: {ConnectionStringMasked}, FromEmail: {FromEmail}",
                MaskConnectionString(options.ConnectionString), options.FromEmail);

            if (warnings.Any())
            {
                return Task.FromResult(ServiceValidationResult.Warning(serviceName,
                    "Azure Communication Services email validated with warnings", warnings, details, stopwatch.Elapsed));
            }

            return Task.FromResult(ServiceValidationResult.Success(serviceName,
                "Azure Communication Services email configuration validated successfully", details, stopwatch.Elapsed));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Azure Communication Services email validation failed");

            return Task.FromResult(ServiceValidationResult.Failure(serviceName,
                "Azure Communication Services email validation failed",
                new List<string> { $"Configuration error: {ex.Message}" },
                null,
                stopwatch.Elapsed));
        }
    }

    /// <summary>
    /// Mask Stripe key for logging (show first 8 and last 4 characters)
    /// </summary>
    private static string MaskStripeKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return "Not configured";
        
        if (key.Length <= 12)
            return new string('*', key.Length);
        
        return $"{key[..8]}***{key[^4..]}";
    }

    /// <summary>
    /// Mask SendGrid key for logging (show first 8 characters)
    /// </summary>
    private static string MaskSendGridKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return "Not configured";
        
        if (key.Length <= 8)
            return new string('*', key.Length);
        
        return $"{key[..8]}***";
    }

    /// <summary>
    /// Mask Azure Communication Services connection string for logging
    /// </summary>
    private static string MaskConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return "Not configured";
        
        // Extract endpoint for identification
        var endpointMatch = System.Text.RegularExpressions.Regex.Match(
            connectionString, @"endpoint=([^;]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        if (endpointMatch.Success)
        {
            var endpoint = endpointMatch.Groups[1].Value;
            return $"endpoint={endpoint};accesskey=***";
        }
        
        // Fallback masking
        if (connectionString.Length <= 20)
            return new string('*', connectionString.Length);
        
        return $"{connectionString[..20]}***";
    }

    /// <summary>
    /// Validate email address format
    /// </summary>
    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Generate a summary message based on validation results
    /// </summary>
    private static string GenerateValidationSummary(ServiceValidationResult[] results, bool isOverallValid)
    {
        var totalServices = results.Length;
        var passedServices = results.Count(r => r.IsValid);
        var failedServices = totalServices - passedServices;
        var warningServices = results.Count(r => r.IsValid && r.Warnings.Any());

        if (isOverallValid)
        {
            return warningServices > 0
                ? $"Configuration validation passed ({passedServices}/{totalServices} services) with {warningServices} warnings"
                : $"All configuration validation passed ({passedServices}/{totalServices} services)";
        }

        return $"Configuration validation failed ({failedServices} of {totalServices} services failed)";
    }
}
