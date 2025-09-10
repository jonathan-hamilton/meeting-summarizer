# Sprint 6: User Management & Infrastructure + Azure Production Hosting

## Sprint Overview

Sprint 6 focuses on implementing user authentication, payment processing, persistent data storage, accessibility compliance, **and complete Azure production hosting deployment**. This sprint enables the transition from demo mode to a fully functional paid service with user accounts, token management, persistent meeting history, **and public production access via Azure hosting with comprehensive monitoring**.

## Sprint Goals

- Implement Azure storage and database infrastructure for persistent user data
- Set up secure payment processing and token management system
- Provide persistent upload progress and meeting history for paid users
- Ensure accessibility compliance across all UI components
- Enable user authentication and account management
- **Deploy complete production hosting infrastructure to Azure**
- **Implement comprehensive monitoring, alerting, and observability**
- **Enable public user access via hosted web application**

## Progress Tracker

| Story ID | Title                                              | Status        | Dependencies         |
|----------|----------------------------------------------------|---------------|----------------------|
| S6.1     | Azure Storage & Persistent Data Setup              | COMPLETE ✅   | None                 |
| S6.2     | User Management Interface & Authentication System  | COMPLETE ✅   | S6.1                 |
| S6.3     | Payment & Token System Setup                       | 85% COMPLETE 🏗️ | S6.1, S6.2           |
| S6.4     | Persistent Upload Progress & Meeting History        | PENDING ⏸️    | S6.1, S6.3           |
| S6.5     | Accessibility Compliance Enhancements              | PENDING ⏸️    | None                 |
| S6.6     | Footer Content & Legal Information                  | PENDING ⏸️    | None                 |
| S6.7     | Azure Production Hosting Deployment                | PENDING ⏸️    | S6.1, S6.3           |
| S6.8     | Production Monitoring & Observability Setup        | PENDING ⏸️    | S6.7                 |

## User Stories

### Story S6.1: Azure Storage & Persistent Data Setup
As a developer, I want to set up Azure storage and database so that paid user data is securely and persistently managed.

**Status: COMPLETE ✅**

**Completion Date:** September 7, 2025

**Dependencies**: None

**Implementation Summary:**
This story establishes the infrastructure foundation for paid user accounts with persistent data storage, meeting history, and secure file management using Azure services.

**Progress Update:**
**Increment 1 COMPLETE ✅**: Database Models & Entity Framework Setup
- Created User, Meeting, MeetingHistory entities with proper relationships
- Configured MeetingSummarizerDbContext with Azure SQL support
- Added initial database migrations with proper indexes and constraints
- Implemented GDPR compliance fields and 365-day retention policy

**Increment 2 COMPLETE ✅**: Azure Configuration & Key Vault Integration
- Implemented AzureConfigurationService for secure secret management
- Added Key Vault configuration with managed identity support and fallbacks
- Updated Program.cs with proper service registration and validation
- Enhanced appsettings with comprehensive Azure configuration options

**Increment 3 COMPLETE ✅**: User Storage Service & API Endpoints
- Implemented comprehensive UserStorageService with per-user blob isolation
- Created user-specific container naming pattern: `user-{userId}`
- Added secure file upload/download with content validation and size limits
- Implemented meeting artifact storage (transcripts, summaries, metadata)
- Built complete UserStorageController with 12 REST API endpoints
- Added GDPR-compliant data deletion capabilities
- Implemented storage tier management for cost optimization
- Added secure access URL generation with time-limited SAS tokens
- Integrated comprehensive error handling and audit logging
- Storage isolation prevents cross-user data access

**Increment 4 COMPLETE ✅**: Database Integration & Retention Policies
- Implemented UserManagementService with complete user lifecycle management
- Created UserManagementController with 15 REST API endpoints for user operations
- Added comprehensive token balance management and validation
- Implemented DataRetentionService for automated cleanup and cost optimization
- Built administrative tools for system health monitoring and maintenance
- Added GDPR-compliant account deletion with complete data removal
- Implemented smart retention policies for inactive users and old data
- Created storage tier archival system to reduce long-term costs
- Added comprehensive audit logging and operational statistics
- Integrated cross-service data consistency and relationship management

**Acceptance Criteria:**
- [✅] Entity Framework database setup with User, Meeting, MeetingHistory models
- [✅] Azure Key Vault integration for secure configuration management
- [✅] Azure Blob Storage configured for persistent storage of user-uploaded audio files and meeting artifacts (Paid mode only)
- [✅] Each paid user has logically isolated storage container or folder for data security
- [✅] Azure SQL Database configured for user metadata, meeting history, and token balances
- [✅] All storage operations use secure, authenticated access (Azure AD, SAS tokens) following least-privilege principles
- [✅] Storage retention and cleanup policies are configurable and clearly documented to users
- [✅] Backend API endpoints implemented for user data management and meeting history retrieval
- [✅] Data encryption at rest and in transit for all user information
- [✅] GDPR-compliant data handling and user data export/deletion capabilities

