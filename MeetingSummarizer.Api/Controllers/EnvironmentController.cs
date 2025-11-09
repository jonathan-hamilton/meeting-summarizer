using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Configuration;
using System.Reflection;
using System.IO;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Environment and application information controller
/// Provides environment-specific configuration and system information
/// Available in Development and Container environments
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EnvironmentController : ControllerBase
{
    private readonly EnvironmentOptions _environmentOptions;
    private readonly StripeOptions _stripeOptions;
    private readonly IWebHostEnvironment _hostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EnvironmentController> _logger;

    public EnvironmentController(
        IOptions<EnvironmentOptions> environmentOptions,
        IOptions<StripeOptions> stripeOptions,
        IWebHostEnvironment hostEnvironment,
        IConfiguration configuration,
        ILogger<EnvironmentController> logger)
    {
        _environmentOptions = environmentOptions.Value;
        _stripeOptions = stripeOptions.Value;
        _hostEnvironment = hostEnvironment;
        _configuration = configuration;
        _logger = logger;
    }

    // Check if this controller should be available in the current environment
    private bool IsControllerEnabled()
    {
        // Available in Development environment or when AllowTestFeatures is true
        return _hostEnvironment.IsDevelopment() || 
               _environmentOptions.AllowTestFeatures ||
               _hostEnvironment.EnvironmentName == "Container";
    }

    /// <summary>
    /// Get environment information
    /// </summary>
    [HttpGet("info")]
    public IActionResult GetEnvironmentInfo()
    {
        if (!IsControllerEnabled())
        {
            return NotFound();
        }

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
                IsDevelopment = _environmentOptions.IsDevelopment
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
        if (!IsControllerEnabled())
        {
            return NotFound();
        }

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
    /// Get configuration status (only in development)
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
            if (!string.IsNullOrEmpty(location) && System.IO.File.Exists(location))
            {
                return System.IO.File.GetCreationTimeUtc(location);
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

    /// <summary>
    /// Mobile device debugging endpoint - logs device information for mobile testing
    /// </summary>
    [HttpPost("mobile-debug")]
    public IActionResult LogMobileDebug([FromBody] MobileDebugRequest request)
    {
        if (!IsControllerEnabled())
        {
            return NotFound();
        }

        try
        {
            // Get request headers for server-side analysis
            var userAgent = Request.Headers["User-Agent"].ToString();
            var acceptHeader = Request.Headers["Accept"].ToString();
            var contentType = Request.ContentType;
            var correlationId = Guid.NewGuid().ToString("N")[..8];

            // Enhanced mobile device detection (server-side)
            var deviceInfo = AnalyzeMobileDevice(userAgent);

            // Log comprehensive mobile debug information
            _logger.LogInformation("📱 MOBILE DEBUG [{CorrelationId}] - Client: {ClientInfo} | Server: {ServerInfo} | UserAgent: {UserAgent}", 
                correlationId,
                new {
                    request.DeviceType,
                    request.Platform,
                    request.Browser,
                    request.IsTouchDevice,
                    request.ScreenWidth,
                    request.ScreenHeight,
                    request.Timestamp,
                    request.ComponentRendered,
                    request.Message
                },
                deviceInfo,
                userAgent
            );

            return Ok(new
            {
                Status = "Debug logged successfully",
                CorrelationId = correlationId,
                ServerDetection = deviceInfo,
                ClientDetection = new 
                {
                    request.DeviceType,
                    request.Platform,
                    request.Browser,
                    request.ComponentRendered
                },
                RequestInfo = new
                {
                    UserAgent = userAgent,
                    ContentType = contentType,
                    Accept = acceptHeader,
                    IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing mobile debug request");
            return StatusCode(500, new { Error = "Failed to process debug request" });
        }
    }

    /// <summary>
    /// Analyze mobile device from user agent
    /// </summary>
    private object AnalyzeMobileDevice(string userAgent)
    {
        var isIOS = userAgent.Contains("iPhone") || userAgent.Contains("iPad");
        var isAndroid = userAgent.Contains("Android");
        var isSafari = userAgent.Contains("Safari") && !userAgent.Contains("Chrome");
        var isChrome = userAgent.Contains("Chrome");
        var isSamsungBrowser = userAgent.Contains("SamsungBrowser");
        var isIOSSafari = isIOS && isSafari;
        var isAndroidChrome = isAndroid && isChrome;
        var isAndroidMobile = isAndroidChrome || (isAndroid && isSamsungBrowser);

        return new
        {
            Platform = isIOS ? "iOS" : isAndroid ? "Android" : "Desktop",
            Browser = isSafari ? "Safari" : isChrome ? "Chrome" : isSamsungBrowser ? "Samsung Browser" : "Unknown",
            DeviceType = isIOSSafari ? "iOS Safari" : isAndroidMobile ? "Android Mobile" : "Desktop",
            IsMobile = isIOSSafari || isAndroidMobile,
            Detection = new
            {
                IsIOS = isIOS,
                IsAndroid = isAndroid,
                IsSafari = isSafari,
                IsChrome = isChrome,
                IsSamsungBrowser = isSamsungBrowser,
                IsIOSSafari = isIOSSafari,
                IsAndroidChrome = isAndroidChrome,
                IsAndroidMobile = isAndroidMobile
            }
        };
    }

    /// <summary>
    /// Get Stripe configuration for frontend
    /// </summary>
    [HttpGet("stripe")]
    public IActionResult GetStripeConfig()
    {
        if (!IsControllerEnabled())
        {
            return NotFound();
        }

        return Ok(new
        {
            PublishableKey = _stripeOptions.PublishableKey,
            IsTestMode = _stripeOptions.IsTestMode,
            Environment = _stripeOptions.GetEnvironmentDescription()
        });
    }
}

/// <summary>
/// Request model for mobile debugging information
/// </summary>
public class MobileDebugRequest
{
    public string? DeviceType { get; set; }
    public string? Platform { get; set; }
    public string? Browser { get; set; }
    public bool IsTouchDevice { get; set; }
    public int ScreenWidth { get; set; }
    public int ScreenHeight { get; set; }
    public string? ComponentRendered { get; set; }
    public string? Message { get; set; }
    public DateTime Timestamp { get; set; }
}
