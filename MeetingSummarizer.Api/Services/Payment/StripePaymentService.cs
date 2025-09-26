using MeetingSummarizer.Api.Models.Payment;
using MeetingSummarizer.Api.Configuration;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Stripe;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services.Payment;

/// <summary>
/// Stripe implementation of the payment service interface
/// </summary>
public class StripePaymentService : IPaymentService
{
    private readonly ILogger<StripePaymentService> _logger;
    private readonly StripeClient _stripeClient;
    private readonly StripeOptions _stripeOptions;
    private readonly MeetingSummarizerDbContext _context;

    public StripePaymentService(
        ILogger<StripePaymentService> logger,
        IOptions<StripeOptions> stripeOptions,
        MeetingSummarizerDbContext context)
    {
        _logger = logger;
        _stripeOptions = stripeOptions.Value;
        _context = context;
        
        if (!_stripeOptions.IsValid())
        {
            throw new InvalidOperationException("Stripe configuration is invalid. Please check SecretKey, PublishableKey, and WebhookSecret.");
        }

        _stripeClient = new StripeClient(_stripeOptions.SecretKey);
        
        _logger.LogInformation("StripePaymentService initialized in {Mode}", _stripeOptions.GetEnvironmentDescription());
    }

    /// <inheritdoc />
    public async Task<PaymentIntentResult> CreatePaymentIntentAsync(CreatePaymentIntentRequest request)
    {
        try
        {
            _logger.LogInformation("Creating payment intent for user {UserId}, amount {Amount}, tokens {TokenCount}", 
                request.UserId, request.Amount, request.TokenCount);

            // Create or get customer
            var customerId = await CreateOrGetCustomerAsync(request.UserId, request.Email);

            // Convert amount to cents
            var amountInCents = (long)(request.Amount * 100);

            var options = new PaymentIntentCreateOptions
            {
                Amount = amountInCents,
                Currency = request.Currency.ToLowerInvariant(),
                Customer = customerId,
                Description = request.Description,
                Metadata = new Dictionary<string, string>(request.Metadata)
                {
                    ["userId"] = request.UserId,
                    ["tokenCount"] = request.TokenCount.ToString(),
                    ["expectedAmount"] = request.Amount.ToString("F2")
                },
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true
                },
                // Capture method is automatic by default
                CaptureMethod = "automatic"
            };

            var service = new PaymentIntentService(_stripeClient);
            var paymentIntent = await service.CreateAsync(options);

            _logger.LogInformation("Payment intent created successfully: {PaymentIntentId}, Status: {Status}", 
                paymentIntent.Id, paymentIntent.Status);

            return new PaymentIntentResult
            {
                Success = true,
                PaymentIntentId = paymentIntent.Id,
                ClientSecret = paymentIntent.ClientSecret,
                Status = paymentIntent.Status
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating payment intent for user {UserId}: {ErrorMessage}", 
                request.UserId, ex.Message);

            return new PaymentIntentResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating payment intent for user {UserId}", request.UserId);

            return new PaymentIntentResult
            {
                Success = false,
                ErrorMessage = "An unexpected error occurred while creating the payment intent",
                ErrorCode = "internal_error"
            };
        }
    }

    /// <inheritdoc />
    public async Task<PaymentConfirmationResult> ConfirmPaymentIntentAsync(string paymentIntentId)
    {
        try
        {
            _logger.LogInformation("Confirming payment intent {PaymentIntentId}", paymentIntentId);

            var service = new PaymentIntentService(_stripeClient);
            var paymentIntent = await service.GetAsync(paymentIntentId);

            _logger.LogInformation("Payment intent {PaymentIntentId} status: {Status}", 
                paymentIntentId, paymentIntent.Status);

            return new PaymentConfirmationResult
            {
                Success = paymentIntent.Status == "succeeded",
                PaymentIntentId = paymentIntent.Id,
                Status = paymentIntent.Status,
                AmountCharged = paymentIntent.Status == "succeeded" ? paymentIntent.Amount / 100m : null,
                Currency = paymentIntent.Currency?.ToUpperInvariant()
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error confirming payment intent {PaymentIntentId}: {ErrorMessage}", 
                paymentIntentId, ex.Message);

            return new PaymentConfirmationResult
            {
                Success = false,
                PaymentIntentId = paymentIntentId,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error confirming payment intent {PaymentIntentId}", paymentIntentId);

            return new PaymentConfirmationResult
            {
                Success = false,
                PaymentIntentId = paymentIntentId,
                ErrorMessage = "An unexpected error occurred while confirming the payment",
                ErrorCode = "internal_error"
            };
        }
    }

    /// <inheritdoc />
    public async Task<WebhookProcessingResult> ProcessWebhookAsync(string json, string signature)
    {
        try
        {
            _logger.LogInformation("Processing Stripe webhook");

            // Validate webhook signature
            if (!ValidateWebhookSignature(json, signature, _stripeOptions.WebhookSecret))
            {
                _logger.LogWarning("Invalid webhook signature received");
                return new WebhookProcessingResult
                {
                    Success = false,
                    ErrorMessage = "Invalid webhook signature"
                };
            }

            var stripeEvent = EventUtility.ConstructEvent(json, signature, _stripeOptions.WebhookSecret, throwOnApiVersionMismatch: false);
            
            _logger.LogInformation("Processing Stripe event: {EventType}, ID: {EventId}", 
                stripeEvent.Type, stripeEvent.Id);

            // Check if this event has already been processed (prevent replay attacks)
            var existingEvent = await _context.WebhookEvents
                .FirstOrDefaultAsync(we => we.EventId == stripeEvent.Id);
            
            if (existingEvent != null)
            {
                _logger.LogWarning("Webhook event {EventId} already processed at {ProcessedAt} with status {Status}", 
                    stripeEvent.Id, existingEvent.ProcessedAt, existingEvent.Status);
                
                return new WebhookProcessingResult
                {
                    Success = existingEvent.Status == "success",
                    ErrorMessage = existingEvent.Status == "success" ? null : "Event already processed with failure",
                    EventType = stripeEvent.Type
                };
            }

            // Create webhook event record (mark as processing)
            var webhookEvent = new WebhookEvent
            {
                EventId = stripeEvent.Id,
                EventType = stripeEvent.Type,
                Status = "processing",
                RawPayload = json,
                ProcessedAt = DateTime.UtcNow
            };

            // Extract payment intent ID if available
            if (stripeEvent.Data?.Object is PaymentIntent paymentIntent)
            {
                webhookEvent.PaymentIntentId = paymentIntent.Id;
                if (paymentIntent.Metadata?.ContainsKey("userId") == true)
                {
                    if (Guid.TryParse(paymentIntent.Metadata["userId"], out var userId))
                    {
                        webhookEvent.UserId = userId;
                    }
                }
            }

            _context.WebhookEvents.Add(webhookEvent);
            await _context.SaveChangesAsync(); // Save immediately to prevent race conditions

            var result = new WebhookProcessingResult
            {
                Success = true,
                EventType = stripeEvent.Type
            };

            // Handle different event types
            switch (stripeEvent.Type)
            {
                case Events.PaymentIntentSucceeded:
                    result = await HandlePaymentSucceededAsync(stripeEvent);
                    break;

                case Events.PaymentIntentPaymentFailed:
                    result = await HandlePaymentFailedAsync(stripeEvent);
                    break;

                case Events.ChargeDisputeCreated:
                    result = await HandleDisputeCreatedAsync(stripeEvent);
                    break;

                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    result.Success = true; // Not an error, just not handled
                    break;
            }

            // Update webhook event status based on processing result
            webhookEvent.Status = result.Success ? "success" : "failed";
            webhookEvent.ErrorMessage = result.Success ? null : result.ErrorMessage;
            await _context.SaveChangesAsync();

            result.EventType = stripeEvent.Type;
            return result;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error processing webhook: {ErrorMessage}", ex.Message);
            
            // Try to update webhook status if we have the event
            try
            {
                var failedEvent = await _context.WebhookEvents
                    .FirstOrDefaultAsync(we => we.Status == "processing" 
                        && we.ProcessedAt >= DateTime.UtcNow.AddMinutes(-5)); // Last 5 minutes
                if (failedEvent != null)
                {
                    failedEvent.Status = "failed";
                    failedEvent.ErrorMessage = ex.Message;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Failed to update webhook event status after Stripe error");
            }
            
            return new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                ShouldRetry = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing webhook");
            
            // Try to update webhook status if we have the event
            try
            {
                var failedEvent = await _context.WebhookEvents
                    .FirstOrDefaultAsync(we => we.Status == "processing" 
                        && we.ProcessedAt >= DateTime.UtcNow.AddMinutes(-5)); // Last 5 minutes
                if (failedEvent != null)
                {
                    failedEvent.Status = "failed";
                    failedEvent.ErrorMessage = ex.Message;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Failed to update webhook event status after unexpected error");
            }
            
            return new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = "An unexpected error occurred while processing webhook",
                ShouldRetry = true
            };
        }
    }

    /// <inheritdoc />
    public async Task<string> CreateOrGetCustomerAsync(string userId, string email)
    {
        try
        {
            _logger.LogInformation("Creating or retrieving Stripe customer for user {UserId}", userId);

            var service = new CustomerService(_stripeClient);

            // First, try to find existing customer by metadata
            var searchOptions = new CustomerSearchOptions
            {
                Query = $"metadata['userId']:'{userId}'"
            };

            var customers = await service.SearchAsync(searchOptions);
            var existingCustomer = customers.Data.FirstOrDefault();

            if (existingCustomer != null)
            {
                _logger.LogInformation("Found existing Stripe customer {CustomerId} for user {UserId}", 
                    existingCustomer.Id, userId);
                return existingCustomer.Id;
            }

            // Create new customer
            var createOptions = new CustomerCreateOptions
            {
                Email = email,
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = userId
                }
            };

            var customer = await service.CreateAsync(createOptions);
            
            _logger.LogInformation("Created new Stripe customer {CustomerId} for user {UserId}", 
                customer.Id, userId);
            
            return customer.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating/retrieving customer for user {UserId}: {ErrorMessage}", 
                userId, ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating/retrieving customer for user {UserId}", userId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<RefundResult> ProcessRefundAsync(string paymentIntentId, decimal? amount = null, string? reason = null)
    {
        try
        {
            _logger.LogInformation("Processing refund for payment intent {PaymentIntentId}, amount {Amount}", 
                paymentIntentId, amount);

            // Get the payment intent to find the charge
            var paymentIntentService = new PaymentIntentService(_stripeClient);
            var paymentIntent = await paymentIntentService.GetAsync(paymentIntentId);

            if (paymentIntent.LatestChargeId == null)
            {
                return new RefundResult
                {
                    Success = false,
                    ErrorMessage = "No charge found for this payment intent",
                    ErrorCode = "no_charge_found"
                };
            }

            var refundOptions = new RefundCreateOptions
            {
                Charge = paymentIntent.LatestChargeId,
                Reason = reason switch
                {
                    "duplicate" => "duplicate",
                    "fraudulent" => "fraudulent",
                    _ => "requested_by_customer"
                }
            };

            if (amount.HasValue)
            {
                refundOptions.Amount = (long)(amount.Value * 100); // Convert to cents
            }

            var refundService = new RefundService(_stripeClient);
            var refund = await refundService.CreateAsync(refundOptions);

            // Calculate tokens to deduct based on original payment metadata
            var tokensToDeduct = 0;
            if (paymentIntent.Metadata.TryGetValue("tokenCount", out var tokenCountStr) && 
                int.TryParse(tokenCountStr, out var originalTokens))
            {
                if (amount.HasValue && paymentIntent.Amount > 0)
                {
                    // Partial refund - calculate proportional tokens
                    var refundRatio = (amount.Value * 100) / paymentIntent.Amount;
                    tokensToDeduct = (int)Math.Round(originalTokens * (decimal)refundRatio);
                }
                else
                {
                    // Full refund
                    tokensToDeduct = originalTokens;
                }
            }

            _logger.LogInformation("Refund processed successfully: {RefundId}, Amount: {Amount}, Tokens to deduct: {TokensToDeduct}", 
                refund.Id, refund.Amount / 100m, tokensToDeduct);

            return new RefundResult
            {
                Success = true,
                RefundId = refund.Id,
                AmountRefunded = refund.Amount / 100m,
                Currency = refund.Currency?.ToUpperInvariant(),
                Status = refund.Status,
                Reason = refund.Reason,
                TokensToDeduct = tokensToDeduct
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error processing refund for payment intent {PaymentIntentId}: {ErrorMessage}", 
                paymentIntentId, ex.Message);

            return new RefundResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing refund for payment intent {PaymentIntentId}", paymentIntentId);

            return new RefundResult
            {
                Success = false,
                ErrorMessage = "An unexpected error occurred while processing the refund",
                ErrorCode = "internal_error"
            };
        }
    }

    /// <inheritdoc />
    public async Task<PaymentDetails?> GetPaymentDetailsAsync(string paymentIntentId)
    {
        try
        {
            _logger.LogInformation("Retrieving payment details for {PaymentIntentId}", paymentIntentId);

            var service = new PaymentIntentService(_stripeClient);
            var paymentIntent = await service.GetAsync(paymentIntentId);

            return new PaymentDetails
            {
                PaymentIntentId = paymentIntent.Id,
                Status = paymentIntent.Status,
                Amount = paymentIntent.Amount / 100m,
                Currency = paymentIntent.Currency?.ToUpperInvariant() ?? "USD",
                CustomerId = paymentIntent.CustomerId,
                PaymentMethod = paymentIntent.PaymentMethodId,
                CreatedAt = paymentIntent.Created,
                Metadata = paymentIntent.Metadata ?? new Dictionary<string, string>()
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error retrieving payment details for {PaymentIntentId}: {ErrorMessage}", 
                paymentIntentId, ex.Message);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving payment details for {PaymentIntentId}", paymentIntentId);
            return null;
        }
    }

    /// <inheritdoc />
    public bool ValidateWebhookSignature(string payload, string signature, string secret)
    {
        try
        {
            _logger.LogInformation("Validating webhook signature - Payload length: {PayloadLength}, Signature: {Signature}, Secret: {Secret}", 
                payload?.Length ?? 0, signature, secret);
            
            EventUtility.ConstructEvent(payload, signature, secret, throwOnApiVersionMismatch: false);
            _logger.LogInformation("Webhook signature validation passed");
            return true;
        }
        catch (StripeException ex)
        {
            _logger.LogWarning("Webhook signature validation failed: {ErrorMessage}", ex.Message);
            return false;
        }
    }

    #region Private Helper Methods

    private Task<WebhookProcessingResult> HandlePaymentSucceededAsync(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
        {
            return Task.FromResult(new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = "Invalid payment intent data in webhook"
            });
        }

        var userId = paymentIntent.Metadata.GetValueOrDefault("userId");
        var tokenCountStr = paymentIntent.Metadata.GetValueOrDefault("tokenCount");
        var expectedAmountStr = paymentIntent.Metadata.GetValueOrDefault("expectedAmount");

        if (string.IsNullOrEmpty(userId) || !int.TryParse(tokenCountStr, out var tokenCount))
        {
            _logger.LogWarning("Missing or invalid metadata in payment intent {PaymentIntentId}", paymentIntent.Id);
            return Task.FromResult(new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = "Missing required metadata in payment intent"
            });
        }

        var amountPaid = paymentIntent.Amount / 100m; // Convert from cents to dollars

        // Validate payment amount matches expected amount (if provided)
        if (!string.IsNullOrEmpty(expectedAmountStr) && decimal.TryParse(expectedAmountStr, out var expectedAmount))
        {
            if (Math.Abs(amountPaid - expectedAmount) > 0.01m) // Allow 1 cent tolerance for rounding
            {
                _logger.LogWarning("Payment amount mismatch for payment intent {PaymentIntentId}: Expected ${ExpectedAmount}, got ${ActualAmount}", 
                    paymentIntent.Id, expectedAmount, amountPaid);
                return Task.FromResult(new WebhookProcessingResult
                {
                    Success = false,
                    ErrorMessage = $"Payment amount mismatch: expected ${expectedAmount}, got ${amountPaid}"
                });
            }
        }

        // Validate token count makes sense (basic sanity check)
        if (tokenCount <= 0 || tokenCount > 100000) // Max 100K tokens per purchase
        {
            _logger.LogWarning("Invalid token count {TokenCount} in payment intent {PaymentIntentId}", 
                tokenCount, paymentIntent.Id);
            return Task.FromResult(new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = $"Invalid token count: {tokenCount}"
            });
        }

        _logger.LogInformation("Payment succeeded for user {UserId}, tokens {TokenCount}, amount {AmountPaid}, payment intent {PaymentIntentId}", 
            userId, tokenCount, amountPaid, paymentIntent.Id);

        return Task.FromResult(new WebhookProcessingResult
        {
            Success = true,
            EventType = Events.PaymentIntentSucceeded,
            PaymentIntentId = paymentIntent.Id,
            UserId = userId,
            TokensToAdd = tokenCount,
            AmountPaid = amountPaid
        });
    }

    private Task<WebhookProcessingResult> HandlePaymentFailedAsync(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
        {
            return Task.FromResult(new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = "Invalid payment intent data in webhook"
            });
        }

        var userId = paymentIntent.Metadata.GetValueOrDefault("userId");
        
        _logger.LogWarning("Payment failed for user {UserId}, payment intent {PaymentIntentId}", 
            userId, paymentIntent.Id);

        return Task.FromResult(new WebhookProcessingResult
        {
            Success = true,
            EventType = Events.PaymentIntentPaymentFailed,
            PaymentIntentId = paymentIntent.Id,
            UserId = userId
        });
    }

    private Task<WebhookProcessingResult> HandleDisputeCreatedAsync(Event stripeEvent)
    {
        var dispute = stripeEvent.Data.Object as Dispute;
        if (dispute == null)
        {
            return Task.FromResult(new WebhookProcessingResult
            {
                Success = false,
                ErrorMessage = "Invalid dispute data in webhook"
            });
        }

        _logger.LogWarning("Dispute created for charge {ChargeId}, amount {Amount}", 
            dispute.ChargeId, dispute.Amount / 100m);

        return Task.FromResult(new WebhookProcessingResult
        {
            Success = true,
            EventType = Events.ChargeDisputeCreated
        });
    }

    #endregion
}