**Technical Notes:**
- Follow REQ-AZURE-1 through REQ-AZURE-5 in requirements
- Implement secure access patterns using Azure Managed Identity in production
- Use Azure Key Vault for sensitive configuration management
- Design for horizontal scaling and multi-region deployment
- **Data Retention Policy**: 365-day retention for paid users (token-only model)
- **Storage Tiers**: Hot tier (0-30 days), Cool tier (30-180 days), Archive tier (180+ days)
- **Cost Recovery**: 10-15% token price increase covers storage costs (~$0.15/month per user)
- **File Size Limits**: Verify 1GB limit - supports worst-case WAV files (60min = ~600MB)
- **Cleanup Jobs**: Automated deletion with 30-day user notifications
- **Value Proposition**: "Your meetings stored safely for a full year" included with token purchase

**Integration Points:**
- Integrates with payment system for user account provisioning
- Provides data persistence foundation for meeting history and upload progress
- Enables user authentication and session management
- Supports compliance and audit requirements

---

### Story S6.2: User Management Interface & Authentication System
As a user, I want to access my account information and authenticate securely so that I can manage my profile, access token features, and maintain secure sessions.

**Status: COMPLETE ✅**

**Completion Date:** September 9, 2025

**Dependencies**: S6.1 (Azure Storage & Persistent Data Setup)

**Implementation Summary:** 
This story delivers a complete JWT authentication system with user interface components for account management. Users can now securely register, login, and access their profile information with persistent authentication state. The system includes complete backend JWT services, frontend authentication dialogs, and user profile management interface.

**Progress Update:**
**Phase 1 COMPLETE ✅**: React Bug Fixes & Core Components
- Fixed critical React infinite loop in UserProfileDialog Zustand selectors
- Created UserProfileDialog.tsx component with Material-UI integration
- Created UserProfileForm.tsx component with form validation
- Implemented userProfileService.ts for API integration
- Updated userProfileStore.ts with proper selector patterns to prevent re-render cycles
- Validated user profile components integrate properly with existing App.tsx structure

**Phase 2 COMPLETE ✅**: Database Foundation & Role System
- Azure development environment fully configured and validated
- Test user successfully created and verified in Azure SQL Database
- API-to-Azure connectivity confirmed with Entity Framework SQL commands
- Frontend-to-API communication patterns established
- User Role system implemented (User, Admin roles with database migration)
- UserRole enum created and applied to User entity in Azure database

**Phase 3 COMPLETE ✅**: JWT Authentication Implementation
- **Phase 1 COMPLETE ✅**: Password hashing with bcrypt, JWT services, localStorage token storage, registration/login endpoints, authentication middleware, user profile integration
- **Phase 2 (Future Sprint)**: Email password reset, remember me functionality, account lockout protection  
- **Phase 3 (Long-term)**: Advanced session management, 2FA support, comprehensive security monitoring

**Acceptance Criteria:**

### Authentication System Implementation

**Phase 1: Database Foundation (COMPLETE ✅)**
- ✅ **User Role System**: User/Admin roles implemented with database migration
- ✅ **Database Schema**: User entity updated with Role field, migration applied to Azure
- ✅ **API Models**: UserManagementModels updated with Role property support
- ✅ **Development Environment**: Azure SQL Database connectivity established

**Phase 2: JWT Authentication Implementation (COMPLETE ✅)**
- ✅ **Password Storage**: PasswordHash and Salt fields added to User entity with database migration
- ✅ **JWT Services**: Complete JwtAuthenticationService with token generation, validation, and refresh
- ✅ **Authentication Endpoints**: Full AuthController with register, login, and refresh endpoints
- ✅ **Authorization Middleware**: JWT authentication middleware with role-based protection
- ✅ **Frontend Integration**: Complete LoginDialog, RegisterDialog, AuthManager with localStorage token storage
- ✅ **User Profile Integration**: UserProfileDialog consumes authenticated user data from JWT tokens
- ✅ **Authentication State Management**: Complete authStore with Zustand for authentication state
- ✅ **Authentication Flow**: Proper redirects, error handling, and user experience flow

**Phase 2: Production Ready Authentication (Sprint 6+)**
- ✓ **Email Password Reset**: Secure reset flow with token expiry
- ✓ **Remember Me**: Extended session option with longer refresh tokens  
- ✓ **Account Security**: Rate limiting and lockout protection
- ✓ **Session Management**: Basic token refresh and validation

**Phase 3: Enhanced Security (Future Sprint)**
- ✓ **Advanced Session Management**: Device tracking and session monitoring
- ✓ **Two-Factor Authentication**: Optional 2FA for enhanced security
- ✓ **Security Monitoring**: Login attempt tracking and suspicious activity alerts

### Core User Profile Interface
- ✓ **User Profile Dialog** accessible from AppBar user menu/icon
- ✓ **Profile displays**: User name, email, account creation date, account type (paid/demo)
- ✓ **Profile editing**: Allow users to update name and email with validation
- ✓ **Token balance display** prominently shown in profile dialog
- ✓ **Account actions**: Access to purchase history and account settings
- ✓ **Account deletion** option with GDPR-compliant data removal confirmation

