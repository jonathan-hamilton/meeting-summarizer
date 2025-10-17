using MeetingSummarizer.Api.Services.Configuration;
using MeetingSummarizer.Api.Configuration;
using System.Threading.Tasks;

namespace MeetingSummarizer.Api.Data
{
    /// <summary>
    /// Resolves database connection strings from Key Vault or fallback configuration
    /// </summary>
    public class DatabaseConnectionResolver : IDatabaseConnectionResolver
    {
        private readonly IAzureConfigurationService _azureConfig;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DatabaseConnectionResolver> _logger;
        private string? _cachedConnectionString;

        public DatabaseConnectionResolver(
            IAzureConfigurationService azureConfig,
            IConfiguration configuration,
            ILogger<DatabaseConnectionResolver> logger)
        {
            _azureConfig = azureConfig;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Resolves the database connection string from Key Vault or fallback configuration
        /// </summary>
        /// <returns>Database connection string</returns>
        public async Task<string> GetConnectionStringAsync()
        {
            // Return cached connection string if available
            if (!string.IsNullOrEmpty(_cachedConnectionString))
            {
                return _cachedConnectionString;
            }

            try
            {
                if (_azureConfig.IsKeyVaultEnabled())
                {
                    _logger.LogDebug("Resolving database connection string from Key Vault");
                    _cachedConnectionString = await _azureConfig.GetDatabaseConnectionStringAsync(
                        _configuration, 
                        "DatabaseConnectionString-Dev-SQL");
                    
                    if (!string.IsNullOrEmpty(_cachedConnectionString))
                    {
                        _logger.LogInformation("✅ Database connection string resolved from Key Vault");
                        return _cachedConnectionString;
                    }
                }

                // Fallback to configuration
                _logger.LogWarning("⚠️ Using fallback database connection string from configuration");
                _cachedConnectionString = _configuration.GetConnectionString("DefaultConnection") ?? 
                                         throw new InvalidOperationException("No database connection string available");
                
                return _cachedConnectionString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to resolve database connection string");
                throw;
            }
        }
    }
}