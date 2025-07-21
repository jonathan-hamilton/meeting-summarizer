using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Services;

/// <summary>
/// Sprint 2 tests for SummarizationService AI-powered summarization
/// Tests S2.3: AI-Powered Meeting Summarization Backend service layer
/// </summary>
[TestClass]
public class SummarizationServiceSprint2Tests
{
    private Mock<IOpenAIService> _mockOpenAIService = null!;
    private Mock<ILogger<SummarizationService>> _mockLogger = null!;
    private SummarizationService _service = null!;

    [TestInitialize]
    public void Setup()
    {
        _mockOpenAIService = new Mock<IOpenAIService>();
        _mockLogger = new Mock<ILogger<SummarizationService>>();
        _service = new SummarizationService(_mockOpenAIService.Object, _mockLogger.Object);
    }

    #region S2.3 Core Summarization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_ValidTranscriptBriefStyle_ReturnsSuccessfulSummary()
    {
        // Arrange
        var transcript = "Speaker 1: Good morning team. Speaker 2: Hello, ready to discuss the project status.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 150,
            Temperature = 0.3f
        };

        var mockOpenAIResponse = "**Meeting Summary**\n\nBrief team meeting to discuss project status. Participants expressed readiness to proceed with updates.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(mockOpenAIResponse);
        result.SummaryType.Should().Be(SummaryStyle.Brief);
        result.UsedSpeakerMappings.Should().BeFalse();
        result.ProcessingTimeMs.Should().BeGreaterThan(0);
        result.TokenCount.Should().BeGreaterThan(0);

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains(transcript) && prompt.Contains("brief")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_DetailedStyle_ReturnsDetailedSummaryWithActionItems()
    {
        // Arrange
        var transcript = "Speaker 1: We need to complete documentation. Speaker 2: I'll handle the user guide by Friday.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Detailed,
            MaxTokens = 300
        };