### Token Balance Display Components  
- ✓ **AppBar token indicator**: Small, always-visible token balance component in header
- ✓ **Responsive design**: Shows full balance on desktop, abbreviated on mobile
- ✓ **Real-time updates**: Token balance updates across all components when changed
- ✓ **Visual states**: Different styling for sufficient/low/insufficient token balances
- ✓ **Click-through functionality**: Token balance component links to purchase dialog

### Token Purchase Preparation Dialog
- ✓ **Token Purchase Dialog** accessible from profile and AppBar token indicator
- ✓ **Package selection**: Display token packages with volume discount pricing
- ✓ **Pricing transparency**: Clear cost breakdown and per-token value display
- ✓ **Mock purchase interface**: Form fields for payment information (development mode)
- ✓ **Purchase confirmation**: Success/failure states with balance update display
- ✓ **Integration ready**: Interface-based design ready for real payment processor in S6.3

### Cost Estimation & Confirmation Dialog
- ✓ **Pre-processing estimation**: Dialog appears before meeting transcription begins
- ✓ **Duration analysis**: "This 23-minute meeting requires 180 tokens ($9.00)" display
- ✓ **Balance validation**: Shows current balance and confirms sufficient tokens
- ✓ **Proceed/Cancel options**: Allow user to continue or abort processing
- ✓ **Integration with FileUpload**: Seamlessly integrated into existing upload workflow

### Insufficient Tokens Handling
- ✓ **Insufficient Tokens Dialog**: Appears when user lacks required tokens
- ✓ **Clear messaging**: Shows shortfall - "You need 180 tokens but have 50"
- ✓ **Purchase prompt**: Direct link to token purchase dialog
- ✓ **Alternative options**: Cancel processing or purchase exact tokens needed
- ✓ **Graceful fallback**: Prevents processing without breaking user experience

### Navigation & Menu Integration
- ✓ **AppBar user menu**: Dropdown/menu icon for accessing profile and account features
- ✓ **Menu items**: Profile, Token Balance, Purchase History, Account Settings
- ✓ **Visual hierarchy**: Clear organization of user-related functionality
- ✓ **Responsive behavior**: Appropriate menu behavior across device sizes
- ✓ **Sign out functionality**: Integrated logout with session cleanup

**Technical Implementation Requirements:**

### User Profile Components
```typescript
// User Profile Dialog
- UserProfileDialog.tsx
- UserProfileForm.tsx  
- AccountActions.tsx

// Profile State Management
- userProfileStore.ts (Zustand)
- userProfileService.ts
```

### Token Balance Components
```typescript
// Token Display Components
- TokenBalance.tsx (AppBar indicator)
- TokenBalanceWidget.tsx (detailed display)
- TokenStatus.tsx (visual status indicator)

// Token State Management
- tokenStore.ts (Zustand)
- tokenService.ts (API integration)
```

### Purchase & Estimation Dialogs
```typescript
// Purchase Flow
- TokenPurchaseDialog.tsx
- TokenPackageSelector.tsx
- MockPaymentForm.tsx

// Estimation & Confirmation
- CostEstimationDialog.tsx
- InsufficientTokensDialog.tsx
- ProcessingConfirmationDialog.tsx
```

### Integration Points
- Extends existing AppBar component with user menu
- Integrates with existing FileUpload workflow for cost estimation
- Uses existing UserManagementService APIs from S6.1
- Prepares foundation for S6.3 payment system integration

**Technical Notes:**
- **JWT Security**: 30-minute access tokens, 7-day refresh tokens with bcrypt password hashing
- **Backend Implementation**: Complete AuthController, JwtAuthenticationService, and authentication middleware
- **Frontend Architecture**: React authentication dialogs with Material-UI, Zustand state management
- **Authentication Flow**: Proper login/register/logout with redirects and error handling
- **Token Management**: localStorage persistence with automatic token refresh and validation
- **User Profile Integration**: Profile dialog consumes authenticated user data directly from JWT claims
- **Database Schema**: User entity extended with PasswordHash, Salt, and Role fields
- **Security Middleware**: Role-based endpoint protection and JWT validation middleware
- **Development Ready**: Complete authentication system ready for production deployment

**Integration Points:**
- Extends S6.1 user management infrastructure
- Provides UI foundation for S6.3 payment system
- Integrates with existing demo/production mode switching
- Enhances existing FileUpload workflow with cost estimation

---

### Story S6.3: Payment & Token System Setup
As a user, I want to purchase duration-based tokens to process meetings with fair, transparent pricing that scales with meeting length.

**Status: 85% COMPLETE 🏗️ - September 9, 2025**

**Dependencies**: S6.1 (Azure Storage), S6.2 (User Authentication)

**Progress Update:**

