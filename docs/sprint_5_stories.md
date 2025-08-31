ds## Sprint Overview

Sprint 5 focuses on enabling user account modes (Demo/Public vs. Paid), implementing persistent upload progress and meeting history for paid users, integrating payment processing and token management, and ensuring accessibility compliance across the UI. This sprint also includes the required Azure storage and payment system setup to support these features.

## Sprint Goals

- Implement user mode selection logic with static demo content for Demo/Public mode
- Set up Azure storage and database for persistent user data in Paid mode
- Integrate secure payment processing and token/credit management
- Provide persistent upload progress and meeting history for paid users
- Ensure accessibility compliance for all interactive UI components

## Progress Tracker

| Story ID | Title                                              | Status        | Dependencies         |
|----------|----------------------------------------------------|---------------|----------------------|
| S5.1     | User Mode Selection & Demo Content                 | IN PROGRESS 🔄| None                 |
| S5.2     | Azure Storage & Persistent Data Setup              | PENDING 🔄    | S5.1                 |
| S5.3     | Payment & Token System Setup                       | PENDING 🔄    | S5.1                 |
| S5.4     | Persistent Upload Progress & Meeting History (Paid)| PENDING 🔄    | S5.2, S5.3           |
| S5.5     | Accessibility Compliance Enhancements              | PENDING 🔄    | None                 |

## User Stories

### Story S5.1: User Mode Selection & Demo Content
As a user, I want to choose between Demo/Public (static demo) and Paid (account-based) modes so that my experience matches my privacy and persistence needs.

**Status: IN PROGRESS 🔄 (~60% Complete)**

**Completion Date:** August 30, 2025 (Incremental Progress)

**Implementation Summary:**
✅ **Completed Components:**
- AppModeContext with toggle-based mode selection (demo/development/production)
- Complete demo API service with comprehensive mock responses and simulated processing workflows
- Mode-aware routing infrastructure (/ → /demo, /app for production)
- Demo mode visual distinction (purple AppBar, "Demo" labeling)
- Simulated file upload without file picker using demo data
- Demo-aware components (FileUpload, speaker mapping, transcript display)
- Email simulation for demo mode (fixed bug preventing real API calls)
- Complete tour step documentation (Steps 1-8) with conditional logic and workflow details
- Demo workflow foundation through transcript display and speaker mapping

❌ **Missing Components (Required for S5.1 Completion):**
- Interactive guided tour system with Material-UI Popovers/Dialogs for step-by-step guidance
- Sign-In/Sign-Out button replacing development toggle in AppBar with authentication dialog
- Complete demo workflow beyond transcript display (summary generation → email sharing UI integration)
- Tour-driven feature access (all demo features only available through guided tour)
- Tour auto-start functionality and navigation controls (forward/backward/skip/close)
- Demo mode messaging and visual indicators (tooltips clarifying simulation)

Acceptance Criteria:
- ✅ System provides clear option to select Demo/Public or Paid mode at entry or sign-in
- ✅ Demo/Public mode: application serves only static/demo content; no uploads, file processing, or progress tracking occurs
- ✅ All upload and meeting features in Demo/Public mode are simulated with static examples
- ❌ Paid mode: authenticated users have access to upload and meeting features
- ❌ Data retention and privacy policies are clearly communicated for each mode

**Technical Notes:**
- Chose client-side routing over server-side mode detection for better development experience
- Established unified store architecture supporting both modes without component duplication
- AppModeContext provides complete tour state foundation but tour UI components not built
- Demo API service fully functional but not integrated with missing UI components (summary/email flows)

**Integration Points:**
- Enhanced store ready for tour progress tracking
- All demo API endpoints implemented and tested
- Component architecture supports mode-aware behavior
- Performance and validation improvements benefit both demo and production modes

