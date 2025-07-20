using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using MeetingSummarizer.Api.Tests.Infrastructure;

namespace MeetingSummarizer.Api.Tests.Controllers;

/// <summary>
/// Sprint 1 tests for HealthController endpoints
/// Tests infrastructure health checks supporting S1.4: Production Configuration
/// </summary>
[TestClass]
public class HealthControllerSprint1Tests
{
    private Sprint1TestWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    [TestInitialize]
    public void Setup()
    {
        _factory = new Sprint1TestWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    #region S1.4 Production Configuration Support Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task GetHealth_BasicEndpoint_ReturnsHealthyStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var healthData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        healthData.GetProperty("status").GetString().Should().Be("Healthy");
        healthData.GetProperty("service").GetString().Should().Be("MeetingSummarizer API");
        healthData.GetProperty("version").GetString().Should().Be("1.0.0");
        healthData.GetProperty("environment").GetString().Should().Be("Testing");
        
        // Verify timestamp exists and is in valid format
        var timestampStr = healthData.GetProperty("timestamp").GetString();
        var timestamp = DateTime.Parse(timestampStr!);
        timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromDays(1)); // Generous check just to ensure valid format
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task GetDetailedHealth_DetailedEndpoint_ReturnsComprehensiveHealthInfo()
    {
        // Act
        var response = await _client.GetAsync("/api/health/detailed");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var healthData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        // Verify core health properties
        healthData.GetProperty("status").GetString().Should().Be("Healthy");
        healthData.GetProperty("service").GetString().Should().Be("MeetingSummarizer API");
        healthData.GetProperty("version").GetString().Should().Be("1.0.0");
        healthData.GetProperty("environment").GetString().Should().Be("Testing");
        
        // Verify system information
        healthData.GetProperty("upTime").GetInt64().Should().BeGreaterThan(0);
        healthData.GetProperty("machineName").GetString().Should().NotBeNullOrEmpty();
        healthData.GetProperty("processorCount").GetInt32().Should().BeGreaterThan(0);
        healthData.GetProperty("workingSet").GetInt64().Should().BeGreaterThan(0);
        
        // Verify dependencies section exists
        healthData.TryGetProperty("dependencies", out var dependencies).Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task HealthEndpoints_ConcurrentRequests_HandleLoadProperly()
    {
        // Arrange
        var tasks = Enumerable.Range(0, 10).Select(_ => _client.GetAsync("/api/health"));

        // Act
        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().HaveCount(10);
        responses.Should().OnlyContain(r => r.StatusCode == HttpStatusCode.OK);
        
        // Verify all responses have valid health data
        foreach (var response in responses)
        {
            var content = await response.Content.ReadAsStringAsync();
            var healthData = JsonSerializer.Deserialize<JsonElement>(content);
            healthData.GetProperty("status").GetString().Should().Be("Healthy");
        }
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task HealthEndpoints_ResponseTime_MeetsPerformanceRequirements()
    {
        // Arrange
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await _client.GetAsync("/api/health");
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000, "Health check should respond within 1 second");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task HealthEndpoints_Headers_IncludeAppropriateContentType()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    #endregion
}
