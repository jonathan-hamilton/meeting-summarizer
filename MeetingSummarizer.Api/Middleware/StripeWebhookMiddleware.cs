using MeetingSummarizer.Api.Services.Payment;
using MeetingSummarizer.Api.Services.TokenManagement;
using System.Text;

namespace MeetingSummarizer.Api.Middleware;

/// <summary>
/// Middleware for processing Stripe webhook events
/// </summary>
public class StripeWebhookMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<StripeWebhookMiddleware> _logger;
    private readonly IServiceProvider _serviceProvider;

    public StripeWebhookMiddleware(
        RequestDelegate next,
        ILogger<StripeWebhookMiddleware> logger,
        IServiceProvider serviceProvider)
    {
        _next = next;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only process POST requests to the exact webhook endpoint (not health or other sub-endpoints)
        if (context.Request.Path != "/api/webhooks/stripe" || context.Request.Method != HttpMethods.Post)
        {
            await _next(context);
            return;
        }

        try
        {
            _logger.LogInformation("Processing Stripe webhook request from {RemoteIpAddress}", 
                context.Connection.RemoteIpAddress);

            // Read the request body
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            var json = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            // Get the Stripe signature header
            var signature = context.Request.Headers["Stripe-Signature"].FirstOrDefault();
            if (string.IsNullOrEmpty(signature))
            {
                _logger.LogWarning("Missing Stripe-Signature header");
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Missing Stripe-Signature header");
                return;
            }

            // Create a scope for processing the webhook
            using var scope = _serviceProvider.CreateScope();
            var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();
            var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

            // Process the webhook
            var result = await paymentService.ProcessWebhookAsync(json, signature);

            if (!result.Success)
            {
                _logger.LogError("Webhook processing failed: {ErrorMessage}", result.ErrorMessage);
                
                if (result.ShouldRetry)
                {
                    context.Response.StatusCode = 500; // Internal Server Error - Stripe will retry
                }
                else
                {
                    context.Response.StatusCode = 400; // Bad Request - Don't retry
                }
                
                await context.Response.WriteAsync(result.ErrorMessage ?? "Webhook processing failed");
                return;
            }

            // Handle successful payment events by updating token balance
            if (result.EventType == "payment_intent.succeeded" && 
                result.TokensToAdd.HasValue && 
                !string.IsNullOrEmpty(result.UserId))
            {
                try
                {
                    await tokenService.RecordTokenPurchaseAsync(
                        result.UserId, 
                        result.TokensToAdd.Value, 
                        result.AmountPaid ?? 0,
                        result.PaymentIntentId ?? "unknown",
                        0); // No discount applied in webhook processing

                    _logger.LogInformation("Token balance updated for user {UserId}: +{TokensAdded} tokens, amount paid {AmountPaid}", 
                        result.UserId, result.TokensToAdd.Value, result.AmountPaid);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update token balance for user {UserId} after successful payment", 
                        result.UserId);
                    
                    // Return 500 so Stripe will retry the webhook
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsync("Failed to update token balance");
                    return;
                }
            }

            // Handle payment failures
            if (result.EventType == "payment_intent.payment_failed" && !string.IsNullOrEmpty(result.UserId))
            {
                _logger.LogWarning("Payment failed for user {UserId}, payment intent {PaymentIntentId}", 
                    result.UserId, result.PaymentIntentId);
                
                // Could implement notification logic here
            }

            _logger.LogInformation("Webhook processed successfully: {EventType}", result.EventType);
            
            // Return success response
            context.Response.StatusCode = 200;
            await context.Response.WriteAsync("OK");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing Stripe webhook");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Internal server error");
        }
    }
}
