using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Data.Entities;

/// <summary>
/// Represents a token refund for a failed transcription job.
/// Tokens are restored to user balance when system failures occur.
/// </summary>
public class TokenRefund
{
    public Guid Id { get; set; }

    /// <summary>
    /// The user who received the token refund
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// The failed batch job that triggered this refund
    /// </summary>
    public Guid BatchJobId { get; set; }
    public BatchTranscriptionJob BatchJob { get; set; } = null!;

    /// <summary>
    /// Number of tokens refunded to the user
    /// </summary>
    public int TokensRefunded { get; set; }

    /// <summary>
    /// Reason for the refund (e.g., "Azure Speech Service failure", "Processing timeout")
    /// </summary>
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// When the refund was processed
    /// </summary>
    public DateTime RefundedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this refund was processed automatically or manually
    /// </summary>
    public bool IsAutomatic { get; set; } = true;

    /// <summary>
    /// User's token balance before the refund
    /// </summary>
    public decimal BalanceBefore { get; set; }

    /// <summary>
    /// User's token balance after the refund
    /// </summary>
    public decimal BalanceAfter { get; set; }
}