        var mockOpenAIResponse = "### Meeting Summary\n\n- Complete documentation discussed\n- User guide delivery by Friday\n\n**Action Items:**\n- Finalize documentation\n- Deliver user guide";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.Detailed);
        result.ActionItems.Should().NotBeNull();
        result.ActionItems!.Should().HaveCountGreaterThan(0);
        result.Content.Should().Contain("documentation");

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains("comprehensive summary") || prompt.Contains("detailed")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_ActionItemsStyle_ExtractsActionItems()
    {
        // Arrange
        var transcript = "Speaker 1: Let's assign tasks. Speaker 2: I will complete the API testing. Speaker 1: Please finish by Wednesday.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.ActionItems,
            MaxTokens = 200
        };

        var mockOpenAIResponse = "Action Items:\n- Complete API testing by Wednesday\n- Assign remaining tasks to team members";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.ActionItems);
        result.ActionItems.Should().NotBeNull();
        result.ActionItems!.Should().Contain(item => item.Contains("API testing"));

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains("action items")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_KeyDecisionsStyle_ExtractsKeyDecisions()
    {
        // Arrange
        var transcript = "Speaker 1: Should we use microservices? Speaker 2: Yes, we decided to go with microservices architecture.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.KeyDecisions,
            MaxTokens = 200
        };

        var mockOpenAIResponse = "Key Decisions:\n- Decided to implement microservices architecture\n- Architecture choice approved by team";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.KeyDecisions);
        result.KeyDecisions.Should().NotBeNull();
        result.KeyDecisions!.Should().Contain(decision => decision.Contains("microservices"));

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains("decisions")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_ExecutiveSummaryStyle_ReturnsExecutiveLevelContent()
    {
        // Arrange
        var transcript = "Speaker 1: Q3 results are strong. Speaker 2: Revenue exceeded targets by 20%.";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.ExecutiveSummary,
            MaxTokens = 250
        };

        var mockOpenAIResponse = "Executive Summary: Q3 performance exceeded expectations with 20% revenue growth above targets.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.Should().NotBeNull();
        result.SummaryType.Should().Be(SummaryStyle.ExecutiveSummary);
        result.Content.Should().Contain("Executive Summary");

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains("executive")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region S2.3 Role-Aware Summarization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateRoleAwareSummaryAsync_WithSpeakerMappings_ReturnsRoleAwareSummary()
    {
        // Arrange
        var transcript = "Speaker 1: The budget looks good. Speaker 2: Technical implementation is on track.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John Smith", Role = "Financial Manager", TranscriptionId = "test123" },
            new() { SpeakerId = "Speaker 2", Name = "Sarah Wilson", Role = "Technical Lead", TranscriptionId = "test123" }
        };
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 200
        };

        var mockOpenAIResponse = "Meeting between John Smith (Financial Manager) and Sarah Wilson (Technical Lead). Budget approved and technical progress confirmed.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        result.Should().NotBeNull();
        result.UsedSpeakerMappings.Should().BeTrue();
        result.Content.Should().Contain("John Smith (Financial Manager)");
        result.Content.Should().Contain("Sarah Wilson (Technical Lead)");

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt =>
                prompt.Contains("John Smith (Financial Manager)") &&
                prompt.Contains("Sarah Wilson (Technical Lead)")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateRoleAwareSummaryAsync_WithTargetRole_ReturnsTargetRoleSpecificSummary()
    {
        // Arrange
        var transcript = "Speaker 1: Security concerns need addressing. Speaker 2: Performance optimization completed.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "Alice Johnson", Role = "Security Engineer", TranscriptionId = "test123" },
            new() { SpeakerId = "Speaker 2", Name = "Bob Chen", Role = "Performance Engineer", TranscriptionId = "test123" }
        };
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Detailed,
            TargetRole = "Engineering Manager",
            MaxTokens = 300
        };

        var mockOpenAIResponse = "Engineering Summary: Security concerns raised by Alice Johnson require attention. Performance improvements by Bob Chen completed successfully.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        result.Should().NotBeNull();
        result.GeneratedFor.Should().Be("Engineering Manager");
        result.UsedSpeakerMappings.Should().BeTrue();

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt => prompt.Contains("Engineering Manager")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateRoleAwareSummaryAsync_AppliesSpeakerMappings_ReplacesGenericLabels()
    {
        // Arrange
        var transcript = "Speaker 1: Project timeline confirmed. Speaker 2: Resources allocated successfully.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "Mike Davis", Role = "Project Manager", TranscriptionId = "test123" },
            new() { SpeakerId = "Speaker 2", Name = "Lisa Brown", Role = "Resource Manager", TranscriptionId = "test123" }
        };
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        var mockOpenAIResponse = "Summary of meeting with proper names.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockOpenAIResponse);

        // Act
        var result = await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        result.Should().NotBeNull();

        // Verify that the transcript was enhanced with real names before sending to OpenAI
        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt =>
                prompt.Contains("Mike Davis (Project Manager):") &&
                prompt.Contains("Lisa Brown (Resource Manager):")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region S2.3 Error Handling Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_NullTranscript_ThrowsArgumentException()
    {
        // Arrange
        string? nullTranscript = null;
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => _service.GenerateSummaryAsync(nullTranscript!, options));

        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
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
    public async Task GenerateSummaryAsync_InvalidMaxTokens_ThrowsArgumentException()
    {
        // Arrange
        var transcript = "Valid transcript content";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            MaxTokens = 10000 // Exceeds limit
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => _service.GenerateSummaryAsync(transcript, options));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_OpenAIServiceThrows_PropagatesException()
    {
        // Arrange
        var transcript = "Valid transcript content";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("OpenAI service unavailable"));

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<InvalidOperationException>(
            () => _service.GenerateSummaryAsync(transcript, options));

        exception.Message.Should().Contain("OpenAI service unavailable");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateRoleAwareSummaryAsync_NullSpeakerMappings_ThrowsArgumentException()
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

    #region S2.3 Service Availability Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task IsServiceAvailableAsync_OpenAIServiceAvailable_ReturnsTrue()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.IsServiceAvailableAsync();

        // Assert
        result.Should().BeTrue();
        _mockOpenAIService.Verify(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task IsServiceAvailableAsync_OpenAIServiceUnavailable_ReturnsFalse()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.IsServiceAvailableAsync();

        // Assert
        result.Should().BeFalse();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task IsServiceAvailableAsync_OpenAIServiceThrows_ReturnsFalse()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Connection failed"));

        // Act
        var result = await _service.IsServiceAvailableAsync();

        // Assert
        result.Should().BeFalse();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void GetServiceStatus_ValidService_ReturnsJsonStatus()
    {
        // Arrange
        var mockOpenAIStatus = "{\n  \"Configured\": true,\n  \"Available\": true\n}";
        _mockOpenAIService
            .Setup(x => x.GetServiceStatus())
            .Returns(mockOpenAIStatus);

        // Act
        var result = _service.GetServiceStatus();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Should().Contain("AI Summarization Service");
        result.Should().Contain("Brief");
        result.Should().Contain("Detailed");
        result.Should().Contain("ActionItems");
        _mockOpenAIService.Verify(x => x.GetServiceStatus(), Times.Once);
    }

    #endregion

    #region S2.3 Prompt Engineering Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_BriefStyle_GeneratesAppropriatePrompt()
    {
        // Arrange
        var transcript = "Meeting content here";
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Brief,
            TargetRole = "Manager"
        };

        var mockResponse = "Brief summary";
        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        // Act
        await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt =>
                prompt.Contains("brief") &&
                prompt.Contains("high-level") &&
                prompt.Contains("Manager") &&
                prompt.Contains(transcript)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateRoleAwareSummaryAsync_IncludesParticipantContext()
    {
        // Arrange
        var transcript = "Speaker 1: Hello. Speaker 2: Hi there.";
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John", Role = "Developer", TranscriptionId = "test" },
            new() { SpeakerId = "Speaker 2", Name = "Jane", Role = "Designer", TranscriptionId = "test" }
        };
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        var mockResponse = "Role-aware summary";
        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        // Act
        await _service.GenerateRoleAwareSummaryAsync(transcript, speakerMappings, options);

        // Assert
        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(
            It.Is<string>(prompt =>
                prompt.Contains("Meeting participants:") &&
                prompt.Contains("John (Developer)") &&
                prompt.Contains("Jane (Designer)")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region S2.3 Performance and Metrics Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_TracksProcessingTime_ReturnsPositiveProcessingTime()
    {
        // Arrange
        var transcript = "Test transcript";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (string prompt, CancellationToken ct) =>
            {
                await Task.Delay(100, ct); // Simulate processing time
                return "Test summary";
            });

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.ProcessingTimeMs.Should().BeGreaterThan(0);
        result.ProcessingTimeMs.Should().BeLessThan(10000); // Reasonable upper bound
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummaryAsync_EstimatesTokenCount_ReturnsReasonableTokenCount()
    {
        // Arrange
        var transcript = "Short transcript";
        var options = new SummaryOptions { Style = SummaryStyle.Brief };
        var mockResponse = "This is a test summary with multiple words to estimate token count properly.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _service.GenerateSummaryAsync(transcript, options);

        // Assert
        result.TokenCount.Should().BeGreaterThan(0);
        result.TokenCount.Should().Be(mockResponse.Length / 4); // Basic estimation algorithm
    }

    #endregion
}
