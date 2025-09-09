using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;

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
}
