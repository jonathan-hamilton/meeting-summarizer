using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.SpeakerMapping;

/// <summary>
/// In-memory implementation of speaker mapping service for testing
/// </summary>
public class InMemorySpeakerMappingService : ISpeakerMappingService
{
    // In-memory storage for speaker mappings
    private static readonly Dictionary<string, SpeakerMappingResponse> _speakerMappings = new();

    public async Task<SpeakerMappingResponse> SaveSpeakerMappingsAsync(SpeakerMappingRequest request)
    {
        await Task.Delay(1); // Simulate async operation

        var response = new SpeakerMappingResponse
        {
            TranscriptionId = request.TranscriptionId,
            Mappings = request.Mappings,
            Success = true,
            Message = "Speaker mappings saved successfully",
            LastUpdated = DateTime.UtcNow
        };

        _speakerMappings[request.TranscriptionId] = response;

        return response;
    }

    public async Task<SpeakerMappingResponse?> GetSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.Delay(1); // Simulate async operation

        return _speakerMappings.GetValueOrDefault(transcriptionId);
    }

    public async Task<bool> DeleteSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.Delay(1); // Simulate async operation

        return _speakerMappings.Remove(transcriptionId);
    }
}