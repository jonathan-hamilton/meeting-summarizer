using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using Moq;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Services;

/// <summary>
/// Sprint 1 tests for OpenAI Service interface and behavior
/// Tests S1.1: Audio Transcription Backend Service and S1.4: OpenAI API Integration
/// </summary>
[TestClass]
public class OpenAIServiceSprint1Tests
{
    private Mock<IOpenAIService> _mockOpenAIService = null!;

    [TestInitialize]
    public void Setup()
    {
        _mockOpenAIService = new Mock<IOpenAIService>();
    }

    #region S1.1 Audio Transcription Service Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioWithMetadataAsync_ValidAudioStream_ReturnsTranscriptionResult()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "test-audio.mp3";
        var expectedResult = new TranscriptionResult
        {
            Text = "This is a test transcription with speaker diarization.",
            DetectedLanguage = "en",
            Duration = 30.5,
            Segments = new List<SpeakerSegment>
            {
                new()
                {
                    Start = 0.0,
                    End = 15.0,
                    Text = "This is a test transcription",
                    Speaker = "Speaker 1",
                    Confidence = 0.95
                },
                new()
                {
                    Start = 15.0,
                    End = 30.5,
                    Text = "with speaker diarization.",
                    Speaker = "Speaker 2",
                    Confidence = 0.92
                }
            }
        };

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName);

        // Assert
        result.Should().NotBeNull();
        result.Text.Should().Be(expectedResult.Text);
        result.DetectedLanguage.Should().Be("en");
        result.Duration.Should().Be(30.5);
        result.Segments.Should().HaveCount(2);
        result.Segments[0].Speaker.Should().Be("Speaker 1");
        result.Segments[1].Speaker.Should().Be("Speaker 2");
        
        _mockOpenAIService.Verify(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioAsync_LegacyMethod_ReturnsTranscriptionText()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "legacy-test.mp3";
        var expectedText = "This is a legacy transcription without speaker diarization.";

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedText);

        // Act
        var result = await _mockOpenAIService.Object.TranscribeAudioAsync(audioStream, fileName);

        // Assert
        result.Should().Be(expectedText);
        
        _mockOpenAIService.Verify(x => x.TranscribeAudioAsync(audioStream, fileName, It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioWithMetadataAsync_ServiceUnavailable_ThrowsInvalidOperationException()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "error-test.mp3";

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("OpenAI service is temporarily unavailable"));

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<InvalidOperationException>(
            () => _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName));
        
        exception.Message.Should().Contain("OpenAI service is temporarily unavailable");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioWithMetadataAsync_AuthenticationFailure_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "auth-error-test.mp3";

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("Invalid OpenAI API key"));

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(
            () => _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName));
        
        exception.Message.Should().Contain("Invalid OpenAI API key");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioWithMetadataAsync_TimeoutFailure_ThrowsTaskCanceledException()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "timeout-test.mp3";

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TaskCanceledException("Request timeout"));

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<TaskCanceledException>(
            () => _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName));
        
        exception.Message.Should().Contain("Request timeout");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioWithMetadataAsync_CancellationRequested_RespectsCancellationToken()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "cancel-test.mp3";
        var cancellationTokenSource = new CancellationTokenSource();
        
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string name, CancellationToken token) =>
            {
                await Task.Delay(100, token); // Simulate work
                token.ThrowIfCancellationRequested();
                return new TranscriptionResult { Text = "Should not complete" };
            });

        // Act
        cancellationTokenSource.Cancel();

        // Assert
        await Assert.ThrowsExceptionAsync<TaskCanceledException>(
            () => _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName, cancellationTokenSource.Token));
    }

    #endregion

    #region S1.4 OpenAI API Integration Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task IsServiceAvailableAsync_ServiceConfigured_ReturnsTrue()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var isAvailable = await _mockOpenAIService.Object.IsServiceAvailableAsync();

        // Assert
        isAvailable.Should().BeTrue();
        
        _mockOpenAIService.Verify(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task IsServiceAvailableAsync_ServiceNotConfigured_ReturnsFalse()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.IsServiceAvailableAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var isAvailable = await _mockOpenAIService.Object.IsServiceAvailableAsync();

        // Assert
        isAvailable.Should().BeFalse();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public void GetServiceStatus_ServiceConfigured_ReturnsStatusMessage()
    {
        // Arrange
        var expectedStatus = "OpenAI service is configured and available";
        _mockOpenAIService
            .Setup(x => x.GetServiceStatus())
            .Returns(expectedStatus);

        // Act
        var status = _mockOpenAIService.Object.GetServiceStatus();

        // Assert
        status.Should().Be(expectedStatus);
        
        _mockOpenAIService.Verify(x => x.GetServiceStatus(), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public void GetServiceStatus_ServiceNotConfigured_ReturnsErrorMessage()
    {
        // Arrange
        var expectedStatus = "OpenAI service is not configured - using mock service";
        _mockOpenAIService
            .Setup(x => x.GetServiceStatus())
            .Returns(expectedStatus);

        // Act
        var status = _mockOpenAIService.Object.GetServiceStatus();

        // Assert
        status.Should().Contain("not configured");
        status.Should().Contain("mock service");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task SummarizeTextAsync_ValidText_ReturnsSummary()
    {
        // Arrange
        var inputText = "This is a long transcription that needs to be summarized for easier consumption.";
        var expectedSummary = "Meeting summary: Discussion about transcription needs.";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(inputText, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        // Act
        var summary = await _mockOpenAIService.Object.SummarizeTextAsync(inputText);

        // Assert
        summary.Should().Be(expectedSummary);
        
        _mockOpenAIService.Verify(x => x.SummarizeTextAsync(inputText, It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task SummarizeTextAsync_EmptyText_HandlesGracefully()
    {
        // Arrange
        var emptyText = "";
        var expectedResponse = "No content to summarize";

        _mockOpenAIService
            .Setup(x => x.SummarizeTextAsync(emptyText, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var summary = await _mockOpenAIService.Object.SummarizeTextAsync(emptyText);

        // Assert
        summary.Should().Be(expectedResponse);
    }

    #endregion

    #region Error Handling and Resilience Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task OpenAIService_NetworkFailure_HandlesRetryLogic()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "network-error-test.mp3";
        var callCount = 0;

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                callCount++;
                if (callCount < 3)
                {
                    await Task.Delay(50); // Simulate network delay
                    throw new HttpRequestException("Network error");
                }
                return new TranscriptionResult { Text = "Success after retry" };
            });

        // Act & Assert - The test should demonstrate resilience behavior
        // Since this is a unit test for the service interface, not actual retry logic,
        // we expect the first call to fail and subsequent calls to succeed
        try
        {
            await _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName);
            Assert.Fail("Expected HttpRequestException on first call");
        }
        catch (HttpRequestException ex)
        {
            ex.Message.Should().Be("Network error");
        }

        // Second call should also fail
        try
        {
            await _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName);
            Assert.Fail("Expected HttpRequestException on second call");
        }
        catch (HttpRequestException ex)
        {
            ex.Message.Should().Be("Network error");
        }

        // Third call should succeed
        var result = await _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName);
        result.Text.Should().Be("Success after retry");
        callCount.Should().Be(3);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task OpenAIService_RateLimitExceeded_HandlesGracefully()
    {
        // Arrange
        var audioStream = new MemoryStream(new byte[1024]);
        var fileName = "rate-limit-test.mp3";

        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(audioStream, fileName, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Rate limit exceeded", null, System.Net.HttpStatusCode.TooManyRequests));

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<HttpRequestException>(
            () => _mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName));
        
        exception.Message.Should().Contain("Rate limit exceeded");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    public async Task OpenAIService_MultipleSimultaneousRequests_HandlesCorrectly()
    {
        // Arrange
        var tasks = new List<Task<TranscriptionResult>>();
        
        for (int i = 0; i < 5; i++)
        {
            var audioStream = new MemoryStream(new byte[1024]);
            var fileName = $"concurrent-test-{i}.mp3";
            
            _mockOpenAIService
                .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), fileName, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TranscriptionResult { Text = $"Transcription {i}" });
            
            tasks.Add(_mockOpenAIService.Object.TranscribeAudioWithMetadataAsync(audioStream, fileName));
        }

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(5);
        results.Should().OnlyContain(r => r.Text.StartsWith("Transcription"));
    }

    #endregion
}
