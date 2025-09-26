# Stripe Production Webhooks Setup Guide

## Overview
This guide configures Stripe webhooks for the production environment to handle payment processing and token allocation.

## Production Configuration

### 1. Azure Key Vault Secrets
Configure these secrets in Azure Key Vault for production:

```bash
# Stripe Production Secrets (required)
StripeSecretKey-Prod: "sk_live_..."           # Live secret key from Stripe
StripePublishableKey-Prod: "pk_live_..."      # Live publishable key from Stripe  
StripeWebhookSecret-Prod: "whsec_..."         # Webhook signing secret
```

### 2. Stripe Dashboard Configuration
In your Stripe Production Dashboard:

1. **Navigate to**: Developers → Webhooks
2. **Click**: Add endpoint
3. **Endpoint URL**: `https://api.meetingsummary.io/api/webhooks/stripe`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded` (if using subscriptions)
5. **API Version**: Set to match your Stripe.NET version (currently 2023-10-16)

### 3. Production Webhook Endpoint
The production webhook endpoint will be:
```
https://api.meetingsummary.io/api/webhooks/stripe
```

### 4. Environment-Specific Settings

#### Production (`appsettings.Production.json`):
```json
{
  "Stripe": {
    "UseKeyVault": true,
    "SecretKeyVaultName": "StripeSecretKey-Prod",
    "PublishableKeyVaultName": "StripePublishableKey-Prod", 
    "WebhookSecretVaultName": "StripeWebhookSecret-Prod",
    "IsTestMode": false
  }
}
```

#### Development (current setup):
```json
{
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_J70aYvRKZCjmRCKP9pmWwUFlEas4Uq4C",
    "IsTestMode": true
  }
}
```

## Security Considerations

### 1. Webhook Signature Validation
✅ **Already Implemented**: The webhook middleware validates all incoming webhooks using the signing secret.

### 2. HTTPS Only
✅ **Configured**: Production endpoints use HTTPS with proper SSL certificates.

### 3. Azure Key Vault Integration
✅ **Configured**: All sensitive keys stored in Azure Key Vault with managed identity access.

### 4. CORS Configuration
✅ **Configured**: Production CORS allows only:
- `https://meetingsummary.io`
- `https://app.meetingsummary.io`
- `https://meetingsummary-prod-web.azurestaticapps.net`

## Testing Production Webhooks

### 1. Stripe CLI Testing
```bash
# Forward production webhooks to local development
stripe listen --forward-to=https://api.meetingsummary.io/api/webhooks/stripe --live

# Test specific event
stripe trigger payment_intent.succeeded --live
```

### 2. Manual Webhook Testing
Use Stripe Dashboard → Webhooks → [Your Endpoint] → Send test webhook

### 3. Monitor Webhook Delivery
- **Stripe Dashboard**: Check webhook delivery logs and retry attempts
- **Application Logs**: Monitor Azure Application Insights for webhook processing
- **Database**: Verify token purchases are recorded correctly

## Deployment Checklist

### Pre-Deployment
- [ ] Create Azure Key Vault secrets for Stripe production keys
- [ ] Configure Stripe production webhook endpoint
- [ ] Update Azure App Service configuration to use production settings
- [ ] Verify CORS settings for production domains

### Post-Deployment
- [ ] Test webhook endpoint responds with 200 OK
- [ ] Verify signature validation works correctly
- [ ] Complete end-to-end payment test
- [ ] Check token balance updates correctly
- [ ] Monitor webhook delivery success rate

## Webhook Event Processing

### Successfully Handled Events
- ✅ `payment_intent.succeeded` - Adds tokens to user balance
- ✅ `payment_intent.payment_failed` - Logs failure (no balance change)

### Event Processing Flow
1. **Webhook Received** → Signature validation
2. **Payment Success** → Extract user ID and token amount from metadata
3. **Database Update** → Add TokenPurchase record and update user balance
4. **Logging** → Record transaction for audit trail

## Monitoring & Alerting

### Key Metrics to Monitor
- Webhook delivery success rate (should be >99%)
- Payment processing latency
- Token balance update failures
- Signature validation failures

### Recommended Alerts
- Webhook endpoint returning errors (>5% failure rate)
- Payment intent succeeded but token balance not updated
- Stripe webhook secret validation failures

## Troubleshooting

### Common Issues
1. **Webhook timeouts**: Ensure endpoint responds within 30 seconds
2. **Signature validation failures**: Verify webhook secret matches exactly
3. **Database connection issues**: Check Azure SQL connection string
4. **Token balance not updating**: Check TokenService logging for errors

### Debug Commands
```bash
# Check webhook endpoint health
curl -X POST https://api.meetingsummary.io/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Monitor application logs
az webapp log tail --name meetingsummary-prod-api --resource-group meetingsummary-prod
```

## Support Contacts
- **Stripe Support**: https://support.stripe.com
- **Azure Support**: Via Azure Portal
- **Development Team**: [Internal contact information]

---

*Last updated: September 25, 2025*
*Environment: Production Deployment*