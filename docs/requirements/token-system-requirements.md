# Token System Technical Requirements
**Meeting-Summary.io - Payment & Token Management Implementation**

*Last Updated: September 23, 2025*  
*Status: CURRENT REQUIREMENTS*

---

## Payment Processing Requirements

### Core Payment Features
- **REQ-PAY-001**: System shall integrate with Stripe for PCI-compliant payment processing
- **REQ-PAY-002**: Users shall purchase tokens in 100-token increments based on meeting duration
- **REQ-PAY-003**: Payment process shall use HTTPS and never store payment data on our servers
- **REQ-PAY-004**: Token balance shall update atomically upon successful payment confirmation
- **REQ-PAY-005**: System shall provide transaction history with receipts and usage tracking
- **REQ-PAY-006**: Email notifications shall be sent for successful payments and failed transactions
- **REQ-PAY-007**: System shall support refunds for failed processing and unused tokens
- **REQ-PAY-008**: Real-time token balance updates across all UI components
- **REQ-PAY-009**: Comprehensive error handling with clear user feedback for payment failures
- **REQ-PAY-010**: Admin dashboard for payment monitoring and transaction auditing

### Payment Security & Compliance
- **REQ-SEC-001**: All payment data handled exclusively by Stripe (PCI DSS Level 1)
- **REQ-SEC-002**: Payment confirmation via validated Stripe webhooks only
- **REQ-SEC-003**: No payment card data stored on Meeting-Summary.io servers
- **REQ-SEC-004**: HTTPS required for all payment-related endpoints
- **REQ-SEC-005**: Payment webhook signatures validated before processing
- **REQ-SEC-006**: Transaction logging for audit compliance and fraud detection
- **REQ-SEC-007**: GDPR compliance for user financial data handling

---

## Token System Requirements

### Token Calculation & Pricing
- **REQ-TOK-001**: Duration-based token calculation: `Math.Ceiling(duration_minutes / 15.0) * 100`
- **REQ-TOK-002**: Volume discount multipliers: 15min=1.0, 30min=0.9, 45min=0.8, 60+min=0.7
- **REQ-TOK-003**: Token price fixed at $0.05 per token (100 tokens = $5.00)
- **REQ-TOK-004**: Maximum meeting length enforced at 90 minutes
- **REQ-TOK-005**: Minimum purchase requirement: 100 tokens ($5.00)
- **REQ-TOK-006**: Token packages offered: 100, 180, 240, 280, 350, 420+ tokens
- **REQ-TOK-007**: Custom token amounts supported in 100-token increments

### Token Usage & Validation
- **REQ-TOK-008**: Token deduction occurs when transcription processing begins
- **REQ-TOK-009**: Pre-flight validation ensures sufficient tokens before processing
- **REQ-TOK-010**: Automatic refund if transcription processing fails
- **REQ-TOK-011**: Summary generation included in transcription token cost (no additional charge)
- **REQ-TOK-012**: Re-downloads of existing results require no additional tokens
- **REQ-TOK-013**: Token balance persistence across user sessions and devices
- **REQ-TOK-014**: Real-time balance updates after each transaction

### Token Balance Management
- **REQ-BAL-001**: User token balance stored securely in database with encryption
- **REQ-BAL-002**: Balance visible in application header at all times
- **REQ-BAL-003**: Low balance warnings when tokens < required for next meeting
- **REQ-BAL-004**: Transaction history with detailed usage breakdown per meeting
- **REQ-BAL-005**: Atomic balance updates to prevent race conditions
- **REQ-BAL-006**: Balance reconciliation checks against payment records
- **REQ-BAL-007**: Token expiration notifications (if implementing expiration)

---

## User Experience Requirements

### Token Purchase Flow
- **REQ-UX-001**: Clear cost estimation before meeting upload: "This 23-minute meeting requires 180 tokens ($9.00)"
- **REQ-UX-002**: Volume discount visualization showing savings for longer meetings
- **REQ-UX-003**: Secure payment form with real-time validation
- **REQ-UX-004**: Loading states during payment processing with progress indicators
- **REQ-UX-005**: Clear success/failure messaging after payment attempts
- **REQ-UX-006**: Immediate balance update reflection in UI after successful purchase
- **REQ-UX-007**: Mobile-responsive payment flow for all device sizes

### Token Management Interface
- **REQ-UX-008**: Token balance prominently displayed in application header
- **REQ-UX-009**: Purchase history accessible from user profile/dashboard
- **REQ-UX-010**: Usage analytics showing tokens spent per meeting with timestamps
- **REQ-UX-011**: Remaining balance alerts when approaching zero tokens
- **REQ-UX-012**: Token purchase button easily accessible from main interface
- **REQ-UX-013**: Pricing transparency with clear per-minute cost breakdown
- **REQ-UX-014**: Refund policy clearly displayed during purchase process

---

## Backend API Requirements

### Token Management Endpoints
- **REQ-API-001**: `GET /api/tokens/balance` - Retrieve current user token balance
- **REQ-API-002**: `POST /api/tokens/calculate` - Calculate tokens required for meeting duration
- **REQ-API-003**: `POST /api/tokens/deduct` - Deduct tokens when processing begins
- **REQ-API-004**: `POST /api/tokens/refund` - Refund tokens for failed processing
- **REQ-API-005**: `GET /api/tokens/history` - Retrieve user token transaction history
- **REQ-API-006**: `GET /api/tokens/usage` - Detailed usage analytics per meeting

