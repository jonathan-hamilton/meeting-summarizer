using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Models;

/// <summary>
/// Sprint 2 tests for Summary models and validation
/// Tests S2.3: AI-Powered Meeting Summarization Backend models
/// </summary>
[TestClass]
public class SummaryModelsSprint2Tests
{
    #region S2.3 SummaryRequest Model Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_ValidModel_PassesValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid meeting transcript content",
            Style = SummaryStyle.Brief,
            MaxTokens = 200
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_MissingTranscript_FailsValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "", // Required field
            Style = SummaryStyle.Brief
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(SummaryRequest.Transcript)));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_TranscriptTooLong_FailsValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = new string('A', 500001), // Exceeds 500KB limit
            Style = SummaryStyle.Brief
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(SummaryRequest.Transcript)));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_MaxTokensTooHigh_FailsValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript",
            MaxTokens = 3000 // Exceeds limit
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(SummaryRequest.MaxTokens)));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_MaxTokensTooLow_FailsValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript",
            MaxTokens = 50 // Below minimum
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(SummaryRequest.MaxTokens)));
    }

    #endregion

    #region S2.3 TranscriptionSummaryRequest Model Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void TranscriptionSummaryRequest_ValidModel_PassesValidation()
    {
        // Arrange
        var request = new TranscriptionSummaryRequest
        {
            TranscriptionId = "test-123",
            Style = SummaryStyle.Brief,
            MaxTokens = 200
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void TranscriptionSummaryRequest_MissingTranscriptionId_FailsValidation()
    {
        // Arrange
        var request = new TranscriptionSummaryRequest
        {
            TranscriptionId = "", // Required field
            Style = SummaryStyle.Brief
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(TranscriptionSummaryRequest.TranscriptionId)));
    }

    #endregion

    #region S2.3 SummaryOptions Model Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryOptions_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var options = new SummaryOptions();

        // Assert
        options.Style.Should().Be(SummaryStyle.Brief);
        options.MaxTokens.Should().Be(500);
        options.Temperature.Should().Be(0.3f);
        options.TargetRole.Should().BeNull();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryOptions_ValidConfiguration_PassesValidation()
    {
        // Arrange
        var options = new SummaryOptions
        {
            Style = SummaryStyle.Detailed,
            MaxTokens = 1000,
            Temperature = 0.7f,
            TargetRole = "Engineering Manager"
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryOptions_IncludeActionItems_ReturnsCorrectValue()
    {
        // Arrange & Act
        var briefOptions = new SummaryOptions { Style = SummaryStyle.Brief };
        var detailedOptions = new SummaryOptions { Style = SummaryStyle.Detailed };
        var actionItemsOptions = new SummaryOptions { Style = SummaryStyle.ActionItems };

        // Assert
        briefOptions.IncludeActionItems.Should().BeFalse();
        detailedOptions.IncludeActionItems.Should().BeTrue();
        actionItemsOptions.IncludeActionItems.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryOptions_IncludeKeyDecisions_ReturnsCorrectValue()
    {
        // Arrange & Act
        var briefOptions = new SummaryOptions { Style = SummaryStyle.Brief };
        var detailedOptions = new SummaryOptions { Style = SummaryStyle.Detailed };
        var keyDecisionsOptions = new SummaryOptions { Style = SummaryStyle.KeyDecisions };

        // Assert
        briefOptions.IncludeKeyDecisions.Should().BeFalse();
        detailedOptions.IncludeKeyDecisions.Should().BeTrue();
        keyDecisionsOptions.IncludeKeyDecisions.Should().BeTrue();
    }

    #endregion

    #region S2.3 SummaryResult Model Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_ValidResult_HasCorrectProperties()
    {
        // Arrange & Act
        var result = new SummaryResult
        {
            SummaryId = "summary-123",
            TranscriptionId = "transcript-456",
            Content = "This is a test summary",
            SummaryType = SummaryStyle.Brief,
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 1500,
            TokenCount = 150,
            UsedSpeakerMappings = true,
            GeneratedFor = "Project Manager",
            ActionItems = new List<string> { "Complete testing", "Deploy to staging" },
            KeyDecisions = new List<string> { "Use microservices", "Implement CI/CD" }
        };

        // Assert
        result.SummaryId.Should().Be("summary-123");
        result.TranscriptionId.Should().Be("transcript-456");
        result.Content.Should().Be("This is a test summary");
        result.SummaryType.Should().Be(SummaryStyle.Brief);
        result.ProcessingTimeMs.Should().Be(1500);
        result.TokenCount.Should().Be(150);
        result.UsedSpeakerMappings.Should().BeTrue();
        result.GeneratedFor.Should().Be("Project Manager");
        result.ActionItems.Should().HaveCount(2);
        result.KeyDecisions.Should().HaveCount(2);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_FromSuccess_CreatesValidResult()
    {
        // Arrange
        var content = "Test summary content";
        var transcriptionId = "test-123";
        var summaryType = SummaryStyle.Brief;
        var processingTime = 1000L;
        var targetRole = "Manager";

        // Act
        var result = SummaryResult.FromSuccess(content, transcriptionId, summaryType, processingTime, targetRole);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(content);
        result.TranscriptionId.Should().Be(transcriptionId);
        result.SummaryType.Should().Be(summaryType);
        result.ProcessingTimeMs.Should().Be(processingTime);
        result.GeneratedFor.Should().Be(targetRole);
        result.TokenCount.Should().BeGreaterThan(0);
        result.GeneratedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_FromError_CreatesErrorResult()
    {
        // Arrange
        var transcriptionId = "test-123";
        var summaryType = SummaryStyle.Brief;
        var errorMessage = "Service unavailable";
        var processingTime = 500L;

        // Act
        var result = SummaryResult.FromError(transcriptionId, summaryType, errorMessage, processingTime);

        // Assert
        result.Should().NotBeNull();
        result.TranscriptionId.Should().Be(transcriptionId);
        result.SummaryType.Should().Be(summaryType);
        result.ProcessingTimeMs.Should().Be(processingTime);
        result.Content.Should().Contain("Summary generation failed");
        result.Content.Should().Contain(errorMessage);
        result.TokenCount.Should().Be(0);
    }

    #endregion

    #region S2.3 SummaryStyle Enum Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryStyle_HasAllExpectedValues()
    {
        // Act & Assert
        var values = Enum.GetValues<SummaryStyle>();

        values.Should().Contain(SummaryStyle.Brief);
        values.Should().Contain(SummaryStyle.Detailed);
        values.Should().Contain(SummaryStyle.ActionItems);
        values.Should().Contain(SummaryStyle.KeyDecisions);
        values.Should().Contain(SummaryStyle.ExecutiveSummary);
        values.Should().HaveCount(5);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryStyle_EnumValues_HaveCorrectIntegerValues()
    {
        // Assert
        ((int)SummaryStyle.Brief).Should().Be(0);
        ((int)SummaryStyle.Detailed).Should().Be(1);
        ((int)SummaryStyle.ActionItems).Should().Be(2);
        ((int)SummaryStyle.KeyDecisions).Should().Be(3);
        ((int)SummaryStyle.ExecutiveSummary).Should().Be(4);
    }

    #endregion

    #region S2.3 JSON Serialization Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_JsonSerialization_RoundTripSuccessful()
    {
        // Arrange
        var original = new SummaryRequest
        {
            Transcript = "Meeting transcript content",
            Style = SummaryStyle.Detailed,
            MaxTokens = 300,
            TargetRole = "Manager"
        };

        // Act
        var json = JsonSerializer.Serialize(original);
        var deserialized = JsonSerializer.Deserialize<SummaryRequest>(json);

        // Assert
        deserialized.Should().NotBeNull();
        deserialized!.Transcript.Should().Be(original.Transcript);
        deserialized.Style.Should().Be(original.Style);
        deserialized.MaxTokens.Should().Be(original.MaxTokens);
        deserialized.TargetRole.Should().Be(original.TargetRole);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void TranscriptionSummaryRequest_JsonSerialization_RoundTripSuccessful()
    {
        // Arrange
        var original = new TranscriptionSummaryRequest
        {
            TranscriptionId = "test-123",
            Style = SummaryStyle.ActionItems,
            MaxTokens = 400,
            TargetRole = "Team Lead"
        };

        // Act
        var json = JsonSerializer.Serialize(original);
        var deserialized = JsonSerializer.Deserialize<TranscriptionSummaryRequest>(json);

        // Assert
        deserialized.Should().NotBeNull();
        deserialized!.TranscriptionId.Should().Be(original.TranscriptionId);
        deserialized.Style.Should().Be(original.Style);
        deserialized.MaxTokens.Should().Be(original.MaxTokens);
        deserialized.TargetRole.Should().Be(original.TargetRole);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_JsonSerialization_RoundTripSuccessful()
    {
        // Arrange
        var original = new SummaryResult
        {
            SummaryId = "summary-123",
            TranscriptionId = "transcript-456",
            Content = "Summary content",
            SummaryType = SummaryStyle.ActionItems,
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 1200,
            TokenCount = 200,
            UsedSpeakerMappings = true,
            GeneratedFor = "Team Lead",
            ActionItems = new List<string> { "Task 1", "Task 2" },
            KeyDecisions = new List<string> { "Decision 1" }
        };

        // Act
        var json = JsonSerializer.Serialize(original);
        var deserialized = JsonSerializer.Deserialize<SummaryResult>(json);

        // Assert
        deserialized.Should().NotBeNull();
        deserialized!.SummaryId.Should().Be(original.SummaryId);
        deserialized.TranscriptionId.Should().Be(original.TranscriptionId);
        deserialized.Content.Should().Be(original.Content);
        deserialized.SummaryType.Should().Be(original.SummaryType);
        deserialized.ProcessingTimeMs.Should().Be(original.ProcessingTimeMs);
        deserialized.TokenCount.Should().Be(original.TokenCount);
        deserialized.UsedSpeakerMappings.Should().Be(original.UsedSpeakerMappings);
        deserialized.GeneratedFor.Should().Be(original.GeneratedFor);
        deserialized.ActionItems.Should().BeEquivalentTo(original.ActionItems);
        deserialized.KeyDecisions.Should().BeEquivalentTo(original.KeyDecisions);
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryStyle_JsonSerialization_SerializesAsString()
    {
        // Arrange
        var style = SummaryStyle.ExecutiveSummary;

        // Act
        var json = JsonSerializer.Serialize(style);
        var deserialized = JsonSerializer.Deserialize<SummaryStyle>(json);

        // Assert
        deserialized.Should().Be(SummaryStyle.ExecutiveSummary);
        json.Should().Contain("ExecutiveSummary");
    }

    #endregion

    #region S2.3 Edge Cases and Integration Tests

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_WithNullOptionalFields_PassesValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript",
            Style = SummaryStyle.Brief,
            MaxTokens = 200
            // TargetRole is null (optional)
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().BeEmpty();
        request.TargetRole.Should().BeNull();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_WithNullOptionalCollections_IsValid()
    {
        // Arrange
        var result = new SummaryResult
        {
            SummaryId = "summary-123",
            TranscriptionId = "transcript-456",
            Content = "Summary content",
            SummaryType = SummaryStyle.Brief,
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 500,
            TokenCount = 100,
            UsedSpeakerMappings = false
            // ActionItems and KeyDecisions are null (optional)
        };

        // Act
        var validationResults = ValidateModel(result);

        // Assert
        validationResults.Should().BeEmpty();
        result.ActionItems.Should().BeNull();
        result.KeyDecisions.Should().BeNull();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_WithEmptyCollections_IsValid()
    {
        // Arrange
        var result = new SummaryResult
        {
            SummaryId = "summary-123",
            TranscriptionId = "transcript-456",
            Content = "Summary content",
            SummaryType = SummaryStyle.ActionItems,
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 500,
            TokenCount = 100,
            UsedSpeakerMappings = false,
            ActionItems = new List<string>(), // Empty but not null
            KeyDecisions = new List<string>()
        };

        // Act
        var validationResults = ValidateModel(result);

        // Assert
        validationResults.Should().BeEmpty();
        result.ActionItems.Should().NotBeNull().And.BeEmpty();
        result.KeyDecisions.Should().NotBeNull().And.BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_BoundaryValues_PassValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript",
            Style = SummaryStyle.Brief,
            MaxTokens = 100 // Minimum allowed
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryRequest_MaximumBoundaryValues_PassValidation()
    {
        // Arrange
        var request = new SummaryRequest
        {
            Transcript = "Valid transcript",
            Style = SummaryStyle.ExecutiveSummary,
            MaxTokens = 2000 // Maximum allowed
        };

        // Act
        var validationResults = ValidateModel(request);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint2")]
    [TestCategory("S2.3")]
    public void SummaryResult_TokenCountEstimation_IsReasonable()
    {
        // Arrange
        var content = "This is a test summary with multiple words for token estimation.";
        var result = SummaryResult.FromSuccess(content, "test-123", SummaryStyle.Brief, 1000);

        // Act & Assert
        result.TokenCount.Should().BeGreaterThan(0);
        result.TokenCount.Should().Be(content.Length / 4); // Basic estimation algorithm
    }

    #endregion

    #region Helper Methods

    private static List<ValidationResult> ValidateModel(object model)
    {
        var context = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, context, results, true);
        return results;
    }

    #endregion
}
