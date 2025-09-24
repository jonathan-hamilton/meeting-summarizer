# Complete Token System Implementation Plan
**Meeting-Summary.io - S6.11 Technical Implementation Guide**

*Last Updated: September 23, 2025*  
*Status: COMPREHENSIVE IMPLEMENTATION PLAN*

---

## Executive Summary

This document provides the complete technical implementation plan for Meeting-Summary.io's token system, addressing critical gaps identified in the current implementation. The plan transforms S6.11 from a simple refund system into a comprehensive token economy that includes purchase flows, payment integration, refund capabilities, and production-ready Stripe integration.

**Key Deliverables:**
- Fix current backend token calculation errors
- Build complete frontend token purchase system
- Implement Stripe sandbox for development + production configuration
- Create comprehensive refund system (automatic + manual)
- Ensure PCI compliance and production readiness

---

## Current Implementation Status

### ✅ Backend Foundation (Completed)
| Component | Status | Notes |
|-----------|--------|-------|
| Database Entities | ✅ Complete | User.TokenBalance, TokenPurchase, TokenUsage |
| Token Services | ✅ Complete | TokenService, TokenCalculationService |
| API Controllers | ✅ Complete | TokenController, PaymentController |
| Stripe Integration | ✅ Complete | StripePaymentService with payment intents |
| Token Calculation | ✅ Complete | Duration-based pricing with volume discounts |

### ❌ Critical Gaps (Must Fix)
| Gap | Impact | Priority |
|-----|--------|----------|
| Frontend Token UI | Users cannot purchase tokens | **P0 - Critical** |
| Incorrect Token Formula | Wrong deduction in SummaryController | **P0 - Critical** |
| Payment Webhooks | No balance updates after payment | **P0 - Critical** |
| Environment Config | No Stripe sandbox for development | **P1 - High** |
| Refund System | No automatic or manual refunds | **P1 - High** |

---

## Phase-by-Phase Implementation

### Phase 1: Backend Fixes & Environment Setup (Week 1)

#### 1.1 Fix Token Calculation in SummaryController
**Current Issue:**
```csharp
// INCORRECT - Flat rate calculation
var estimatedTokens = Math.Max(1, (int)Math.Ceiling(estimatedDurationMinutes * 1.2));
```

**Required Fix:**
```csharp
// CORRECT - Duration-based with volume discounts
var calculation = _tokenCalculationService.CalculateTokensRequired((int)estimatedDurationMinutes);
var requiredTokens = calculation.FinalTokens;

// Validate user has sufficient tokens
if (user.TokenBalance < requiredTokens)
{
    return BadRequest(new {
        error = "Insufficient tokens",
        required = requiredTokens,
        available = user.TokenBalance,
        shortfall = requiredTokens - (int)user.TokenBalance,
        estimatedCost = requiredTokens * 0.05m
    });
}
```

#### 1.2 Environment Configuration
```csharp
// StripeOptions.cs
public class StripeOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public bool IsTestMode { get; set; } = false;
    public string ApiVersion { get; set; } = "2023-10-16";
}

// Program.cs configuration
builder.Services.Configure<StripeOptions>(
    builder.Configuration.GetSection("Stripe"));

// Development environment (appsettings.Development.json)
{
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_...",
    "IsTestMode": true
  }
}
```

#### 1.3 Enhanced StripePaymentService
```csharp
public class StripePaymentService : IPaymentService
{
    private readonly StripeOptions _options;
    
    public StripePaymentService(IOptions<StripeOptions> options)
    {
        _options = options.Value;
        
        if (_options.IsTestMode)
        {
            _logger.LogInformation("Stripe configured for TEST MODE");
            StripeConfiguration.ApiKey = _options.SecretKey; // sk_test_...
        }
        else
        {
            _logger.LogInformation("Stripe configured for PRODUCTION MODE");
            StripeConfiguration.ApiKey = _options.SecretKey; // sk_live_...
        }
    }
}
```

### Phase 2: Frontend Token System (Week 2)

#### 2.1 Token Store (Zustand - MANDATORY)
```typescript
// stores/tokenStore.ts
interface TokenState {
  // State
  balance: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  purchaseInProgress: boolean;
  purchaseHistory: TokenPurchase[];
  
  // Actions
  updateBalance: (newBalance: number) => void;
  startPurchase: (tokenCount: number, amount: number) => void;
  completePurchase: (result: PaymentResult) => void;
  failPurchase: (error: string) => void;
  fetchBalance: () => Promise<void>;
  fetchPurchaseHistory: () => Promise<void>;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  balance: 0,
  isLoading: false,
  lastUpdated: null,
  purchaseInProgress: false,
  purchaseHistory: [],
  
  updateBalance: (newBalance) => set({ 
    balance: newBalance, 
    lastUpdated: new Date() 
  }),
  
  startPurchase: (tokenCount, amount) => set({ 
    purchaseInProgress: true 
  }),
  
  completePurchase: (result) => {
    if (result.success) {
      set({ 
        balance: get().balance + result.tokensPurchased,
        purchaseInProgress: false,
        lastUpdated: new Date()
      });
    } else {
      set({ purchaseInProgress: false });
    }
  },
  
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const response = await apiService.getTokenBalance();
      set({ 
        balance: response.balance,
        lastUpdated: new Date(),
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));
```

