using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Data.Entities
{
    /// <summary>
    /// Represents a parsed segment of a transcript for efficient storage and search
    /// </summary>
    public class TranscriptSegment
    {
        /// <summary>
        /// Reference to the batch transcription job
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Sequential index of the segment within the transcript
        /// </summary>
        public int SegmentIndex { get; set; }

        /// <summary>
        /// The transcribed text content for this segment
        /// </summary>
        [Required]
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// Start time of the segment in seconds
        /// </summary>
        public double StartTime { get; set; }

        /// <summary>
        /// End time of the segment in seconds
        /// </summary>
        public double EndTime { get; set; }

        /// <summary>
        /// Speaker identifier (optional, for speaker diarization)
        /// </summary>
        [MaxLength(50)]
        public string? SpeakerId { get; set; }

        /// <summary>
        /// Confidence score from Azure Speech Services (0.0 to 1.0)
        /// </summary>
        public double? Confidence { get; set; }

        // Navigation property
        /// <summary>
        /// Reference to the parent batch transcription job
        /// </summary>
        public BatchTranscriptionJob Job { get; set; } = null!;
    }
}