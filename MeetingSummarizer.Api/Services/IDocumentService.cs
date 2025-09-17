using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services;

public interface IDocumentService
{
    /// <summary>
    /// Generates a PDF document containing the meeting transcript with speaker mappings
    /// </summary>
    /// <param name="transcriptionId">The transcription identifier</param>
    /// <param name="speakerMappings">List of speaker mappings for enhanced formatting</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GenerateTranscriptPdfAsync(string transcriptionId, List<Models.SpeakerMapping> speakerMappings);
}