**Increment 1 COMPLETE ✅**: Database Schema Extensions
- Created TokenPurchase entity with comprehensive Stripe integration fields
- Created TokenUsage entity with detailed usage tracking and volume discount support
- Applied database migration AddTokenSystemTables with proper relationships
- Extended User entity with token system navigation properties (TokenPurchases, TokenUsages)
- Configured Entity Framework relationships with proper cascading and indexes
- Database schema ready for production token management system

**Increment 2 COMPLETE ✅**: Token Calculation Service
- Implemented complete TokenCalculationService with duration-based pricing logic
- Created TokenCalculationResult model with comprehensive calculation details
- Added volume discount calculations (10%, 20%, 30%) with automatic tier detection
- Implemented fair pricing: 15-minute increments, $0.05 per token base rate
- Added comprehensive unit test suite (11 tests, all passing)
- Service registered in dependency injection container and production-ready
- Provides cost estimation, savings calculation, and user-friendly explanations

**Increment 3 COMPLETE ✅**: Token Management API Endpoints
- Implemented complete ITokenService interface with 8 comprehensive methods
- Created TokenService with full business logic for balance, purchases, usage, statistics
- Built TokenController with 8 authenticated REST API endpoints
- Added TokenApiModels with complete request/response DTOs and validation
- Comprehensive unit test suite with 13 tests covering all service operations
- JWT authentication integration with proper user identification
- Database persistence with proper GUID/string conversions and error handling
- Production-ready token management system with full CRUD operations

**Increment 4 COMPLETE ✅**: Stripe Payment Integration (Backend) - **S6.3.4**
- **Completion Date**: September 9, 2025
- Implemented complete IPaymentService interface with StripePaymentService implementation (526 lines)
- Created comprehensive PaymentModels with full DTOs and validation (CreatePaymentIntentRequest, PaymentIntentResult, WebhookProcessingResult)
- Built PaymentController with 4 authenticated REST API endpoints (create-intent, confirm, get details, refund)
- Implemented WebhookController with secure Stripe webhook processing and health check endpoint
- Created StripeWebhookMiddleware for webhook signature verification and event processing
- Integrated with TokenService for automatic balance updates on successful payments via webhooks
- Configured Azure Key Vault integration for secure Stripe API keys and webhook secrets
- Added comprehensive error handling, audit logging, and PCI compliance through Stripe infrastructure
- Fixed middleware routing issue preventing webhook health endpoint access (405 → 200 OK)
- Production-ready implementation tested with real Stripe test credentials and ngrok webhook tunnel
- **Acceptance Criteria**: All 7 criteria COMPLETE ✅ (Payment Integration, Transaction Audit Trail, Webhook Handling, Refund Support, Security & PCI Compliance, Token Balance Updates, Error Handling)

**Additional Infrastructure Improvements:**
- Fixed test infrastructure (133 passing tests, resolved compilation issues)
- Enhanced UI with repositioned TRY DEMO button and proper spacing
- Implemented React Router navigation patterns (eliminated window.location.href anti-pattern)
- Replaced mock payment system with production-ready Stripe integration

**Implementation Summary:**
This story implements a duration-based token system with volume discounts, where users pay proportionally to meeting length. The system uses mock payment processing for development while providing complete functionality and a seamless upgrade path to real payment providers.

## Token System Specification

### Core Token Structure
- **Base Unit**: 1 token = $0.05 (100 tokens = $5.00)
- **Duration-Based Pricing**: Tokens calculated by meeting length with automatic volume discounts
- **Fair Pricing Model**: Users pay proportionally to actual processing costs

### Token Calculation Formula
```
Base tokens = Math.Ceiling(duration_minutes / 15.0) * 100
Final tokens = Base tokens * volume_discount_multiplier

Volume Discount Multipliers:
- 15 minutes: 1.0 (no discount)
- 30 minutes: 0.9 (10% discount) 
- 45 minutes: 0.8 (20% discount)
- 60+ minutes: 0.7 (30% discount for 60+ minutes)
```

### Pricing Structure

| Meeting Duration | Base Calculation | Volume Discount | Tokens Required | Cost | Per-Minute Cost |
|-----------------|------------------|-----------------|----------------|------|-----------------|
| 15 minutes      | 100 tokens      | None           | 100 tokens     | $5.00| $0.33          |
| 30 minutes      | 200 tokens      | 10%            | 180 tokens     | $9.00| $0.30          |
| 45 minutes      | 300 tokens      | 20%            | 240 tokens     | $12.00| $0.27         |
| 60 minutes      | 400 tokens      | 30%            | 280 tokens     | $14.00| $0.23         |
| 75 minutes      | 500 tokens      | 30%            | 350 tokens     | $17.50| $0.23         |
| 90 minutes      | 600 tokens      | 30%            | 420 tokens     | $21.00| $0.23         |

### Business Model Benefits
- **Fair Cost Alignment**: Users pay proportionally to actual processing costs
- **Strong Profitability**: 73-76% profit margins across all meeting lengths
- **Competitive Advantage**: 3-5x cheaper than Rev.ai with no monthly subscriptions
- **Volume Rewards**: Automatic discounts for longer meetings

**Acceptance Criteria:**