#### 2.2 Token Balance Display Component
```typescript
// components/token/TokenBalanceDisplay.tsx
export const TokenBalanceDisplay: React.FC = () => {
  const { balance, isLoading, fetchBalance } = useTokenStore();
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);
  
  if (!isAuthenticated || isLoading) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip 
        icon={<MonetizationOnIcon />}
        label={`${balance} tokens`}
        color={balance < 100 ? 'warning' : 'success'}
        size="small"
      />
      <Typography variant="caption" color="text.secondary">
        ≈ ${(balance * 0.05).toFixed(2)}
      </Typography>
    </Box>
  );
};
```

#### 2.3 Token Purchase Dialog
```typescript
// components/token/TokenPurchaseDialog.tsx
interface TokenPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  initialTokenCount?: number;
}

export const TokenPurchaseDialog: React.FC<TokenPurchaseDialogProps> = ({
  open,
  onClose,
  initialTokenCount = 100
}) => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [customAmount, setCustomAmount] = useState(initialTokenCount);
  const { purchaseInProgress } = useTokenStore();
  
  const tokenPackages: TokenPackage[] = [
    { tokens: 100, cost: 5.00, description: '15-minute meeting' },
    { tokens: 180, cost: 9.00, description: '30-minute meeting', discount: '10%' },
    { tokens: 240, cost: 12.00, description: '45-minute meeting', discount: '20%' },
    { tokens: 280, cost: 14.00, description: '60-minute meeting', discount: '30%' },
  ];
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Purchase Processing Tokens</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Select Package
            </Typography>
            {tokenPackages.map((pkg) => (
              <TokenPackageCard
                key={pkg.tokens}
                package={pkg}
                selected={selectedPackage?.tokens === pkg.tokens}
                onSelect={() => setSelectedPackage(pkg)}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <PaymentForm
              selectedPackage={selectedPackage}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
```

#### 2.4 Stripe Elements Integration
```typescript
// components/payment/PaymentForm.tsx
export const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedPackage,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !selectedPackage) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Create payment intent
      const { data: paymentIntent } = await apiService.createPaymentIntent({
        tokenCount: selectedPackage.tokens,
        amount: selectedPackage.cost
      });
      
      // Confirm payment
      const { error } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: user.name,
              email: user.email
            }
          }
        }
      );
      
      if (error) {
        onPaymentError(error.message);
      } else {
        onPaymentSuccess({
          paymentIntentId: paymentIntent.id,
          tokensPurchased: selectedPackage.tokens,
          amountPaid: selectedPackage.cost
        });
      }
    } catch (error) {
      onPaymentError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Details
          </Typography>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              {selectedPackage?.tokens} tokens for ${selectedPackage?.cost}
            </Typography>
          </Box>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </CardContent>
        <CardActions>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!stripe || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {processing ? 'Processing...' : `Pay $${selectedPackage?.cost}`}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
```

### Phase 3: Payment Integration & Webhooks (Week 3)

#### 3.1 Enhanced Webhook Controller
```csharp
[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly string _webhookSecret;
    private readonly ITokenService _tokenService;
    private readonly IUserManagementService _userService;
    private readonly IEmailService _emailService;
    
    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripeWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json, 
                Request.Headers["Stripe-Signature"], 
                _webhookSecret
            );
            
            _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);
            
            switch (stripeEvent.Type)
            {
                case Events.PaymentIntentSucceeded:
                    await HandlePaymentSuccess(stripeEvent.Data.Object as PaymentIntent);
                    break;
                    
                case Events.PaymentIntentPaymentFailed:
                    await HandlePaymentFailure(stripeEvent.Data.Object as PaymentIntent);
                    break;
                    
                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    break;
            }
            
            return Ok();
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe webhook signature validation failed");
            return BadRequest();
        }
    }
    
    private async Task HandlePaymentSuccess(PaymentIntent paymentIntent)
    {
        var userId = paymentIntent.Metadata["userId"];
        var tokenCount = int.Parse(paymentIntent.Metadata["tokenCount"]);
        var amountPaid = decimal.Parse(paymentIntent.Metadata["amountUsd"]);
        
        try
        {
            // Update user token balance
            var newBalance = await _tokenService.UpdateTokenBalanceAsync(
                userId, 
                tokenCount, 
                $"Token purchase - Payment Intent: {paymentIntent.Id}"
            );
            
            // Create purchase record
            await CreateTokenPurchaseRecord(userId, tokenCount, amountPaid, paymentIntent.Id);
            
            // Send confirmation email
            await _emailService.SendTokenPurchaseConfirmationAsync(
                userId, 
                tokenCount, 
                amountPaid, 
                newBalance
            );
            
            _logger.LogInformation(
                "Payment processed successfully. User: {UserId}, Tokens: {TokenCount}, Amount: {Amount}",
                userId, tokenCount, amountPaid
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing successful payment for user {UserId}", userId);
        }
    }
}
```

