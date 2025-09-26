using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Tracks processed webhook events to prevent replay attacks and duplicate processing
/// </summary>
public class WebhookEvent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Stripe event ID to prevent replay attacks
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string EventId { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of webhook event (e.g., payment_intent.succeeded)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;
    
    /// <summary>
    /// Payment intent ID associated with this event
    /// </summary>
    [MaxLength(255)]
    public string? PaymentIntentId { get; set; }
    
    /// <summary>
    /// When the event was first processed
    /// </summary>
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Processing status (success, failed, duplicate)
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = "processing";
    
    /// <summary>
    /// User ID if applicable
    /// </summary>
    public Guid? UserId { get; set; }
    
    /// <summary>
    /// Raw webhook payload for debugging
    /// </summary>
    public string? RawPayload { get; set; }
    
    /// <summary>
    /// Error message if processing failed
    /// </summary>
    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }
}