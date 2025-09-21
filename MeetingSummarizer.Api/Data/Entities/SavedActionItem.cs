using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a saved action item within a meeting summary
/// </summary>
public class SavedActionItem
{
    /// <summary>
    /// Unique identifier for this action item
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Foreign key to the SavedSummary this action item belongs to
    /// </summary>
    [Required]
    public Guid SummaryId { get; set; }
    
    /// <summary>
    /// Description of the action item
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Person or role this action item is assigned to
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string AssignedTo { get; set; } = string.Empty;
    
    /// <summary>
    /// AI confidence level for this assignment (0.0 to 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    [Column(TypeName = "decimal(5,4)")]
    public decimal Confidence { get; set; } = 0.0m;
    
    /// <summary>
    /// Whether this assignment was explicitly made (vs AI-inferred)
    /// </summary>
    public bool IsExplicitAssignment { get; set; } = false;
    
    /// <summary>
    /// Sort order within the summary (for user-defined ordering)
    /// </summary>
    public int SortOrder { get; set; } = 0;
    
    /// <summary>
    /// Whether this action item has been completed
    /// </summary>
    public bool IsCompleted { get; set; } = false;
    
    /// <summary>
    /// When this action item was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When this action item was last modified
    /// </summary>
    public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property to the summary this action item belongs to
    /// </summary>
    public SavedSummary Summary { get; set; } = null!;
}