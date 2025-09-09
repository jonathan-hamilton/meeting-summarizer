using MeetingSummarizer.Api.Models;
using Microsoft.Extensions.Logging;

namespace MeetingSummarizer.Api.Services.TokenManagement;

/// <summary>
/// Token calculation service implementation with duration-based pricing and volume discounts
/// </summary>
public class TokenCalculationService : ITokenCalculationService
{
    private readonly ILogger<TokenCalculationService> _logger;
    
    // Token system constants
    private const decimal TOKEN_VALUE_USD = 0.05m; // 1 token = $0.05
    private const int BASE_TOKENS_PER_15_MINUTES = 100;
    
    public TokenCalculationService(ILogger<TokenCalculationService> logger)
    {
        _logger = logger;
    }
    
    /// <summary>
    /// Calculate tokens required for a meeting based on duration
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Token calculation result with breakdown</returns>
    public TokenCalculationResult CalculateTokensRequired(int durationMinutes)
    {
        if (durationMinutes <= 0)
        {
            throw new ArgumentException("Duration must be greater than 0", nameof(durationMinutes));
        }
        
        // Base calculation: 100 tokens per 15-minute increment (rounded up)
        int baseTokens = (int)Math.Ceiling(durationMinutes / 15.0) * BASE_TOKENS_PER_15_MINUTES;
        
        // Apply volume discount
        double discountMultiplier = GetVolumeDiscountMultiplier(durationMinutes);
        int discountPercentage = GetVolumeDiscountPercentage(durationMinutes);
        int finalTokens = (int)(baseTokens * discountMultiplier);
        
        // Calculate costs
        decimal finalCost = CalculateCostForTokens(finalTokens);
        decimal baseCost = CalculateCostForTokens(baseTokens);
        decimal savings = baseCost - finalCost;
        decimal costPerMinute = finalCost / durationMinutes;
        
        // Generate explanation and discount tier
        string discountTier = GetDiscountTierDescription(durationMinutes);
        string explanation = GenerateExplanation(durationMinutes, baseTokens, finalTokens, discountPercentage);
        
        var result = new TokenCalculationResult
        {
            DurationMinutes = durationMinutes,
            BaseTokens = baseTokens,
            VolumeDiscountMultiplier = discountMultiplier,
            VolumeDiscountPercentage = discountPercentage,
            FinalTokens = finalTokens,
            CostInUsd = finalCost,
            CostPerMinute = costPerMinute,
            SavingsFromDiscount = savings,
            DiscountTier = discountTier,
            Explanation = explanation
        };
        
        _logger.LogDebug("Token calculation for {Duration} minutes: {BaseTokens} base tokens → {FinalTokens} final tokens ({DiscountPercentage}% discount) = ${Cost}",
            durationMinutes, baseTokens, finalTokens, discountPercentage, finalCost);
        
        return result;
    }
    
    /// <summary>
    /// Calculate tokens required for a meeting based on duration
    /// </summary>
    /// <param name="duration">Meeting duration as TimeSpan</param>
    /// <returns>Token calculation result with breakdown</returns>
    public TokenCalculationResult CalculateTokensRequired(TimeSpan duration)
    {
        int durationMinutes = (int)Math.Ceiling(duration.TotalMinutes);
        return CalculateTokensRequired(durationMinutes);
    }
    
    /// <summary>
    /// Calculate cost in USD for a given number of tokens
    /// </summary>
    /// <param name="tokens">Number of tokens</param>
    /// <returns>Cost in USD</returns>
    public decimal CalculateCostForTokens(int tokens)
    {
        if (tokens < 0)
        {
            throw new ArgumentException("Tokens must be non-negative", nameof(tokens));
        }
        
        return tokens * TOKEN_VALUE_USD;
    }
    
    /// <summary>
    /// Get volume discount multiplier based on meeting duration
    /// Volume Discount Structure:
    /// - 15 minutes: 1.0 (no discount)
    /// - 30 minutes: 0.9 (10% discount) 
    /// - 45 minutes: 0.8 (20% discount)
    /// - 60+ minutes: 0.7 (30% discount)
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Discount multiplier (1.0 = no discount, 0.9 = 10% discount, etc.)</returns>
    public double GetVolumeDiscountMultiplier(int durationMinutes)
    {
        return durationMinutes switch
        {
            <= 15 => 1.0,    // No discount
            <= 30 => 0.9,    // 10% discount
            <= 45 => 0.8,    // 20% discount
            _ => 0.7          // 30% discount for 60+ minutes
        };
    }
    
    /// <summary>
    /// Get volume discount percentage based on meeting duration
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Discount percentage (0 = no discount, 10 = 10% discount, etc.)</returns>
    public int GetVolumeDiscountPercentage(int durationMinutes)
    {
        return durationMinutes switch
        {
            <= 15 => 0,      // No discount
            <= 30 => 10,     // 10% discount
            <= 45 => 20,     // 20% discount
            _ => 30          // 30% discount for 60+ minutes
        };
    }
    
    /// <summary>
    /// Get human-readable description of the discount tier
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Discount tier description</returns>
    private string GetDiscountTierDescription(int durationMinutes)
    {
        return durationMinutes switch
        {
            <= 15 => "Standard Rate",
            <= 30 => "Volume Discount (10% off)",
            <= 45 => "Volume Discount (20% off)",
            _ => "Volume Discount (30% off)"
        };
    }
    
    /// <summary>
    /// Generate user-friendly explanation of the token calculation
    /// </summary>
    /// <param name="durationMinutes">Meeting duration</param>
    /// <param name="baseTokens">Base tokens before discount</param>
    /// <param name="finalTokens">Final tokens after discount</param>
    /// <param name="discountPercentage">Discount percentage applied</param>
    /// <returns>Explanation string</returns>
    private string GenerateExplanation(int durationMinutes, int baseTokens, int finalTokens, int discountPercentage)
    {
        if (discountPercentage == 0)
        {
            return $"This {durationMinutes}-minute meeting requires {finalTokens} tokens (100 tokens per 15-minute increment).";
        }
        
        return $"This {durationMinutes}-minute meeting requires {finalTokens} tokens. " +
               $"Base calculation: {baseTokens} tokens, with {discountPercentage}% volume discount applied.";
    }
}
