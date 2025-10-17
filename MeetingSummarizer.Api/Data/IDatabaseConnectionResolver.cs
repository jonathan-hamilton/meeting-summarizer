using System.Threading.Tasks;

namespace MeetingSummarizer.Api.Data
{
    /// <summary>
    /// Interface for resolving database connection strings from various sources
    /// </summary>
    public interface IDatabaseConnectionResolver
    {
        /// <summary>
        /// Resolves the database connection string from Key Vault or fallback configuration
        /// </summary>
        /// <returns>Database connection string</returns>
        Task<string> GetConnectionStringAsync();
    }
}