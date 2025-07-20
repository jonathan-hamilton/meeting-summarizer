using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Tests.Infrastructure;

/// <summary>
/// Custom WebApplicationFactory for Sprint 1 API testing
/// Sets up test environment with mocked dependencies
/// </summary>
public class Sprint1TestWebApplicationFactory : WebApplicationFactory<Program>
{
    public Mock<IOpenAIService> MockOpenAIService { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        
        builder.ConfigureServices(services =>
        {
            // Remove the existing IOpenAIService registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IOpenAIService));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add our mock service
            services.AddSingleton(MockOpenAIService.Object);

            // Ensure logging is configured for tests
            services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            MockOpenAIService.Reset();
        }
        base.Dispose(disposing);
    }
}
