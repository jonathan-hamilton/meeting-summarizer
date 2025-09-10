using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models.Payment;
using MeetingSummarizer.Api.Services.Payment;
using System.Security.Claims;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for payment operations
/// </summary>
[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly ILogger<PaymentController> _logger;
    private readonly IPaymentService _paymentService;

    public PaymentController(
        ILogger<PaymentController> logger,
        IPaymentService paymentService)
    {
        _logger = logger;
        _paymentService = paymentService;
    }

    /// <summary>
    /// Create a payment intent for token purchase
    /// </summary>
    /// <param name="request">Payment intent creation request</param>
    /// <returns>Payment intent with client secret</returns>
    [HttpPost("create-intent")]
    public async Task<ActionResult<PaymentIntentResult>> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogWarning("User ID not found in JWT claims");
                return Unauthorized("User not authenticated");
            }

            // Override the user ID from claims for security
            request.UserId = userIdClaim;

            _logger.LogInformation("Creating payment intent for user {UserId}, amount {Amount}, tokens {TokenCount}", 
                request.UserId, request.Amount, request.TokenCount);

            // Validate request
            if (request.Amount <= 0)
            {
                return BadRequest("Amount must be greater than zero");
            }

            if (request.TokenCount <= 0)
            {
                return BadRequest("Token count must be greater than zero");
            }

            var result = await _paymentService.CreatePaymentIntentAsync(request);

            if (!result.Success)
            {
                _logger.LogError("Payment intent creation failed for user {UserId}: {ErrorMessage}", 
                    request.UserId, result.ErrorMessage);
                
                return BadRequest(new { 
                    error = result.ErrorMessage, 
                    code = result.ErrorCode 
                });
            }

            _logger.LogInformation("Payment intent created successfully for user {UserId}: {PaymentIntentId}", 
                request.UserId, result.PaymentIntentId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating payment intent for user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while creating the payment intent");
        }
    }

    /// <summary>
    /// Confirm a payment intent
    /// </summary>
    /// <param name="paymentIntentId">Payment intent ID to confirm</param>
    /// <returns>Payment confirmation result</returns>
    [HttpPost("confirm/{paymentIntentId}")]
    public async Task<ActionResult<PaymentConfirmationResult>> ConfirmPaymentIntent(string paymentIntentId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized("User not authenticated");
            }

            _logger.LogInformation("Confirming payment intent {PaymentIntentId} for user {UserId}", 
                paymentIntentId, userIdClaim);

            if (string.IsNullOrEmpty(paymentIntentId))
            {
                return BadRequest("Payment intent ID is required");
            }

            var result = await _paymentService.ConfirmPaymentIntentAsync(paymentIntentId);

            if (!result.Success)
            {
                _logger.LogError("Payment confirmation failed for payment intent {PaymentIntentId}: {ErrorMessage}", 
                    paymentIntentId, result.ErrorMessage);
                
                return BadRequest(new { 
                    error = result.ErrorMessage, 
                    code = result.ErrorCode 
                });
            }

            _logger.LogInformation("Payment confirmed successfully: {PaymentIntentId}, Status: {Status}", 
                result.PaymentIntentId, result.Status);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error confirming payment intent {PaymentIntentId}", paymentIntentId);
            return StatusCode(500, "An error occurred while confirming the payment");
        }
    }

    /// <summary>
    /// Get payment details
    /// </summary>
    /// <param name="paymentIntentId">Payment intent ID</param>
    /// <returns>Payment details</returns>
    [HttpGet("{paymentIntentId}")]
    public async Task<ActionResult<PaymentDetails>> GetPaymentDetails(string paymentIntentId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized("User not authenticated");
            }

            _logger.LogInformation("Retrieving payment details for {PaymentIntentId}, user {UserId}", 
                paymentIntentId, userIdClaim);

            if (string.IsNullOrEmpty(paymentIntentId))
            {
                return BadRequest("Payment intent ID is required");
            }

            var paymentDetails = await _paymentService.GetPaymentDetailsAsync(paymentIntentId);

            if (paymentDetails == null)
            {
                _logger.LogWarning("Payment details not found for payment intent {PaymentIntentId}", paymentIntentId);
                return NotFound("Payment not found");
            }

            // Security check: verify the payment belongs to the requesting user
            if (paymentDetails.Metadata.TryGetValue("userId", out var paymentUserId) && 
                paymentUserId != userIdClaim)
            {
                _logger.LogWarning("User {UserId} attempted to access payment {PaymentIntentId} belonging to user {PaymentUserId}", 
                    userIdClaim, paymentIntentId, paymentUserId);
                return Forbid("You don't have permission to access this payment");
            }

            return Ok(paymentDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving payment details for {PaymentIntentId}", paymentIntentId);
            return StatusCode(500, "An error occurred while retrieving payment details");
        }
    }

    /// <summary>
    /// Process a refund for a payment
    /// </summary>
    /// <param name="paymentIntentId">Payment intent ID to refund</param>
    /// <param name="request">Refund request details</param>
    /// <returns>Refund processing result</returns>
    [HttpPost("{paymentIntentId}/refund")]
    [Authorize(Roles = "Admin")] // Only admins can process refunds
    public async Task<ActionResult<RefundResult>> ProcessRefund(
        string paymentIntentId, 
        [FromBody] RefundRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Processing refund for payment intent {PaymentIntentId} by admin {AdminUserId}", 
                paymentIntentId, userIdClaim);

            if (string.IsNullOrEmpty(paymentIntentId))
            {
                return BadRequest("Payment intent ID is required");
            }

            var result = await _paymentService.ProcessRefundAsync(
                paymentIntentId, 
                request.Amount, 
                request.Reason);

            if (!result.Success)
            {
                _logger.LogError("Refund processing failed for payment intent {PaymentIntentId}: {ErrorMessage}", 
                    paymentIntentId, result.ErrorMessage);
                
                return BadRequest(new { 
                    error = result.ErrorMessage, 
                    code = result.ErrorCode 
                });
            }

            _logger.LogInformation("Refund processed successfully: {RefundId}, Amount: {Amount}", 
                result.RefundId, result.AmountRefunded);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing refund for payment intent {PaymentIntentId}", paymentIntentId);
            return StatusCode(500, "An error occurred while processing the refund");
        }
    }
}

/// <summary>
/// Request model for processing refunds
/// </summary>
public class RefundRequest
{
    /// <summary>
    /// Amount to refund (null for full refund)
    /// </summary>
    public decimal? Amount { get; set; }

    /// <summary>
    /// Reason for the refund
    /// </summary>
    public string? Reason { get; set; }
}
