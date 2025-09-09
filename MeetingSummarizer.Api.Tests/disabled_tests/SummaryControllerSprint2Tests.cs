using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using System.Net;
using System.Text;
using System.Text.Json;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MeetingSummarizer.Api.Controllers;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Tests.Controllers;

/// <summary>
/// Sprint 2 tests for SummaryController AI summarization endpoints
/// Tests S2.3: AI-Powered Meeting Summarization Backend functionality
/// </summary>
[TestClass]
public class SummaryControllerSprint2Tests
{
    private Mock<ILogger<SummaryController>> _mockLogger = null!;
    private Mock<IOpenAIService> _mockOpenAIService = null!;
    private Mock<ISummarizationService> _mockSummarizationService = null!;
    private Mock<ISpeakerMappingService> _mockSpeakerMappingService = null!;
    private SummaryController _controller = null!;

    [TestInitialize]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<SummaryController>>();
        _mockOpenAIService = new Mock<IOpenAIService>();
        _mockSummarizationService = new Mock<ISummarizationService>();
        _mockSpeakerMappingService = new Mock<ISpeakerMappingService>();

        _controller = new SummaryController(
            _mockLogger.Object,
            _mockOpenAIService.Object,
            _mockSummarizationService.Object,
            _mockSpeakerMappingService.Object);
    }

    #region S2.3 AI Summarization Tests - Basic Functionality

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ValidTranscriptBriefStyle_ReturnsSuccessfulSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Good morning team. Speaker 2: Hello, ready to discuss the project.",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Brief meeting summary discussing project status.",
            SummaryType = SummaryStyle.Brief,
            ProcessingTimeMs = 2000,
            TokenCount = 45,
            UsedSpeakerMappings = false
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.Content.Should().Be(expectedSummary.Content);
        summaryResult.SummaryType.Should().Be(SummaryStyle.Brief);
        summaryResult.UsedSpeakerMappings.Should().BeFalse();

        _mockSummarizationService.Verify(x => x.GenerateSummaryAsync(
            request.Transcript,
            It.Is<SummaryOptions>(opts => opts.Style == SummaryStyle.Brief && opts.MaxTokens == 150),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ValidTranscriptDetailedStyle_ReturnsDetailedSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Let's review the quarterly results. Speaker 2: The numbers show 20% growth.",
            Style = SummaryStyle.Detailed,
            MaxTokens = 300
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Detailed meeting summary covering quarterly results review and growth analysis.",
            SummaryType = SummaryStyle.Detailed,
            ActionItems = new List<string> { "Review detailed quarterly metrics", "Analyze growth drivers" },
            KeyDecisions = new List<string> { "Approved continued growth strategy" },
            ProcessingTimeMs = 3500,
            TokenCount = 120,
            UsedSpeakerMappings = false
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.Detailed);
        summaryResult.ActionItems.Should().HaveCount(2);
        summaryResult.KeyDecisions.Should().HaveCount(1);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ActionItemsStyle_ReturnsActionItemsFocusedSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: We need to complete the documentation. Speaker 2: I'll handle the user guide by Friday.",
            Style = SummaryStyle.ActionItems,
            MaxTokens = 200
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Action items from the meeting focused on documentation completion.",
            SummaryType = SummaryStyle.ActionItems,
            ActionItems = new List<string> { "Complete documentation", "User guide delivery by Friday" },
            ProcessingTimeMs = 2800,
            TokenCount = 80
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.ActionItems);
        summaryResult.ActionItems.Should().HaveCount(2);
        summaryResult.ActionItems.Should().Contain("Complete documentation");
    }

    #endregion

    #region S2.3 Role-Aware Summarization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_WithSpeakerMappings_ReturnsRoleAwareSummary()
    {
        // Arrange
        var speakerMappings = new List<SpeakerMapping>
        {
            new() { SpeakerId = "Speaker 1", Name = "John Smith", Role = "Project Manager", TranscriptionId = "test123" },
            new() { SpeakerId = "Speaker 2", Name = "Sarah Johnson", Role = "Lead Developer", TranscriptionId = "test123" }
        };

        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Let's review the sprint progress. Speaker 2: We completed 8 out of 10 story points.",
            Style = SummaryStyle.Brief,
            MaxTokens = 200,
            SpeakerMappings = speakerMappings
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Sprint review meeting between John Smith (Project Manager) and Sarah Johnson (Lead Developer). Progress update: 8/10 story points completed.",
            SummaryType = SummaryStyle.Brief,
            ProcessingTimeMs = 3200,
            TokenCount = 95,
            UsedSpeakerMappings = true
        };

        _mockSummarizationService
            .Setup(x => x.GenerateRoleAwareSummaryAsync(It.IsAny<string>(), It.IsAny<List<SpeakerMapping>>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.UsedSpeakerMappings.Should().BeTrue();
        summaryResult.Content.Should().Contain("John Smith (Project Manager)");
        summaryResult.Content.Should().Contain("Sarah Johnson (Lead Developer)");

        _mockSummarizationService.Verify(x => x.GenerateRoleAwareSummaryAsync(
            request.Transcript,
            It.Is<List<SpeakerMapping>>(mappings => mappings.Count == 2),
            It.IsAny<SummaryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_WithTargetRole_ReturnsRoleSpecificSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: The project is on schedule. Speaker 2: We need more resources for testing.",
            Style = SummaryStyle.ExecutiveSummary,
            MaxTokens = 250,
            TargetRole = "Executive"
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Executive Summary: Project maintains schedule, resource allocation needed for testing phase.",
            SummaryType = SummaryStyle.ExecutiveSummary,
            GeneratedFor = "Executive",
            ProcessingTimeMs = 2900,
            TokenCount = 110
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.GeneratedFor.Should().Be("Executive");
        summaryResult.SummaryType.Should().Be(SummaryStyle.ExecutiveSummary);

        _mockSummarizationService.Verify(x => x.GenerateSummaryAsync(
            request.Transcript,
            It.Is<SummaryOptions>(opts => opts.TargetRole == "Executive"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region S2.3 Error Handling Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_EmptyTranscript_ReturnsBadRequest()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult?.Value.Should().NotBeNull();

        _mockSummarizationService.Verify(x => x.GenerateSummaryAsync(
            It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ServiceThrowsInvalidOperationException_ReturnsServiceUnavailable()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript content",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("OpenAI service unavailable"));

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult?.StatusCode.Should().Be(503);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript content",
            Style = SummaryStyle.Brief,
            MaxTokens = 10000 // Exceeds limit
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("MaxTokens exceeds limit"));

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult?.Value.Should().NotBeNull();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript content",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult?.StatusCode.Should().Be(500);
    }

    #endregion

    #region S2.3 Future Transcription Storage Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummarizeTranscription_ValidTranscriptionId_ReturnsNotImplemented()
    {
        // Arrange
        var transcriptionId = "test-transcription-123";
        var request = new TranscriptionSummaryRequest
        {
            TranscriptionId = transcriptionId,
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        // Act
        var result = _controller.SummarizeTranscription(transcriptionId, request);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult?.StatusCode.Should().Be(501); // Not Implemented
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummarizeTranscription_MismatchedTranscriptionIds_ReturnsBadRequest()
    {
        // Arrange
        var urlTranscriptionId = "test-transcription-123";
        var request = new TranscriptionSummaryRequest
        {
            TranscriptionId = "different-transcription-456",
            Style = SummaryStyle.Brief,
            MaxTokens = 150
        };

        // Act
        var result = _controller.SummarizeTranscription(urlTranscriptionId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult?.Value.Should().NotBeNull();
    }

    #endregion

    #region S2.3 Service Status Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void GetSummarizationStatus_ValidService_ReturnsStatusInformation()
    {
        // Arrange
        var expectedStatus = "{\n  \"ServiceName\": \"AI Summarization Service\",\n  \"Available\": true\n}";
        _mockSummarizationService
            .Setup(x => x.GetServiceStatus())
            .Returns(expectedStatus);

        // Act
        var result = _controller.GetSummarizationStatus();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult?.Value.Should().NotBeNull();

        _mockSummarizationService.Verify(x => x.GetServiceStatus(), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void GetSummarizationStatus_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        _mockSummarizationService
            .Setup(x => x.GetServiceStatus())
            .Throws(new Exception("Service status unavailable"));

        // Act
        var result = _controller.GetSummarizationStatus();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult?.StatusCode.Should().Be(500);
    }

    #endregion

    #region S2.3 Integration with Speaker Mapping Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_EmptySpeakerMappings_UsesStandardSummarization()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Meeting discussion. Speaker 2: Agreement reached.",
            Style = SummaryStyle.Brief,
            MaxTokens = 150,
            SpeakerMappings = new List<SpeakerMapping>() // Empty list
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Brief meeting summary.",
            SummaryType = SummaryStyle.Brief,
            ProcessingTimeMs = 2000,
            TokenCount = 45,
            UsedSpeakerMappings = false
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        // Should use standard summarization, not role-aware
        _mockSummarizationService.Verify(x => x.GenerateSummaryAsync(
            It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()), Times.Once);

        _mockSummarizationService.Verify(x => x.GenerateRoleAwareSummaryAsync(
            It.IsAny<string>(), It.IsAny<List<SpeakerMapping>>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region S2.3 Summary Styles Comprehensive Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_KeyDecisionsStyle_ReturnsDecisionsFocusedSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Should we proceed with Plan A? Speaker 2: Yes, Plan A is approved. Speaker 1: Great, we'll move forward.",
            Style = SummaryStyle.KeyDecisions,
            MaxTokens = 200
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Key decisions from the meeting.",
            SummaryType = SummaryStyle.KeyDecisions,
            KeyDecisions = new List<string> { "Plan A approved and moving forward" },
            ProcessingTimeMs = 2500,
            TokenCount = 75
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.KeyDecisions);
        summaryResult.KeyDecisions.Should().HaveCount(1);
        summaryResult.KeyDecisions![0].Should().Contain("Plan A approved");
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public async Task GenerateSummary_ExecutiveSummaryStyle_ReturnsExecutiveLevelSummary()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Speaker 1: Q3 revenue exceeded targets by 15%. Speaker 2: Customer satisfaction scores improved to 4.8/5.",
            Style = SummaryStyle.ExecutiveSummary,
            MaxTokens = 300
        };

        var expectedSummary = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            Content = "Executive Summary: Strong Q3 performance with revenue exceeding targets and high customer satisfaction.",
            SummaryType = SummaryStyle.ExecutiveSummary,
            ProcessingTimeMs = 3100,
            TokenCount = 135
        };

        _mockSummarizationService
            .Setup(x => x.GenerateSummaryAsync(It.IsAny<string>(), It.IsAny<SummaryOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GenerateSummary(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var summaryResult = okResult?.Value as SummaryResult;

        summaryResult.Should().NotBeNull();
        summaryResult!.SummaryType.Should().Be(SummaryStyle.ExecutiveSummary);
        summaryResult.Content.Should().Contain("Executive Summary");
    }

    #endregion
}
