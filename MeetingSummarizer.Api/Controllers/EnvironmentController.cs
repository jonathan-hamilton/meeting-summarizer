using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Reflection;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Environment and application information controller
/// Provides environment-specific configuration and system information
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EnvironmentController : ControllerBase
{
    private readonly EnvironmentOptions _environmentOptions;
    private readonly IWebHostEnvironment _hostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EnvironmentController> _logger;

    public EnvironmentController(
        IOptions<EnvironmentOptions> environmentOptions,
        IWebHostEnvironment hostEnvironment,
        IConfiguration configuration,
        ILogger<EnvironmentController> logger)
    {
        _environmentOptions = environmentOptions.Value;
        _hostEnvironment = hostEnvironment;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Get environment information
    /// </summary>
    [HttpGet("info")]
    public IActionResult GetEnvironmentInfo()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version?.ToString() ?? "Unknown";
        
        return Ok(new
        {
            Environment = new
            {
                _environmentOptions.Name,
                _environmentOptions.DisplayName,
                _environmentOptions.IsProduction,
                _environmentOptions.AllowTestFeatures,
                AspNetCoreEnvironment = _hostEnvironment.EnvironmentName,
                IsDevelopment = _environmentOptions.IsDevelopment,
                IsStaging = _environmentOptions.IsStaging
            },
            Application = new
            {
                Name = "MeetingSummarizer API",
                Version = version,
                BuildDate = GetBuildDate(),
                Framework = GetFrameworkVersion()
            },
            Features = new
            {
                SwaggerEnabled = _environmentOptions.ShouldEnableSwagger,
                DetailedErrorsEnabled = _environmentOptions.ShouldEnableDetailedErrors,
                SensitiveDataLoggingEnabled = _environmentOptions.ShouldLogSensitiveData,
                TestFeaturesEnabled = _environmentOptions.AllowTestFeatures
            },
            Configuration = new
            {
                KeyVaultEnabled = _configuration.GetValue<bool>("KeyVault:Enabled"),
                DatabaseProvider = _configuration.GetValue<string>("Database:Provider") ?? "Unknown",
                StorageAccountConfigured = !string.IsNullOrEmpty(_configuration.GetValue<string>("AzureStorage:AccountName")),
                SpeechServicesConfigured = !string.IsNullOrEmpty(_configuration.GetValue<string>("AzureSpeech:Region")),
                OpenAIConfigured = !string.IsNullOrEmpty(_configuration.GetValue<string>("OpenAI:ApiKey"))
            },
            Server = new
            {
                MachineName = Environment.MachineName,
                ProcessorCount = Environment.ProcessorCount,
                OSVersion = Environment.OSVersion.ToString(),
                RuntimeVersion = Environment.Version.ToString(),
                WorkingSet = GC.GetTotalMemory(false),
                UpTime = TimeSpan.FromMilliseconds(Environment.TickCount64)
            },
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get feature flags for the current environment
    /// </summary>
    [HttpGet("features")]
    public IActionResult GetFeatureFlags()
    {
        return Ok(new
        {
            Environment = _environmentOptions.Name,
            Features = _environmentOptions.FeatureFlags,
            SystemFeatures = new
            {
                SwaggerEnabled = _environmentOptions.ShouldEnableSwagger,
                DetailedErrors = _environmentOptions.ShouldEnableDetailedErrors,
                SensitiveDataLogging = _environmentOptions.ShouldLogSensitiveData,
                TestEndpoints = _environmentOptions.AllowTestFeatures
            }
        });
    }

    /// <summary>
    /// Health check endpoint with environment-specific information
    /// </summary>
    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        try
        {
            var healthStatus = new
            {
                Status = "Healthy",
                Environment = _environmentOptions.Name,
                Version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                Timestamp = DateTime.UtcNow,
                Uptime = TimeSpan.FromMilliseconds(Environment.TickCount64),
                Checks = new
                {
                    Configuration = CheckConfigurationHealth(),
                    Memory = CheckMemoryHealth(),
                    Environment = CheckEnvironmentHealth()
                }
            };

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Error = _environmentOptions.ShouldEnableDetailedErrors ? ex.Message : "Internal server error",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Get configuration status (only in development/staging)
    /// </summary>
    [HttpGet("config-status")]
    public IActionResult GetConfigurationStatus()
    {
        if (_environmentOptions.IsProduction && !_environmentOptions.AllowTestFeatures)
        {
            return NotFound(new { Message = "Configuration status is not available in production" });
        }

        return Ok(new
        {
            Environment = _environmentOptions.Name,
            ConfigurationSources = _configuration.AsEnumerable()
                .Where(kvp => !IsSecretKey(kvp.Key))
                .GroupBy(kvp => GetConfigSource(kvp.Key))
                .ToDictionary(g => g.Key, g => g.Count()),
            KeyVault = new
            {
                Enabled = _configuration.GetValue<bool>("KeyVault:Enabled"),
                VaultUri = _configuration.GetValue<string>("KeyVault:VaultUri"),
                UseManagedIdentity = _configuration.GetValue<bool>("KeyVault:UseManagedIdentity")
            },
            Database = new
            {
                Provider = _configuration.GetValue<string>("Database:Provider"),
                UseKeyVault = _configuration.GetValue<bool>("Database:UseKeyVault"),
                ConnectionConfigured = !string.IsNullOrEmpty(_configuration.GetConnectionString("DefaultConnection"))
            },
            Services = new
            {
                AzureStorage = !string.IsNullOrEmpty(_configuration.GetValue<string>("AzureStorage:AccountName")),
                AzureSpeech = !string.IsNullOrEmpty(_configuration.GetValue<string>("AzureSpeech:Region")),
                OpenAI = !string.IsNullOrEmpty(_configuration.GetValue<string>("OpenAI:ApiKey")),
                SendGrid = !string.IsNullOrEmpty(_configuration.GetValue<string>("SendGrid:FromEmail"))
            }
        });
    }

    // Helper methods
    private DateTime GetBuildDate()
    {
        try
        {
            var assembly = Assembly.GetExecutingAssembly();
            var attribute = assembly.GetCustomAttribute<AssemblyMetadataAttribute>();
            if (attribute?.Key == "BuildDate" && DateTime.TryParse(attribute.Value, out var buildDate))
            {
                return buildDate;
            }
            
            // Fallback to file creation time
            var location = assembly.Location;
            if (!string.IsNullOrEmpty(location) && File.Exists(location))
            {
                return File.GetCreationTimeUtc(location);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not determine build date");
        }

        return DateTime.UtcNow;
    }

    private string GetFrameworkVersion()
    {
        return Environment.Version.ToString();
    }

    private object CheckConfigurationHealth()
    {
        var issues = new List<string>();

        if (_environmentOptions.IsProduction)
        {
            if (!_configuration.GetValue<bool>("KeyVault:Enabled"))
                issues.Add("Key Vault should be enabled in production");
        }

        return new
        {
            Status = issues.Count == 0 ? "Healthy" : "Warning",
            Issues = issues
        };
    }

    private object CheckMemoryHealth()
    {
        var totalMemory = GC.GetTotalMemory(false);
        var totalMemoryMB = totalMemory / 1024 / 1024;

        return new
        {
            Status = totalMemoryMB < 500 ? "Healthy" : "Warning",
            TotalMemoryMB = totalMemoryMB,
            Gen0Collections = GC.CollectionCount(0),
            Gen1Collections = GC.CollectionCount(1),
            Gen2Collections = GC.CollectionCount(2)
        };
    }

    private object CheckEnvironmentHealth()
    {
        var issues = new List<string>();

        if (_environmentOptions.IsProduction && _environmentOptions.ShouldLogSensitiveData)
            issues.Add("Sensitive data logging should be disabled in production");

        if (_environmentOptions.IsProduction && _environmentOptions.ShouldEnableDetailedErrors)
            issues.Add("Detailed errors should be disabled in production");

        return new
        {
            Status = issues.Count == 0 ? "Healthy" : "Warning",
            Issues = issues
        };
    }

    private bool IsSecretKey(string key)
    {
        var secretKeywords = new[] { "password", "secret", "key", "token", "connectionstring" };
        return secretKeywords.Any(keyword => key.ToLowerInvariant().Contains(keyword));
    }

    private string GetConfigSource(string key)
    {
        if (key.StartsWith("KeyVault:")) return "KeyVault";
        if (key.StartsWith("ASPNETCORE_")) return "Environment";
        if (key.Contains(":")) return "Configuration Files";
        return "Other";
    }
}