### Core Token System
- ✓ **TokenCalculationService** implemented with duration-based pricing logic
- ✓ **Volume discount calculations** automatically applied (10%, 20%, 30%)
- ✓ **Token balance management** integrated with existing user accounts
- ✓ **Pre-processing cost estimation** shows users exact token requirements before processing
- ✓ **Mock payment system** simulates successful payments for development and testing

### User Experience
- ✓ **Duration analysis**: System analyzes uploaded audio and displays required tokens
- ✓ **Cost transparency**: "This 23-minute meeting requires 180 tokens ($9.00)" messaging
- ✓ **Token balance display**: Current balance prominently shown in user dashboard
- ✓ **Purchase flow**: Simple token buying interface with clear pricing
- ✓ **Usage tracking**: Complete history of tokens spent per meeting

### Payment Integration
- ✓ **Mock payment processor** for development with interface-based design
- ✓ **Token purchase API endpoints** handle payment processing and balance updates
- ✓ **Payment webhook simulation** for transaction confirmation
- ✓ **Refund handling** for failed processing or user dissatisfaction
- ✓ **Transaction audit trail** for all token purchases and usage

### Database Extensions
- ✓ **UserAccount.TokenBalance** field added for balance tracking
- ✓ **TokenPurchases table** for purchase history and reconciliation
- ✓ **TokenUsage table** for per-meeting consumption tracking
- ✓ **Payment integration** ready for future real processor migration

### Administrative Tools
- ✓ **Admin dashboard** for token system monitoring and management
- ✓ **Usage analytics** showing system-wide token consumption patterns
- ✓ **Payment reconciliation** tools for transaction management
- ✓ **Token adjustment** capabilities for customer service issues

**Technical Implementation Requirements:**

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

### Database Schema Extensions
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

**Technical Notes:**
- Mock payment system provides complete functionality except live credit card processing
- Interface-based design enables seamless migration to real payment processors
- Token pricing includes 365-day storage costs (factored into profit margins)
- System maintains 73-76% profit margins across all meeting durations
- Volume discounts encourage longer meeting usage while maintaining profitability

### Story S6.3: Payment & Token System Setup
As a user, I want to purchase duration-based tokens to process meetings with fair, transparent pricing that scales with meeting length.

**Status: 40% COMPLETE 🏗️**

**Completion Progress:** September 9, 2025

**Dependencies**: S6.1 (Azure Storage), S6.2 (User Management Interface)

**Implementation Summary:**
This story implements the backend duration-based token system with volume discounts, integrating with the UI components created in S6.2. The system uses mock payment processing for development while providing complete functionality and a seamless upgrade path to real payment providers.

## Token System Specification

### Core Token Structure
- **Base Unit**: 1 token = $0.05 (100 tokens = $5.00)
- **Duration-Based Pricing**: Tokens calculated by meeting length with automatic volume discounts
- **Fair Pricing Model**: Users pay proportionally to actual processing costs

### Token Calculation Formula
```
Base tokens = Math.Ceiling(duration_minutes / 15.0) * 100
Final tokens = Base tokens * volume_discount_multiplier

Volume Discount Multipliers:
- 15 minutes: 1.0 (no discount)
- 30 minutes: 0.9 (10% discount) 
- 45 minutes: 0.8 (20% discount)
- 60+ minutes: 0.7 (30% discount for 60+ minutes)
```

### Pricing Structure

| Meeting Duration | Base Calculation | Volume Discount | Tokens Required | Cost | Per-Minute Cost |
|-----------------|------------------|-----------------|----------------|------|-----------------|
| 15 minutes      | 100 tokens      | None           | 100 tokens     | $5.00| $0.33          |
| 30 minutes      | 200 tokens      | 10%            | 180 tokens     | $9.00| $0.30          |
| 45 minutes      | 300 tokens      | 20%            | 240 tokens     | $12.00| $0.27         |
| 60 minutes      | 400 tokens      | 30%            | 280 tokens     | $14.00| $0.23         |
| 75 minutes      | 500 tokens      | 30%            | 350 tokens     | $17.50| $0.23         |
| 90 minutes      | 600 tokens      | 30%            | 420 tokens     | $21.00| $0.23         |

### Business Model Benefits
- **Fair Cost Alignment**: Users pay proportionally to actual processing costs
- **Strong Profitability**: 73-76% profit margins across all meeting lengths
- **Competitive Advantage**: 3-5x cheaper than Rev.ai with no monthly subscriptions
- **Volume Rewards**: Automatic discounts for longer meetings

**Acceptance Criteria:**

### Core Token System
- ✓ **TokenCalculationService** implemented with duration-based pricing logic
- ✓ **Volume discount calculations** automatically applied (10%, 20%, 30%)
- ✓ **Token balance management** integrated with existing user accounts
- ✓ **Pre-processing cost estimation** integrates with S6.2 cost estimation dialog
- ✓ **Mock payment system** simulates successful payments for development and testing

