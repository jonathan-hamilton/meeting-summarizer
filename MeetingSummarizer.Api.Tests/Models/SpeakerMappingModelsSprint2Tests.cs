using FluentAssertions;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Tests.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Tests.Models
{
    [TestClass]
    [TestCategory("Sprint2")]
    public class SpeakerMappingModelsSprint2Tests
    {
        #region SpeakerMapping Model Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMapping_WithValidData_ShouldCreateSuccessfully()
        {
            // Arrange & Act
            var speakerMapping = new SpeakerMapping
            {
                SpeakerId = "speaker_1",
                Name = "John Doe",
                Role = "Project Manager"
            };

            // Assert
            speakerMapping.SpeakerId.Should().Be("speaker_1");
            speakerMapping.Name.Should().Be("John Doe");
            speakerMapping.Role.Should().Be("Project Manager");
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMapping_WithEmptyValues_ShouldAllowEmptyStrings()
        {
            // Arrange & Act
            var speakerMapping = new SpeakerMapping
            {
                SpeakerId = "",
                Name = "",
                Role = ""
            };

            // Assert
            speakerMapping.SpeakerId.Should().Be("");
            speakerMapping.Name.Should().Be("");
            speakerMapping.Role.Should().Be("");
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMapping_WithNullValues_ShouldAllowNullStrings()
        {
            // Arrange & Act
            var speakerMapping = new SpeakerMapping
            {
                SpeakerId = null,
                Name = null,
                Role = null
            };

            // Assert
            speakerMapping.SpeakerId.Should().BeNull();
            speakerMapping.Name.Should().BeNull();
            speakerMapping.Role.Should().BeNull();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMapping_Equality_ShouldWorkCorrectly()
        {
            // Arrange
            var mapping1 = new SpeakerMapping
            {
                SpeakerId = "speaker_1",
                Name = "John Doe",
                Role = "Manager"
            };

            var mapping2 = new SpeakerMapping
            {
                SpeakerId = "speaker_1",
                Name = "John Doe",
                Role = "Manager"
            };

            var mapping3 = new SpeakerMapping
            {
                SpeakerId = "speaker_2",
                Name = "Jane Smith",
                Role = "Developer"
            };

            // Assert
            mapping1.Should().BeEquivalentTo(mapping2);
            mapping1.Should().NotBeEquivalentTo(mapping3);
        }

        #endregion

        #region SpeakerMappingRequest Model Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingRequest_WithValidData_ShouldCreateSuccessfully()
        {
            // Arrange
            var mappings = Sprint2TestDataFactory.CreateMultipleSpeakerMappings();

            // Act
            var request = new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-123",
                Mappings = mappings
            };

            // Assert
            request.TranscriptionId.Should().Be("test-transcription-123");
            request.Mappings.Should().HaveCount(4);
            request.Mappings.Should().BeEquivalentTo(mappings);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingRequest_WithEmptyMappings_ShouldCreateSuccessfully()
        {
            // Act
            var request = new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-456",
                Mappings = new List<SpeakerMapping>()
            };

            // Assert
            request.TranscriptionId.Should().Be("test-transcription-456");
            request.Mappings.Should().NotBeNull();
            request.Mappings.Should().BeEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingRequest_WithNullMappings_ShouldAllowNull()
        {
            // Act
            var request = new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-789",
                Mappings = null
            };

            // Assert
            request.TranscriptionId.Should().Be("test-transcription-789");
            request.Mappings.Should().BeNull();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingRequest_Validation_ShouldValidateRequiredFields()
        {
            // Arrange
            var request = new SpeakerMappingRequest
            {
                TranscriptionId = null,
                Mappings = new List<SpeakerMapping>()
            };

            var validationContext = new ValidationContext(request);
            var validationResults = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(request, validationContext, validationResults, true);

            // Assert
            isValid.Should().BeFalse();
            validationResults.Should().NotBeEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingRequest_WithFactoryData_ShouldMatchExpectedStructure()
        {
            // Act
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();

            // Assert
            request.Should().NotBeNull();
            request.TranscriptionId.Should().NotBeNullOrEmpty();
            request.Mappings.Should().NotBeNull();
            request.Mappings.Should().HaveCount(3);
            request.Mappings.Should().OnlyContain(m =>
                !string.IsNullOrEmpty(m.SpeakerId) &&
                !string.IsNullOrEmpty(m.Name) &&
                !string.IsNullOrEmpty(m.Role));
        }

        #endregion

        #region SpeakerMappingResponse Model Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingResponse_WithValidData_ShouldCreateSuccessfully()
        {
            // Arrange
            var mappings = Sprint2TestDataFactory.CreateMultipleSpeakerMappings();

            // Act
            var response = new SpeakerMappingResponse
            {
                TranscriptionId = "test-transcription-123",
                Mappings = mappings,
                Success = true,
                Message = "Operation completed successfully"
            };

            // Assert
            response.TranscriptionId.Should().Be("test-transcription-123");
            response.Mappings.Should().HaveCount(4);
            response.Mappings.Should().BeEquivalentTo(mappings);
            response.Success.Should().BeTrue();
            response.Message.Should().Be("Operation completed successfully");
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingResponse_WithErrorState_ShouldCreateSuccessfully()
        {
            // Act
            var response = new SpeakerMappingResponse
            {
                TranscriptionId = "test-transcription-error",
                Mappings = new List<SpeakerMapping>(),
                Success = false,
                Message = "An error occurred during processing"
            };

            // Assert
            response.TranscriptionId.Should().Be("test-transcription-error");
            response.Mappings.Should().BeEmpty();
            response.Success.Should().BeFalse();
            response.Message.Should().Be("An error occurred during processing");
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingResponse_WithFactoryData_ShouldMatchExpectedStructure()
        {
            // Act
            var response = Sprint2TestDataFactory.CreateSpeakerMappingResponse();

            // Assert
            response.Should().NotBeNull();
            response.TranscriptionId.Should().NotBeNullOrEmpty();
            response.Mappings.Should().NotBeNull();
            response.Mappings.Should().HaveCount(3);
            response.Success.Should().BeTrue();
            response.Message.Should().NotBeNullOrEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingResponse_ErrorFactory_ShouldCreateErrorResponse()
        {
            // Act
            var response = Sprint2TestDataFactory.CreateErrorSpeakerMappingResponse();

            // Assert
            response.Should().NotBeNull();
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("Error");
            response.Mappings.Should().BeEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void SpeakerMappingResponse_EmptyFactory_ShouldCreateEmptyResponse()
        {
            // Act
            var response = Sprint2TestDataFactory.CreateEmptySpeakerMappingResponse();

            // Assert
            response.Should().NotBeNull();
            response.Success.Should().BeTrue();
            response.Mappings.Should().BeEmpty();
            response.Message.Should().Contain("No speaker mappings");
        }

        #endregion

        #region Model Integration Tests - S2.2

        [TestMethod]
        [TestCategory("S2.2")]
        public void ModelWorkflow_RequestToResponse_ShouldMaintainDataIntegrity()
        {
            // Arrange
            var request = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();

            // Act - Simulate service processing
            var response = new SpeakerMappingResponse
            {
                TranscriptionId = request.TranscriptionId,
                Mappings = request.Mappings,
                Success = true,
                Message = "Mappings saved successfully"
            };

            // Assert
            response.TranscriptionId.Should().Be(request.TranscriptionId);
            response.Mappings.Should().BeEquivalentTo(request.Mappings);
            response.Success.Should().BeTrue();
            response.Message.Should().NotBeNullOrEmpty();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void ModelSerialization_ShouldMaintainStructure()
        {
            // Arrange
            var originalRequest = Sprint2TestDataFactory.CreateValidSpeakerMappingRequest();
            var originalResponse = Sprint2TestDataFactory.CreateSpeakerMappingResponse();

            // Act - Simulate JSON serialization/deserialization
            var requestJson = System.Text.Json.JsonSerializer.Serialize(originalRequest);
            var responseJson = System.Text.Json.JsonSerializer.Serialize(originalResponse);

            var deserializedRequest = System.Text.Json.JsonSerializer.Deserialize<SpeakerMappingRequest>(requestJson);
            var deserializedResponse = System.Text.Json.JsonSerializer.Deserialize<SpeakerMappingResponse>(responseJson);

            // Assert
            deserializedRequest.Should().BeEquivalentTo(originalRequest);
            deserializedResponse.Should().BeEquivalentTo(originalResponse);
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void ModelValidation_ComplexScenarios_ShouldHandleEdgeCases()
        {
            // Arrange & Act
            var emptyMappingRequest = Sprint2TestDataFactory.CreateSpeakerMappingRequestWithEmptyMappings();
            var nullMappingRequest = Sprint2TestDataFactory.CreateSpeakerMappingRequestWithNullMappings();
            var errorResponse = Sprint2TestDataFactory.CreateErrorSpeakerMappingResponse();

            // Assert
            emptyMappingRequest.Mappings.Should().BeEmpty();
            nullMappingRequest.Mappings.Should().BeNull();
            errorResponse.Success.Should().BeFalse();

            // All should be valid model instances
            emptyMappingRequest.Should().NotBeNull();
            nullMappingRequest.Should().NotBeNull();
            errorResponse.Should().NotBeNull();
        }

        [TestMethod]
        [TestCategory("S2.2")]
        public void ModelProperties_ShouldSupportAllDataTypes()
        {
            // Arrange & Act
            var mapping = new SpeakerMapping
            {
                SpeakerId = "speaker_special_chars_123!@#",
                Name = "Name with Spaces and Numbers 123",
                Role = "Senior Software Engineer / Team Lead"
            };

            var request = new SpeakerMappingRequest
            {
                TranscriptionId = "transcription-with-dashes-and-numbers-456",
                Mappings = new List<SpeakerMapping> { mapping }
            };

            // Assert
            mapping.SpeakerId.Should().Contain("!");
            mapping.Name.Should().Contain(" ");
            mapping.Role.Should().Contain("/");
            request.TranscriptionId.Should().Contain("-");
            request.Mappings.Should().ContainSingle();
        }

        #endregion
    }
}