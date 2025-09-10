using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Services.Payment;
using MeetingSummarizer.Api.Services.TokenManagement;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for handling payment provider webhooks
/// </summary>
[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly ILogger<WebhookController> _logger;
    private readonly IPaymentService _paymentService;
    private readonly ITokenService _tokenService;

    public WebhookController(
        ILogger<WebhookController> logger,
        IPaymentService paymentService,
        ITokenService tokenService)
    {
        _logger = logger;
        _paymentService = paymentService;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Handle Stripe webhook events
    /// </summary>
    /// <returns>OK if webhook processed successfully</returns>
    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripeWebhook()
    {
        try
        {
            _logger.LogInformation("Stripe webhook endpoint called");

            // Read the request body
            using var reader = new StreamReader(Request.Body);
            var json = await reader.ReadToEndAsync();

            // Get the Stripe signature header
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();
            
            if (string.IsNullOrEmpty(signature))
            {
                _logger.LogWarning("Missing Stripe-Signature header in webhook request");
                return BadRequest("Missing Stripe-Signature header");
            }

            if (string.IsNullOrEmpty(json))
            {
                _logger.LogWarning("Empty webhook payload received");
                return BadRequest("Empty webhook payload");
            }

            _logger.LogDebug("Processing webhook with signature: {Signature}", signature);

            // Process the webhook through the payment service
            var result = await _paymentService.ProcessWebhookAsync(json, signature);

            if (!result.Success)
            {
                _logger.LogError("Webhook processing failed: {ErrorMessage}", result.ErrorMessage);
                
                // Return appropriate status code based on whether retry is recommended
                return result.ShouldRetry 
                    ? StatusCode(500, result.ErrorMessage) 
                    : BadRequest(result.ErrorMessage);
            }

            // Handle successful payment events
            if (result.EventType == "payment_intent.succeeded" && 
                result.TokensToAdd.HasValue && 
                !string.IsNullOrEmpty(result.UserId))
            {
                try
                {
                    await _tokenService.RecordTokenPurchaseAsync(
                        result.UserId, 
                        result.TokensToAdd.Value, 
                        result.AmountPaid ?? 0,
                        result.PaymentIntentId ?? "unknown",
                        0); // No discount applied in webhook processing

                    _logger.LogInformation("Successfully updated token balance for user {UserId}: +{TokensAdded} tokens, amount paid {AmountPaid}, from payment {PaymentIntentId}", 
                        result.UserId, result.TokensToAdd.Value, result.AmountPaid, result.PaymentIntentId);
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid user ID format in webhook metadata: {UserId}", result.UserId);
                    return StatusCode(500, "Invalid user ID format");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update token balance for user {UserId} after successful payment {PaymentIntentId}", 
                        result.UserId, result.PaymentIntentId);
                    
                    // Return 500 so Stripe will retry
                    return StatusCode(500, "Failed to update token balance");
                }
            }

            // Handle payment failure events
            if (result.EventType == "payment_intent.payment_failed" && !string.IsNullOrEmpty(result.UserId))
            {
                _logger.LogWarning("Payment failed for user {UserId}, payment intent {PaymentIntentId}", 
                    result.UserId, result.PaymentIntentId);
                
                // Could implement email notification or other failure handling here
                // For now, just log the failure
            }

            // Handle dispute events
            if (result.EventType == "charge.dispute.created")
            {
                _logger.LogWarning("Dispute created for payment, requires manual review");
                
                // Could implement dispute notification system here
                // For now, just log for manual review
            }

            _logger.LogInformation("Webhook processed successfully: EventType={EventType}, PaymentIntentId={PaymentIntentId}", 
                result.EventType, result.PaymentIntentId);

            return Ok(new { 
                message = "Webhook processed successfully", 
                eventType = result.EventType 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing Stripe webhook");
            return StatusCode(500, "Internal server error processing webhook");
        }
    }

    /// <summary>
    /// Health check endpoint for webhook configuration
    /// </summary>
    /// <returns>OK if webhook endpoint is accessible</returns>
    [HttpGet("stripe/health")]
    public IActionResult WebhookHealth()
    {
        return Ok(new { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            endpoint = "stripe webhook handler"
        });
    }
}
