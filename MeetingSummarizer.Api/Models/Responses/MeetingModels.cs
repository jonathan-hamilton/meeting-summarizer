using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Models.Responses;

/// <summary>
/// Paginated result wrapper for API responses
/// </summary>
/// <typeparam name="T">Type of items in the result</typeparam>
public class PaginatedResult<T>
{
    public IList<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

/// <summary>
/// Meeting list item for meeting history display
/// </summary>
public class MeetingListItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public int DurationSeconds { get; set; }
    public MeetingStatus Status { get; set; }
    public int SpeakerCount { get; set; }
    public decimal TokensConsumed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime LastAccessedAt { get; set; }
    
    /// <summary>
    /// Formatted file size for display
    /// </summary>
    public string FormattedFileSize => FormatFileSize(FileSizeBytes);
    
    /// <summary>
    /// Formatted duration for display
    /// </summary>
    public string FormattedDuration => FormatDuration(DurationSeconds);
    
    /// <summary>
    /// Processing progress percentage (0-100)
    /// </summary>
    public int ProgressPercentage => CalculateProgress(Status);
    
    /// <summary>
    /// Whether the meeting has completed processing
    /// </summary>
    public bool IsCompleted => Status == MeetingStatus.Completed;
    
    /// <summary>
    /// Whether the meeting failed processing
    /// </summary>
    public bool HasFailed => Status == MeetingStatus.Failed;

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private static string FormatDuration(int seconds)
    {
        var timeSpan = TimeSpan.FromSeconds(seconds);
        if (timeSpan.Hours > 0)
        {
            return $"{timeSpan.Hours:D1}:{timeSpan.Minutes:D2}:{timeSpan.Seconds:D2}";
        }
        return $"{timeSpan.Minutes:D2}:{timeSpan.Seconds:D2}";
    }

    private static int CalculateProgress(MeetingStatus status)
    {
        return status switch
        {
            MeetingStatus.Uploaded => 10,
            MeetingStatus.Transcribing => 30,
            MeetingStatus.Transcribed => 60,
            MeetingStatus.Summarizing => 80,
            MeetingStatus.Completed => 100,
            MeetingStatus.Failed => 0,
            MeetingStatus.Deleted => 0,
            _ => 0
        };
    }
}

/// <summary>
/// User meeting statistics summary
/// </summary>
public class MeetingStatistics
{
    public int TotalMeetings { get; set; }
    public int CompletedMeetings { get; set; }
    public int ProcessingMeetings { get; set; }
    public int FailedMeetings { get; set; }
    public long TotalStorageBytes { get; set; }
    public int TotalDurationSeconds { get; set; }
    public decimal TotalTokensConsumed { get; set; }
    public DateTime? LastMeetingAt { get; set; }
    
    /// <summary>
    /// Formatted total storage for display
    /// </summary>
    public string FormattedTotalStorage => FormatFileSize(TotalStorageBytes);
    
    /// <summary>
    /// Formatted total duration for display
    /// </summary>
    public string FormattedTotalDuration => FormatDuration(TotalDurationSeconds);
    
    /// <summary>
    /// Success rate percentage
    /// </summary>
    public double SuccessRate => TotalMeetings > 0 ? (double)CompletedMeetings / TotalMeetings * 100 : 0;

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private static string FormatDuration(int seconds)
    {
        var timeSpan = TimeSpan.FromSeconds(seconds);
        if (timeSpan.TotalDays >= 1)
        {
            return $"{(int)timeSpan.TotalDays}d {timeSpan.Hours}h {timeSpan.Minutes}m";
        }
        if (timeSpan.Hours > 0)
        {
            return $"{timeSpan.Hours}h {timeSpan.Minutes}m {timeSpan.Seconds}s";
        }
        return $"{timeSpan.Minutes}m {timeSpan.Seconds}s";
    }
}