#### 3.2 Token Purchase Record Creation
```csharp
private async Task CreateTokenPurchaseRecord(string userId, int tokenCount, decimal amountPaid, string paymentIntentId)
{
    var purchase = new TokenPurchase
    {
        Id = Guid.NewGuid(),
        UserId = Guid.Parse(userId),
        TokensPurchased = tokenCount,
        AmountPaid = amountPaid,
        PaymentId = paymentIntentId,
        PurchaseDate = DateTime.UtcNow,
        PaymentStatus = "completed"
    };
    
    _context.TokenPurchases.Add(purchase);
    await _context.SaveChangesAsync();
}
```

### Phase 4: Refund System Implementation (Week 4)

#### 4.1 Automatic Refund Detection
```csharp
// Service to detect and process automatic refunds
public class AutoRefundService : IAutoRefundService
{
    public async Task ProcessFailedTranscription(Guid meetingId, string userId, string failureReason)
    {
        var meeting = await _context.Meetings.FindAsync(meetingId);
        if (meeting == null) return;
        
        var tokensUsed = meeting.TokensConsumed;
        if (tokensUsed > 0)
        {
            var refund = new Refund
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Parse(userId),
                OriginalMeetingId = meetingId,
                RefundType = "Automatic",
                TokenAmount = tokensUsed,
                Reason = $"Transcription failure: {failureReason}",
                Status = "Completed",
                RequestedAt = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow
            };
            
            _context.Refunds.Add(refund);
            
            // Restore tokens to user
            await _tokenService.UpdateTokenBalanceAsync(
                userId,
                tokensUsed,
                $"Automatic refund for failed transcription - Meeting: {meetingId}"
            );
            
            await _context.SaveChangesAsync();
            
            // Send refund notification email
            await _emailService.SendRefundNotificationAsync(userId, refund);
            
            _logger.LogInformation(
                "Automatic refund processed. User: {UserId}, Meeting: {MeetingId}, Tokens: {Tokens}",
                userId, meetingId, tokensUsed
            );
        }
    }
}
```

#### 4.2 Manual Refund System
```csharp
[ApiController]
[Route("api/refunds")]
[Authorize]
public class RefundController : ControllerBase
{
    [HttpPost("request")]
    public async Task<ActionResult<RefundRequestResult>> RequestRefund([FromBody] RefundRequest request)
    {
        var userId = GetCurrentUserId();
        
        // Validate refund eligibility
        var eligibility = await _refundService.CheckRefundEligibilityAsync(userId, request.MeetingId);
        if (!eligibility.IsEligible)
        {
            return BadRequest(new { error = eligibility.Reason });
        }
        
        // Check rate limiting (max 5 manual refunds per month)
        var monthlyRefunds = await _refundService.GetMonthlyRefundCountAsync(userId);
        if (monthlyRefunds >= 5)
        {
            return BadRequest(new { error = "Monthly refund limit exceeded" });
        }
        
        // Create refund request
        var refund = new Refund
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse(userId),
            OriginalMeetingId = request.MeetingId,
            RefundType = "Manual",
            TokenAmount = request.TokenAmount,
            Reason = request.Reason,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        };
        
        _context.Refunds.Add(refund);
        await _context.SaveChangesAsync();
        
        // Send notification to admin
        await _emailService.SendRefundRequestNotificationAsync(refund);
        
        return Ok(new RefundRequestResult
        {
            RefundId = refund.Id,
            Status = "Submitted",
            EstimatedProcessingTime = "24-48 hours"
        });
    }
    
    [HttpGet("history")]
    public async Task<ActionResult<RefundHistory>> GetRefundHistory()
    {
        var userId = GetCurrentUserId();
        var refunds = await _context.Refunds
            .Where(r => r.UserId == Guid.Parse(userId))
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
            
        return Ok(new RefundHistory
        {
            Refunds = refunds.Select(r => new RefundHistoryItem
            {
                Id = r.Id,
                Type = r.RefundType,
                TokenAmount = r.TokenAmount,
                Reason = r.Reason,
                Status = r.Status,
                RequestedAt = r.RequestedAt,
                ProcessedAt = r.ProcessedAt
            }).ToList(),
            TotalRefunded = refunds.Where(r => r.Status == "Completed").Sum(r => r.TokenAmount)
        });
    }
}
```

