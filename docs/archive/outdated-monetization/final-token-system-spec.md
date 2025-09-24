# Final Duration-Based Token System Specification

## Core Token System

### Base Token Structure
- **1 token = $0.05**
- **100 tokens = $5.00**
- **Duration-based pricing**: Tokens calculated by meeting length with volume discounts

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

---

## Cost Analysis Per Transaction

### Direct Processing Costs (per 15-minute increment)
- **Azure Speech Services**: $0.70 per 15 minutes
- **GPT-4o-mini Processing**: $0.001 (fixed per meeting)
- **SendGrid Email**: $0.002 (fixed per meeting)
- **User Storage (amortized)**: $0.0375 per meeting
- **Total cost per 15-minute increment**: $0.741

### Profit Analysis Examples

#### 15-Minute Meeting (100 tokens @ $5.00)
- **Revenue**: $5.00
- **Processing Cost**: $0.741
- **Payment Processing**: $0.445 (2.9% + $0.30)
- **Net Profit**: $3.814
- **Profit Margin**: 76.3%

#### 60-Minute Meeting (280 tokens @ $14.00)
- **Revenue**: $14.00
- **Processing Cost**: $2.964 (4 × $0.741)
- **Payment Processing**: $0.706 (2.9% + $0.30)
- **Net Profit**: $10.330
- **Profit Margin**: 73.8%

---

## Token Package Options

### Individual Purchases
Users can buy tokens as needed:
- **100 tokens**: $5.00 (one 15-minute meeting)
- **280 tokens**: $14.00 (one 60-minute meeting)
- **Custom amounts**: Any multiple of 100 tokens

### Bulk Packages (Optional Future Enhancement)
- **Starter Pack**: $25 for 550 tokens (10% bulk discount)
- **Professional Pack**: $50 for 1,200 tokens (16% bulk discount)
- **Business Pack**: $100 for 2,700 tokens (26% bulk discount)

---

## User Experience Flow

### Token Purchase
1. User uploads audio file
2. System analyzes duration and displays: *"This 23-minute meeting requires 180 tokens ($9.00)"*
3. User confirms purchase or adds tokens to account
4. Processing begins after payment confirmation

### Account Management
- **Token Balance**: Always visible in user dashboard
- **Purchase History**: Record of all token purchases and usage
- **Usage Analytics**: Tokens used per meeting, monthly summaries

---

## Technical Implementation Requirements

### Token Calculation Service
```csharp
public class TokenCalculationService
{
    public int CalculateTokensRequired(int durationMinutes)
    {
        // Base: 100 tokens per 15-minute increment
        int baseTokens = (int)Math.Ceiling(durationMinutes / 15.0) * 100;
        
        // Apply volume discount
        double multiplier = GetVolumeDiscountMultiplier(durationMinutes);
        return (int)(baseTokens * multiplier);
    }
    
    private double GetVolumeDiscountMultiplier(int minutes)
    {
        return minutes switch
        {
            <= 15 => 1.0,    // No discount
            <= 30 => 0.9,    // 10% discount
            <= 45 => 0.8,    // 20% discount
            _ => 0.7          // 30% discount for 60+ minutes
        };
    }
}
```

### Payment Integration
- **Mock Payment System**: Simulate successful payments for development
- **Token Purchase API**: Handle token purchases with payment processing
- **Balance Management**: Track user token balances and usage

### User Interface Elements
- **Token Calculator**: Show estimated cost before processing
- **Balance Display**: Current tokens remaining
- **Purchase Flow**: Simple token buying interface
- **Usage History**: Track tokens spent per meeting

---

## Business Model Benefits

### 1. **Fair Pricing**
- Users pay proportionally to actual processing costs
- Volume discounts reward longer meetings
- No cross-subsidization between users

### 2. **Competitive Advantage**
- **5x cheaper than Rev.ai** ($0.23/min vs $1.25/min for 60-min meetings)
- **No monthly subscriptions** required
- **Pay-only-for-what-you-use** model

### 3. **Strong Profitability**
- **73-76% profit margins** across all meeting lengths
- **Scalable revenue** that grows with usage
- **Predictable cost structure**

### 4. **User Benefits**
- **Transparent pricing** with no hidden fees
- **Volume discounts** automatically applied
- **Flexible usage** - tokens never expire
- **No commitment** required

---

## Integration with Existing System

### User Management (S6.1 Complete)
- Extend existing `UserAccount` model with token balance
- Use existing authentication and authorization
- Leverage current user storage and data retention services

### API Extensions Required
- **Token purchase endpoints**
- **Balance inquiry endpoints** 
- **Usage tracking endpoints**
- **Payment webhook handlers**

### Database Schema Additions
```sql
-- Add to existing UserAccount table
ALTER TABLE UserAccount ADD TokenBalance INT DEFAULT 0;

-- New tables
CREATE TABLE TokenPurchases (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES UserAccount(Id),
    TokensPurchased INT,
    AmountPaid DECIMAL(10,2),
    PaymentId VARCHAR(255),
    PurchaseDate DATETIME2,
    PaymentStatus VARCHAR(50)
);

CREATE TABLE TokenUsage (
    Id INT IDENTITY PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES UserAccount(Id),
    MeetingId INT FOREIGN KEY REFERENCES Meeting(Id),
    TokensUsed INT,
    MeetingDurationMinutes INT,
    UsageDate DATETIME2
);
```

---

## Competitive Comparison

| Service | Model | 15-min Cost | 30-min Cost | 60-min Cost | Notes |
|---------|-------|-------------|-------------|-------------|--------|
| **Meeting Summarizer** | Pay-per-use | $5.00 | $9.00 | $14.00 | No subscription |
| Rev.ai | Pay-per-use | $18.75 | $37.50 | $75.00 | Premium accuracy |
| Otter.ai Pro | Subscription | $16.99/month | $16.99/month | $16.99/month | 6,000 min limit |
| Fireflies.ai Pro | Subscription | $10/month | $10/month | $10/month | 8,000 min limit |

**Value Proposition**: 3-5x cheaper than competitors with no monthly commitment required.

---

## Implementation Priority

### Phase 1: Core Token System
1. Token calculation service
2. User balance management
3. Mock payment integration
4. Basic purchase flow

### Phase 2: Enhanced Features
5. Usage analytics and history
6. Bulk purchase packages
7. Admin tools and reporting
8. Real payment processor integration

This system provides an optimal balance of user value, competitive pricing, and business profitability while maintaining the flexibility to scale and enhance over time.
