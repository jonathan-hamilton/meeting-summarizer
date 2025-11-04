using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Summarization;

namespace MeetingSummarizer.Api.Tests.Mocks;

/// <summary>
/// Mock implementation of ISummarizationService for testing
/// </summary>
public class MockSummarizationService : ISummarizationService
{
    public Task<SummaryResult> GenerateSummaryAsync(
        string transcript,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        var result = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            TranscriptionId = "test-transcription-id",
            SummaryType = options.Style,
            Content = $"Test summary for transcript: {transcript.Substring(0, Math.Min(50, transcript.Length))}...",
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 100,
            TokenCount = 50,
            UsedSpeakerMappings = false
        };

        return Task.FromResult(result);
    }

    public Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript,
        List<SpeakerMapping> speakerMappings,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        var result = new SummaryResult
        {
            SummaryId = Guid.NewGuid().ToString(),
            TranscriptionId = "test-transcription-id",
            SummaryType = options.Style,
            Content = $"Test role-aware summary for transcript with {speakerMappings.Count} speakers: {transcript.Substring(0, Math.Min(50, transcript.Length))}...",
            GeneratedAt = DateTime.UtcNow,
            ProcessingTimeMs = 150,
            TokenCount = 75,
            UsedSpeakerMappings = true
        };

        return Task.FromResult(result);
    }

    public Task<MeetingSummary> GenerateMeetingSummaryAsync(
        string transcript,
        List<SpeakerMapping> speakerMappings,
        int maxTokens = 800,
        CancellationToken cancellationToken = default)
    {
        var result = new MeetingSummary
        {
            SummaryId = Guid.NewGuid().ToString(),
            TranscriptionId = "test-transcription-id",
            MeetingOverview = "Test meeting overview generated from transcript",
            ActionItemsByRole = new List<ActionItemsByRole>
            {
                new ActionItemsByRole
                {
                    SpeakerName = speakerMappings.FirstOrDefault()?.Name ?? "Test Speaker",
                    SpeakerRole = speakerMappings.FirstOrDefault()?.Role ?? "Participant",
                    ActionItems = new List<ActionItem>
                    {
                        new ActionItem
                        {
                            Description = "Test action item from mock service",
                            IsExplicitAssignment = true,
                            Confidence = 0.95
                        }
                    }
                }
            },
            UnassignedActionItems = new List<UnassignedActionItem>
            {
                new UnassignedActionItem
                {
                    Description = "Test unassigned action item",
                    Confidence = 0.8
                }
            },
            Metadata = new MeetingMetadata
            {
                SpeakerCount = speakerMappings.Count,
                Participants = speakerMappings.Select(sm => sm.Name).ToList()
            }
        };

        return Task.FromResult(result);
    }

    public Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public string GetServiceStatus()
    {
        return "Mock Summarization Service - Available for Testing";
    }
}