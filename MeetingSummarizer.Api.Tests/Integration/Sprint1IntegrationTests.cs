using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using Moq;
using MeetingSummarizer.Api.Tests.Infrastructure;
using MeetingSummarizer.Api.Tests.TestData;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Tests.Integration;

/// <summary>
/// Sprint 1 integration tests covering complete end-to-end workflows
/// Tests S1.3: File Upload to Transcription Integration
/// </summary>
[TestClass]
public class Sprint1IntegrationTests
{
    private Sprint1TestWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;
    private Mock<IOpenAIService> _mockOpenAIService = null!;

    [TestInitialize]
    public void Setup()
    {
        _factory = new Sprint1TestWebApplicationFactory();
        _client = _factory.CreateClient();
        _mockOpenAIService = _factory.MockOpenAIService;
    }

    [TestCleanup]
    public void Cleanup()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    #region S1.3 Complete File Upload to Transcription Workflow Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_FileUploadToTranscriptionDisplay_EndToEndSuccess()
    {
        // Arrange - Setup complete end-to-end test scenario
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string fileName, CancellationToken token) =>
            {
                await Task.Delay(5, token); // Simulate some processing time
                return mockResult;
            });

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile("meeting-recording.mp3", 5 * 1024 * 1024);
        var uploadContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile, "en", 0.0, "Meeting transcription");

        // Act - Execute the complete workflow

        // Step 1: Validate file before upload
        var validationContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile, "en", 0.0, "Meeting transcription");
        var validationResponse = await _client.PostAsync("/api/summary/validate", validationContent);

        // Step 2: Upload and transcribe file (create fresh content)
        var transcriptionFormContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile, "en", 0.0, "Meeting transcription");
        var transcriptionResponse = await _client.PostAsync("/api/summary/transcribe", transcriptionFormContent);

        // Step 3: Get transcription result
        var transcriptionContent = await transcriptionResponse.Content.ReadAsStringAsync();
        var transcription = JsonSerializer.Deserialize<TranscriptionResponse>(transcriptionContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Step 4: Verify transcription status
        var statusResponse = await _client.GetAsync($"/api/summary/transcribe/{transcription!.TranscriptionId}");

        // Assert - Verify complete workflow success

        // Validation step assertions
        validationResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Transcription step assertions
        transcriptionResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        transcription.Should().NotBeNull();
        transcription!.Status.Should().Be("Completed");
        transcription.FileName.Should().Be("meeting-recording.mp3");
        transcription.FileSize.Should().Be(5 * 1024 * 1024);
        transcription.HasSpeakerDiarization.Should().BeTrue();
        transcription.SpeakerCount.Should().Be(2);
        transcription.TranscribedText.Should().NotBeNullOrEmpty();
        transcription.ProcessingTimeMs.Should().BeGreaterThan(0);

        // Status check assertions
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify speaker segments for frontend display
        transcription.SpeakerSegments.Should().NotBeNull().And.HaveCount(3);
        transcription.SpeakerSegments!.Should().OnlyContain(s => !string.IsNullOrEmpty(s.Text));
        transcription.SpeakerSegments.Should().OnlyContain(s => s.End > s.Start);
        transcription.SpeakerSegments.Should().OnlyContain(s => s.Confidence > 0.8);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_MultipleFileFormats_AllSupportedFormatsWork()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateSingleSpeakerTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        var supportedFormats = new[]
        {
            ("test.mp3", "audio/mpeg"),
            ("test.wav", "audio/wav"),
            ("test.m4a", "audio/mp4"),
            ("test.flac", "audio/flac"),
            ("test.ogg", "audio/ogg"),
            ("test.webm", "audio/webm")
        };

        // Act & Assert
        foreach (var (fileName, contentType) in supportedFormats)
        {
            var audioFile = Sprint1TestDataFactory.CreateMockAudioFile(fileName, 2 * 1024 * 1024, contentType);
            var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

            var response = await _client.PostAsync("/api/summary/transcribe", content);

            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Format {fileName} should be supported");

            var responseContent = await response.Content.ReadAsStringAsync();
            var transcription = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            transcription.Should().NotBeNull();
            transcription!.FileName.Should().Be(fileName);
            transcription.Status.Should().Be("Completed");
        }
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_ServiceFailure_FallbackAndErrorHandling()
    {
        // Arrange - Setup service failure scenario
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string fileName, CancellationToken token) =>
            {
                await Task.Delay(5, token); // Simulate some processing time before failure
                throw new InvalidOperationException("OpenAI service temporarily unavailable");
            });

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act - Attempt transcription with service failure
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert - Verify graceful error handling
        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);

        var responseContent = await response.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        errorResponse.Should().NotBeNull();
        errorResponse!.Status.Should().Be("Failed");
        errorResponse.ErrorMessage.Should().Contain("OpenAI service temporarily unavailable");
        errorResponse.FileName.Should().Be(audioFile.FileName);
        errorResponse.FileSize.Should().Be(audioFile.Length);
        errorResponse.ProcessingTimeMs.Should().BeGreaterThan(0);
        errorResponse.TranscriptionId.Should().NotBeNullOrEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_LargeFile_HandlesWithinLimits()
    {
        // Arrange - Test with large but valid file (100MB)
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        var largeFile = Sprint1TestDataFactory.CreateMockAudioFile("large-meeting.mp3", 100 * 1024 * 1024);
        var content = Sprint1TestDataFactory.CreateMultipartContent(largeFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var transcription = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        transcription.Should().NotBeNull();
        transcription!.FileSize.Should().Be(100 * 1024 * 1024);
        transcription.Status.Should().Be("Completed");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_ValidationToTranscription_ConsistentBehavior()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string fileName, CancellationToken token) =>
            {
                await Task.Delay(5, token); // Simulate some processing time
                return mockResult;
            });

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var validationContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Create a new audio file for transcription to avoid stream reuse issues
        var audioFile2 = Sprint1TestDataFactory.CreateMockAudioFile();
        var transcriptionContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile2);

        // Act - Test both validation and transcription with same file
        var validationResponse = await _client.PostAsync("/api/summary/validate", validationContent);
        var transcriptionResponse = await _client.PostAsync("/api/summary/transcribe", transcriptionContent);

        // Assert - Both should succeed for same file
        validationResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        transcriptionResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var validationContent2 = await validationResponse.Content.ReadAsStringAsync();
        var validationResult = JsonSerializer.Deserialize<JsonElement>(validationContent2);

        var transcriptionContentStr = await transcriptionResponse.Content.ReadAsStringAsync();
        var transcriptionResult = JsonSerializer.Deserialize<TranscriptionResponse>(transcriptionContentStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Verification should match transcription file info
        validationResult.GetProperty("isValid").GetBoolean().Should().BeTrue();
        validationResult.GetProperty("fileName").GetString().Should().Be(transcriptionResult!.FileName);
        validationResult.GetProperty("fileSize").GetInt64().Should().Be(transcriptionResult.FileSize);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.3")]
    [TestCategory("Integration")]
    public async Task CompleteWorkflow_ConcurrentTranscriptions_HandlesMultipleRequests()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        // Create multiple concurrent transcription requests
        var tasks = Enumerable.Range(1, 3).Select(async i =>
        {
            var audioFile = Sprint1TestDataFactory.CreateMockAudioFile($"concurrent-test-{i}.mp3", 2 * 1024 * 1024);
            var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);
            return await _client.PostAsync("/api/summary/transcribe", content);
        });

        // Act
        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().HaveCount(3);
        responses.Should().OnlyContain(r => r.StatusCode == HttpStatusCode.OK);

        // Verify each response has unique transcription ID
        var transcriptionIds = new List<string>();
        foreach (var response in responses)
        {
            var content = await response.Content.ReadAsStringAsync();
            var transcription = JsonSerializer.Deserialize<TranscriptionResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            transcription.Should().NotBeNull();
            transcription!.TranscriptionId.Should().NotBeNullOrEmpty();
            transcriptionIds.Should().NotContain(transcription.TranscriptionId, "Each transcription should have unique ID");
            transcriptionIds.Add(transcription.TranscriptionId);
        }
    }

    #endregion

    #region S1.4 Production Configuration Integration Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    [TestCategory("Integration")]
    public async Task ProductionReadiness_HealthChecksAndTranscription_WorkTogether()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        // Act - Test production readiness workflow

        // Step 1: Check API health
        var healthResponse = await _client.GetAsync("/api/health");

        // Step 2: Check detailed health with dependencies
        var detailedHealthResponse = await _client.GetAsync("/api/health/detailed");

        // Step 3: Perform actual transcription
        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var transcriptionContent = Sprint1TestDataFactory.CreateMultipartContent(audioFile);
        var transcriptionResponse = await _client.PostAsync("/api/summary/transcribe", transcriptionContent);

        // Assert
        healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        detailedHealthResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        transcriptionResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify health check indicates system ready for production
        var healthContent = await healthResponse.Content.ReadAsStringAsync();
        var healthData = JsonSerializer.Deserialize<JsonElement>(healthContent);
        healthData.GetProperty("status").GetString().Should().Be("Healthy");

        // Verify transcription works after health confirmation
        var transcriptionContentStr = await transcriptionResponse.Content.ReadAsStringAsync();
        var transcription = JsonSerializer.Deserialize<TranscriptionResponse>(transcriptionContentStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        transcription!.Status.Should().Be("Completed");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.4")]
    [TestCategory("Integration")]
    public async Task ProductionReadiness_ErrorScenarios_LoggingAndMonitoring()
    {
        // Arrange - Test error scenarios for production monitoring
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string fileName, CancellationToken token) =>
            {
                await Task.Delay(5, token); // Simulate some processing time before failure
                throw new UnauthorizedAccessException("API key invalid");
            });

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var transcriptionResponse = await _client.PostAsync("/api/summary/transcribe", content);
        var healthResponse = await _client.GetAsync("/api/health");

        // Assert - System should remain healthy even with transcription failures
        transcriptionResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify error response structure for monitoring
        var errorContent = await transcriptionResponse.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<TranscriptionResponse>(errorContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        errorResponse.Should().NotBeNull();
        errorResponse!.Status.Should().Be("Failed");
        errorResponse.ErrorMessage.Should().Contain("Authentication failed");
        errorResponse.ProcessingTimeMs.Should().BeGreaterThan(0);
        errorResponse.TranscriptionId.Should().NotBeNullOrEmpty();
    }

    #endregion
}
