using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Services;

/// <summary>
/// Sprint 2 tests for MockSummarizationService development fallback
/// Tests S2.3: AI-Powered Meeting Summarization Backend mock service
/// </summary>
[TestClass]
public class MockSummarizationServiceSprint2Tests
{
    private Mock<ILogger<MockSummarizationService>> _mockLogger = null!;
    private MockSummarizationService _service = null!;

    [TestInitialize]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<MockSummarizationService>>();
        _service = new MockSummarizationService(_mockLogger.Object);
    }

    #region S2.3 Mock Summarization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_BriefStyle_ReturnsBriefMockSummary()
    {
        // Arrange
        var transcript = "Speaker 1: Hello team. Speaker 2: Let's start the meeting.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.Brief);
        result.Content.Should().Contain("Brief summary of the meeting");
        result.UsedSpeakerMappings.Should().BeFalse();
        result.ProcessingTimeMs.Should().BeInRange(100, 1000); // Mock processing time
        result.TokenCount.Should().BeGreaterThan(0);
        result.GeneratedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_DetailedStyle_ReturnsDetailedMockSummaryWithActionItems()
    {
        // Arrange
        var transcript = "Meeting about project planning and task assignments.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Detailed,
            MaxTokens = 300
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.Detailed);
        result.Content.Should().Contain("Detailed summary");
        result.Content.Should().Contain("**Key Points:**");
        result.ActionItems.Should().NotBeNull();
        result.ActionItems!.Should().HaveCountGreaterThan(0);
        result.ActionItems![0].Should().Contain("Complete project documentation");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_ActionItemsStyle_ReturnsActionItemsFocusedSummary()
    {
        // Arrange
        var transcript = "Task assignment and deadline discussion.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.ActionItems,
            MaxTokens = 200
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.ActionItems);
        result.Content.Should().Contain("Action Items");
        result.ActionItems.Should().NotBeNull();
        result.ActionItems!.Should().HaveCount(3);
        result.ActionItems!.Should().Contain(item => item.Contains("Review and approve"));
        result.ActionItems!.Should().Contain(item => item.Contains("Update project timeline"));
        result.ActionItems!.Should().Contain(item => item.Contains("Schedule follow-up"));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_KeyDecisionsStyle_ReturnsKeyDecisionsSummary()
    {
        // Arrange
        var transcript = "Decision making meeting about technical architecture.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.KeyDecisions,
            MaxTokens = 250
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.KeyDecisions);
        result.Content.Should().Contain("Key Decisions");
        result.KeyDecisions.Should().NotBeNull();
        result.KeyDecisions!.Should().HaveCount(2);
        result.KeyDecisions!.Should().Contain(decision => decision.Contains("Use microservices architecture"));
        result.KeyDecisions!.Should().Contain(decision => decision.Contains("Implement API-first design"));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_ExecutiveSummaryStyle_ReturnsExecutiveLevelSummary()
    {
        // Arrange
        var transcript = "Executive meeting discussing quarterly results.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.ExecutiveSummary,
            MaxTokens = 300
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.ExecutiveSummary);
        result.Content.Should().Contain("Executive Summary");
        result.Content.Should().Contain("high-level overview");
        result.Content.Should().Contain("strategic implications");
    }

    #endregion

    #region S2.3 Mock Role-Aware Summarization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_WithSpeakerMappings_ReturnsRoleAwareMockSummary()
    {
        // Arrange
        var transcript = "Speaker 1: Budget approved. Speaker 2: Technical specs ready.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John Smith", Role = "CFO", TranscriptionId = "test123" },
            new() { SpeakerId = "Speaker 2", Name = "Sarah Wilson", Role = "CTO", TranscriptionId = "test123" }
        };
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 200
        };

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        result.Should().NotBeNull();
        result.UsedSpeakerMappings.Should().BeTrue();
        result.Content.Should().Contain("John Smith (CFO)");
        result.Content.Should().Contain("Sarah Wilson (CTO)");
        result.Content.Should().Contain("role-aware summary");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_WithTargetRole_IncludesTargetRoleInSummary()
    {
        // Arrange
        var transcript = "Technical discussion about system performance.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "Alice Johnson", Role = "DevOps Engineer", TranscriptionId = "test" },
            new() { SpeakerId = "Speaker 2", Name = "Bob Chen", Role = "Senior Developer", TranscriptionId = "test" }
        };
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Detailed,
            TargetRole = "Engineering Manager",
            MaxTokens = 300
        };

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        result.Should().NotBeNull();
        result.GeneratedFor.Should().Be("Engineering Manager");
        result.Content.Should().Contain("Engineering Manager");
        result.Content.Should().Contain("Alice Johnson (DevOps Engineer)");
        result.Content.Should().Contain("Bob Chen (Senior Developer)");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_EmptySpeakerMappings_ReturnsBasicSummary()
    {
        // Arrange
        var transcript = "Meeting without speaker identification.";
        var emptySpeakerMappings = new List<SpeakerMapping>();
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, emptySpeakerMappings, options);

        // Assert
        result.Should().NotBeNull();
        result.UsedSpeakerMappings.Should().BeFalse();
        result.Content.Should().Contain("meeting summary");
        result.Content.Should().NotContain("role-aware");
    }

    #endregion

    #region S2.3 Mock Error Handling Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_NullTranscript_ThrowsArgumentException()
    {
        // Arrange
        string? nullTranscript = null;
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => _service.GenerateSummaryAsync(nullTranscript!, options));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_EmptyTranscript_ThrowsArgumentException()
    {
        // Arrange
        var emptyTranscript = "";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => _service.GenerateSummaryAsync(emptyTranscript, options));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_TranscriptTooLong_ThrowsArgumentException()
    {
        // Arrange
        var veryLongTranscript = new string('A', 500001); // Exceeds 500KB limit
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => _service.GenerateSummaryAsync(veryLongTranscript, options));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_NullSpeakerMappings_ThrowsArgumentNullException()
    {
        // Arrange
        var transcript = "Valid transcript";
        List<SpeakerMapping>? nullMappings = null;
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentNullException>(
            () => _service.GenerateRoleAwareSummaryAsync(transcript, nullMappings!, options));
    }

    #endregion

    #region S2.3 Mock Service Availability Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task IsServiceAvailableAsync_MockService_AlwaysReturnsTrue()
    {
        // Act
        var result = await _service.IsServiceAvailableAsync();

        // Assert
        result.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task IsServiceAvailableAsync_WithCancellation_ReturnsTrue()
    {
        // Arrange
        var cancellationToken = new CancellationToken();

        // Act
        var result = await _service.IsServiceAvailableAsync(cancellationToken);

        // Assert
        result.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public void GetServiceStatus_MockService_ReturnsValidJsonStatus()
    {
        // Act
        var result = _service.GetServiceStatus();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Should().Contain("Mock AI Summarization Service");
        result.Should().Contain("\"Available\": true");
        result.Should().Contain("\"Type\": \"Mock\"");
        result.Should().Contain("Brief");
        result.Should().Contain("Detailed");
        result.Should().Contain("ActionItems");
        result.Should().Contain("KeyDecisions");
        result.Should().Contain("ExecutiveSummary");
    }

    #endregion

    #region S2.3 Mock Performance Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_SimulatesRealisticProcessingTime()
    {
        // Arrange
        var transcript = "Test transcript for timing";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.ProcessingTimeMs.Should().BeInRange(100, 1000); // Mock simulates 100-1000ms
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_SimulatesIncreasedProcessingTime()
    {
        // Arrange
        var transcript = "Role-aware test transcript";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John", Role = "Manager", TranscriptionId = "test" }
        };
        var options = new SummaryOptions { Style = SummaryStyle.Detailed };

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        // Role-aware processing should take slightly longer
        result.ProcessingTimeMs.Should().BeInRange(150, 1200);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_ConsistentTokenCounting()
    {
        // Arrange
        var transcript = "This is a test transcript with multiple words for token counting.";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.TokenCount.Should().BeGreaterThan(0);
        result.TokenCount.Should().Be(result.Content.Length / 4); // Basic estimation
    }

    #endregion

    #region S2.3 Mock Content Variation Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_DifferentStyles_ProduceDifferentContent()
    {
        // Arrange
        var transcript = "Same transcript for different styles";

        // Act
        var briefResult = await _service.GenerateSummaryAsync(transcript,
            new SummaryOptions { Style = SummaryStyle.Brief });
        var detailedResult = await _service.GenerateSummaryAsync(transcript,
            new SummaryOptions { Style = SummaryStyle.Detailed });
        var actionItemsResult = await _service.GenerateSummaryAsync(transcript,
            new SummaryOptions { Style = SummaryStyle.ActionItems });

        // Assert
        briefResult.Content.Should().NotBe(detailedResult.Content);
        briefResult.Content.Should().NotBe(actionItemsResult.Content);
        detailedResult.Content.Should().NotBe(actionItemsResult.Content);

        briefResult.Content.Should().Contain("Brief");
        detailedResult.Content.Should().Contain("Detailed");
        actionItemsResult.Content.Should().Contain("Action Items");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_WithTargetRole_IncludesRoleInContent()
    {
        // Arrange
        var transcript = "Meeting content for role targeting";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            TargetRole = "Project Manager"
        };

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.GeneratedFor.Should().Be("Project Manager");
        result.Content.Should().Contain("Project Manager");
    }

    #endregion

    #region S2.3 Mock Logging Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateSummaryAsync_LogsServiceUsage()
    {
        // Arrange
        var transcript = "Test transcript for logging";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act
        await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        // Verify that information was logged (mock service should log usage)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Mock summarization")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    [TestCategory("Mock")]
    public async Task GenerateRoleAwareSummaryAsync_LogsRoleAwareUsage()
    {
        // Arrange
        var transcript = "Test transcript";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "Test", Role = "Tester", TranscriptionId = "test" }
        };
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act
        await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("role-aware")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion
}
