using System.ComponentModel.DataAnnotations;
using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Models
{
    /// <summary>
    /// Represents a token reservation for a meeting processing operation.
    /// This eliminates race conditions by reserving tokens before processing
    /// and only consuming them on successful completion.
    /// </summary>
    public class TokenReservation
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid MeetingId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Tokens reserved must be positive")]
        public int TokensReserved { get; set; }

        [Required]
        public DateTime ReservedAt { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        [Required]
        public TokenReservationStatus Status { get; set; }

        /// <summary>
        /// Optional description of why the tokens were reserved
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// When the reservation was consumed (if Status = Consumed)
        /// </summary>
        public DateTime? ConsumedAt { get; set; }

        /// <summary>
        /// When the reservation was cancelled (if Status = Cancelled)
        /// </summary>
        public DateTime? CancelledAt { get; set; }

        /// <summary>
        /// Check if the reservation is still valid (not expired and in Reserved status)
        /// </summary>
        public bool IsValid => Status == TokenReservationStatus.Reserved && DateTime.UtcNow < ExpiresAt;

        /// <summary>
        /// Check if the reservation has expired
        /// </summary>
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    }

    /// <summary>
    /// Status of a token reservation
    /// </summary>
    public enum TokenReservationStatus
    {
        /// <summary>
        /// Tokens are reserved and available for consumption
        /// </summary>
        Reserved = 0,

        /// <summary>
        /// Tokens have been consumed (deducted from user balance)
        /// </summary>
        Consumed = 1,

        /// <summary>
        /// Reservation was cancelled by user or system
        /// </summary>
        Cancelled = 2,

        /// <summary>
        /// Reservation expired without being consumed or cancelled
        /// </summary>
        Expired = 3
    }
}