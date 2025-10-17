namespace MeetingSummarizer.Api.Helpers;

/// <summary>
/// Helper class for detecting runtime environment and deployment mode
/// </summary>
public static class EnvironmentDetector
{
    /// <summary>
    /// Determines if the application is running in a containerized environment
    /// </summary>
    public static bool IsContainerEnvironment()
    {
        // Check Docker-specific indicators
        if (File.Exists("/.dockerenv") || 
            !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")))
        {
            return true;
        }

        // Check if we're running in a known container platform
        var hostname = Environment.GetEnvironmentVariable("HOSTNAME");
        if (!string.IsNullOrEmpty(hostname) && 
            (hostname.Length == 12 || hostname.Contains("container") || hostname.Contains("docker")))
        {
            return true;
        }

        // Check for container-specific environment variables
        var containerEnvVars = new[]
        {
            "CONTAINER_NAME",
            "DOCKER_CONTAINER",
            "KUBERNETES_SERVICE_HOST",
            "WEBSITE_INSTANCE_ID" // Azure Container Apps
        };

        return containerEnvVars.Any(env => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(env)));
    }

    /// <summary>
    /// Determines if the application is running in local 2-server development mode
    /// </summary>
    public static bool IsLocalTwoServerMode(IWebHostEnvironment environment)
    {
        // Not in container and in development environment
        if (IsContainerEnvironment())
        {
            return false;
        }

        // Check for local development indicators
        var environmentName = environment.EnvironmentName;
        return environmentName.Equals("Local", StringComparison.OrdinalIgnoreCase) ||
               environmentName.Equals("Development", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Gets the appropriate CORS origins based on environment
    /// </summary>
    public static string[] GetCorsOrigins(IWebHostEnvironment environment, IConfiguration configuration)
    {
        if (IsContainerEnvironment())
        {
            // Container mode - frontend is served from same origin
            return new[] { "http://localhost:8080", "https://localhost:8080" };
        }
        else
        {
            // 2-server mode - frontend runs on separate port
            var corsOptions = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            return corsOptions ?? new[]
            {
                "http://localhost:3000",  // Default Vite React dev server
                "http://localhost:5173",  // Alternative Vite port
                "http://localhost:5174",  // Current Vite port
                "http://localhost:3001"   // Alternative React dev server port
            };
        }
    }

    /// <summary>
    /// Determines if static files should be served (container mode only)
    /// </summary>
    public static bool ShouldServeStaticFiles()
    {
        return IsContainerEnvironment();
    }

    /// <summary>
    /// Gets environment-specific logging configuration
    /// </summary>
    public static void ConfigureLogging(ILoggingBuilder logging, IWebHostEnvironment environment)
    {
        if (IsContainerEnvironment())
        {
            // Container logging - more structured, less verbose
            logging.AddConsole();
        }
        else
        {
            // Local development - more verbose debugging
            logging.AddConsole();
            logging.AddDebug();
        }
    }

    /// <summary>
    /// Gets runtime environment information for logging
    /// </summary>
    public static object GetEnvironmentInfo()
    {
        return new
        {
            IsContainer = IsContainerEnvironment(),
            Platform = Environment.OSVersion.Platform.ToString(),
            MachineName = Environment.MachineName,
            ProcessorCount = Environment.ProcessorCount,
            AspNetCoreEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            DotNetEnvironment = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT"),
            DockerEnv = File.Exists("/.dockerenv"),
            ContainerRuntime = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")
        };
    }
}