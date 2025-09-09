using System.ComponentModel.DataAnnotations;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Request model for token purchase operations
/// </summary>
public class PurchaseTokensRequest
{
    /// <summary>
    /// Number of tokens to purchase
    /// </summary>
    [Required]
    [Range(100, 10000, ErrorMessage = "Token amount must be between 100 and 10,000")]
    public int TokenAmount { get; set; }

    /// <summary>
    /// Expected amount to pay (for validation)
    /// </summary>
    [Required]
    [Range(0.01, 500.00, ErrorMessage = "Amount must be between $0.01 and $500.00")]
    public decimal ExpectedAmount { get; set; }

    /// <summary>
    /// Optional meeting duration in minutes (for cost estimation validation)
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Client-side calculation for verification
    /// </summary>
    public string? CalculationMetadata { get; set; }
}

/// <summary>
/// Response model for token purchase initiation
/// </summary>
public class PurchaseTokensResponse
{
    /// <summary>
    /// Stripe Payment Intent client secret for frontend processing
    /// </summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>
    /// Payment Intent ID for tracking
    /// </summary>
    public string PaymentIntentId { get; set; } = string.Empty;

    /// <summary>
    /// Calculated token amount (server-side validation)
    /// </summary>
    public int TokenAmount { get; set; }

    /// <summary>
    /// Final amount to charge
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Applied discount information
    /// </summary>
    public string DiscountDetails { get; set; } = string.Empty;

    /// <summary>
    /// Expiration time for the payment intent
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}

/// <summary>
/// Request model for confirming payment completion
/// </summary>
public class ConfirmPaymentRequest
{
    /// <summary>
    /// Stripe Payment Intent ID
    /// </summary>
    [Required]
    public string PaymentIntentId { get; set; } = string.Empty;

    /// <summary>
    /// Expected token amount (for validation)
    /// </summary>
    [Required]
    public int ExpectedTokenAmount { get; set; }
}

/// <summary>
/// Response model for payment confirmation
/// </summary>
public class ConfirmPaymentResponse
{
    /// <summary>
    /// Whether the payment was successfully processed
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// New token balance after purchase
    /// </summary>
    public decimal NewTokenBalance { get; set; }

    /// <summary>
    /// Tokens added from this purchase
    /// </summary>
    public int TokensAdded { get; set; }

    /// <summary>
    /// Transaction ID for reference
    /// </summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>
    /// Error message if payment failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request model for token usage validation
/// </summary>
public class ValidateTokensRequest
{
    /// <summary>
    /// Meeting duration in minutes
    /// </summary>
    [Required]
    [Range(1, 1440, ErrorMessage = "Duration must be between 1 and 1440 minutes")]
    public int DurationMinutes { get; set; }

    /// <summary>
    /// Optional meeting ID for reference
    /// </summary>
    public string? MeetingId { get; set; }
}

/// <summary>
/// Response model for token validation
/// </summary>
public class ValidateTokensResponse
{
    /// <summary>
    /// Whether user has sufficient tokens
    /// </summary>
    public bool HasSufficientTokens { get; set; }

    /// <summary>
    /// Current token balance
    /// </summary>
    public decimal CurrentBalance { get; set; }

    /// <summary>
    /// Required tokens for the operation
    /// </summary>
    public int RequiredTokens { get; set; }

    /// <summary>
    /// Token shortfall if insufficient
    /// </summary>
    public int Shortfall { get; set; }

    /// <summary>
    /// Cost calculation details
    /// </summary>
    public TokenCalculationResult CalculationDetails { get; set; } = new();

    /// <summary>
    /// Suggested token purchase amount
    /// </summary>
    public int SuggestedPurchaseAmount { get; set; }
}

/// <summary>
/// Response model for token balance inquiry
/// </summary>
public class TokenBalanceResponse
{
    /// <summary>
    /// Current token balance
    /// </summary>
    public decimal Balance { get; set; }

    /// <summary>
    /// Equivalent dollar value of current balance
    /// </summary>
    public decimal DollarValue { get; set; }

    /// <summary>
    /// Estimated minutes of processing available
    /// </summary>
    public int EstimatedMinutesAvailable { get; set; }

    /// <summary>
    /// Last balance update timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Response model for token transaction history
/// </summary>
public class TokenHistoryResponse
{
    /// <summary>
    /// List of recent purchases
    /// </summary>
    public IEnumerable<TokenPurchaseDto> Purchases { get; set; } = new List<TokenPurchaseDto>();

    /// <summary>
    /// List of recent usages
    /// </summary>
    public IEnumerable<TokenUsageDto> Usages { get; set; } = new List<TokenUsageDto>();

    /// <summary>
    /// Overall statistics
    /// </summary>
    public TokenStatistics Statistics { get; set; } = new();
}

/// <summary>
/// DTO for token purchase display
/// </summary>
public class TokenPurchaseDto
{
    public string Id { get; set; } = string.Empty;
    public int TokenAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal DiscountApplied { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
}

/// <summary>
/// DTO for token usage display
/// </summary>
public class TokenUsageDto
{
    public string Id { get; set; } = string.Empty;
    public string MeetingId { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
    public int DurationMinutes { get; set; }
    public decimal DiscountApplied { get; set; }
    public DateTime UsageDate { get; set; }
    public decimal Cost { get; set; }
    public string MeetingTitle { get; set; } = string.Empty;
}
