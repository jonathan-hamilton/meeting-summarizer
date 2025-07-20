using Microsoft.VisualStudio.TestTools.UnitTesting;
using FluentAssertions;
using MeetingSummarizer.Api.Helpers;
using MeetingSummarizer.Api.Tests.TestData;

namespace MeetingSummarizer.Api.Tests.Helpers;

/// <summary>
/// Sprint 1 tests for AudioFileValidator
/// Tests file validation supporting S1.1: Audio Transcription Backend Service
/// </summary>
[TestClass]
public class AudioFileValidatorSprint1Tests
{
    #region S1.1 File Format Validation Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow("test.mp3", "audio/mpeg")]
    [DataRow("test.wav", "audio/wav")]
    [DataRow("test.m4a", "audio/mp4")]
    [DataRow("test.flac", "audio/flac")]
    [DataRow("test.ogg", "audio/ogg")]
    [DataRow("test.webm", "audio/webm")]
    public void ValidateAudioFile_SupportedFormats_ReturnsValid(string fileName, string contentType)
    {
        // Arrange
        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile(fileName, 1024 * 1024, contentType);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(audioFile);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Message.Should().NotBeNullOrEmpty();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow("document.pdf", "application/pdf")]
    [DataRow("video.mp4", "video/mp4")]
    [DataRow("image.jpg", "image/jpeg")]
    [DataRow("text.txt", "text/plain")]
    [DataRow("archive.zip", "application/zip")]
    public void ValidateAudioFile_UnsupportedFormats_ReturnsInvalid(string fileName, string contentType)
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile(fileName, 1024 * 1024, contentType);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("supported");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_NoFileExtension_ReturnsInvalid()
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile("filewithoutextension", 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("extension");
    }

    #endregion

    #region S1.1 File Size Validation Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_ValidFileSize_ReturnsValid()
    {
        // Arrange - 5MB file (well within 500MB limit)
        var audioFile = Sprint1TestDataFactory.CreateMockAudioFile("test.mp3", 5 * 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(audioFile);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_OversizedFile_ReturnsInvalid()
    {
        // Arrange - 600MB file (exceeds 500MB limit)
        var oversizedFile = Sprint1TestDataFactory.CreateOversizedAudioFile();

        // Act
        var result = AudioFileValidator.ValidateAudioFile(oversizedFile);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("500MB limit");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_UndersizedFile_ReturnsInvalid()
    {
        // Arrange - 512 byte file (below 1KB minimum)
        var undersizedFile = Sprint1TestDataFactory.CreateUndersizedAudioFile();

        // Act
        var result = AudioFileValidator.ValidateAudioFile(undersizedFile);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("too small");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_EmptyFile_ReturnsInvalid()
    {
        // Arrange
        var emptyFile = Sprint1TestDataFactory.CreateEmptyFile();

        // Act
        var result = AudioFileValidator.ValidateAudioFile(emptyFile);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("empty");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_NullFile_ReturnsInvalid()
    {
        // Act
        var result = AudioFileValidator.ValidateAudioFile(null);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("required");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_MaximumValidSize_ReturnsValid()
    {
        // Arrange - File just at the 500MB limit
        var maxSizeFile = Sprint1TestDataFactory.CreateMockAudioFile("max-size.mp3", AudioFileValidator.MaxFileSizeBytes);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(maxSizeFile);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_MinimumValidSize_ReturnsValid()
    {
        // Arrange - File just at the 1KB minimum
        var minSizeFile = Sprint1TestDataFactory.CreateMockAudioFile("min-size.mp3", AudioFileValidator.MinFileSizeBytes);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(minSizeFile);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region S1.1 File Name Validation Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_EmptyFileName_ReturnsInvalid()
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile("", 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("File name is required");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_WhitespaceFileName_ReturnsInvalid()
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile("   ", 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("File name is required");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_TooLongFileName_ReturnsInvalid()
    {
        // Arrange - File name longer than 255 characters
        var longFileName = new string('a', 300) + ".mp3";
        var file = Sprint1TestDataFactory.CreateMockAudioFile(longFileName, 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("too long");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow("file<name>.mp3")]
    [DataRow("file|name.mp3")]
    [DataRow("file\"name.mp3")]
    [DataRow("file:name.mp3")]
    [DataRow("file*name.mp3")]
    [DataRow("file?name.mp3")]
    public void ValidateAudioFile_DangerousFileNameCharacters_ReturnsInvalid(string fileName)
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile(fileName, 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("invalid characters");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidateAudioFile_ValidFileName_ReturnsValid()
    {
        // Arrange
        var file = Sprint1TestDataFactory.CreateMockAudioFile("valid-audio-file_123.mp3", 1024 * 1024);

        // Act
        var result = AudioFileValidator.ValidateAudioFile(file);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Utility Method Tests

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    [DataRow(1024L, "1 KB")]
    [DataRow(1048576L, "1 MB")]
    [DataRow(1073741824L, "1 GB")]
    [DataRow(2560L, "2.5 KB")]
    [DataRow(5242880L, "5 MB")]
    public void FormatFileSize_VariousSizes_FormatsCorrectly(long bytes, string expected)
    {
        // Act
        var result = AudioFileValidator.FormatFileSize(bytes);

        // Assert
        result.Should().Be(expected);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void SupportedExtensions_Contains_RequiredAudioFormats()
    {
        // Assert
        AudioFileValidator.SupportedExtensions.Should().Contain(".mp3");
        AudioFileValidator.SupportedExtensions.Should().Contain(".wav");
        AudioFileValidator.SupportedExtensions.Should().Contain(".m4a");
        AudioFileValidator.SupportedExtensions.Should().Contain(".flac");
        AudioFileValidator.SupportedExtensions.Should().Contain(".ogg");
        AudioFileValidator.SupportedExtensions.Should().Contain(".webm");
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void FileSizeConstants_HaveCorrectValues()
    {
        // Assert
        AudioFileValidator.MaxFileSizeBytes.Should().Be(500L * 1024 * 1024); // 500MB
        AudioFileValidator.MinFileSizeBytes.Should().Be(1024); // 1KB
        AudioFileValidator.MaxFileNameLength.Should().Be(255);
    }

    [TestMethod]
    [TestCategory("Sprint1")]
    [TestCategory("S1.1")]
    public void ValidMimeTypes_Contains_RequiredMimeTypes()
    {
        // Assert
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/mpeg");
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/wav");
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/mp4");
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/flac");
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/ogg");
        AudioFileValidator.ValidMimeTypes.Should().Contain("audio/webm");
    }

    #endregion
}
