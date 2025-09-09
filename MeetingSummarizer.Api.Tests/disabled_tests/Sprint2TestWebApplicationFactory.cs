using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MeetingSummarizer.Api.Services;
using Moq;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Infrastructure
{
    /// <summary>
    /// Test Web Application Factory for Sprint 2 integration tests
    /// Provides a configured test environment for speaker mapping functionality
    /// </summary>
    public class Sprint2TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing ISpeakerMappingService registration if it exists
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(ISpeakerMappingService));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add a mock ISpeakerMappingService for testing
                var mockSpeakerMappingService = new Mock<ISpeakerMappingService>();
                services.AddSingleton(mockSpeakerMappingService.Object);
                services.AddSingleton(mockSpeakerMappingService);

                // Configure test logging
                services.AddLogging(builder =>
                {
                    builder.ClearProviders();
                    builder.AddConsole();
                    builder.SetMinimumLevel(LogLevel.Warning);
                });

                // Add any Sprint 2 specific test configurations
                ConfigureSprint2Services(services);
            });

            builder.UseEnvironment("Testing");
        }

        /// <summary>
        /// Configure services specific to Sprint 2 testing requirements
        /// </summary>
        /// <param name="services">The service collection to configure</param>
        private static void ConfigureSprint2Services(IServiceCollection services)
        {
            // Add any additional Sprint 2 specific service configurations here
            // For example: test databases, mock external services, etc.

            // Ensure we have a proper in-memory implementation for actual service testing
            services.AddScoped<InMemorySpeakerMappingService>();
        }

        /// <summary>
        /// Get the mock ISpeakerMappingService for test setup
        /// </summary>
        /// <returns>Mock ISpeakerMappingService instance</returns>
        public Mock<ISpeakerMappingService> GetMockSpeakerMappingService()
        {
            return Services.GetRequiredService<Mock<ISpeakerMappingService>>();
        }

        /// <summary>
        /// Get the in-memory speaker mapping service for integration tests
        /// </summary>
        /// <returns>InMemorySpeakerMappingService instance</returns>
        public InMemorySpeakerMappingService GetInMemorySpeakerMappingService()
        {
            return Services.GetRequiredService<InMemorySpeakerMappingService>();
        }

        /// <summary>
        /// Create a pre-configured HTTP client for Sprint 2 API testing
        /// </summary>
        /// <returns>HttpClient configured for Sprint 2 testing</returns>
        public new HttpClient CreateClient()
        {
            var client = base.CreateClient();

            // Configure default headers for Sprint 2 testing
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.DefaultRequestHeaders.Add("User-Agent", "Sprint2-Test-Client");

            return client;
        }

        /// <summary>
        /// Create an HTTP client with custom base address for specific test scenarios
        /// </summary>
        /// <param name="baseAddress">Custom base address for the client</param>
        /// <returns>Configured HttpClient</returns>
        public HttpClient CreateClient(string baseAddress)
        {
            var client = CreateClient();
            client.BaseAddress = new Uri(baseAddress);
            return client;
        }

        /// <summary>
        /// Reset all mocks to their default state for test isolation
        /// </summary>
        public void ResetMocks()
        {
            var mockService = GetMockSpeakerMappingService();
            mockService.Reset();
        }

        /// <summary>
        /// Setup common mock behaviors for Sprint 2 tests
        /// </summary>
        public void SetupCommonMocks()
        {
            var mockService = GetMockSpeakerMappingService();

            // Setup default successful responses for common scenarios
            mockService.Setup(s => s.SaveSpeakerMappingsAsync(It.IsAny<MeetingSummarizer.Api.Models.SpeakerMappingRequest>()))
                .ReturnsAsync(new MeetingSummarizer.Api.Models.SpeakerMappingResponse
                {
                    Success = true,
                    Message = "Mappings saved successfully",
                    TranscriptionId = "test-default",
                    Mappings = new List<MeetingSummarizer.Api.Models.SpeakerMapping>()
                });

            mockService.Setup(s => s.GetSpeakerMappingsAsync(It.IsAny<string>()))
                .ReturnsAsync(new MeetingSummarizer.Api.Models.SpeakerMappingResponse
                {
                    Success = true,
                    Message = "Mappings retrieved successfully",
                    TranscriptionId = "test-default",
                    Mappings = new List<MeetingSummarizer.Api.Models.SpeakerMapping>()
                });

            mockService.Setup(s => s.DeleteSpeakerMappingsAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                // Clean up any Sprint 2 specific resources
                ResetMocks();
            }

            base.Dispose(disposing);
        }
    }
}