using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models.Requests;

/// <summary>
/// Request model for creating a new meeting
/// </summary>
public class CreateMeetingRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public string OriginalFileName { get; set; } = string.Empty;

    [Range(1, long.MaxValue)]
    public long FileSizeBytes { get; set; }

    [Range(1, int.MaxValue)]
    public int DurationSeconds { get; set; }

    [Required]
    public string BlobStoragePath { get; set; } = string.Empty;
}

/// <summary>
/// Request model for updating meeting metadata
/// </summary>
public class UpdateMeetingMetadataRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }
}

/// <summary>
/// Request model for meeting list filtering
/// </summary>
public class GetMeetingsRequest
{
    public string? SearchTerm { get; set; }
    public int? StatusFilter { get; set; } // MeetingStatus enum value
    
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;
    
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Request model for updating meeting transcription data
/// </summary>
public class UpdateTranscriptionRequest
{
    [Required]
    public string TranscriptionJson { get; set; } = string.Empty;

    public string? SpeakerMappingsJson { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TokensConsumed { get; set; } = 0;
}

/// <summary>
/// Request model for updating meeting summary data
/// </summary>
public class UpdateSummaryRequest
{
    [Required]
    public string SummaryJson { get; set; } = string.Empty;

    public string? ActionItemsJson { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TokensConsumed { get; set; } = 0;
}