**Next Steps for S5.1 Completion:**
1. Implement TourPopover component with Material-UI Backdrop and Portal for step highlighting
2. Replace development environment toggle with Sign-In/Sign-Out button in AppBar
3. Build missing UI components: Summary generation display and Email sharing dialog for demo
4. Integrate tour system with existing demo-aware components
5. Add tour auto-start, navigation controls, and completion tracking

Dependencies: None

Developer Notes:
- Use Azure AD B2C for authentication in Paid mode
- Static assets for demo content

---

### Story S5.2: Azure Storage & Persistent Data Setup
As a developer, I want to set up Azure storage and database so that paid user data is securely and persistently managed.

Acceptance Criteria:
- Azure Blob Storage is configured for persistent storage of user-uploaded audio files and meeting artifacts (Paid mode only)
- Each paid user has a logically isolated storage container or folder
- Azure SQL Database or Cosmos DB is configured for user metadata, meeting history, and token balances
- All storage operations use secure, authenticated access (Azure AD, SAS tokens)
- Storage retention and cleanup policies are configurable and documented

Dependencies: S5.1

Developer Notes:
- Follow REQ-AZURE-1 through REQ-AZURE-5 in requirements

---

### Story S5.3: Payment & Token System Setup
As a developer, I want to set up payment and token management infrastructure so that users can securely purchase and use credits.

Acceptance Criteria:
- PCI-compliant payment provider account (e.g., Stripe) is configured with API keys and webhook endpoints
- Payment provider supports token/credit package products with pricing managed via dashboard
- Backend implements secure webhook endpoints for payment confirmation, refunds, and token balance updates
- Admin tools are available for reconciling transactions, managing token packages, and auditing events
- All payment and token operations are logged for audit and compliance

Dependencies: S5.1

Developer Notes:
- Follow REQ-PAY-SETUP-1 through REQ-PAY-SETUP-5 in requirements

---

### Story S5.4: Persistent Upload Progress & Meeting History (Paid Users)
As a paid user, I want my upload progress and meeting history to persist across browser refreshes and sessions so that I can resume work and access past meetings.

Acceptance Criteria:
- Upload progress and meeting history are saved to user account in backend (Paid mode only)
- Data is restored on login or page refresh for paid users
- Real-time updates to progress and history
- Error handling for data sync failures

Dependencies: S5.2, S5.3

Developer Notes:
- Use Azure SQL/Cosmos DB for persistent storage
- Implement backend APIs for progress/history management

---

### Story S5.5: Accessibility Compliance Enhancements
As a user with accessibility needs, I want all interactive UI components to be fully accessible so that I can use the application with assistive technologies.

Acceptance Criteria:
- All UI components (chips, buttons, progress bars, dialogs, etc.) include ARIA labels, roles, and tabIndex
- UI follows WCAG 2.1 guidelines for color contrast, focus indicators, and semantic HTML
- Keyboard navigation is supported throughout the app

Dependencies: None

Developer Notes:
- Audit and update Material-UI components for accessibility
- Use automated and manual accessibility testing tools

---

## Integration Notes

- Azure AD B2C setup required for Paid mode authentication
- Azure Blob Storage and SQL/Cosmos DB setup for persistent user data
- Stripe (or equivalent) integration for payment processing
- Backend API endpoints for token management, upload progress, and meeting history
- Accessibility improvements may require updates to frontend component library usage

## Success Metrics

- User mode selection and demo/static content work as specified
- Azure storage and database are operational and secure
- Payment processing and token management are functional and auditable
- Paid users see persistent upload progress and meeting history
- Accessibility audits pass with no critical issues

## Foundation for Next Sprint

- Enables advanced meeting features for paid users
- Provides infrastructure for future monetization and reporting
- Establishes accessibility baseline for all future UI work

## Technical Rationale

These stories are chosen to enable monetization, user account management, and accessibility, which are critical for production launch and compliance. Dependencies are minimized to allow parallel work on accessibility while core account/payment features are implemented.
