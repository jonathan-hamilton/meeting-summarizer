using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.TokenManagement;
using System.Security.Claims;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// API controller for token management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all token operations
public class TokenController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly ITokenCalculationService _calculationService;
    private readonly ILogger<TokenController> _logger;

    public TokenController(
        ITokenService tokenService,
        ITokenCalculationService calculationService,
        ILogger<TokenController> logger)
    {
        _tokenService = tokenService;
        _calculationService = calculationService;
        _logger = logger;
    }

    /// <summary>
    /// Get current token balance for the authenticated user
    /// </summary>
    /// <returns>Token balance information</returns>
    [HttpGet("balance")]
    [ProducesResponseType(typeof(TokenBalanceResponse), 200)]
    public async Task<ActionResult<TokenBalanceResponse>> GetTokenBalance()
    {
        try
        {
            var userId = GetCurrentUserId();
            var balance = await _tokenService.GetTokenBalanceAsync(userId);
            
            var response = new TokenBalanceResponse
            {
                Balance = balance,
                DollarValue = balance * 0.05m,
                EstimatedMinutesAvailable = (int)(balance / 100 * 15), // Estimate based on minimum cost
                LastUpdated = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving token balance");
            return StatusCode(500, "Failed to retrieve token balance");
        }
    }

    /// <summary>
    /// Validate token availability for a meeting duration
    /// </summary>
    /// <param name="request">Token validation request</param>
    /// <returns>Validation result with cost calculation</returns>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ValidateTokensResponse), 200)]
    public async Task<ActionResult<ValidateTokensResponse>> ValidateTokens([FromBody] ValidateTokensRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var calculation = _calculationService.CalculateTokensRequired(request.DurationMinutes);
            var currentBalance = await _tokenService.GetTokenBalanceAsync(userId);
            var hasEnough = currentBalance >= calculation.FinalTokens;

            var response = new ValidateTokensResponse
            {
                HasSufficientTokens = hasEnough,
                CurrentBalance = currentBalance,
                RequiredTokens = calculation.FinalTokens,
                Shortfall = hasEnough ? 0 : calculation.FinalTokens - (int)currentBalance,
                CalculationDetails = calculation,
                SuggestedPurchaseAmount = hasEnough ? 0 : Math.Max(500, (int)(((calculation.FinalTokens - (int)currentBalance) / 100 + 1) * 100))
            };

            _logger.LogInformation("Token validation for user {UserId}: Required {Required}, Available {Available}, Sufficient: {Sufficient}", 
                userId, calculation.FinalTokens, currentBalance, hasEnough);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating tokens for duration {Duration}", request.DurationMinutes);
            return StatusCode(500, "Failed to validate token requirements");
        }
    }

    /// <summary>
    /// Get token transaction history for the authenticated user
    /// </summary>
    /// <param name="limit">Maximum number of transactions to return</param>
    /// <returns>Token purchase and usage history</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(TokenHistoryResponse), 200)]
    public async Task<ActionResult<TokenHistoryResponse>> GetTokenHistory([FromQuery] int limit = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var purchases = await _tokenService.GetPurchaseHistoryAsync(userId, limit);
            var usages = await _tokenService.GetUsageHistoryAsync(userId, limit);
            var statistics = await _tokenService.GetTokenStatisticsAsync(userId);

            var response = new TokenHistoryResponse
            {
                Purchases = purchases.Select(p => new TokenPurchaseDto
                {
                    Id = p.Id.ToString(),
                    TokenAmount = p.TokensPurchased,
                    AmountPaid = p.AmountPaid,
                    DiscountApplied = 0, // TODO: Add discount tracking to entity
                    PurchaseDate = p.PurchaseDate,
                    Status = p.PaymentStatus,
                    PaymentMethod = "Credit Card" // TODO: Get from Stripe metadata
                }),
                Usages = usages.Select(u => new TokenUsageDto
                {
                    Id = u.Id.ToString(),
                    MeetingId = u.MeetingId.ToString(),
                    TokensUsed = u.TokensUsed,
                    DurationMinutes = u.MeetingDurationMinutes,
                    DiscountApplied = u.VolumeDiscountApplied,
                    UsageDate = u.UsageDate,
                    Cost = u.CostInUsd,
                    MeetingTitle = $"Meeting {u.MeetingId}" // TODO: Get actual meeting title
                }),
                Statistics = statistics
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving token history");
            return StatusCode(500, "Failed to retrieve token history");
        }
    }

    /// <summary>
    /// Get detailed token statistics for the authenticated user
    /// </summary>
    /// <returns>Comprehensive token usage statistics</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(TokenStatistics), 200)]
    public async Task<ActionResult<TokenStatistics>> GetTokenStatistics()
    {
        try
        {
            var userId = GetCurrentUserId();
            var statistics = await _tokenService.GetTokenStatisticsAsync(userId);

            _logger.LogDebug("Retrieved token statistics for user {UserId}", userId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving token statistics");
            return StatusCode(500, "Failed to retrieve token statistics");
        }
    }

    /// <summary>
    /// Initiate a token purchase (creates Stripe Payment Intent)
    /// This endpoint will be implemented in Increment 4 with Stripe integration
    /// </summary>
    /// <param name="request">Purchase request details</param>
    /// <returns>Payment Intent information for frontend</returns>
    [HttpPost("purchase/initiate")]
    [ProducesResponseType(typeof(PurchaseTokensResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<PurchaseTokensResponse>> InitiatePurchase([FromBody] PurchaseTokensRequest request)
    {
        // TODO: Implement in Increment 4 with Stripe integration
        _logger.LogInformation("Token purchase initiation requested for {TokenAmount} tokens", request.TokenAmount);
        
        return BadRequest(new { 
            message = "Token purchases not yet available", 
            detail = "Payment integration will be implemented in the next increment" 
        });
    }

    /// <summary>
    /// Confirm a completed payment and add tokens to user balance
    /// This endpoint will be implemented in Increment 4 with Stripe integration
    /// </summary>
    /// <param name="request">Payment confirmation details</param>
    /// <returns>Confirmation result with new balance</returns>
    [HttpPost("purchase/confirm")]
    [ProducesResponseType(typeof(ConfirmPaymentResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ConfirmPaymentResponse>> ConfirmPurchase([FromBody] ConfirmPaymentRequest request)
    {
        // TODO: Implement in Increment 4 with Stripe integration
        _logger.LogInformation("Token purchase confirmation requested for Payment Intent {PaymentIntentId}", request.PaymentIntentId);
        
        return BadRequest(new { 
            message = "Payment confirmation not yet available", 
            detail = "Payment integration will be implemented in the next increment" 
        });
    }

    /// <summary>
    /// Record token usage for a processed meeting (internal endpoint)
    /// </summary>
    /// <param name="meetingId">Meeting identifier</param>
    /// <param name="tokensUsed">Number of tokens to deduct</param>
    /// <param name="durationMinutes">Meeting duration</param>
    /// <returns>Usage record confirmation</returns>
    [HttpPost("usage/record")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> RecordUsage([FromBody] RecordUsageRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validate token availability
            var hasEnough = await _tokenService.ValidateTokenAvailabilityAsync(userId, request.TokensUsed);
            if (!hasEnough)
            {
                var balance = await _tokenService.GetTokenBalanceAsync(userId);
                return BadRequest(new { 
                    message = "Insufficient tokens", 
                    required = request.TokensUsed, 
                    available = balance 
                });
            }

            // Calculate discount based on duration
            var calculation = _calculationService.CalculateTokensRequired(request.DurationMinutes);
            var discountApplied = 1.0m - (decimal)calculation.VolumeDiscountMultiplier;

            // Record the usage
            var usage = await _tokenService.RecordTokenUsageAsync(
                userId, 
                request.MeetingId, 
                request.TokensUsed, 
                request.DurationMinutes, 
                discountApplied);

            var newBalance = await _tokenService.GetTokenBalanceAsync(userId);

            _logger.LogInformation("Recorded token usage for user {UserId}: {TokensUsed} tokens for meeting {MeetingId}", 
                userId, request.TokensUsed, request.MeetingId);

            return Ok(new { 
                success = true, 
                usageId = usage.Id, 
                newBalance = newBalance,
                tokensDeducted = request.TokensUsed 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording token usage for meeting {MeetingId}", request.MeetingId);
            return StatusCode(500, "Failed to record token usage");
        }
    }

    /// <summary>
    /// Get the current user's ID from the JWT token
    /// </summary>
    /// <returns>User ID</returns>
    private string GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null)
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userIdClaim.Value;
    }
}

/// <summary>
/// Request model for recording token usage
/// </summary>
public class RecordUsageRequest
{
    /// <summary>
    /// Meeting identifier
    /// </summary>
    public string MeetingId { get; set; } = string.Empty;

    /// <summary>
    /// Number of tokens used
    /// </summary>
    public int TokensUsed { get; set; }

    /// <summary>
    /// Meeting duration in minutes
    /// </summary>
    public int DurationMinutes { get; set; }
}
