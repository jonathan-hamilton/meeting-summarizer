using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// In-memory implementation of speaker mapping service for MVP
/// Note: This will be replaced with database persistence in future iterations
/// </summary>
public class InMemorySpeakerMappingService : ISpeakerMappingService
{
    // Using static dictionary to ensure persistence across requests during testing
    private static readonly Dictionary<string, SpeakerMappingResponse> _speakerMappings = new();

    public async Task<SpeakerMappingResponse> SaveSpeakerMappingsAsync(SpeakerMappingRequest request)
    {
        await Task.CompletedTask; // Async for future database operations

        var response = new SpeakerMappingResponse
        {
            TranscriptionId = request.TranscriptionId,
            Mappings = request.Mappings.ToList(),
            LastUpdated = DateTime.UtcNow
        };

        _speakerMappings[request.TranscriptionId] = response;

        return response;
    }

    public async Task<SpeakerMappingResponse?> GetSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.CompletedTask; // Async for future database operations

        _speakerMappings.TryGetValue(transcriptionId, out var mappings);
        return mappings;
    }

    public async Task<bool> DeleteSpeakerMappingsAsync(string transcriptionId)
    {
        await Task.CompletedTask; // Async for future database operations

        return _speakerMappings.Remove(transcriptionId);
    }
}
