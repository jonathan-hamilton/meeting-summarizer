# Token System Specification
**Meeting-Summary.io Payment & Monetization System**

*Last Updated: September 23, 2025*  
*Status: CURRENT SPECIFICATION*

---

## Executive Summary

Meeting-Summary.io uses a duration-based token system with volume discounts to provide fair, transparent pricing that scales with actual processing costs. Users purchase tokens to process meetings, with longer meetings receiving significant discounts per minute.

**Key Benefits:**
- 5x cheaper than competitors like Rev.ai ($0.23/min vs $1.25/min for 60-min meetings)
- No monthly subscriptions required
- Pay-only-for-what-you-use model
- 73-76% profit margins across all meeting lengths

---

## Core Token Economics

### Base Token Structure
- **1 token = $0.05**
- **100 tokens = $5.00**
- **Minimum purchase**: 100 tokens (covers one 15-minute meeting)

### Token Calculation Formula
```
Base tokens = Math.Ceiling(duration_minutes / 15.0) * 100
Final tokens = Base tokens * volume_discount_multiplier

Volume Discount Multipliers:
- 15 minutes: 1.0 (no discount)
- 30 minutes: 0.9 (10% discount) 
- 45 minutes: 0.8 (20% discount)
- 60+ minutes: 0.7 (30% discount)
```

---

## Pricing Structure

| Meeting Duration | Base Calculation | Volume Discount | Tokens Required | Cost | Per-Minute Cost |
|-----------------|------------------|-----------------|----------------|------|-----------------|
| 15 minutes      | 100 tokens      | None           | 100 tokens     | $5.00| $0.33          |
| 30 minutes      | 200 tokens      | 10%            | 180 tokens     | $9.00| $0.30          |
| 45 minutes      | 300 tokens      | 20%            | 240 tokens     | $12.00| $0.27         |
| 60 minutes      | 400 tokens      | 30%            | 280 tokens     | $14.00| $0.23         |
| 75 minutes      | 500 tokens      | 30%            | 350 tokens     | $17.50| $0.23         |
| 90 minutes      | 600 tokens      | 30%            | 420 tokens     | $21.00| $0.23         |

**Meeting Length Limit**: 90 minutes maximum per upload (automatically enforced)

---

## Business Model Details

### What's Included in Token Price
Each token purchase covers the **complete meeting processing workflow**:

1. **Azure Speech Services Transcription** (duration-dependent cost)
2. **OpenAI GPT-4o-mini Summarization** (fixed cost per meeting)  
3. **Email Delivery via SendGrid** (fixed cost per meeting)
4. **User Storage & Infrastructure** (amortized cost)

### Cost Analysis Example (60-minute meeting)
- **Revenue**: $14.00 (280 tokens)
- **Processing Cost**: $2.964 (4 × $0.741 per 15-min increment)
- **Payment Processing**: $0.706 (Stripe fees: 2.9% + $0.30)
- **Net Profit**: $10.330 
- **Profit Margin**: 73.8%

---

## User Experience Flow

### Token Purchase Process
1. **Upload & Analysis**: User uploads audio file, system analyzes duration
2. **Cost Display**: System shows: *"This 23-minute meeting requires 180 tokens ($9.00)"*
3. **Purchase Decision**: User confirms purchase or adds tokens to account
4. **Processing**: Meeting processing begins immediately after payment confirmation

### Token Management
- **Balance Display**: Current token count always visible in header
- **Purchase History**: Complete record of token purchases and usage
- **Usage Analytics**: Detailed breakdown showing tokens spent per meeting
- **Low Balance Alerts**: Automatic warnings when tokens are running low

---

## Payment Integration

### Supported Payment Methods
- **Credit/Debit Cards**: Visa, Mastercard, American Express, Discover
- **Digital Wallets**: Apple Pay, Google Pay (where supported)
- **Payment Processor**: Stripe (PCI-compliant, secure tokenization)

### Payment Packages
- **Flexible Purchasing**: Buy exact tokens needed for each meeting
- **Common Packages**: 
  - 100 tokens ($5.00) - One 15-minute meeting
  - 180 tokens ($9.00) - One 30-minute meeting  
  - 280 tokens ($14.00) - One 60-minute meeting
  - Custom amounts in 100-token increments

### Security & Compliance
- **PCI DSS Compliant**: All payment data handled by Stripe
- **No Stored Card Data**: Zero payment information stored on our servers
- **Secure Webhooks**: Payment confirmations via validated Stripe webhooks
- **Receipt Generation**: Automatic email receipts for all purchases

