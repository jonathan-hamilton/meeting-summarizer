namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Result of token calculation with detailed breakdown
/// </summary>
public class TokenCalculationResult
{
    /// <summary>
    /// Meeting duration in minutes
    /// </summary>
    public int DurationMinutes { get; set; }
    
    /// <summary>
    /// Base tokens calculated before discounts (duration / 15 * 100)
    /// </summary>
    public int BaseTokens { get; set; }
    
    /// <summary>
    /// Volume discount multiplier applied (1.0 = no discount, 0.9 = 10% discount)
    /// </summary>
    public double VolumeDiscountMultiplier { get; set; }
    
    /// <summary>
    /// Volume discount percentage (0 = no discount, 10 = 10% discount)
    /// </summary>
    public int VolumeDiscountPercentage { get; set; }
    
    /// <summary>
    /// Final tokens required after applying volume discount
    /// </summary>
    public int FinalTokens { get; set; }
    
    /// <summary>
    /// Cost in USD for the final tokens
    /// </summary>
    public decimal CostInUsd { get; set; }
    
    /// <summary>
    /// Cost per minute in USD
    /// </summary>
    public decimal CostPerMinute { get; set; }
    
    /// <summary>
    /// Amount saved due to volume discount in USD
    /// </summary>
    public decimal SavingsFromDiscount { get; set; }
    
    /// <summary>
    /// Description of the discount tier applied
    /// </summary>
    public string DiscountTier { get; set; } = string.Empty;
    
    /// <summary>
    /// Breakdown explanation for display to users
    /// </summary>
    public string Explanation { get; set; } = string.Empty;
}

/// <summary>
/// Comprehensive token statistics for a user
/// </summary>
public class TokenStatistics
{
    /// <summary>
    /// Current token balance
    /// </summary>
    public decimal CurrentBalance { get; set; }
    
    /// <summary>
    /// Total tokens purchased (lifetime)
    /// </summary>
    public int TotalPurchased { get; set; }
    
    /// <summary>
    /// Total tokens used (lifetime)
    /// </summary>
    public int TotalUsed { get; set; }
    
    /// <summary>
    /// Total amount spent on tokens (lifetime)
    /// </summary>
    public decimal TotalSpent { get; set; }
    
    /// <summary>
    /// Number of meetings processed
    /// </summary>
    public int MeetingsProcessed { get; set; }
    
    /// <summary>
    /// Total meeting minutes processed
    /// </summary>
    public int TotalMinutesProcessed { get; set; }
    
    /// <summary>
    /// Average tokens per meeting
    /// </summary>
    public decimal AverageTokensPerMeeting { get; set; }
    
    /// <summary>
    /// Most recent purchase date
    /// </summary>
    public DateTime? LastPurchaseDate { get; set; }
    
    /// <summary>
    /// Most recent usage date
    /// </summary>
    public DateTime? LastUsageDate { get; set; }
    
    /// <summary>
    /// Total savings from volume discounts
    /// </summary>
    public decimal TotalSavingsFromDiscounts { get; set; }
}
