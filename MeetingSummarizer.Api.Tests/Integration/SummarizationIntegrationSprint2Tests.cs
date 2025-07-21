using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Integration;

/// <summary>
/// Sprint 2 integration tests for AI-Powered Meeting Summarization
/// Tests S2.3: AI-Powered Meeting Summarization Backend end-to-end workflows
/// </summary>
[TestClass]
public class SummarizationIntegrationSprint2Tests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    [TestInitialize]
    public void Setup()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["OpenAI:ApiKey"] = "test-key-for-integration-tests",
                        ["OpenAI:Model"] = "gpt-4",
                        ["OpenAI:BaseUrl"] = "https://api.openai.com/v1"
                    });
                });
            });

        _client = _factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    #region S2.3 Health Check Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task HealthCheck_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Healthy");
    }

    #endregion

    #region S2.3 Summary Generation Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_ValidRequest_ReturnsSummaryResponse()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Good morning team. We need to discuss the project status and upcoming milestones. Speaker 2: I've completed the API development. The endpoints are ready for testing.",
            Style = SummaryStyle.Brief,
            MaxTokens = 200
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summaryResult.Should().NotBeNull();
        summaryResult!.Content.Should().NotBeNullOrEmpty();
        summaryResult.SummaryType.Should().Be(SummaryStyle.Brief);
        summaryResult.GeneratedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        summaryResult.ProcessingTimeMs.Should().BeGreaterThan(0);
        summaryResult.TokenCount.Should().BeGreaterThan(0);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_DetailedStyle_ReturnsDetailedSummaryWithActionItems()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: We need to prioritize the documentation. Speaker 2: I'll handle the user guide by Friday. Speaker 1: Great, and we need to schedule testing for next week.",
            Style = SummaryStyle.Detailed,
            MaxTokens = 400
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.Detailed);
        summaryResult.ActionItems.Should().NotBeNull();
        summaryResult.ActionItems!.Should().HaveCountGreaterThan(0);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_ActionItemsStyle_ExtractsActionItems()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Let's assign the database optimization task to John. Speaker 2: I will complete the security review by Wednesday. Speaker 1: Perfect, and don't forget to update the deployment scripts.",
            Style = SummaryStyle.ActionItems,
            MaxTokens = 300
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.ActionItems);
        summaryResult.ActionItems.Should().NotBeNull();
        summaryResult.ActionItems!.Should().HaveCountGreaterThan(0);
        summaryResult.Content.Should().ContainAny("action", "task", "complete");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_WithTargetRole_IncludesRoleInResponse()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Technical implementation is on track. Speaker 2: Budget allocation looks good for Q4.",
            Style = SummaryStyle.ExecutiveSummary,
            TargetRole = "Executive Director",
            MaxTokens = 250
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summaryResult.Should().NotBeNull();
        summaryResult!.GeneratedFor.Should().Be("Executive Director");
        summaryResult.SummaryType.Should().Be(SummaryStyle.ExecutiveSummary);
    }

    #endregion

    #region S2.3 Role-Aware Summarization Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateRoleAwareSummary_WithSpeakerMappings_ReturnsEnhancedSummary()
    {
        // Arrange
        var transcriptionId = "role-aware-test-123";

        // First, create speaker mappings
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John Smith", Role = "Technical Lead", TranscriptionId = transcriptionId },
            new() { SpeakerId = "Speaker 2", Name = "Sarah Wilson", Role = "Product Manager", TranscriptionId = transcriptionId }
        };

        // Create speaker mappings first
        foreach (var mapping in speakerMappings)
        {
            var mappingJson = JsonSerializer.Serialize(mapping);
            var mappingContent = new StringContent(mappingJson, Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/speakers", mappingContent);
        }

        // Create the summary request with speaker mappings
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: The technical architecture is solid. Speaker 2: From a product perspective, we're meeting user requirements.",
            Style = SummaryStyle.Brief,
            MaxTokens = 300,
            SpeakerMappings = speakerMappings
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summaryResult.Should().NotBeNull();
        summaryResult!.UsedSpeakerMappings.Should().BeTrue();
        summaryResult.Content.Should().ContainAny("John Smith", "Sarah Wilson", "Technical Lead", "Product Manager");
    }

    #endregion

    #region S2.3 Error Handling Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var invalidRequest = new SummaryRequest
        {
            Transcript = "", // Invalid - empty
            Style = SummaryStyle.Brief
        };

        var jsonContent = JsonSerializer.Serialize(invalidRequest);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_TranscriptTooLong_ReturnsBadRequest()
    {
        // Arrange
        var invalidRequest = new SummaryRequest
        {
            Transcript = new string('A', 500001), // Exceeds limit
            Style = SummaryStyle.Brief
        };

        var jsonContent = JsonSerializer.Serialize(invalidRequest);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_InvalidMaxTokens_ReturnsBadRequest()
    {
        // Arrange
        var invalidRequest = new SummaryRequest
        {
            Transcript = "Valid transcript content",
            Style = SummaryStyle.Brief,
            MaxTokens = 3000 // Invalid - too high
        };

        var jsonContent = JsonSerializer.Serialize(invalidRequest);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_MalformedJson_ReturnsBadRequest()
    {
        // Arrange
        var malformedJson = "{ invalid json content }";
        var content = new StringContent(malformedJson, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    #endregion

    #region S2.3 Service Status Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GetSummaryServiceStatus_ReturnsServiceStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/summary/status");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        content.Should().NotBeNullOrEmpty();
        content.Should().Contain("Summarization Service");
        content.Should().ContainAny("Available", "Configured");
        content.Should().Contain("Brief");
        content.Should().Contain("Detailed");
        content.Should().Contain("ActionItems");
        content.Should().Contain("KeyDecisions");
        content.Should().Contain("ExecutiveSummary");
    }

    #endregion

    #region S2.3 Performance Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_PerformanceTest_CompletesWithinReasonableTime()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: This is a performance test transcript. Speaker 2: We want to ensure the API responds quickly.",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        stopwatch.Stop();
        response.EnsureSuccessStatusCode();

        // Should complete within 30 seconds (generous for integration test with potential mock service)
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(30000);

        var responseContent = await response.Content.ReadAsStringAsync();
        var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        summaryResult.Should().NotBeNull();
        summaryResult!.ProcessingTimeMs.Should().BeGreaterThan(0);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_MultipleConcurrentRequests_HandlesLoad()
    {
        // Arrange
        var tasks = new List<Task<HttpResponseMessage>>();

        for (int i = 0; i < 5; i++)
        {
            var request = new SummaryRequest
            {
                Transcript = $"Speaker 1: This is concurrent test {i}. Speaker 2: Testing load handling capabilities.",
                Style = SummaryStyle.Brief,
                MaxTokens = 100
            };

            var jsonContent = JsonSerializer.Serialize(request);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            tasks.Add(_client.PostAsync("/api/summary/generate", content));
        }

        // Act
        var responses = await Task.WhenAll(tasks);

        // Assert
        foreach (var response in responses)
        {
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var summaryResult = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            summaryResult.Should().NotBeNull();
            summaryResult!.Content.Should().NotBeNullOrEmpty();
        }
    }

    #endregion

    #region S2.3 Content Type and Headers Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_ValidRequest_ReturnsJsonContentType()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Test transcript for content type validation",
            Style = SummaryStyle.Brief
        };

        var jsonContent = JsonSerializer.Serialize(request);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/summary/generate", content);

        // Assert
        response.EnsureSuccessStatusCode();
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    public async Task GenerateSummary_OptionsRequest_ReturnsAllowedMethods()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/summary/generate");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().BeOneOf(
            System.Net.HttpStatusCode.OK,
            System.Net.HttpStatusCode.NoContent,
            System.Net.HttpStatusCode.MethodNotAllowed // Some configurations might not allow OPTIONS
        );
    }

    #endregion

    #region S2.3 End-to-End Workflow Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Integration")]
    [TestCategory("E2E")]
    public async Task EndToEndWorkflow_CreateSpeakersAndGenerateRoleAwareSummary_Success()
    {
        // Arrange
        var transcriptionId = "e2e-workflow-test";

        // Step 1: Create speaker mappings
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "Dr. Emily Chen", Role = "Research Director", TranscriptionId = transcriptionId },
            new() { SpeakerId = "Speaker 2", Name = "Mark Johnson", Role = "Engineering Manager", TranscriptionId = transcriptionId }
        };

        foreach (var mapping in speakerMappings)
        {
            var mappingJson = JsonSerializer.Serialize(mapping);
            var mappingContent = new StringContent(mappingJson, Encoding.UTF8, "application/json");
            var mappingResponse = await _client.PostAsync("/api/speakers", mappingContent);
            mappingResponse.EnsureSuccessStatusCode();
        }

        // Step 2: Generate role-aware summary
        var summaryRequest = new SummaryRequest
        {
            Transcript = "Speaker 1: Our research indicates strong user adoption. Speaker 2: From an engineering perspective, the system is performing well under load.",
            Style = SummaryStyle.Detailed,
            TargetRole = "Executive Team",
            MaxTokens = 400,
            SpeakerMappings = speakerMappings
        };

        var summaryJson = JsonSerializer.Serialize(summaryRequest);
        var summaryContent = new StringContent(summaryJson, Encoding.UTF8, "application/json");

        // Act
        var summaryResponse = await _client.PostAsync("/api/summary/generate", summaryContent);

        // Assert
        summaryResponse.EnsureSuccessStatusCode();
        var responseContent = await summaryResponse.Content.ReadAsStringAsync();
        var summary = JsonSerializer.Deserialize<SummaryResult>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        summary.Should().NotBeNull();
        summary!.UsedSpeakerMappings.Should().BeTrue();
        summary.GeneratedFor.Should().Be("Executive Team");
        summary.SummaryType.Should().Be(SummaryStyle.Detailed);
        summary.Content.Should().ContainAny("Emily Chen", "Mark Johnson", "Research Director", "Engineering Manager");
    }

    #endregion
}
