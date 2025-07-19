using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Mock transcription service for development and testing when OpenAI is unavailable
/// </summary>
public class MockTranscriptionService : IOpenAIService
{
    private readonly ILogger<MockTranscriptionService> _logger;

    public MockTranscriptionService(ILogger<MockTranscriptionService> logger)
    {
        _logger = logger;
    }

    public async Task<TranscriptionResult> TranscribeAudioWithMetadataAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using mock transcription service - OpenAI API not available");

        // Simulate processing time
        await Task.Delay(2000, cancellationToken);

        var mockText = GenerateMockTranscription(fileName);
        var segments = CreateSpeakerSegments(mockText);

        return new TranscriptionResult
        {
            Text = mockText,
            Segments = segments,
            DetectedLanguage = "en",
            Duration = 120.5 // Mock duration
        };
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string fileName, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using mock transcription service - OpenAI API not available");

        // Simulate processing time
        await Task.Delay(2000, cancellationToken);

        return GenerateMockTranscription(fileName);
    }

    public async Task<string> SummarizeTextAsync(string transcribedText, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using mock summarization service - OpenAI API not available");

        await Task.Delay(1000, cancellationToken);

        return $"[MOCK SUMMARY] This is a simulated summary of the transcribed text ({transcribedText.Length} characters). Key topics discussed include project updates, team coordination, and next steps.";
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Mock transcription service is always available");
        await Task.Delay(100, cancellationToken); // Simulate check
        return true;
    }

    public string GetServiceStatus()
    {
        return "Mock Transcription Service - Active (OpenAI API not configured)";
    }

    private string GenerateMockTranscription(string fileName)
    {
        var mockScenarios = new[]
        {
            "Welcome everyone to today's meeting. Let me start by reviewing our quarterly objectives. We've made significant progress on the project milestones. Sarah, could you share the latest updates on the development timeline?",

            "Good morning team. Today we'll be discussing the upcoming product launch. The marketing campaign is ready to go live next week. We need to ensure all stakeholders are aligned on the messaging.",

            "Thank you all for joining this standup. Let's quickly go through what everyone accomplished yesterday. Starting with the backend team, we've deployed the new API endpoints to staging.",

            "This is our monthly retrospective meeting. I'd like to start by celebrating our recent wins. The user feedback has been overwhelmingly positive since the last release."
        };

        var random = new Random(fileName.GetHashCode()); // Deterministic based on filename
        var scenario = mockScenarios[random.Next(mockScenarios.Length)];

        return scenario;
    }

    private List<SpeakerSegment> CreateSpeakerSegments(string text)
    {
        var segments = new List<SpeakerSegment>();
        var sentences = text.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var currentTime = 0.0;
        var speakerIndex = 1;

        foreach (var sentence in sentences)
        {
            if (string.IsNullOrWhiteSpace(sentence)) continue;

            var trimmedSentence = sentence.Trim() + ".";
            var duration = Math.Max(2.0, trimmedSentence.Length * 0.1); // Estimate speaking time

            segments.Add(new SpeakerSegment
            {
                Speaker = $"Speaker {speakerIndex}",
                Text = trimmedSentence,
                Start = currentTime,
                End = currentTime + duration,
                Confidence = 0.85 + (new Random().NextDouble() * 0.1) // Random confidence 85-95%
            });

            currentTime += duration + 0.5; // Add small pause between speakers
            speakerIndex = speakerIndex % 3 + 1; // Rotate between 3 speakers
        }

        return segments;
    }
}
