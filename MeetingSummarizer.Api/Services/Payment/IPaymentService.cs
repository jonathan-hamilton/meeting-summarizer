using MeetingSummarizer.Api.Models.Payment;

namespace MeetingSummarizer.Api.Services.Payment;

/// <summary>
/// Generic payment service interface for processing payments through various providers
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Create a payment intent for token purchase
    /// </summary>
    /// <param name="request">Payment request details</param>
    /// <returns>Payment intent result with client secret</returns>
    Task<PaymentIntentResult> CreatePaymentIntentAsync(CreatePaymentIntentRequest request);

    /// <summary>
    /// Confirm a payment intent
    /// </summary>
    /// <param name="paymentIntentId">Payment intent identifier</param>
    /// <returns>Payment confirmation result</returns>
    Task<PaymentConfirmationResult> ConfirmPaymentIntentAsync(string paymentIntentId);

    /// <summary>
    /// Process webhook event from payment provider
    /// </summary>
    /// <param name="json">Webhook JSON payload</param>
    /// <param name="signature">Payment provider signature header</param>
    /// <returns>Processing result</returns>
    Task<WebhookProcessingResult> ProcessWebhookAsync(string json, string signature);

    /// <summary>
    /// Create or retrieve customer for user in payment provider
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="email">User email address</param>
    /// <returns>Payment provider customer ID</returns>
    Task<string> CreateOrGetCustomerAsync(string userId, string email);

    /// <summary>
    /// Process refund for a payment
    /// </summary>
    /// <param name="paymentIntentId">Payment intent to refund</param>
    /// <param name="amount">Amount to refund (null for full refund)</param>
    /// <param name="reason">Refund reason</param>
    /// <returns>Refund processing result</returns>
    Task<RefundResult> ProcessRefundAsync(string paymentIntentId, decimal? amount = null, string? reason = null);

    /// <summary>
    /// Get payment intent details
    /// </summary>
    /// <param name="paymentIntentId">Payment intent identifier</param>
    /// <returns>Payment details</returns>
    Task<PaymentDetails?> GetPaymentDetailsAsync(string paymentIntentId);

    /// <summary>
    /// Validate webhook signature to ensure authenticity
    /// </summary>
    /// <param name="payload">Raw webhook payload</param>
    /// <param name="signature">Signature header from payment provider</param>
    /// <param name="secret">Webhook secret for validation</param>
    /// <returns>True if signature is valid</returns>
    bool ValidateWebhookSignature(string payload, string signature, string secret);
}
