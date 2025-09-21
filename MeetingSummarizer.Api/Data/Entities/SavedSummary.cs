using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a saved meeting summary with persistent storage
/// </summary>
public class SavedSummary
{
    /// <summary>
    /// Unique identifier for this saved summary
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Foreign key to User who owns this summary
    /// </summary>
    [Required]
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Optional foreign key to Meeting this summary belongs to
    /// </summary>
    public Guid? MeetingId { get; set; }
    
    /// <summary>
    /// Display title for the summary
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional description or notes about the summary
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    /// <summary>
    /// JSON serialized MeetingSummary data
    /// </summary>
    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string SummaryData { get; set; } = "{}";
    
    /// <summary>
    /// Original transcript filename for reference
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string TranscriptFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// When this summary was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When this summary was last modified
    /// </summary>
    public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When this summary was last accessed
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }
    
    /// <summary>
    /// Navigation property to the user who owns this summary
    /// </summary>
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Navigation property to the meeting this summary belongs to (optional)
    /// </summary>
    public Meeting? Meeting { get; set; }
    
    /// <summary>
    /// Navigation property to action items in this summary
    /// </summary>
    public ICollection<SavedActionItem> ActionItems { get; set; } = new List<SavedActionItem>();
}