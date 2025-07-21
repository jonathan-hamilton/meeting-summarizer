using FluentAssertions;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Tests.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace MeetingSummarizer.Api.Tests.Services
{
    [TestClass]
    [TestCategory("Sprint2")]
    public class InMemorySpeakerMappingServiceSprint2Tests
    {
        private InMemorySpeakerMappingService _service = null!;

        [TestInitialize]
        public void Setup()
        {
            _service = new InMemorySpeakerMappingService();
        }

        #region SaveSpeakerMappingsAsync Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappingsAsync_WithValidRequest_ShouldReturnSuccessResponse()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();

            // Act
            var result = await _service.SaveSpeakerMappingsAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.TranscriptionId.Should().Be(request.TranscriptionId);
            result.Mappings.Should().HaveCount(request.Mappings.Count);
            result.Mappings.Should().BeEquivalentTo(request.Mappings);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappingsAsync_WithEmptyMappings_ShouldReturnSuccessWithEmptyMappings()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateSpeakerMappingRequestWithEmptyMappings();

            // Act
            var result = await _service.SaveSpeakerMappingsAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.TranscriptionId.Should().Be(request.TranscriptionId);
            result.Mappings.Should().BeEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task SaveSpeakerMappingsAsync_ShouldOverwriteExistingMappings()
        {
            // Arrange
            var initialRequest = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            var updatedMappings = new List<SpeakerMapping>
            {
                new SpeakerMapping
                {
                    SpeakerId = "speaker_0",
                    Name = "Updated John",
                    Role = "Senior Manager"
                }
            };
            var updateRequest = new SpeakerMappingRequest
            {
                TranscriptionId = initialRequest.TranscriptionId,
                Mappings = updatedMappings
            };

            // Act
            await _service.SaveSpeakerMappingsAsync(initialRequest);
            var result = await _service.SaveSpeakerMappingsAsync(updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Mappings.Should().HaveCount(1);
            result.Mappings.First().Name.Should().Be("Updated John");
            result.Mappings.First().Role.Should().Be("Senior Manager");
        }

        #endregion

        #region GetSpeakerMappingsAsync Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappingsAsync_WithExistingTranscriptionId_ShouldReturnMappings()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            await _service.SaveSpeakerMappingsAsync(request);

            // Act
            var result = await _service.GetSpeakerMappingsAsync(request.TranscriptionId);

            // Assert
            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.TranscriptionId.Should().Be(request.TranscriptionId);
            result.Mappings.Should().HaveCount(request.Mappings.Count);
            result.Mappings.Should().BeEquivalentTo(request.Mappings);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task GetSpeakerMappingsAsync_WithNonExistentTranscriptionId_ShouldReturnNull()
        {
            // Act
            var result = await _service.GetSpeakerMappingsAsync("non-existent-id");

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region DeleteSpeakerMappingsAsync Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappingsAsync_WithExistingTranscriptionId_ShouldReturnTrue()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            await _service.SaveSpeakerMappingsAsync(request);

            // Act
            var result = await _service.DeleteSpeakerMappingsAsync(request.TranscriptionId);

            // Assert
            result.Should().BeTrue();

            // Verify deletion
            var getResult = await _service.GetSpeakerMappingsAsync(request.TranscriptionId);
            getResult.Should().BeNull();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task DeleteSpeakerMappingsAsync_WithNonExistentTranscriptionId_ShouldReturnFalse()
        {
            // Act
            var result = await _service.DeleteSpeakerMappingsAsync("non-existent-id");

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region Integration Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task FullWorkflow_SaveGetDelete_ShouldWorkCorrectly()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();

            // Act - Save
            var saveResult = await _service.SaveSpeakerMappingsAsync(request);

            // Assert - Save
            saveResult.Should().NotBeNull();
            saveResult.Success.Should().BeTrue();

            // Act - Get
            var getResult = await _service.GetSpeakerMappingsAsync(request.TranscriptionId);

            // Assert - Get
            getResult.Should().NotBeNull();
            getResult!.Success.Should().BeTrue();
            getResult.Mappings.Should().BeEquivalentTo(request.Mappings);

            // Act - Delete
            var deleteResult = await _service.DeleteSpeakerMappingsAsync(request.TranscriptionId);

            // Assert - Delete
            deleteResult.Should().BeTrue();

            // Act - Verify deletion
            var getAfterDeleteResult = await _service.GetSpeakerMappingsAsync(request.TranscriptionId);

            // Assert - Verify deletion
            getAfterDeleteResult.Should().BeNull();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public async Task ConcurrentOperations_ShouldHandleMultipleTranscriptions()
        {
            // Arrange
            var request1 = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            var request2 = new SpeakerMappingRequest
            {
                TranscriptionId = "different-transcription-id",
                Mappings = Sprint2TestDataFactory.CreateMultipleSpeakerMappings()
            };

            // Act - Save both
            var saveResult1 = await _service.SaveSpeakerMappingsAsync(request1);
            var saveResult2 = await _service.SaveSpeakerMappingsAsync(request2);

            // Assert - Both saved successfully
            saveResult1.Success.Should().BeTrue();
            saveResult2.Success.Should().BeTrue();

            // Act - Get both
            var getResult1 = await _service.GetSpeakerMappingsAsync(request1.TranscriptionId);
            var getResult2 = await _service.GetSpeakerMappingsAsync(request2.TranscriptionId);

            // Assert - Both retrieved correctly
            getResult1.Should().NotBeNull();
            getResult1!.Mappings.Should().BeEquivalentTo(request1.Mappings);
            getResult2.Should().NotBeNull();
            getResult2!.Mappings.Should().BeEquivalentTo(request2.Mappings);

            // Act - Delete first only
            var deleteResult1 = await _service.DeleteSpeakerMappingsAsync(request1.TranscriptionId);

            // Assert - First deleted, second still exists
            deleteResult1.Should().BeTrue();
            var getAfterDelete1 = await _service.GetSpeakerMappingsAsync(request1.TranscriptionId);
            var getAfterDelete2 = await _service.GetSpeakerMappingsAsync(request2.TranscriptionId);

            getAfterDelete1.Should().BeNull();
            getAfterDelete2.Should().NotBeNull();
            getAfterDelete2!.Mappings.Should().BeEquivalentTo(request2.Mappings);
        }

        #endregion
    }
}