using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents token usage for meeting processing
/// </summary>
public class TokenUsage
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// User who used the tokens
    /// </summary>
    [Required]
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Meeting that consumed the tokens
    /// </summary>
    [Required]
    public Guid MeetingId { get; set; }
    
    /// <summary>
    /// Number of tokens consumed
    /// </summary>
    public int TokensUsed { get; set; }
    
    /// <summary>
    /// Duration of the meeting in minutes
    /// </summary>
    public int MeetingDurationMinutes { get; set; }
    
    /// <summary>
    /// Cost in USD for this usage
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal CostInUsd { get; set; }
    
    /// <summary>
    /// When the tokens were used
    /// </summary>
    public DateTime UsageDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Type of processing (transcription, summary, etc.)
    /// </summary>
    [MaxLength(100)]
    public string ProcessingType { get; set; } = "full_meeting";
    
    /// <summary>
    /// Volume discount applied (percentage)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal VolumeDiscountApplied { get; set; } = 0;
    
    /// <summary>
    /// Additional metadata for the usage
    /// </summary>
    [MaxLength(1000)]
    public string? Metadata { get; set; }
    
    /// <summary>
    /// Navigation property to User
    /// </summary>
    public virtual User User { get; set; } = null!;
    
    /// <summary>
    /// Navigation property to Meeting
    /// </summary>
    public virtual Meeting Meeting { get; set; } = null!;
}
