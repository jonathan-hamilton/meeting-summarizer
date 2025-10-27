using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using MeetingSummarizer.Api.Data;

namespace MeetingSummarizer.Api.Factories;

/// <summary>
/// Design-time factory for MeetingSummarizerDbContext
/// Used by EF Core tools (migrations, etc.) when the full application context is not available
/// </summary>
public class MeetingSummarizerDbContextFactory : IDesignTimeDbContextFactory<MeetingSummarizerDbContext>
{
    public MeetingSummarizerDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MeetingSummarizerDbContext>();
        
        // Get connection string from environment variable (set in CI/CD)
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            // Fallback for local development - use a temporary connection string
            // This should not be used in production
            connectionString = "Server=(localdb)\\mssqllocaldb;Database=MeetingSummarizerDev;Trusted_Connection=true;";
            Console.WriteLine("⚠️ Using fallback connection string for design-time DbContext");
        }
        else
        {
            Console.WriteLine("✅ Using connection string from environment variable for design-time DbContext");
        }
        
        optionsBuilder.UseSqlServer(connectionString, sqlServerOptions =>
        {
            sqlServerOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
        
        return new MeetingSummarizerDbContext(optionsBuilder.Options);
    }
}