### User Experience Integration
- ✓ **Duration analysis**: System analyzes uploaded audio and displays required tokens in S6.2 dialogs
- ✓ **Cost transparency**: Backend provides pricing data for S6.2 UI components
- ✓ **Token balance updates**: Real-time balance updates to S6.2 token display components
- ✓ **Purchase processing**: Backend handles token purchases initiated from S6.2 purchase dialog
- ✓ **Usage tracking**: Complete history accessible through S6.2 profile interface

### Payment Integration
- ✓ **Mock payment processor** for development with interface-based design
- ✓ **Token purchase API endpoints** handle payment processing and balance updates
- ✓ **Payment webhook simulation** for transaction confirmation
- ✓ **Refund handling** for failed processing or user dissatisfaction
- ✓ **Transaction audit trail** for all token purchases and usage

### Database Extensions
- ✓ **UserAccount.TokenBalance** field added for balance tracking
- ✓ **TokenPurchases table** for purchase history and reconciliation
- ✓ **TokenUsage table** for per-meeting consumption tracking
- ✓ **Payment integration** ready for future real processor migration

### Administrative Tools
- ✓ **Admin dashboard** for token system monitoring and management
- ✓ **Usage analytics** showing system-wide token consumption patterns
- ✓ **Payment reconciliation** tools for transaction management
- ✓ **Token adjustment** capabilities for customer service issues

**Technical Implementation Requirements:**

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

### Database Schema Extensions
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

**Technical Notes:**
- Mock payment system provides complete functionality except live credit card processing
- Interface-based design enables seamless migration to real payment processors
- Token pricing includes 365-day storage costs (factored into profit margins)
- System maintains 73-76% profit margins across all meeting durations
- Volume discounts encourage longer meeting usage while maintaining profitability

**Integration Points:**
- Extends existing S6.1 user management and storage infrastructure
- Integrates with S6.2 user interface components for seamless user experience
- Provides backend services for S6.2 dialogs and token display components
- Enables business analytics and revenue tracking capabilities

---

### Story S6.4: Persistent Upload Progress & Meeting History (Paid Users)
As a paid user, I want my upload progress and meeting history to persist across browser refreshes and sessions so that I can resume work and access past meetings.

**Status: PENDING ⏸️**

**Dependencies**: S6.1 (Azure Storage), S6.2 (Payment System)

**Implementation Summary:**
This story provides paid users with persistent meeting data, upload progress tracking, and comprehensive meeting history management that survives browser sessions and device changes.

**Acceptance Criteria:**
- ✓ Upload progress and meeting history saved to user account in backend (Paid mode only)
- ✓ Data restored on login or page refresh for paid users with seamless experience
- ✓ Real-time updates to progress and history across multiple browser tabs/devices
- ✓ Error handling for data sync failures with offline capability and conflict resolution
- ✓ Meeting history includes transcripts, summaries, action items, and speaker mappings
- ✓ Search functionality across meeting history by date, participants, keywords, or action items
- ✓ Export capabilities for meeting data (PDF, Word, JSON) with user-controlled access
- ✓ Meeting sharing capabilities between authenticated users
- ✓ Data retention policies with user control over meeting deletion and archival

**Technical Notes:**
- Use Azure SQL/Cosmos DB for persistent storage with proper indexing for search
- Implement backend APIs for progress/history management with caching for performance
- Design for eventual consistency and offline-first experience
- Implement WebSocket or Server-Sent Events for real-time updates

**Integration Points:**
- Requires user authentication from payment system integration
- Uses Azure storage infrastructure for persistent data
- Enhances demo mode tour with paid feature demonstrations
- Enables advanced search and analytics capabilities

---

### Story S6.4: Persistent Upload Progress & Meeting History (Paid Users)
As a paid user, I want my upload progress and meeting history to persist across browser refreshes and sessions so that I can resume work and access past meetings.

**Status: PENDING ⏸️**

**Dependencies**: S6.1 (Azure Storage), S6.3 (Payment & Token System)

**Implementation Summary:**
This story provides paid users with persistent meeting data, upload progress tracking, and comprehensive meeting history management that survives browser sessions and device changes.

**Acceptance Criteria:**
- ✓ Upload progress and meeting history saved to user account in backend (Paid mode only)
- ✓ Data restored on login or page refresh for paid users with seamless experience
- ✓ Real-time updates to progress and history across multiple browser tabs/devices
- ✓ Error handling for data sync failures with offline capability and conflict resolution
- ✓ Meeting history includes transcripts, summaries, action items, and speaker mappings
- ✓ Search functionality across meeting history by date, participants, keywords, or action items
- ✓ Export capabilities for meeting data (PDF, Word, JSON) with user-controlled access
- ✓ Meeting sharing capabilities between authenticated users
- ✓ Data retention policies with user control over meeting deletion and archival

**Technical Notes:**
- Use Azure SQL/Cosmos DB for persistent storage with proper indexing for search
- Implement backend APIs for progress/history management with caching for performance
- Design for eventual consistency and offline-first experience
- Implement WebSocket or Server-Sent Events for real-time updates

