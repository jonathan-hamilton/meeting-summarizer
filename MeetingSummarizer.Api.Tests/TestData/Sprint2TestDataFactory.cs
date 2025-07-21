using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Tests.TestData
{
    public static class Sprint2TestDataFactory
    {
        public static SpeakerMappingRequest CreateValidSpeakerMappingRequest()
        {
            return new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-123",
                Mappings = new List<SpeakerMapping>
                {
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_0",
                        Name = "John Doe",
                        Role = "Project Manager"
                    },
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_1",
                        Name = "Jane Smith",
                        Role = "Developer"
                    },
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_2",
                        Name = "Bob Johnson",
                        Role = "QA Engineer"
                    }
                }
            };
        }

        public static SpeakerMappingRequest CreateSpeakerMappingRequestWithEmptyMappings()
        {
            return new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-456",
                Mappings = new List<SpeakerMapping>()
            };
        }

        public static SpeakerMappingRequest CreateSpeakerMappingRequestWithNullMappings()
        {
            return new SpeakerMappingRequest
            {
                TranscriptionId = "test-transcription-789",
                Mappings = null!
            };
        }

        public static SpeakerMappingResponse CreateSpeakerMappingResponse()
        {
            return new SpeakerMappingResponse
            {
                TranscriptionId = "test-transcription-123",
                Mappings = new List<SpeakerMapping>
                {
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_0",
                        Name = "John Doe",
                        Role = "Project Manager"
                    },
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_1",
                        Name = "Jane Smith",
                        Role = "Developer"
                    },
                    new SpeakerMapping
                    {
                        SpeakerId = "speaker_2",
                        Name = "Bob Johnson",
                        Role = "QA Engineer"
                    }
                },
                Success = true,
                Message = "Speaker mappings saved successfully"
            };
        }

        public static SpeakerMappingResponse CreateEmptySpeakerMappingResponse()
        {
            return new SpeakerMappingResponse
            {
                TranscriptionId = "test-transcription-empty",
                Mappings = new List<SpeakerMapping>(),
                Success = true,
                Message = "No speaker mappings found"
            };
        }

        public static SpeakerMappingResponse CreateErrorSpeakerMappingResponse()
        {
            return new SpeakerMappingResponse
            {
                TranscriptionId = "test-transcription-error",
                Mappings = new List<SpeakerMapping>(),
                Success = false,
                Message = "Error occurred while processing speaker mappings"
            };
        }

        public static List<SpeakerMapping> CreateMultipleSpeakerMappings()
        {
            return new List<SpeakerMapping>
            {
                new SpeakerMapping
                {
                    SpeakerId = "speaker_0",
                    Name = "Alice Wilson",
                    Role = "Team Lead"
                },
                new SpeakerMapping
                {
                    SpeakerId = "speaker_1",
                    Name = "Charlie Brown",
                    Role = "Senior Developer"
                },
                new SpeakerMapping
                {
                    SpeakerId = "speaker_2",
                    Name = "Diana Prince",
                    Role = "UX Designer"
                },
                new SpeakerMapping
                {
                    SpeakerId = "speaker_3",
                    Name = "Edward Norton",
                    Role = "Product Owner"
                }
            };
        }

        public static SpeakerMapping CreateSingleSpeakerMapping()
        {
            return new SpeakerMapping
            {
                SpeakerId = "speaker_solo",
                Name = "Solo Speaker",
                Role = "Presenter"
            };
        }
    }
}