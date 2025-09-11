using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MeetingSummarizer.Api.Data.Enums;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a user in the system with persistent data storage
/// </summary>
public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// Token balance for paid users
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TokenBalance { get; set; } = 0;
    
    /// <summary>
    /// Indicates if user is in paid mode or demo mode
    /// </summary>
    public bool IsPaidUser { get; set; } = false;
    
    /// <summary>
    /// User role for access control (User, Admin, SuperAdmin)
    /// </summary>
    public UserRole Role { get; set; } = UserRole.User;
    
    /// <summary>
    /// Hashed password for authentication (bcrypt)
    /// </summary>
    [MaxLength(255)]
    public string? PasswordHash { get; set; }
    
    /// <summary>
    /// Password salt for additional security
    /// </summary>
    [MaxLength(255)]
    public string? Salt { get; set; }
    
    /// <summary>
    /// User consent for data processing (GDPR)
    /// </summary>
    public bool HasConsentedToDataProcessing { get; set; } = false;
    
    /// <summary>
    /// When user consented to data processing
    /// </summary>
    public DateTime? ConsentDate { get; set; }
    
    /// <summary>
    /// Account creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last activity timestamp for retention policies
    /// </summary>
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property for user's meetings
    /// </summary>
    public virtual ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    
    /// <summary>
    /// Navigation property for user's token purchases
    /// </summary>
    public virtual ICollection<TokenPurchase> TokenPurchases { get; set; } = new List<TokenPurchase>();
    
    /// <summary>
    /// Navigation property for user's token usage
    /// </summary>
    public virtual ICollection<TokenUsage> TokenUsages { get; set; } = new List<TokenUsage>();
    
    /// <summary>
    /// Navigation property for user's batch transcription jobs
    /// </summary>
    public virtual ICollection<BatchTranscriptionJob> BatchTranscriptionJobs { get; set; } = new List<BatchTranscriptionJob>();
}
