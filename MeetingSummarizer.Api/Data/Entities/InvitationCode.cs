using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents an invitation code for development environment access control
/// </summary>
public class InvitationCode
{
    /// <summary>
    /// Unique identifier for the invitation code
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// The unique invitation code (cryptographically secure)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional email restriction - if specified, only this email can use the code
    /// </summary>
    [MaxLength(255)]
    public string? Email { get; set; }
    
    /// <summary>
    /// When the invitation code expires and becomes invalid
    /// </summary>
    [Required]
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// When the invitation code was used (null if unused)
    /// </summary>
    public DateTime? UsedAt { get; set; }
    
    /// <summary>
    /// The ID of the user who used this invitation code (null if unused)
    /// </summary>
    public Guid? UsedByUserId { get; set; }
    
    /// <summary>
    /// Whether the invitation code is active and can be used
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// When the invitation code was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Who created the invitation code (email or admin identifier)
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string CreatedBy { get; set; } = string.Empty;
    
    /// <summary>
    /// Navigation property to the user who used this invitation (if any)
    /// </summary>
    [ForeignKey(nameof(UsedByUserId))]
    public virtual User? UsedByUser { get; set; }
}