**Integration Points:**
- Requires user authentication from payment system integration
- Uses Azure storage infrastructure for persistent data
- Enhances demo mode tour with paid feature demonstrations
- Enables advanced search and analytics capabilities

---

### Story S6.5: Accessibility Compliance Enhancements
As a user with accessibility needs, I want all interactive UI components to be fully accessible so that I can use the application with assistive technologies.

**Status: PENDING ⏸️**

**Dependencies**: None

**Implementation Summary:**
This story ensures comprehensive accessibility compliance across all application features, making the service usable for users with disabilities and meeting legal accessibility requirements.

**Acceptance Criteria:**
- ✓ All UI components (chips, buttons, progress bars, dialogs, etc.) include proper ARIA labels, roles, and tabIndex
- ✓ UI follows WCAG 2.1 Level AA guidelines for color contrast, focus indicators, and semantic HTML structure
- ✓ Keyboard navigation supported throughout the app with logical tab order and keyboard shortcuts
- ✓ Screen reader compatibility tested and verified for all major screen reading software
- ✓ Audio transcription results properly marked up for assistive technology consumption
- ✓ Form validation errors clearly announced to screen readers with proper error association
- ✓ Modal dialogs and dynamic content changes properly announced
- ✓ Alternative text provided for all informational images and icons
- ✓ Color is not the only means of conveying information (patterns, text, icons also used)
- ✓ Automated accessibility testing integrated into CI/CD pipeline

**Technical Notes:**
- Audit and update Material-UI components for accessibility with custom overrides where needed
- Use automated (axe-core) and manual accessibility testing tools
- Implement focus management for single-page application navigation
- Test with multiple assistive technologies (NVDA, JAWS, VoiceOver)

**Integration Points:**
- Applies to all existing and future UI components
- Ensures tour system is accessible for demo mode users
- Supports compliance requirements for enterprise customers
- Establishes accessibility baseline for future development

---

### Story S6.5: Footer Content & Legal Information
As a user, I want clear legal information and support contact details in the footer so I can understand my rights and get help when needed.

**Status: PENDING ⏸️**

**Dependencies**: None

**Implementation Summary:**
This story adds a comprehensive footer with legal information, support contact, and company branding to establish trust and provide essential user information.

**Acceptance Criteria:**
- ✓ Footer displays "© 2025 Vertec Solutions LLC" prominently
- ✓ Support contact shows "support@meeting-summary.io" (placeholder until domain active)
- ✓ Links to Terms of Service and Privacy Policy pages (content TBD)
- ✓ Footer is responsive and displays properly on all screen sizes
- ✓ Footer remains at bottom of page regardless of content height
- ✓ All links are accessible and follow WCAG guidelines
- ✓ Footer styling consistent with overall application design
- ✓ Social media links section prepared for future implementation

**Technical Notes:**
- Legal jurisdiction not specified - generic terms acceptable
- Domain activation pending - use placeholder email for now
- Social media integration deferred to future sprint
- Footer should be sticky/fixed at bottom of viewport
- **Data retention policy displayed in Terms of Service only** (not footer)
- Terms of Service should include 365-day retention policy for paid users
- Consider data retention policy display when pricing analysis complete

**Integration Points:**
- Appears on all application pages (demo and paid modes)
- Links integrate with routing system for Terms/Privacy pages
- Support contact ready for helpdesk system integration
- Branding consistent with overall company identity

---

### Story S6.6: Azure Production Hosting Deployment
As a business owner, I want the application deployed to Azure production environment so that users can access the service publicly via a hosted web application.

**Status: PENDING ⏸️**

**Dependencies**: S6.1 (Azure Storage), S6.2 (Payment System)

**Implementation Summary:**
This story establishes production Azure hosting infrastructure for both the .NET API backend and React frontend, enabling public access to the meeting summary service with proper security, scaling, and CI/CD automation.

**Acceptance Criteria:**
- ✓ Azure App Service configured and deployed for .NET 9 Web API backend with proper scaling rules
- ✓ Azure Static Web Apps or App Service hosting for React frontend with CDN acceleration
- ✓ Azure Key Vault integration for secure API key management (OpenAI, Azure Speech, Stripe)
- ✓ Custom domain setup with SSL/TLS certificates and HTTPS enforcement
- ✓ Production environment configuration with proper logging and error handling
- ✓ CI/CD pipeline implemented with GitHub Actions for automated deployment
- ✓ Database connection strings and storage account keys secured in Key Vault
- ✓ Environment-specific configuration for Development, Staging, and Production
- ✓ Health check endpoints configured for load balancer and monitoring
- ✓ Auto-scaling policies configured based on CPU/memory/request volume

**Technical Notes:**
- Follow REQ-HOSTING-1 through REQ-HOSTING-7 in requirements roadmap
- Use Azure Managed Identity for secure service-to-service authentication
- Implement blue-green deployment strategy for zero-downtime updates
- Configure Application Gateway or Front Door for advanced routing and security
- Set up Azure CDN for static asset delivery and improved global performance

