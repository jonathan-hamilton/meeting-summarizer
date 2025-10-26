using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Models.Payment;

namespace MeetingSummarizer.Api.Services.TokenManagement;

/// <summary>
/// Service for token operations including balance management, purchase processing, and usage tracking
/// </summary>
public class TokenService : ITokenService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<TokenService> _logger;

    public TokenService(MeetingSummarizerDbContext context, ILogger<TokenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<decimal> GetTokenBalanceAsync(string userId)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found when retrieving token balance", userId);
                return 0;
            }

            return user.TokenBalance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving token balance for user {UserId}", userId);
            throw;
        }
    }

    public async Task<decimal> UpdateTokenBalanceAsync(string userId, int tokenAmount, string description)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                throw new ArgumentException($"User {userId} not found", nameof(userId));
            }

            var newBalance = user.TokenBalance + tokenAmount;
            if (newBalance < 0)
            {
                throw new InvalidOperationException($"Insufficient tokens. Current balance: {user.TokenBalance}, Required: {Math.Abs(tokenAmount)}");
            }

            user.TokenBalance = newBalance;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated token balance for user {UserId}: {OldBalance} → {NewBalance} ({Change}) - {Description}", 
                userId, user.TokenBalance - tokenAmount, newBalance, tokenAmount, description);

            return newBalance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating token balance for user {UserId}, amount {TokenAmount}", userId, tokenAmount);
            throw;
        }
    }

    public async Task<TokenPurchase> RecordTokenPurchaseAsync(string userId, int tokenAmount, decimal amountPaid, 
        string stripePaymentIntentId, decimal discountApplied = 0)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                throw new ArgumentException($"User {userId} not found", nameof(userId));
            }

            // Check for duplicate payment (unique constraint should prevent this, but double-check)
            var existingPurchase = await _context.TokenPurchases
                .FirstOrDefaultAsync(tp => tp.PaymentId == stripePaymentIntentId);
            
            if (existingPurchase != null)
            {
                _logger.LogWarning("Duplicate payment attempt detected for payment ID {PaymentId}. Existing purchase: {ExistingId}", 
                    stripePaymentIntentId, existingPurchase.Id);
                return existingPurchase; // Return existing purchase instead of creating duplicate
            }

            // Validate token amount is reasonable
            if (tokenAmount <= 0 || tokenAmount > 100000)
            {
                throw new ArgumentException($"Invalid token amount: {tokenAmount}. Must be between 1 and 100,000", nameof(tokenAmount));
            }

            // Validate amount paid is reasonable
            if (amountPaid <= 0 || amountPaid > 10000) // Max $10,000 per purchase
            {
                throw new ArgumentException($"Invalid amount paid: ${amountPaid}. Must be between $0.01 and $10,000", nameof(amountPaid));
            }

            var purchase = new TokenPurchase
            {
                UserId = userGuid,
                TokensPurchased = tokenAmount,
                AmountPaid = amountPaid,
                PaymentId = stripePaymentIntentId,
                PurchaseDate = DateTime.UtcNow,
                PaymentStatus = "completed"
            };

            _context.TokenPurchases.Add(purchase);

            // Update user token balance
            user.TokenBalance += tokenAmount;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Recorded token purchase for user {UserId}: {TokenAmount} tokens for ${AmountPaid} (Discount: {Discount}%)", 
                userId, tokenAmount, amountPaid, discountApplied * 100);

            return purchase;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording token purchase for user {UserId}", userId);
            throw;
        }
    }

    public async Task<TokenUsage> RecordTokenUsageAsync(string userId, string meetingId, int tokensUsed, 
        int durationMinutes, decimal discountApplied = 0)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var meetingGuid = Guid.Parse(meetingId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                throw new ArgumentException($"User {userId} not found", nameof(userId));
            }

            if (user.TokenBalance < tokensUsed)
            {
                throw new InvalidOperationException($"Insufficient tokens. Required: {tokensUsed}, Available: {user.TokenBalance}");
            }

            var usage = new TokenUsage
            {
                UserId = userGuid,
                MeetingId = meetingGuid,
                TokensUsed = tokensUsed,
                MeetingDurationMinutes = durationMinutes,
                VolumeDiscountApplied = discountApplied,
                UsageDate = DateTime.UtcNow,
                CostInUsd = tokensUsed * 0.05m // Base cost per token
            };

            _context.TokenUsages.Add(usage);

            // Deduct tokens from user balance
            user.TokenBalance -= tokensUsed;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Recorded token usage for user {UserId}: {TokensUsed} tokens for meeting {MeetingId} ({DurationMinutes} minutes)", 
                userId, tokensUsed, meetingId, durationMinutes);

            return usage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording token usage for user {UserId}, meeting {MeetingId}", userId, meetingId);
            throw;
        }
    }

    public async Task<bool> ValidateTokenAvailabilityAsync(string userId, int requiredTokens)
    {
        try
        {
            var balance = await GetTokenBalanceAsync(userId);
            var isAvailable = balance >= requiredTokens;

            _logger.LogDebug("Token availability check for user {UserId}: Required {RequiredTokens}, Available {AvailableTokens}, Result: {IsAvailable}", 
                userId, requiredTokens, balance, isAvailable);

            return isAvailable;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token availability for user {UserId}", userId);
            return false;
        }
    }

    public async Task<IEnumerable<TokenPurchase>> GetPurchaseHistoryAsync(string userId, int limit = 50)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            return await _context.TokenPurchases
                .Where(p => p.UserId == userGuid)
                .OrderByDescending(p => p.PurchaseDate)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase history for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<TokenUsage>> GetUsageHistoryAsync(string userId, int limit = 50)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            return await _context.TokenUsages
                .Where(u => u.UserId == userGuid)
                .OrderByDescending(u => u.UsageDate)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving usage history for user {UserId}", userId);
            throw;
        }
    }

    public async Task<TokenStatistics> GetTokenStatisticsAsync(string userId)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                throw new ArgumentException($"User {userId} not found", nameof(userId));
            }

            var purchases = await _context.TokenPurchases
                .Where(p => p.UserId == userGuid)
                .ToListAsync();

            var usages = await _context.TokenUsages
                .Where(u => u.UserId == userGuid)
                .ToListAsync();

            var totalPurchased = purchases.Sum(p => p.TokensPurchased);
            var totalUsed = usages.Sum(u => u.TokensUsed);
            var totalSpent = purchases.Sum(p => p.AmountPaid);
            var totalMinutesProcessed = usages.Sum(u => u.MeetingDurationMinutes);
            var meetingsProcessed = usages.Count;

            // Calculate total savings from volume discounts
            var totalSavingsFromDiscounts = usages.Sum(u => u.TokensUsed * 0.05m * u.VolumeDiscountApplied);

            var statistics = new TokenStatistics
            {
                CurrentBalance = user.TokenBalance,
                TotalPurchased = totalPurchased,
                TotalUsed = totalUsed,
                TotalSpent = totalSpent,
                MeetingsProcessed = meetingsProcessed,
                TotalMinutesProcessed = totalMinutesProcessed,
                AverageTokensPerMeeting = meetingsProcessed > 0 ? (decimal)totalUsed / meetingsProcessed : 0,
                LastPurchaseDate = purchases.MaxBy(p => p.PurchaseDate)?.PurchaseDate,
                LastUsageDate = usages.MaxBy(u => u.UsageDate)?.UsageDate,
                TotalSavingsFromDiscounts = totalSavingsFromDiscounts
            };

            _logger.LogDebug("Generated token statistics for user {UserId}: Balance {Balance}, Purchased {Purchased}, Used {Used}", 
                userId, statistics.CurrentBalance, statistics.TotalPurchased, statistics.TotalUsed);

            return statistics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating token statistics for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> IsRefundAlreadyProcessedAsync(Guid fastJobId)
    {
        try
        {
            return await _context.TokenRefunds
                .AnyAsync(tr => tr.FastJobId == fastJobId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if refund already processed for fast job {FastJobId}", fastJobId);
            return false; // Default to assuming not processed to avoid missing refunds
        }
    }

    public async Task<TokenRefundResult> ProcessAutomaticRefundAsync(Guid fastJobId, string reason)
    {
        try
        {
            _logger.LogInformation("Processing automatic token refund for fast job {FastJobId}. Reason: {Reason}", 
                fastJobId, reason);

            // Check if refund already processed
            var existingRefund = await _context.TokenRefunds
                .FirstOrDefaultAsync(tr => tr.FastJobId == fastJobId);
            
            if (existingRefund != null)
            {
                _logger.LogWarning("Refund for fast job {FastJobId} already processed on {RefundedAt}", 
                    fastJobId, existingRefund.RefundedAt);
                
                return new TokenRefundResult
                {
                    Success = true,
                    AlreadyProcessed = true,
                    TokensRefunded = existingRefund.TokensRefunded,
                    BalanceBefore = existingRefund.BalanceBefore,
                    BalanceAfter = existingRefund.BalanceAfter,
                    Reason = existingRefund.Reason
                };
            }

            // Get the fast transcription job with token usage information
            var fastJob = await _context.FastTranscriptionJobs
                .FirstOrDefaultAsync(fj => fj.Id == fastJobId);

            if (fastJob == null)
            {
                var error = $"Fast transcription job {fastJobId} not found";
                _logger.LogError(error);
                return new TokenRefundResult { Success = false, ErrorMessage = error };
            }

            // Only refund if tokens were actually charged
            if (fastJob.TokensCharged <= 0)
            {
                _logger.LogInformation("No tokens were charged for fast job {FastJobId}, no refund needed", fastJobId);
                return new TokenRefundResult 
                { 
                    Success = true, 
                    TokensRefunded = 0,
                    Reason = "No tokens were charged for this job"
                };
            }

            // Get the user to refund tokens to
            var user = await _context.Users.FindAsync(fastJob.UserId);
            if (user == null)
            {
                var error = $"User {fastJob.UserId} not found for fast job {fastJobId}";
                _logger.LogError(error);
                return new TokenRefundResult { Success = false, ErrorMessage = error };
            }

            var tokensToRefund = fastJob.TokensCharged;
            var balanceBefore = user.TokenBalance;
            var balanceAfter = balanceBefore + tokensToRefund;

            // Create refund record
            var tokenRefund = new TokenRefund
            {
                UserId = user.Id,
                FastJobId = fastJobId,
                TokensRefunded = tokensToRefund,
                Reason = reason,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                IsAutomatic = true,
                RefundedAt = DateTime.UtcNow
            };

            // Update user balance
            user.TokenBalance = balanceAfter;

            // Save changes in a transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.TokenRefunds.Add(tokenRefund);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Automatic token refund processed for user {UserId}: {TokensRefunded} tokens refunded. Balance: {BalanceBefore} -> {BalanceAfter}", 
                    user.Id, tokensToRefund, balanceBefore, balanceAfter);

                return new TokenRefundResult
                {
                    Success = true,
                    TokensRefunded = tokensToRefund,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    Reason = reason
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to save automatic refund for fast job {FastJobId}", fastJobId);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing automatic token refund for fast job {FastJobId}", fastJobId);
            return new TokenRefundResult 
            { 
                Success = false, 
                ErrorMessage = ex.Message 
            };
        }
    }

    /// <summary>
    /// Process automatic token refund for a meeting-based transcription (when no FastTranscriptionJob exists)
    /// </summary>
    /// <param name="meetingId">Meeting ID</param>
    /// <param name="reason">Reason for refund</param>
    /// <returns>Refund result</returns>
    public async Task<TokenRefundResult> ProcessMeetingRefundAsync(Guid meetingId, string reason)
    {
        try
        {
            _logger.LogInformation("Processing meeting-based token refund for meeting {MeetingId}. Reason: {Reason}", 
                meetingId, reason);

            // Get the meeting and associated token usage
            var meeting = await _context.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting {MeetingId} not found for refund", meetingId);
                return new TokenRefundResult { Success = false, ErrorMessage = "Meeting not found" };
            }

            // Find the token usage for this meeting
            var tokenUsage = await _context.TokenUsages
                .FirstOrDefaultAsync(tu => tu.MeetingId == meetingId);

            if (tokenUsage == null)
            {
                _logger.LogWarning("No token usage found for meeting {MeetingId}", meetingId);
                return new TokenRefundResult { Success = false, ErrorMessage = "No token usage found for this meeting" };
            }

            // Check if refund already processed
            var existingRefund = await _context.TokenRefunds
                .FirstOrDefaultAsync(tr => tr.UserId == meeting.UserId && tr.Reason.Contains(meetingId.ToString()));
            
            if (existingRefund != null)
            {
                _logger.LogWarning("Refund for meeting {MeetingId} already processed on {RefundedAt}", 
                    meetingId, existingRefund.RefundedAt);
                
                return new TokenRefundResult
                {
                    Success = true,
                    AlreadyProcessed = true,
                    TokensRefunded = existingRefund.TokensRefunded,
                    BalanceAfter = existingRefund.BalanceAfter,
                    Reason = existingRefund.Reason
                };
            }

            // Get user for balance update
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == meeting.UserId);
            if (user == null)
            {
                _logger.LogError("User {UserId} not found for meeting refund", meeting.UserId);
                return new TokenRefundResult { Success = false, ErrorMessage = "User not found" };
            }

            var tokensToRefund = tokenUsage.TokensUsed;
            var balanceBefore = user.TokenBalance;
            var balanceAfter = balanceBefore + tokensToRefund;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update user token balance
                user.TokenBalance = balanceAfter;
                _context.Users.Update(user);

                // Create refund record (without FastJobId since this is meeting-based)
                var refund = new TokenRefund
                {
                    Id = Guid.NewGuid(),
                    UserId = meeting.UserId,
                    TokensRefunded = tokensToRefund,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    Reason = $"Meeting cancellation: {reason} (MeetingId: {meetingId})",
                    IsAutomatic = true,
                    RefundedAt = DateTime.UtcNow,
                    FastJobId = null // No FastJobId for meeting-based refunds
                };

                _context.TokenRefunds.Add(refund);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Meeting-based refund processed successfully for meeting {MeetingId}: {TokensRefunded} tokens, new balance: {BalanceAfter}",
                    meetingId, tokensToRefund, balanceAfter);

                return new TokenRefundResult
                {
                    Success = true,
                    TokensRefunded = tokensToRefund,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    Reason = reason
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to save meeting-based refund for meeting {MeetingId}", meetingId);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing meeting-based token refund for meeting {MeetingId}", meetingId);
            return new TokenRefundResult 
            { 
                Success = false, 
                ErrorMessage = ex.Message 
            };
        }
    }

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
    public async Task<TokenReservationResult> ReserveTokensAsync(
        string userId, 
        string meetingId, 
        int tokensRequired, 
        string? description = null,
        int expirationMinutes = 30)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var meetingGuid = Guid.Parse(meetingId);

            _logger.LogInformation("Creating token reservation for user {UserId}, meeting {MeetingId}: {TokensRequired} tokens", 
                userId, meetingId, tokensRequired);

            // Validate user exists and has sufficient tokens
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
            {
                return new TokenReservationResult 
                { 
                    Success = false, 
                    ErrorMessage = $"User {userId} not found" 
                };
            }

            if (user.TokenBalance < tokensRequired)
            {
                return new TokenReservationResult
                {
                    Success = false,
                    ErrorMessage = $"Insufficient tokens. Required: {tokensRequired}, Available: {user.TokenBalance}",
                    RequiredTokens = tokensRequired,
                    AvailableTokens = user.TokenBalance
                };
            }

            // Check for existing active reservation for this meeting
            var existingReservation = await _context.TokenReservations
                .FirstOrDefaultAsync(tr => tr.MeetingId == meetingGuid && 
                                         tr.Status == TokenReservationStatus.Reserved);

            if (existingReservation != null)
            {
                if (existingReservation.IsValid)
                {
                    _logger.LogWarning("Active reservation already exists for meeting {MeetingId}: {ReservationId}", 
                        meetingId, existingReservation.Id);
                    
                    return new TokenReservationResult
                    {
                        Success = true,
                        ReservationId = existingReservation.Id,
                        TokensReserved = existingReservation.TokensReserved,
                        ExpiresAt = existingReservation.ExpiresAt,
                        AlreadyExists = true
                    };
                }
                else
                {
                    // Mark expired reservation as expired
                    existingReservation.Status = TokenReservationStatus.Expired;
                }
            }

            // Create new reservation
            var reservation = new TokenReservation
            {
                Id = Guid.NewGuid(),
                UserId = userGuid,
                MeetingId = meetingGuid,
                TokensReserved = tokensRequired,
                ReservedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes),
                Status = TokenReservationStatus.Reserved,
                Description = description ?? $"Fast transcription processing for meeting {meetingId}"
            };

            _context.TokenReservations.Add(reservation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Token reservation created successfully: {ReservationId} for user {UserId}, {TokensReserved} tokens, expires {ExpiresAt}",
                reservation.Id, userId, tokensRequired, reservation.ExpiresAt);

            return new TokenReservationResult
            {
                Success = true,
                ReservationId = reservation.Id,
                TokensReserved = tokensRequired,
                ExpiresAt = reservation.ExpiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating token reservation for user {UserId}, meeting {MeetingId}", userId, meetingId);
            return new TokenReservationResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Consume a token reservation by deducting tokens from user balance.
    /// This should only be called on successful completion of the operation.
    /// </summary>
    /// <param name="reservationId">ID of the reservation to consume</param>
    /// <returns>Consumption result</returns>
    public async Task<TokenReservationResult> ConsumeReservationAsync(Guid reservationId)
    {
        try
        {
            _logger.LogInformation("Consuming token reservation {ReservationId}", reservationId);

            var reservation = await _context.TokenReservations
                .FirstOrDefaultAsync(tr => tr.Id == reservationId);

            if (reservation == null)
            {
                return new TokenReservationResult
                {
                    Success = false,
                    ErrorMessage = $"Reservation {reservationId} not found"
                };
            }

            if (reservation.Status != TokenReservationStatus.Reserved)
            {
                return new TokenReservationResult
                {
                    Success = false,
                    ErrorMessage = $"Reservation {reservationId} is not in Reserved status (current: {reservation.Status})"
                };
            }

            if (!reservation.IsValid)
            {
                // Mark as expired
                reservation.Status = TokenReservationStatus.Expired;
                await _context.SaveChangesAsync();

                return new TokenReservationResult
                {
                    Success = false,
                    ErrorMessage = $"Reservation {reservationId} has expired"
                };
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get user and deduct tokens
                var user = await _context.Users.FindAsync(reservation.UserId);
                if (user == null)
                {
                    return new TokenReservationResult
                    {
                        Success = false,
                        ErrorMessage = $"User {reservation.UserId} not found for reservation consumption"
                    };
                }

                // Double-check user still has sufficient tokens
                if (user.TokenBalance < reservation.TokensReserved)
                {
                    return new TokenReservationResult
                    {
                        Success = false,
                        ErrorMessage = $"Insufficient tokens for consumption. Required: {reservation.TokensReserved}, Available: {user.TokenBalance}"
                    };
                }

                // Deduct tokens from user balance
                user.TokenBalance -= reservation.TokensReserved;

                // Mark reservation as consumed
                reservation.Status = TokenReservationStatus.Consumed;
                reservation.ConsumedAt = DateTime.UtcNow;

                // Create token usage record for history (maintaining existing audit trail)
                var usage = new TokenUsage
                {
                    UserId = reservation.UserId,
                    MeetingId = reservation.MeetingId,
                    TokensUsed = reservation.TokensReserved,
                    MeetingDurationMinutes = 0, // Will be updated later if needed
                    VolumeDiscountApplied = 0,
                    UsageDate = DateTime.UtcNow,
                    CostInUsd = reservation.TokensReserved * 0.05m // Base cost per token
                };

                _context.TokenUsages.Add(usage);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Token reservation consumed successfully: {ReservationId}, {TokensConsumed} tokens deducted from user {UserId}",
                    reservationId, reservation.TokensReserved, reservation.UserId);

                return new TokenReservationResult
                {
                    Success = true,
                    ReservationId = reservationId,
                    TokensReserved = reservation.TokensReserved,
                    ConsumedAt = reservation.ConsumedAt,
                    NewBalance = user.TokenBalance
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to consume token reservation {ReservationId}", reservationId);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consuming token reservation {ReservationId}", reservationId);
            return new TokenReservationResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Release a token reservation without consuming tokens.
    /// This should be called when an operation is cancelled or fails.
    /// </summary>
    /// <param name="reservationId">ID of the reservation to release</param>
    /// <param name="reason">Reason for releasing the reservation</param>
    /// <returns>Release result</returns>
    public async Task<TokenReservationResult> ReleaseReservationAsync(Guid reservationId, string? reason = null)
    {
        try
        {
            _logger.LogInformation("Releasing token reservation {ReservationId}. Reason: {Reason}", 
                reservationId, reason ?? "Not specified");

            var reservation = await _context.TokenReservations
                .FirstOrDefaultAsync(tr => tr.Id == reservationId);

            if (reservation == null)
            {
                return new TokenReservationResult
                {
                    Success = false,
                    ErrorMessage = $"Reservation {reservationId} not found"
                };
            }

            if (reservation.Status != TokenReservationStatus.Reserved)
            {
                _logger.LogWarning("Attempting to release reservation {ReservationId} that is not in Reserved status (current: {Status})", 
                    reservationId, reservation.Status);
                
                return new TokenReservationResult
                {
                    Success = true, // Not an error - already released/consumed
                    ReservationId = reservationId,
                    TokensReserved = reservation.TokensReserved,
                    AlreadyProcessed = true
                };
            }

            // Mark reservation as cancelled
            reservation.Status = TokenReservationStatus.Cancelled;
            reservation.CancelledAt = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(reason))
            {
                reservation.Description = $"{reservation.Description} | Cancelled: {reason}";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Token reservation released successfully: {ReservationId}, {TokensReleased} tokens returned to available pool for user {UserId}",
                reservationId, reservation.TokensReserved, reservation.UserId);

            return new TokenReservationResult
            {
                Success = true,
                ReservationId = reservationId,
                TokensReserved = reservation.TokensReserved,
                CancelledAt = reservation.CancelledAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error releasing token reservation {ReservationId}", reservationId);
            return new TokenReservationResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Get reservation details by ID
    /// </summary>
    /// <param name="reservationId">Reservation ID to lookup</param>
    /// <returns>Reservation details or null if not found</returns>
    public async Task<TokenReservation?> GetReservationAsync(Guid reservationId)
    {
        try
        {
            return await _context.TokenReservations
                .FirstOrDefaultAsync(tr => tr.Id == reservationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving token reservation {ReservationId}", reservationId);
            return null;
        }
    }

    /// <summary>
    /// Cleanup expired reservations (for background service)
    /// </summary>
    /// <returns>Number of reservations cleaned up</returns>
    public async Task<int> CleanupExpiredReservationsAsync()
    {
        try
        {
            var cutoffTime = DateTime.UtcNow;
            var expiredReservations = await _context.TokenReservations
                .Where(tr => tr.Status == TokenReservationStatus.Reserved && tr.ExpiresAt <= cutoffTime)
                .ToListAsync();

            if (expiredReservations.Any())
            {
                foreach (var reservation in expiredReservations)
                {
                    reservation.Status = TokenReservationStatus.Expired;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Cleaned up {Count} expired token reservations", expiredReservations.Count);
            }

            return expiredReservations.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up expired token reservations");
            return 0;
        }
    }

    #endregion
}
