using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MeetingSummarizer.Api.Hubs;

/// <summary>
/// SignalR hub for real-time meeting progress updates
/// Enables cross-device synchronization of batch job status
/// </summary>
[Authorize]
public class MeetingProgressHub : Hub
{
    private readonly ILogger<MeetingProgressHub> _logger;

    public MeetingProgressHub(ILogger<MeetingProgressHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Called when a client connects to the hub
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            // Add user to a group for their user ID for targeted messaging
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} connected to MeetingProgressHub with connection {ConnectionId}", userId, Context.ConnectionId);
        }
        
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects from the hub
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} disconnected from MeetingProgressHub", userId);
        }

        if (exception != null)
        {
            _logger.LogWarning(exception, "User disconnected with exception");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a specific meeting room for updates
    /// </summary>
    /// <param name="meetingId">Meeting ID to join</param>
    public async Task JoinMeetingRoom(string meetingId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"meeting_{meetingId}");
        _logger.LogInformation("Connection {ConnectionId} joined meeting room {MeetingId}", Context.ConnectionId, meetingId);
    }

    /// <summary>
    /// Leave a specific meeting room
    /// </summary>
    /// <param name="meetingId">Meeting ID to leave</param>
    public async Task LeaveMeetingRoom(string meetingId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"meeting_{meetingId}");
        _logger.LogInformation("Connection {ConnectionId} left meeting room {MeetingId}", Context.ConnectionId, meetingId);
    }
}

/// <summary>
/// Service interface for sending SignalR notifications
/// </summary>
public interface IMeetingProgressNotificationService
{
    /// <summary>
    /// Send progress update to all clients watching a specific meeting
    /// </summary>
    Task SendMeetingProgressUpdateAsync(Guid meetingId, Guid userId, MeetingProgressUpdate update);

    /// <summary>
    /// Send batch job status update to all user's connected devices
    /// </summary>
    Task SendBatchJobUpdateAsync(Guid userId, BatchJobProgressUpdate update);
}

/// <summary>
/// Service for sending meeting progress notifications via SignalR
/// </summary>
public class MeetingProgressNotificationService : IMeetingProgressNotificationService
{
    private readonly IHubContext<MeetingProgressHub> _hubContext;
    private readonly ILogger<MeetingProgressNotificationService> _logger;

    public MeetingProgressNotificationService(
        IHubContext<MeetingProgressHub> hubContext,
        ILogger<MeetingProgressNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendMeetingProgressUpdateAsync(Guid meetingId, Guid userId, MeetingProgressUpdate update)
    {
        try
        {
            // Send to both meeting-specific group and user group for redundancy
            await _hubContext.Clients.Group($"meeting_{meetingId}")
                .SendAsync("MeetingProgressUpdate", update);
            
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("MeetingProgressUpdate", update);

            _logger.LogInformation("Sent meeting progress update for meeting {MeetingId} to user {UserId}", meetingId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send meeting progress update for meeting {MeetingId}", meetingId);
        }
    }

    public async Task SendBatchJobUpdateAsync(Guid userId, BatchJobProgressUpdate update)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("BatchJobProgressUpdate", update);

            _logger.LogInformation("Sent batch job update for job {JobId} to user {UserId}", update.JobId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send batch job update for job {JobId}", update.JobId);
        }
    }
}

/// <summary>
/// Meeting progress update model for SignalR
/// </summary>
public class MeetingProgressUpdate
{
    public Guid MeetingId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? StatusMessage { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? BatchJobId { get; set; }
}

/// <summary>
/// Batch job progress update model for SignalR
/// </summary>
public class BatchJobProgressUpdate
{
    public Guid JobId { get; set; }
    public Guid MeetingId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? StatusMessage { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}