using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Models.Payment;

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

    /// <summary>
    /// Checks if a refund has already been processed for a fast transcription job
    /// </summary>
    /// <param name="fastJobId">The fast transcription job to check</param>
    /// <returns>True if refund already processed</returns>
    Task<bool> IsRefundAlreadyProcessedAsync(Guid fastJobId);

    /// <summary>
    /// Process an automatic token refund for a failed fast transcription job.
    /// Restores tokens to user's balance when system failures occur.
    /// </summary>
    /// <param name="fastJobId">The failed fast transcription job</param>
    /// <param name="reason">Reason for the refund</param>
    /// <returns>Result indicating success and details</returns>
    Task<TokenRefundResult> ProcessAutomaticRefundAsync(Guid fastJobId, string reason);

    /// <summary>
    /// Process a token refund for a meeting-based cancellation
    /// </summary>
    /// <param name="meetingId">The meeting ID to refund</param>
    /// <param name="reason">Reason for the refund</param>
    /// <returns>Result indicating success and details</returns>
    Task<TokenRefundResult> ProcessMeetingRefundAsync(Guid meetingId, string reason);

    #region Token Reservation System (New Architecture)

    /// <summary>
    /// Reserve tokens for a meeting without immediately deducting from user balance.
    /// This eliminates race conditions by ensuring tokens are only consumed on successful completion.
    /// </summary>
    /// <param name="userId">User ID requesting the reservation</param>
    /// <param name="meetingId">Meeting ID the tokens are reserved for</param>
    /// <param name="tokensRequired">Number of tokens to reserve</param>
    /// <param name="description">Optional description for the reservation</param>
    /// <param name="expirationMinutes">Minutes until reservation expires (default: 30)</param>
    /// <returns>Token reservation result</returns>
    Task<TokenReservationResult> ReserveTokensAsync(string userId, string meetingId, int tokensRequired, 
        string? description = null, int expirationMinutes = 30);

    /// <summary>
    /// Consume a token reservation by deducting tokens from user balance.
    /// This should only be called on successful completion of the operation.
    /// </summary>
    /// <param name="reservationId">ID of the reservation to consume</param>
    /// <returns>Consumption result</returns>
    Task<TokenReservationResult> ConsumeReservationAsync(Guid reservationId);

    /// <summary>
    /// Release a token reservation without consuming tokens.
    /// This should be called when an operation is cancelled or fails.
    /// </summary>
    /// <param name="reservationId">ID of the reservation to release</param>
    /// <param name="reason">Reason for releasing the reservation</param>
    /// <returns>Release result</returns>
    Task<TokenReservationResult> ReleaseReservationAsync(Guid reservationId, string? reason = null);

    /// <summary>
    /// Get reservation details by ID
    /// </summary>
    /// <param name="reservationId">Reservation ID to lookup</param>
    /// <returns>Reservation details or null if not found</returns>
    Task<TokenReservation?> GetReservationAsync(Guid reservationId);

    /// <summary>
    /// Cleanup expired reservations (for background service)
    /// </summary>
    /// <returns>Number of reservations cleaned up</returns>
    Task<int> CleanupExpiredReservationsAsync();

    #endregion
}