---

## Technical Implementation

### Backend Services Architecture
```csharp
// Core Services
public class TokenCalculationService
{
    public int CalculateTokensRequired(int durationMinutes)
    {
        int baseTokens = (int)Math.Ceiling(durationMinutes / 15.0) * 100;
        double multiplier = GetVolumeDiscountMultiplier(durationMinutes);
        return (int)(baseTokens * multiplier);
    }
    
    private double GetVolumeDiscountMultiplier(int minutes) =>
        minutes switch
        {
            <= 15 => 1.0,    // No discount
            <= 30 => 0.9,    // 10% discount  
            <= 45 => 0.8,    // 20% discount
            _ => 0.7          // 30% discount for 60+ minutes
        };
}

public class TokenValidationService  
{
    public async Task<bool> ValidateTokenBalance(string userId, int requiredTokens)
    public async Task<bool> DeductTokens(string userId, int tokenAmount)
    public async Task<bool> RefundTokens(string userId, int tokenAmount)
}
```

### Token Consumption Points
- **Transcription Start**: Tokens deducted when Azure Speech Services begins processing
- **Processing Failure**: Automatic refund if transcription fails
- **Summary Generation**: No additional tokens (included in transcription cost)
- **Re-downloads**: No additional tokens for accessing existing results

### Database Schema
```sql
-- User token balance tracking
Users (Id, Email, TokenBalance, CreatedAt, UpdatedAt)

-- Transaction logging for audit and analytics  
TokenTransactions (
    Id, UserId, Amount, TransactionType, 
    Timestamp, Description, MeetingId, PaymentId
)

-- Payment processing records
PaymentTransactions (
    Id, UserId, StripePaymentId, Amount, 
    Status, TokensPurchased, CreatedAt
)
```

---

## Business Compliance

### Financial Regulations
- **PCI DSS Level 1**: Stripe handles all card data processing
- **GDPR Compliant**: User data retention and deletion policies
- **Tax Compliance**: Automatic tax calculation via Stripe Tax
- **Financial Reporting**: Complete audit trail for all transactions

### Refund Policy
- **Failed Processing**: Full automatic refund if transcription fails
- **User Requested**: 30-day refund window for unused tokens
- **Partial Refunds**: Prorated refunds based on actual usage
- **Processing Time**: 3-5 business days via original payment method

---

## Competitive Analysis

### Market Positioning
| Service | Per-Minute Cost (60 min) | Monthly Fee | Meeting Limit |
|---------|-------------------------|-------------|---------------|
| **Meeting-Summary.io** | **$0.23** | **$0** | **90 minutes** |
| Rev.ai | $1.25 | $0 | None |
| Otter.ai Pro | $0.33 | $10 | 600 min/month |
| Grain | $0.50 | $15 | Unlimited |

### Value Proposition
- **5x cheaper than Rev.ai** for typical meeting lengths
- **No monthly commitments** unlike Otter.ai or Grain
- **Volume discounts** reward longer meetings
- **All-inclusive pricing** covers transcription, summarization, and delivery

---

## Implementation Status

### Current Development (Sprint 6)
- ✅ **Token Calculation Service**: Duration-based calculation with volume discounts
- ✅ **User Balance Management**: Database schema and balance tracking
- ✅ **Backend API Endpoints**: Token purchase, balance check, usage tracking
- 🔄 **Payment Integration**: Stripe webhook implementation in progress
- 🔄 **Frontend UI**: Token purchase flow components

### Next Phase (Sprint 7)
- **Production Payment Testing**: Full Stripe integration testing
- **Volume Discount UI**: Clear pricing display with discount visualization  
- **Usage Analytics**: Detailed token usage reporting dashboard
- **Mobile Optimization**: Responsive payment flow for mobile devices

---

## Success Metrics

### Key Performance Indicators
- **Average Revenue Per Meeting**: Target $10-15 (45-75 minute meetings)
- **Token Utilization Rate**: >85% of purchased tokens used within 90 days
- **Payment Conversion**: >40% of demo users purchase tokens
- **Customer Lifetime Value**: Target $50+ per user over 6 months

### Financial Targets
- **Monthly Recurring Revenue**: $10K by Q1 2026
- **Gross Margin**: Maintain >70% across all meeting lengths  
- **Customer Acquisition Cost**: <$15 per paying customer
- **Churn Rate**: <5% monthly for token purchasers

---

*This specification supersedes all previous monetization and token system documents.*