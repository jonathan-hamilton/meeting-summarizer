using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.Services;

/// <summary>
/// Sprint 4.2 tests for Azure Speech Service with Batch Transcription routing
/// Tests S4.2: Azure Batch Transcription API integration
/// </summary>
[TestClass]
public class AzureSpeechServiceSprint4Tests
{
    private Mock<ILogger<AzureSpeechService>> _mockLogger = null!;
    private AzureSpeechOptions _options = null!;

    [TestInitialize]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<AzureSpeechService>>();
        
        _options = new AzureSpeechOptions
        {
            Key = "test-key",
            Region = "westus", 
            Language = "en-US",
            EnableSpeakerDiarization = true,
            RequestTimeoutSeconds = 120,
            BatchTranscription = new BatchTranscriptionOptions
            {
                MinimumDurationForBatch = 90, // 90 seconds threshold
                PollingIntervalSeconds = 2,
                MaxPollingTimeoutSeconds = 1800,
                EnableJobCleanup = true
            }
        };
    }

    #region S4.2 Duration-Based Routing Tests

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Unit")]
    public void EstimateAudioDuration_ShortMp3File_ReturnsExpectedDuration()
    {
        // Arrange - Simulate a 1MB MP3 file (should be ~64 seconds)
        var audioData = new byte[1_000_000]; // 1MB
        var audioStream = new MemoryStream(audioData);
        var fileName = "short-audio.mp3";

        // Act - Use reflection to test the private static method
        var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = (TimeSpan)method!.Invoke(null, new object[] { audioStream, fileName })!;

        // Assert - Should be approximately 64 seconds (with 10% buffer = ~70 seconds)
        result.TotalSeconds.Should().BeGreaterThan(60);
        result.TotalSeconds.Should().BeLessThan(80);
    }

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Unit")]
    public void EstimateAudioDuration_LargeMp3File_ReturnsExpectedDuration()
    {
        // Arrange - Simulate a 2MB MP3 file (should be ~128 seconds, over 90s threshold)
        var audioData = new byte[2_000_000]; // 2MB
        var audioStream = new MemoryStream(audioData);
        var fileName = "long-audio.mp3";

        // Act
        var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = (TimeSpan)method!.Invoke(null, new object[] { audioStream, fileName })!;

        // Assert - Should be approximately 128 seconds (with 10% buffer = ~140 seconds)
        result.TotalSeconds.Should().BeGreaterThan(120);
        result.TotalSeconds.Should().BeLessThan(160);
        
        // Should exceed the 90-second threshold for batch processing
        result.TotalSeconds.Should().BeGreaterThan(_options.BatchTranscription.MinimumDurationForBatch);
    }

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Unit")]
    public void EstimateAudioDuration_WavFile_UsesCorrectBitrate()
    {
        // Arrange - WAV files have much higher bitrate (1411 kbps vs 128 kbps for MP3)
        var audioData = new byte[1_000_000]; // 1MB
        var audioStream = new MemoryStream(audioData);
        var fileName = "audio.wav";

        // Act
        var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = (TimeSpan)method!.Invoke(null, new object[] { audioStream, fileName })!;

        // Assert - WAV should have much shorter duration for same file size
        result.TotalSeconds.Should().BeLessThan(10); // WAV is uncompressed, so 1MB = ~5-6 seconds
    }

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Unit")]
    public void EstimateAudioDuration_UnknownFormat_UsesDefaultBitrate()
    {
        // Arrange
        var audioData = new byte[1_000_000]; // 1MB
        var audioStream = new MemoryStream(audioData);
        var fileName = "audio.xyz"; // Unknown extension

        // Act
        var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = (TimeSpan)method!.Invoke(null, new object[] { audioStream, fileName })!;

        // Assert - Should default to MP3 bitrate (128 kbps)
        result.TotalSeconds.Should().BeGreaterThan(60);
        result.TotalSeconds.Should().BeLessThan(80);
    }

    #endregion

    #region Configuration Tests

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Configuration")]
    public void BatchTranscriptionOptions_DefaultValues_AreReasonable()
    {
        // Arrange & Act
        var defaultOptions = new BatchTranscriptionOptions();

        // Assert
        defaultOptions.MinimumDurationForBatch.Should().Be(300); // 5 minutes default
        defaultOptions.PollingIntervalSeconds.Should().Be(15);
        defaultOptions.MaxPollingTimeoutSeconds.Should().Be(1800); // 30 minutes
        defaultOptions.EnableJobCleanup.Should().BeTrue();
        defaultOptions.JobRetentionHours.Should().Be(24);
    }

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Configuration")]
    public void BatchTranscriptionOptions_CanBeConfigured()
    {
        // Arrange
        var options = new BatchTranscriptionOptions
        {
            MinimumDurationForBatch = 120, // 2 minutes
            PollingIntervalSeconds = 5,
            MaxPollingTimeoutSeconds = 3600, // 60 minutes
            EnableJobCleanup = false,
            JobRetentionHours = 48
        };

        // Act & Assert
        options.MinimumDurationForBatch.Should().Be(120);
        options.PollingIntervalSeconds.Should().Be(5);
        options.MaxPollingTimeoutSeconds.Should().Be(3600);
        options.EnableJobCleanup.Should().BeFalse();
        options.JobRetentionHours.Should().Be(48);
    }

    #endregion

    #region File Format Tests

    [TestMethod]
    [TestCategory("Sprint4")]
    [TestCategory("S4.2")]
    [TestCategory("Unit")]
    public void EstimateAudioDuration_DifferentFormats_UseCorrectBitrates()
    {
        // Test data: same file size, different formats should give different durations
        var testCases = new[]
        {
            ("audio.mp3", 128_000),   // 128 kbps
            ("audio.wav", 1_411_200), // 1411 kbps (CD quality)
            ("audio.m4a", 256_000),   // 256 kbps
            ("audio.flac", 1_000_000) // ~1000 kbps
        };

        var audioData = new byte[500_000]; // 500KB
        var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

        var results = new List<(string format, double duration)>();

        foreach (var (fileName, expectedBitrate) in testCases)
        {
            var audioStream = new MemoryStream(audioData);
            var result = (TimeSpan)method!.Invoke(null, new object[] { audioStream, fileName })!;
            results.Add((fileName, result.TotalSeconds));
        }

        // Assert - Higher bitrate = shorter duration for same file size
        // WAV should be shortest (highest bitrate)
        // MP3 should be longest (lowest bitrate) 
        var wavDuration = results.First(r => r.format.EndsWith(".wav")).duration;
        var mp3Duration = results.First(r => r.format.EndsWith(".mp3")).duration;

        wavDuration.Should().BeLessThan(mp3Duration, 
            "WAV files have higher bitrate, so same file size = shorter duration");
    }

    #endregion
}
