using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using MeetingSummarizer.Api.Controllers;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Tests.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace MeetingSummarizer.Api.Tests.Controllers
{
    [TestClass]
    [TestCategory("Sprint2")]
    public class SpeakerMappingControllerSprint2Tests
    {
        private Mock<ISpeakerMappingService> _mockSpeakerMappingService = null!;
        private Mock<ISessionSpeakerMappingService> _mockSessionSpeakerMappingService = null!;
        private Mock<ILogger<SpeakerMappingController>> _mockLogger = null!;
        private SpeakerMappingController _controller = null!;

        [TestInitialize]
        public void Setup()
        {
            _mockSpeakerMappingService = new Mock<ISpeakerMappingService>();
            _mockSessionSpeakerMappingService = new Mock<ISessionSpeakerMappingService>();
            _mockLogger = new Mock<ILogger<SpeakerMappingController>>();
            _controller = new SpeakerMappingController(
                _mockSpeakerMappingService.Object,
                _mockSessionSpeakerMappingService.Object,
                _mockLogger.Object);
        }

        #region SaveSpeakerMappings Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappings_WithValidRequest_ShouldReturnOk()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            var expectedResponse = Sprint2TestDataFactory.CreateSpeakerMappingResponse();

            _mockSpeakerMappingService.Setup(s => s.SaveSpeakerMappingsAsync(It.IsAny<SpeakerMappingRequest>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.SaveSpeakerMappings(request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(expectedResponse);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappings_WithNullRequest_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.SaveSpeakerMappings(null!);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappings_WithEmptyMappings_ShouldReturnBadRequest()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateSpeakerMappingRequestWithEmptyMappings();

            // Act
            var result = await _controller.SaveSpeakerMappings(request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappings_ServiceThrowsException_ShouldReturnInternalServerError()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            _mockSpeakerMappingService.Setup(s => s.SaveSpeakerMappingsAsync(It.IsAny<SpeakerMappingRequest>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.SaveSpeakerMappings(request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        #endregion

        #region GetSpeakerMappings Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappings_WithValidTranscriptionId_ShouldReturnOk()
        {
            // Arrange
            var transcriptionId = "test-transcription-123";
            var expectedResponse = Sprint2TestDataFactory.CreateSpeakerMappingResponse();

            _mockSpeakerMappingService.Setup(s => s.GetSpeakerMappingsAsync(transcriptionId))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetSpeakerMappings(transcriptionId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(expectedResponse);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappings_WithNullTranscriptionId_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.GetSpeakerMappings(null!);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappings_WithEmptyTranscriptionId_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.GetSpeakerMappings("");

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappings_TranscriptionNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var transcriptionId = "non-existent-transcription";
            _mockSpeakerMappingService.Setup(s => s.GetSpeakerMappingsAsync(transcriptionId))
                .ReturnsAsync((SpeakerMappingResponse?)null);

            // Act
            var result = await _controller.GetSpeakerMappings(transcriptionId);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappings_ServiceThrowsException_ShouldReturnInternalServerError()
        {
            // Arrange
            var transcriptionId = "test-transcription-123";
            _mockSpeakerMappingService.Setup(s => s.GetSpeakerMappingsAsync(transcriptionId))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetSpeakerMappings(transcriptionId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        #endregion

        #region DeleteSpeakerMappings Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappings_WithValidTranscriptionId_ShouldReturnNoContent()
        {
            // Arrange
            var transcriptionId = "test-transcription-123";
            _mockSpeakerMappingService.Setup(s => s.DeleteSpeakerMappingsAsync(transcriptionId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteSpeakerMappings(transcriptionId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappings_WithNullTranscriptionId_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.DeleteSpeakerMappings(null!);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappings_WithEmptyTranscriptionId_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.DeleteSpeakerMappings("");

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappings_TranscriptionNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var transcriptionId = "non-existent-transcription";
            _mockSpeakerMappingService.Setup(s => s.DeleteSpeakerMappingsAsync(transcriptionId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteSpeakerMappings(transcriptionId);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappings_ServiceThrowsException_ShouldReturnInternalServerError()
        {
            // Arrange
            var transcriptionId = "test-transcription-123";
            _mockSpeakerMappingService.Setup(s => s.DeleteSpeakerMappingsAsync(transcriptionId))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.DeleteSpeakerMappings(transcriptionId);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var objectResult = result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        #endregion
    }
}