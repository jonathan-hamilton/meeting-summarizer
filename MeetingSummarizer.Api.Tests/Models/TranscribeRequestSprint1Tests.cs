using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Tests.TestData;
using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Tests.Models;

/// <summary>
/// Sprint 1 tests for TranscribeRequest and related models
/// Tests request/response models supporting S1.1: Audio Transcription Backend Service
/// </summary>
[TestClass]
public class TranscribeRequestSprint1Tests
{
    #region S1.1 TranscribeRequest Model Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscribeRequest_ValidRequest_PassesValidation()
    {
        // Arrange
        var request = Sprint1TestDataFactory.CreateValidTranscribeRequest();
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

        // Assert
        isValid.Should().BeTrue();
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscribeRequest_NullAudioFile_FailsValidation()
    {
        // Arrange
        var request = new TranscribeRequest
        {
            AudioFile = null!,
            Language = "en",
            Temperature = 0.0
        };
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

        // Assert
        isValid.Should().BeFalse();
        validationResults.Should().HaveCount(1);
        validationResults[0].ErrorMessage.Should().Be("Audio file is required");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow(-0.1)]
    [DataRow(1.1)]
    [DataRow(2.0)]
    public void TranscribeRequest_InvalidTemperature_FailsValidation(double invalidTemperature)
    {
        // Arrange
        var request = new TranscribeRequest
        {
            AudioFile = Sprint1TestDataFactory.CreateMockAudioFile(),
            Temperature = invalidTemperature
        };
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

        // Assert
        isValid.Should().BeFalse();
        validationResults.Should().Contain(r => r.ErrorMessage!.Contains("Temperature must be between 0.0 and 1.0"));
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow(0.0)]
    [DataRow(0.5)]
    [DataRow(1.0)]
    public void TranscribeRequest_ValidTemperature_PassesValidation(double validTemperature)
    {
        // Arrange
        var request = new TranscribeRequest
        {
            AudioFile = Sprint1TestDataFactory.CreateMockAudioFile(),
            Temperature = validTemperature
        };
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

        // Assert
        isValid.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscribeRequest_OptionalFields_AllowNullValues()
    {
        // Arrange
        var request = new TranscribeRequest
        {
            AudioFile = Sprint1TestDataFactory.CreateMockAudioFile(),
            Language = null,
            Prompt = null,
            Temperature = 0.0
        };
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

        // Assert
        isValid.Should().BeTrue();
        validationResults.Should().BeEmpty();
    }

    #endregion

    #region S1.1 TranscriptionResult Model Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResult_NewInstance_HasEmptyDefaults()
    {
        // Act
        var result = new TranscriptionResult();

        // Assert
        result.Text.Should().BeEmpty();
        result.Segments.Should().NotBeNull().And.BeEmpty();
        result.DetectedLanguage.Should().BeNull();
        result.Duration.Should().BeNull();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResult_WithSegments_HandlesMultipleSpeakers()
    {
        // Arrange
        var result = Sprint1TestDataFactory.CreateMockTranscriptionResult();

        // Assert
        result.Segments.Should().HaveCount(3);
        result.Segments.Select(s => s.Speaker).Distinct().Should().HaveCount(2);
        result.Segments.Should().OnlyContain(s => s.Confidence > 0.8);
        result.Text.Should().NotBeNullOrEmpty();
        result.DetectedLanguage.Should().Be("en");
        result.Duration.Should().BeGreaterThan(40);
    }

    #endregion

    #region S1.1 SpeakerSegment Model Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void SpeakerSegment_NewInstance_HasDefaults()
    {
        // Act
        var segment = new SpeakerSegment();

        // Assert
        segment.Start.Should().Be(0.0);
        segment.End.Should().Be(0.0);
        segment.Text.Should().BeEmpty();
        segment.Speaker.Should().Be("Speaker 1");
        segment.Confidence.Should().BeNull();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void SpeakerSegment_WithValues_StoresDataCorrectly()
    {
        // Arrange & Act
        var segment = new SpeakerSegment
        {
            Start = 10.5,
            End = 25.8,
            Text = "Hello, this is a test segment.",
            Speaker = "Speaker 2",
            Confidence = 0.95
        };

        // Assert
        segment.Start.Should().Be(10.5);
        segment.End.Should().Be(25.8);
        segment.Text.Should().Be("Hello, this is a test segment.");
        segment.Speaker.Should().Be("Speaker 2");
        segment.Confidence.Should().Be(0.95);
    }

    #endregion

    #region S1.1 TranscriptionResponse Model Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_FromResult_CreatesCorrectResponse()
    {
        // Arrange
        var transcriptionResult = Sprint1TestDataFactory.CreateMockTranscriptionResult();
        var fileName = "test-audio.mp3";
        var fileSize = 1024 * 1024;
        var processingTime = 2500L;

        // Act
        var response = TranscriptionResponse.FromResult(transcriptionResult, fileName, fileSize, processingTime);

        // Assert
        response.Should().NotBeNull();
        response.TranscriptionId.Should().NotBeNullOrEmpty();
        response.FileName.Should().Be(fileName);
        response.FileSize.Should().Be(fileSize);
        response.Status.Should().Be("Completed");
        response.TranscribedText.Should().Be(transcriptionResult.Text);
        response.SpeakerSegments.Should().BeEquivalentTo(transcriptionResult.Segments);
        response.ProcessingTimeMs.Should().Be(processingTime);
        response.DetectedLanguage.Should().Be(transcriptionResult.DetectedLanguage);
        response.Duration.Should().Be(transcriptionResult.Duration);
        response.SpeakerCount.Should().Be(2);
        response.HasSpeakerDiarization.Should().BeTrue();
        response.ConfidenceScore.Should().BeGreaterThan(0.8);
        response.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        response.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_FromError_CreatesFailedResponse()
    {
        // Arrange
        var fileName = "failed-audio.mp3";
        var fileSize = 2048 * 1024;
        var errorMessage = "OpenAI service unavailable";
        var processingTime = 1200L;

        // Act
        var response = TranscriptionResponse.FromError(fileName, fileSize, errorMessage, processingTime);

        // Assert
        response.Should().NotBeNull();
        response.TranscriptionId.Should().NotBeNullOrEmpty();
        response.FileName.Should().Be(fileName);
        response.FileSize.Should().Be(fileSize);
        response.Status.Should().Be("Failed");
        response.ErrorMessage.Should().Be(errorMessage);
        response.ProcessingTimeMs.Should().Be(processingTime);
        response.TranscribedText.Should().BeNull();
        response.SpeakerSegments.Should().BeNull();
        response.SpeakerCount.Should().BeNull();
        response.HasSpeakerDiarization.Should().BeFalse();
        response.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        response.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_HasSpeakerDiarization_WithSegments_ReturnsTrue()
    {
        // Arrange
        var response = new TranscriptionResponse
        {
            SpeakerSegments = new List<SpeakerSegment>
            {
                new() { Speaker = "Speaker 1", Text = "Hello" }
            }
        };

        // Act & Assert
        response.HasSpeakerDiarization.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_HasSpeakerDiarization_WithoutSegments_ReturnsFalse()
    {
        // Arrange
        var response = new TranscriptionResponse
        {
            SpeakerSegments = null
        };

        // Act & Assert
        response.HasSpeakerDiarization.Should().BeFalse();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_HasSpeakerDiarization_WithEmptySegments_ReturnsFalse()
    {
        // Arrange
        var response = new TranscriptionResponse
        {
            SpeakerSegments = new List<SpeakerSegment>()
        };

        // Act & Assert
        response.HasSpeakerDiarization.Should().BeFalse();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_SingleSpeaker_CalculatesCorrectSpeakerCount()
    {
        // Arrange
        var singleSpeakerResult = Sprint1TestDataFactory.CreateSingleSpeakerTranscriptionResult();

        // Act
        var response = TranscriptionResponse.FromResult(singleSpeakerResult, "mono.mp3", 1024, 1500);

        // Assert
        response.SpeakerCount.Should().Be(1);
        response.HasSpeakerDiarization.Should().BeTrue();
        response.SpeakerSegments.Should().HaveCount(1);
        response.SpeakerSegments![0].Speaker.Should().Be("Speaker 1");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void TranscriptionResponse_NoConfidenceScores_HandlesGracefully()
    {
        // Arrange
        var resultWithoutConfidence = new TranscriptionResult
        {
            Text = "Test text",
            Segments = new List<SpeakerSegment>
            {
                new() { Speaker = "Speaker 1", Text = "Test", Confidence = null }
            }
        };

        // Act
        var response = TranscriptionResponse.FromResult(resultWithoutConfidence, "test.mp3", 1024, 1000);

        // Assert
        response.ConfidenceScore.Should().BeNull();
        response.SpeakerCount.Should().Be(1);
    }

    #endregion
}