**Integration Points:**
- Integrates with Azure storage and database infrastructure from S6.1
- Uses payment system configurations from S6.2
- Provides hosting foundation for monitoring setup in S6.7
- Enables public user access and production readiness

---

### Story S6.7: Production Monitoring & Observability Setup
As a system administrator, I want comprehensive monitoring and alerting in place so that I can ensure system reliability, track business metrics, and respond to issues proactively.

**Status: PENDING ⏸️**

**Dependencies**: S6.6 (Azure Hosting)

**Implementation Summary:**
This story implements production-grade monitoring, logging, and alerting infrastructure to ensure operational visibility, business intelligence, and proactive issue resolution for the hosted audio processing service.

**Acceptance Criteria:**
- ✓ Azure Application Insights integrated for application performance monitoring (APM)
- ✓ Real-time dashboards showing system health, response times, error rates, and throughput
- ✓ Custom telemetry events for business metrics (audio processing, token usage, user behavior)
- ✓ Azure Log Analytics configured for centralized logging with correlation IDs
- ✓ Alert rules configured for critical system events (API failures, high latency, storage issues)
- ✓ Audio processing pipeline monitoring (file sizes, transcription times, success/failure rates)
- ✓ Cost monitoring and spending alerts for Azure services (storage, compute, AI services)
- ✓ User experience monitoring (page load times, API response times, JavaScript errors)
- ✓ Security monitoring (failed authentication attempts, suspicious activity patterns)
- ✓ Health check endpoints for all critical services (database, storage, OpenAI, Azure Speech)

**Technical Notes:**
- Follow REQ-MONITOR-1 through REQ-MONITOR-10 in requirements roadmap
- Implement structured logging with correlation IDs for request tracing
- Set up automated alerting with escalation policies (email → SMS → PagerDuty)
- Configure cost thresholds with daily/weekly spending alerts
- Create business intelligence dashboards for revenue and usage analytics

**Integration Points:**
- Monitors the production hosting infrastructure from S6.6
- Tracks user behavior and payment processing from S6.2
- Provides visibility into storage usage and costs from S6.1
- Enables data-driven optimization and scaling decisions

---

## Integration Notes

- Azure AD B2C setup required for Paid mode authentication and user management
- Azure Blob Storage and SQL/Cosmos DB setup for persistent user data and meeting history
- Stripe integration for secure payment processing and subscription management
- Backend API endpoints for token management, upload progress, and meeting history
- Accessibility improvements require comprehensive audit of Material-UI component usage
- WebSocket/SSE implementation for real-time data synchronization across user sessions
- **Azure App Service and Static Web Apps deployment for production hosting**
- **Application Insights and Log Analytics for comprehensive monitoring and observability**
- **GitHub Actions CI/CD pipeline for automated deployment and updates**

## Success Metrics

- Azure storage and database operational and secure with proper access controls
- Payment processing and token management functional and auditable with fraud protection
- Paid users experience seamless persistent upload progress and meeting history
- Accessibility audits pass WCAG 2.1 Level AA compliance with no critical issues
- User conversion from demo to paid accounts meets target conversion rates
- System handles expected user load with proper scaling and performance
- **Production hosting infrastructure deployed and publicly accessible**
- **Monitoring dashboards provide real-time visibility into system health and business metrics**
- **CI/CD pipeline enables reliable, automated deployments with rollback capability**

## Foundation for Next Sprint

- Enables full production launch with paid user accounts and persistent data
- Provides infrastructure for advanced analytics and business intelligence
- Establishes compliance baseline for enterprise sales and partnerships
- Supports customer success and retention through persistent user experience
- Enables advanced features like team collaboration and meeting sharing
- **Production hosting foundation enables mobile PWA deployment in Sprint 7**
- **Monitoring infrastructure supports operational excellence and business intelligence**
- **Public access enables user acquisition and growth marketing campaigns**

## Technical Rationale

Sprint 6 establishes the complete production infrastructure necessary for monetization, user retention, **and public accessibility**. By implementing persistent data storage, secure payment processing, accessibility compliance, **comprehensive Azure hosting, and production-grade monitoring**, the application becomes ready for enterprise customers, legal compliance requirements, **and public user acquisition**. These features directly support business goals of user acquisition, retention, and revenue generation while ensuring inclusive design for all users **and operational excellence through comprehensive observability**.

## Extended Timeline Justification

**Original Estimate**: 4-5 weeks  
**Updated Estimate**: 5-6 weeks

The timeline extension accounts for the **critical addition of Azure production hosting (S6.6) and comprehensive monitoring setup (S6.7)**. While user management and payment infrastructure represent the core Sprint 6 work, production hosting deployment is essential for:

1. **Public User Access**: Users cannot access a service that isn't hosted
2. **Mobile Foundation**: Sprint 7 mobile development requires a hosted backend
3. **Business Viability**: Revenue generation requires publicly accessible service
4. **Production Readiness**: Monitoring must be in place before launch

The additional 1-2 weeks ensures production infrastructure is properly configured, secured, monitored, and tested before public launch.
