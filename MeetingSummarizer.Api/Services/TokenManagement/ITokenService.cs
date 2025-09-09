using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;

namespace MeetingSummarizer.Api.Services.TokenManagement;

/// <summary>
/// Service interface for token operations including balance management, purchase processing, and usage tracking
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Get current token balance for a user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Current token balance</returns>
    Task<decimal> GetTokenBalanceAsync(string userId);

    /// <summary>
    /// Update user token balance (add or subtract tokens)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="tokenAmount">Amount to add (positive) or subtract (negative)</param>
    /// <param name="description">Description of the transaction</param>
    /// <returns>New token balance after update</returns>
    Task<decimal> UpdateTokenBalanceAsync(string userId, int tokenAmount, string description);

    /// <summary>
    /// Record a token purchase transaction
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="tokenAmount">Number of tokens purchased</param>
    /// <param name="amountPaid">Amount paid in dollars</param>
    /// <param name="stripePaymentIntentId">Stripe payment intent ID</param>
    /// <param name="discountApplied">Volume discount applied (0.0 to 1.0)</param>
    /// <returns>Created token purchase record</returns>
    Task<TokenPurchase> RecordTokenPurchaseAsync(string userId, int tokenAmount, decimal amountPaid, 
        string stripePaymentIntentId, decimal discountApplied = 0);

    /// <summary>
    /// Record token usage for a meeting
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="tokensUsed">Number of tokens consumed</param>
    /// <param name="durationMinutes">Meeting duration in minutes</param>
    /// <param name="discountApplied">Volume discount applied (0.0 to 1.0)</param>
    /// <returns>Created token usage record</returns>
    Task<TokenUsage> RecordTokenUsageAsync(string userId, string meetingId, int tokensUsed, 
        int durationMinutes, decimal discountApplied = 0);

    /// <summary>
    /// Validate and reserve tokens for a meeting (pre-processing check)
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="requiredTokens">Number of tokens required</param>
    /// <returns>True if user has sufficient tokens, false otherwise</returns>
    Task<bool> ValidateTokenAvailabilityAsync(string userId, int requiredTokens);

    /// <summary>
    /// Get token purchase history for a user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="limit">Maximum number of records to return (default 50)</param>
    /// <returns>List of token purchases ordered by date descending</returns>
    Task<IEnumerable<TokenPurchase>> GetPurchaseHistoryAsync(string userId, int limit = 50);

    /// <summary>
    /// Get token usage history for a user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="limit">Maximum number of records to return (default 50)</param>
    /// <returns>List of token usages ordered by date descending</returns>
    Task<IEnumerable<TokenUsage>> GetUsageHistoryAsync(string userId, int limit = 50);

    /// <summary>
    /// Get detailed token statistics for a user
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Token statistics including balance, total purchased, total used</returns>
    Task<TokenStatistics> GetTokenStatisticsAsync(string userId);
}
