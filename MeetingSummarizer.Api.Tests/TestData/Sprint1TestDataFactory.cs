using Microsoft.AspNetCore.Http;
using System.Text;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.TestData;

/// <summary>
/// Test data factory for Sprint 1 API tests
/// Provides mock audio files, transcription results, and request data
/// </summary>
public static class Sprint1TestDataFactory
{
    /// <summary>
    /// Creates a mock audio file for testing
    /// </summary>
    public static IFormFile CreateMockAudioFile(
        string fileName = "test-audio.mp3",
        long size = 1024 * 1024, // 1MB
        string contentType = "audio/mpeg")
    {
        var content = new byte[size];
        // Fill with mock audio data pattern
        for (int i = 0; i < content.Length; i++)
        {
            content[i] = (byte)(i % 256);
        }

        var stream = new MemoryStream(content);
        var file = new FormFile(stream, 0, content.Length, "AudioFile", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };

        return file;
    }

    /// <summary>
    /// Creates a mock oversized audio file for testing file size validation
    /// </summary>
    public static IFormFile CreateOversizedAudioFile()
    {
        const long oversizeLength = 600L * 1024 * 1024; // 600MB (exceeds 500MB limit)
        return CreateMockAudioFile("large-file.mp3", oversizeLength);
    }

    /// <summary>
    /// Creates a mock undersized audio file for testing minimum size validation
    /// </summary>
    public static IFormFile CreateUndersizedAudioFile()
    {
        return CreateMockAudioFile("tiny-file.mp3", 512); // 512 bytes (below 1KB limit)
    }

    /// <summary>
    /// Creates a mock file with unsupported extension
    /// </summary>
    public static IFormFile CreateUnsupportedFileType()
    {
        return CreateMockAudioFile("document.txt", 2048, "text/plain");
    }

    /// <summary>
    /// Creates a mock empty file
    /// </summary>
    public static IFormFile CreateEmptyFile()
    {
        return CreateMockAudioFile("empty.mp3", 0);
    }

    /// <summary>
    /// Creates a valid transcribe request
    /// </summary>
    public static TranscribeRequest CreateValidTranscribeRequest()
    {
        return new TranscribeRequest
        {
            AudioFile = CreateMockAudioFile(),
            Language = "en",
            Temperature = 0.0,
            Prompt = "This is a meeting transcription"
        };
    }

    /// <summary>
    /// Creates a mock transcription result with speaker diarization
    /// </summary>
    public static TranscriptionResult CreateMockTranscriptionResult()
    {
        return new TranscriptionResult
        {
            Text = "Hello, this is Speaker 1. Nice to meet you, says Speaker 2. Thank you for joining the meeting.",
            DetectedLanguage = "en",
            Duration = 45.5,
            Segments = new List<SpeakerSegment>
            {
                new()
                {
                    Start = 0.0,
                    End = 15.0,
                    Text = "Hello, this is Speaker 1.",
                    Speaker = "Speaker 1",
                    Confidence = 0.95
                },
                new()
                {
                    Start = 15.0,
                    End = 30.0,
                    Text = "Nice to meet you, says Speaker 2.",
                    Speaker = "Speaker 2",
                    Confidence = 0.92
                },
                new()
                {
                    Start = 30.0,
                    End = 45.5,
                    Text = "Thank you for joining the meeting.",
                    Speaker = "Speaker 1",
                    Confidence = 0.88
                }
            }
        };
    }

    /// <summary>
    /// Creates a mock single-speaker transcription result
    /// </summary>
    public static TranscriptionResult CreateSingleSpeakerTranscriptionResult()
    {
        return new TranscriptionResult
        {
            Text = "This is a monologue with only one speaker throughout the entire recording.",
            DetectedLanguage = "en",
            Duration = 30.0,
            Segments = new List<SpeakerSegment>
            {
                new()
                {
                    Start = 0.0,
                    End = 30.0,
                    Text = "This is a monologue with only one speaker throughout the entire recording.",
                    Speaker = "Speaker 1",
                    Confidence = 0.96
                }
            }
        };
    }

    /// <summary>
    /// Creates test data for various supported audio file formats
    /// </summary>
    public static IEnumerable<object[]> SupportedAudioFormats()
    {
        yield return new object[] { "test.mp3", "audio/mpeg" };
        yield return new object[] { "test.wav", "audio/wav" };
        yield return new object[] { "test.m4a", "audio/mp4" };
        yield return new object[] { "test.flac", "audio/flac" };
        yield return new object[] { "test.ogg", "audio/ogg" };
        yield return new object[] { "test.webm", "audio/webm" };
    }

    /// <summary>
    /// Creates test data for unsupported file formats
    /// </summary>
    public static IEnumerable<object[]> UnsupportedFileFormats()
    {
        yield return new object[] { "document.pdf", "application/pdf" };
        yield return new object[] { "video.mp4", "video/mp4" };
        yield return new object[] { "image.jpg", "image/jpeg" };
        yield return new object[] { "text.txt", "text/plain" };
        yield return new object[] { "archive.zip", "application/zip" };
    }

    /// <summary>
    /// Creates test data for invalid file names
    /// </summary>
    public static IEnumerable<object[]> InvalidFileNames()
    {
        yield return new object[] { "" }; // Empty name
        yield return new object[] { "   " }; // Whitespace only
        yield return new object[] { "file<name>.mp3" }; // Invalid characters
        yield return new object[] { "file|name.mp3" }; // Invalid characters
        yield return new object[] { "file\"name.mp3" }; // Invalid characters
        yield return new object[] { new string('a', 300) + ".mp3" }; // Too long
    }

    /// <summary>
    /// Creates a multipart form data content for file upload testing
    /// </summary>
    public static MultipartFormDataContent CreateMultipartContent(IFormFile file, string? language = null, double temperature = 0.0, string? prompt = null)
    {
        var content = new MultipartFormDataContent();

        var fileContent = new StreamContent(file.OpenReadStream());
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
        content.Add(fileContent, "AudioFile", file.FileName);

        if (!string.IsNullOrEmpty(language))
        {
            content.Add(new StringContent(language), "Language");
        }

        content.Add(new StringContent(temperature.ToString()), "Temperature");

        if (!string.IsNullOrEmpty(prompt))
        {
            content.Add(new StringContent(prompt), "Prompt");
        }

        return content;
    }
}
