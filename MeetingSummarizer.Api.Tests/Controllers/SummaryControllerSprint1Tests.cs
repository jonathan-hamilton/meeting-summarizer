using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using Moq;
using MeetingSummarizer.Api.Tests.Infrastructure;
using MeetingSummarizer.Api.Tests.TestData;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Tests.Controllers;

/// <summary>
/// Sprint 1 tests for SummaryController transcription endpoints
/// Tests S1.1: Audio Transcription Backend Service functionality
/// </summary>
[TestClass]
public class SummaryControllerSprint1Tests
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

    #region S1.1 Audio Transcription Backend Service Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_ValidAudioFile_ReturnsSuccessfulTranscription()
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
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile, "en", 0.0, "Meeting transcription");

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var transcriptionResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        transcriptionResponse.Should().NotBeNull();
        transcriptionResponse!.Status.Should().Be("Completed");
        transcriptionResponse.TranscribedText.Should().NotBeNullOrEmpty();
        transcriptionResponse.FileName.Should().Be(audioFile.FileName);
        transcriptionResponse.FileSize.Should().Be(audioFile.Length);
        transcriptionResponse.SpeakerCount.Should().Be(2);
        transcriptionResponse.HasSpeakerDiarization.Should().BeTrue();
        transcriptionResponse.ProcessingTimeMs.Should().BeGreaterThan(0);
        transcriptionResponse.TranscriptionId.Should().NotBeNullOrEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_WithSpeakerDiarization_ReturnsProperSpeakerSegments()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var transcriptionResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        transcriptionResponse.Should().NotBeNull();
        transcriptionResponse!.SpeakerSegments.Should().NotBeNull().And.HaveCount(3);
        
        var segments = transcriptionResponse.SpeakerSegments!;
        segments[0].Speaker.Should().Be("Speaker 1");
        segments[1].Speaker.Should().Be("Speaker 2");
        segments[2].Speaker.Should().Be("Speaker 1");
        
        segments.All(s => s.Confidence.HasValue && s.Confidence > 0.8).Should().BeTrue();
        segments.All(s => s.End > s.Start).Should().BeTrue();
        segments.All(s => !string.IsNullOrEmpty(s.Text)).Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow("test.mp3", "audio/mpeg")]
    [DataRow("test.wav", "audio/wav")]
    [DataRow("test.m4a", "audio/mp4")]
    [DataRow("test.flac", "audio/flac")]
    [DataRow("test.ogg", "audio/ogg")]
    [DataRow("test.webm", "audio/webm")]
    public async Task TranscribeAudio_SupportedAudioFormats_AcceptsAllValidFormats(string fileName, string contentType)
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateSingleSpeakerTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile(fileName, 1024 * 1024, contentType);
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var transcriptionResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        transcriptionResponse.Should().NotBeNull();
        transcriptionResponse!.Status.Should().Be("Completed");
        transcriptionResponse.FileName.Should().Be(fileName);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_OpenAIServiceFailure_ReturnsServiceUnavailable()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (Stream stream, string fileName, CancellationToken token) =>
            {
                await Task.Delay(5, token); // Simulate some processing time before failure
                throw new InvalidOperationException("OpenAI service temporarily unavailable");
            });

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        errorResponse.Should().NotBeNull();
        errorResponse!.Status.Should().Be("Failed");
        errorResponse.ErrorMessage.Should().Contain("OpenAI service temporarily unavailable");
        errorResponse.ProcessingTimeMs.Should().BeGreaterThan(0);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_AuthenticationFailure_ReturnsUnauthorized()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("Invalid OpenAI API key"));

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        errorResponse.Should().NotBeNull();
        errorResponse!.Status.Should().Be("Failed");
        errorResponse.ErrorMessage.Should().Be("Authentication failed with OpenAI service");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_TimeoutFailure_ReturnsRequestTimeout()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TaskCanceledException("Request timed out"));

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.RequestTimeout);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        errorResponse.Should().NotBeNull();
        errorResponse!.Status.Should().Be("Failed");
        errorResponse.ErrorMessage.Should().Be("Transcription request timed out");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_FileIOError_ReturnsBadRequest()
    {
        // Arrange
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("Cannot read file stream"));

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        errorData.GetProperty("error").GetString().Should().Contain("Unable to read the uploaded file");
    }

    #endregion

    #region Enhanced Transcription Endpoint Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudioEnhanced_ValidAudioFile_ReturnsEnhancedTranscription()
    {
        // Arrange
        var mockResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        _mockOpenAIService
            .Setup(x => x.TranscribeAudioWithMetadataAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(audioFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe-enhanced", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var transcriptionResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        transcriptionResponse.Should().NotBeNull();
        transcriptionResponse!.Status.Should().Be("Completed");
        transcriptionResponse.HasSpeakerDiarization.Should().BeTrue();
        transcriptionResponse.SpeakerSegments.Should().NotBeNull().And.NotBeEmpty();
        transcriptionResponse.DetectedLanguage.Should().NotBeNullOrEmpty();
        transcriptionResponse.Duration.Should().BeGreaterThan(0);
        transcriptionResponse.ConfidenceScore.Should().BeGreaterThan(0.8);
    }

    #endregion

    #region File Validation Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_OversizedFile_ReturnsBadRequest()
    {
        // Arrange
        var oversizedFile = Sprint1TestDataFactory.CreateOversizedAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(oversizedFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        // Check if the response has an "error" property, if not check the message directly
        if (errorData.TryGetProperty("error", out var errorProperty))
        {
            errorProperty.GetString().Should().Contain("500MB limit");
        }
        else
        {
            // ASP.NET Core built-in validation may trigger before our custom validation
            responseContent.Should().Contain("exceeded", "The oversized file should be rejected by framework or custom validation");
        }
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_UndersizedFile_ReturnsBadRequest()
    {
        // Arrange
        var undersizedFile = Sprint1TestDataFactory.CreateUndersizedAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(undersizedFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        errorData.GetProperty("error").GetString().Should().Contain("too small");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_UnsupportedFileFormat_ReturnsBadRequest()
    {
        // Arrange
        var unsupportedFile = Sprint1TestDataFactory.CreateUnsupportedFileType();
        var content = Sprint1TestDataFactory.CreateMultipartContent(unsupportedFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        errorData.GetProperty("error").GetString().Should().Contain("supported");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_EmptyFile_ReturnsBadRequest()
    {
        // Arrange
        var emptyFile = Sprint1TestDataFactory.CreateEmptyFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(emptyFile);

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var errorData = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        errorData.GetProperty("error").GetString().Should().Contain("empty");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task TranscribeAudio_NoFile_ReturnsBadRequest()
    {
        // Arrange
        var content = new MultipartFormDataContent();
        content.Add(new StringContent("en"), "Language");

        // Act
        var response = await _client.PostAsync("/api/summary/transcribe", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Validation Endpoint Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task ValidateAudioFile_ValidFile_ReturnsSuccessfulValidation()
    {
        // Arrange
        var validFile = Sprint1TestDataFactory.CreateMockAudioFile();
        var content = Sprint1TestDataFactory.CreateMultipartContent(validFile);

        // Act
        var response = await _client.PostAsync("/api/summary/validate", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var validationResult = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        validationResult.GetProperty("isValid").GetBoolean().Should().BeTrue();
        validationResult.GetProperty("fileName").GetString().Should().Be(validFile.FileName);
        validationResult.GetProperty("fileSize").GetInt64().Should().Be(validFile.Length);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task ValidateAudioFile_InvalidFile_ReturnsValidationErrors()
    {
        // Arrange
        var invalidFile = Sprint1TestDataFactory.CreateUnsupportedFileType();
        var content = Sprint1TestDataFactory.CreateMultipartContent(invalidFile);

        // Act
        var response = await _client.PostAsync("/api/summary/validate", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var validationResult = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        validationResult.GetProperty("isValid").GetBoolean().Should().BeFalse();
        validationResult.GetProperty("message").GetString().Should().NotBeNullOrEmpty();
    }

    #endregion

    #region Transcription Status Endpoint Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public async Task GetTranscription_ValidId_ReturnsTranscriptionStatus()
    {
        // Arrange
        var transcriptionId = Guid.NewGuid().ToString();

        // Act
        var response = await _client.GetAsync($"/api/summary/transcribe/{transcriptionId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var transcriptionResponse = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        transcriptionResponse.Should().NotBeNull();
        transcriptionResponse!.TranscriptionId.Should().Be(transcriptionId);
        transcriptionResponse.Status.Should().Be("Completed");
    }

    #endregion
}
