using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a token purchase transaction
/// </summary>
public class TokenPurchase
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// User who made the purchase
    /// </summary>
    [Required]
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Number of tokens purchased
    /// </summary>
    public int TokensPurchased { get; set; }
    
    /// <summary>
    /// Amount paid in USD
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal AmountPaid { get; set; }
    
    /// <summary>
    /// Stripe payment intent ID or transaction reference
    /// </summary>
    [MaxLength(255)]
    public string? PaymentId { get; set; }
    
    /// <summary>
    /// When the purchase was made
    /// </summary>
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Payment status (pending, completed, failed, refunded)
    /// </summary>
    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "pending";
    
    /// <summary>
    /// Stripe session ID for tracking
    /// </summary>
    [MaxLength(255)]
    public string? StripeSessionId { get; set; }
    
    /// <summary>
    /// Additional metadata for the purchase
    /// </summary>
    [MaxLength(1000)]
    public string? Metadata { get; set; }
    
    /// <summary>
    /// Navigation property to User
    /// </summary>
    public virtual User User { get; set; } = null!;
}