### Phase 5: Production Readiness & Testing (Week 4)

#### 5.1 Security Implementation
```csharp
// Input validation and security
[ApiController]
public class SecurePaymentController : ControllerBase
{
    [HttpPost("create-intent")]
    [ValidateAntiForgeryToken]
    public async Task<ActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        // Validate request
        if (request.Amount <= 0 || request.Amount > 1000) // Max $1000
        {
            return BadRequest("Invalid payment amount");
        }
        
        if (request.TokenCount <= 0 || request.TokenCount > 20000) // Max 20k tokens
        {
            return BadRequest("Invalid token count");
        }
        
        // Rate limiting - max 5 payment attempts per hour
        var rateLimitKey = $"payment_attempts_{GetCurrentUserId()}";
        var attemptCount = await _cache.GetAsync<int>(rateLimitKey);
        if (attemptCount >= 5)
        {
            return TooManyRequests("Payment attempt limit exceeded");
        }
        
        await _cache.SetAsync(rateLimitKey, attemptCount + 1, TimeSpan.FromHours(1));
        
        // Process payment intent...
    }
}
```

#### 5.2 Monitoring and Analytics
```csharp
// Payment metrics and monitoring
public class PaymentMetricsService : IPaymentMetricsService
{
    public async Task TrackPaymentAttempt(string userId, decimal amount, string status)
    {
        var metric = new PaymentMetric
        {
            UserId = userId,
            Amount = amount,
            Status = status,
            Timestamp = DateTime.UtcNow,
            Environment = _environment.IsProduction() ? "production" : "development"
        };
        
        await _metricsRepository.AddAsync(metric);
        
        // Send to monitoring service
        _telemetry.TrackEvent("PaymentAttempt", new Dictionary<string, string>
        {
            ["UserId"] = userId,
            ["Amount"] = amount.ToString(),
            ["Status"] = status,
            ["Environment"] = metric.Environment
        });
    }
    
    public async Task<PaymentAnalytics> GetPaymentAnalytics(DateTime from, DateTime to)
    {
        return new PaymentAnalytics
        {
            TotalTransactions = await GetTransactionCount(from, to),
            SuccessRate = await GetSuccessRate(from, to),
            AverageTransactionValue = await GetAverageTransactionValue(from, to),
            TopFailureReasons = await GetTopFailureReasons(from, to),
            RevenueByDay = await GetDailyRevenue(from, to)
        };
    }
}
```

---

## Testing Strategy

### Development Testing (Stripe Test Mode)
```typescript
// Test card numbers for different scenarios
const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069'
};

// Automated test suite
describe('Token Purchase Flow', () => {
  it('should complete successful purchase', async () => {
    const tokenStore = useTokenStore.getState();
    const initialBalance = tokenStore.balance;
    
    // Simulate successful payment
    await tokenStore.startPurchase(100, 5.00);
    
    // Mock Stripe success
    mockStripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' }
    });
    
    // Verify balance update
    expect(tokenStore.balance).toBe(initialBalance + 100);
  });
});
```

### Production Deployment Checklist
- [ ] **Environment Variables**: All Stripe keys configured correctly
- [ ] **Webhook Endpoints**: Production webhooks configured and tested
- [ ] **SSL Certificates**: HTTPS enabled for all payment endpoints
- [ ] **Rate Limiting**: Payment endpoint rate limits configured
- [ ] **Monitoring**: Payment success/failure monitoring active
- [ ] **Backup Systems**: Database backups and disaster recovery tested
- [ ] **Security Audit**: PCI compliance validation completed
- [ ] **Performance Testing**: Payment flow load testing completed

---

## Success Metrics & KPIs

### Technical Performance
- **Payment Processing Time**: <3 seconds end-to-end
- **Webhook Processing Time**: <5 seconds from event to balance update
- **System Uptime**: 99.9% availability for payment services
- **Error Rate**: <1% payment processing errors

### Business Metrics
- **Payment Success Rate**: >95% successful transactions
- **Customer Satisfaction**: >90% positive payment experience feedback
- **Refund Rate**: <5% of transactions require refunds
- **Revenue Growth**: Track monthly recurring revenue growth

### Security & Compliance
- **PCI Compliance**: Level 1 compliance maintained
- **Security Incidents**: Zero payment data breaches
- **Fraud Prevention**: <0.1% fraudulent transaction rate
- **Audit Compliance**: 100% compliance with financial auditing requirements

---

**Implementation Owner**: Development Team  
**Business Owner**: Product Management  
**Timeline**: 4 weeks (Sprint 6 extension + early Sprint 7)  
**Budget Impact**: Stripe processing fees (2.9% + $0.30 per transaction)  
**Risk Level**: Medium (financial transactions require careful testing)**