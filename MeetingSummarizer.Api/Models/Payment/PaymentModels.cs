namespace MeetingSummarizer.Api.Models.Payment;

/// <summary>
/// Request model for creating a payment intent
/// </summary>
public class CreatePaymentIntentRequest
{
    /// <summary>
    /// User identifier
    /// </summary>
    public required string UserId { get; set; }

    /// <summary>
    /// User email address
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Amount to charge in USD
    /// </summary>
    public required decimal Amount { get; set; }

    /// <summary>
    /// Number of tokens being purchased
    /// </summary>
    public required int TokenCount { get; set; }

    /// <summary>
    /// Currency code (default: USD)
    /// </summary>
    public string Currency { get; set; } = "usd";

    /// <summary>
    /// Payment description
    /// </summary>
    public string Description { get; set; } = "Token purchase";

    /// <summary>
    /// Additional metadata for the payment
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// Result of payment intent creation
/// </summary>
public class PaymentIntentResult
{
    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public required bool Success { get; set; }

    /// <summary>
    /// Payment intent identifier
    /// </summary>
    public string? PaymentIntentId { get; set; }

    /// <summary>
    /// Client secret for frontend payment confirmation
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Current status of the payment intent
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Error message if operation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Error code for specific error types
    /// </summary>
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Result of payment confirmation
/// </summary>
public class PaymentConfirmationResult
{
    /// <summary>
    /// Whether the payment was confirmed successfully
    /// </summary>
    public required bool Success { get; set; }

    /// <summary>
    /// Payment intent identifier
    /// </summary>
    public string? PaymentIntentId { get; set; }

    /// <summary>
    /// Final payment status
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Amount that was charged
    /// </summary>
    public decimal? AmountCharged { get; set; }

    /// <summary>
    /// Currency of the charge
    /// </summary>
    public string? Currency { get; set; }

    /// <summary>
    /// Error message if confirmation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Error code for specific error types
    /// </summary>
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Result of webhook processing
/// </summary>
public class WebhookProcessingResult
{
    /// <summary>
    /// Whether the webhook was processed successfully
    /// </summary>
    public required bool Success { get; set; }

    /// <summary>
    /// Type of event that was processed
    /// </summary>
    public string? EventType { get; set; }

    /// <summary>
    /// Payment intent ID associated with the event
    /// </summary>
    public string? PaymentIntentId { get; set; }

    /// <summary>
    /// User ID associated with the payment
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Number of tokens to add to user balance (for successful payments)
    /// </summary>
    public int? TokensToAdd { get; set; }

    /// <summary>
    /// Amount paid for the tokens (for successful payments)
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Whether this event should be retried later
    /// </summary>
    public bool ShouldRetry { get; set; } = false;
}

/// <summary>
/// Result of refund processing
/// </summary>
public class RefundResult
{
    /// <summary>
    /// Whether the refund was processed successfully
    /// </summary>
    public required bool Success { get; set; }

    /// <summary>
    /// Refund identifier
    /// </summary>
    public string? RefundId { get; set; }

    /// <summary>
    /// Amount that was refunded
    /// </summary>
    public decimal? AmountRefunded { get; set; }

    /// <summary>
    /// Currency of the refund
    /// </summary>
    public string? Currency { get; set; }

    /// <summary>
    /// Refund status
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Reason for the refund
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Number of tokens to deduct from user balance
    /// </summary>
    public int? TokensToDeduct { get; set; }

    /// <summary>
    /// Error message if refund failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Error code for specific error types
    /// </summary>
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Payment details for retrieving payment information
/// </summary>
public class PaymentDetails
{
    /// <summary>
    /// Payment intent identifier
    /// </summary>
    public required string PaymentIntentId { get; set; }

    /// <summary>
    /// Current payment status
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Amount of the payment
    /// </summary>
    public required decimal Amount { get; set; }

    /// <summary>
    /// Currency of the payment
    /// </summary>
    public required string Currency { get; set; }

    /// <summary>
    /// Customer identifier
    /// </summary>
    public string? CustomerId { get; set; }

    /// <summary>
    /// Payment method used
    /// </summary>
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// When the payment was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Payment metadata
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}
