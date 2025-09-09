using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.TokenManagement;

/// <summary>
/// Interface for token calculation operations
/// </summary>
public interface ITokenCalculationService
{
    /// <summary>
    /// Calculate tokens required for a meeting based on duration
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Token calculation result with breakdown</returns>
    TokenCalculationResult CalculateTokensRequired(int durationMinutes);
    
    /// <summary>
    /// Calculate tokens required for a meeting based on duration
    /// </summary>
    /// <param name="duration">Meeting duration as TimeSpan</param>
    /// <returns>Token calculation result with breakdown</returns>
    TokenCalculationResult CalculateTokensRequired(TimeSpan duration);
    
    /// <summary>
    /// Calculate cost in USD for a given number of tokens
    /// </summary>
    /// <param name="tokens">Number of tokens</param>
    /// <returns>Cost in USD</returns>
    decimal CalculateCostForTokens(int tokens);
    
    /// <summary>
    /// Get volume discount multiplier based on meeting duration
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Discount multiplier (1.0 = no discount, 0.9 = 10% discount, etc.)</returns>
    double GetVolumeDiscountMultiplier(int durationMinutes);
    
    /// <summary>
    /// Get volume discount percentage based on meeting duration
    /// </summary>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <returns>Discount percentage (0 = no discount, 10 = 10% discount, etc.)</returns>
    int GetVolumeDiscountPercentage(int durationMinutes);
}