### Payment Processing Endpoints
- **REQ-API-007**: `POST /api/payment/create-intent` - Create Stripe payment intent
- **REQ-API-008**: `POST /api/payment/confirm` - Confirm payment and update balance
- **REQ-API-009**: `POST /api/payment/webhook` - Handle Stripe webhook events
- **REQ-API-010**: `GET /api/payment/history` - Retrieve payment transaction history
- **REQ-API-011**: `POST /api/payment/refund` - Process refund requests
- **REQ-API-012**: `GET /api/payment/receipt/{id}` - Generate receipt for transaction

### Meeting Processing Integration
- **REQ-API-013**: Token validation integrated into `POST /api/transcription/upload`
- **REQ-API-014**: Token validation integrated into `POST /api/transcription/batch`
- **REQ-API-015**: Automatic token deduction when Azure Speech Services begins processing
- **REQ-API-016**: Token refund triggers if transcription fails after deduction
- **REQ-API-017**: No additional token validation for summary generation endpoints
- **REQ-API-018**: No token requirements for downloading existing results

---

## Database Schema Requirements

### Core Tables
```sql
-- User token balance tracking
Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    TokenBalance INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL
)

-- Token transaction logging
TokenTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Amount INT NOT NULL, -- Positive for purchases, negative for usage
    TransactionType NVARCHAR(50) NOT NULL, -- 'Purchase', 'Usage', 'Refund'
    Timestamp DATETIME2 NOT NULL,
    Description NVARCHAR(500),
    MeetingId UNIQUEIDENTIFIER NULL, -- For usage transactions
    PaymentId NVARCHAR(100) NULL, -- Stripe payment ID
    CreatedAt DATETIME2 NOT NULL
)

-- Payment processing records
PaymentTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    StripePaymentId NVARCHAR(100) NOT NULL,
    Amount DECIMAL(10,2) NOT NULL, -- USD amount
    TokensPurchased INT NOT NULL,
    Status NVARCHAR(50) NOT NULL, -- 'Pending', 'Completed', 'Failed', 'Refunded'
    CreatedAt DATETIME2 NOT NULL,
    CompletedAt DATETIME2 NULL
)
```

### Data Integrity Requirements
- **REQ-DB-001**: Foreign key constraints enforced for all relationships
- **REQ-DB-002**: Token balance cannot be negative (check constraint)
- **REQ-DB-003**: All financial amounts use DECIMAL for precision
- **REQ-DB-004**: Transaction timestamps use DATETIME2 for precision
- **REQ-DB-005**: Audit trail maintained for all token and payment operations
- **REQ-DB-006**: Backup and recovery procedures for financial data

---

## Integration Requirements

### Stripe Payment Integration
- **REQ-INT-001**: Stripe API version v2023-10-16 or later
- **REQ-INT-002**: Webhook endpoint secured with signature validation
- **REQ-INT-003**: Support for payment_intent.succeeded webhook events
- **REQ-INT-004**: Support for payment_intent.payment_failed webhook events
- **REQ-INT-005**: Idempotency keys used for all payment operations
- **REQ-INT-006**: Test mode configuration for development environment
- **REQ-INT-007**: Production keys management via secure environment variables

### Azure Speech Services Integration
- **REQ-INT-008**: Token deduction trigger when speech recognition job begins
- **REQ-INT-009**: Token refund trigger if speech recognition fails
- **REQ-INT-010**: No token requirements for speech recognition job status checks
- **REQ-INT-011**: Batch processing token validation before job submission

### OpenAI Integration
- **REQ-INT-012**: No token requirements for summary generation (included in transcription cost)
- **REQ-INT-013**: Summary generation failures do not trigger token refunds
- **REQ-INT-014**: Multiple summary regeneration attempts included in original token cost

---

## Performance & Monitoring Requirements

### System Performance
- **REQ-PERF-001**: Token balance checks complete within 100ms
- **REQ-PERF-002**: Payment processing UI responds within 2 seconds
- **REQ-PERF-003**: Webhook processing completes within 5 seconds
- **REQ-PERF-004**: Database queries optimized with proper indexing
- **REQ-PERF-005**: Concurrent token operations handled safely with locking

### Monitoring & Alerting
- **REQ-MON-001**: Payment success/failure rates monitored and alerted
- **REQ-MON-002**: Token balance discrepancies detected and flagged
- **REQ-MON-003**: Webhook delivery failures monitored and retried
- **REQ-MON-004**: Unusual spending patterns detected and flagged
- **REQ-MON-005**: Financial reconciliation reports generated daily
- **REQ-MON-006**: System health dashboard for payment processing status

---

## Testing Requirements

### Unit Testing
- **REQ-TEST-001**: Token calculation service unit tests covering all scenarios
- **REQ-TEST-002**: Payment processing service unit tests with mock Stripe
- **REQ-TEST-003**: Token validation logic unit tests for edge cases
- **REQ-TEST-004**: Database operation unit tests with transaction rollback

### Integration Testing
- **REQ-TEST-005**: End-to-end token purchase flow testing
- **REQ-TEST-006**: Payment webhook processing integration testing
- **REQ-TEST-007**: Token deduction and refund integration testing
- **REQ-TEST-008**: Multi-user concurrent operation testing

### Security Testing
- **REQ-TEST-009**: Payment endpoint security testing with invalid tokens
- **REQ-TEST-010**: SQL injection testing on all financial endpoints
- **REQ-TEST-011**: Rate limiting testing on payment endpoints
- **REQ-TEST-012**: Webhook signature validation testing

---

*This document supersedes all previous payment and monetization requirement documents.*