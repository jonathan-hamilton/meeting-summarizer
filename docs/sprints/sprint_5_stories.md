

# Sprint 5: User Accounts, Demo Mode, Monetization, and Accessibility

## Sprint Overview

Sprint 5 focuses on enabling user account modes (Demo/Public vs. Paid), implementing a fully interactive Demo mode with a guided tour and simulated workflow, persistent upload progress and meeting history for paid users, integrating payment processing and token management, and ensuring accessibility compliance across the UI. This sprint lays the foundation for monetization, onboarding, and production readiness.

## Sprint Goals

- Implement user mode selection and data persistence logic
- Replace toggle with "Sign In" button and sign-in dialog
- Implement a fully interactive Demo mode with guided tour and simulated workflow
- Integrate secure payment processing and token/credit management
- Provide persistent upload progress and meeting history for paid users
- Ensure accessibility compliance for all interactive UI components
- Add analytics for demo usage and tour completion

## Progress Tracker

| Story ID | Title                                              | Status        | Dependencies         |
|----------|----------------------------------------------------|---------------|----------------------|
| S5.1     | User Mode Selection, Sign-In, and Demo Mode        | PENDING 🔄    | None                 |
| S5.2     | Payment Processing & Token Management Integration  | PENDING 🔄    | S5.1                 |
| S5.3     | Persistent Upload Progress & Meeting History (Paid)| PENDING 🔄    | S5.1, S5.2           |
| S5.4     | Accessibility Compliance Enhancements              | PENDING 🔄    | None                 |

## User Stories


### Story S5.1: User Mode Selection, Sign-In, and Demo Mode
As a user, I want to experience the app in Demo mode with a guided tour and simulated workflow, and be able to sign in to access Paid mode with real uploads and persistent data.

Acceptance Criteria:
- The application defaults to Demo mode for users who have not signed in
- In Demo mode, the AppBar is visually distinct and displays "Demo" in the title
- A prominent "Sign In" button is present in the AppBar, replacing the previous toggle
- Clicking "Sign In" opens a sign-in dialog for Paid mode
- Demo mode provides a step-by-step interactive Tour using tooltips, guiding users through the main features and workflow
- The Tour is closable at any time, and users can navigate forward/backward through Tour steps
- Demo mode simulates the full workflow: upload (via a button), progress, speaker mapping, transcript editing, summary generation, and email sharing
- All features are interactive: users can edit speaker mappings, reassign transcript segments, edit the summary, and use the email dialog
- All actions in Demo mode operate on static/mock data; no real uploads, API calls, or emails are performed
- Tooltips and UI messaging clearly indicate that all actions are simulated and no real data is processed or sent
- Upload is simulated: clicking "Upload" triggers a mock upload/progress sequence
- Speaker mapping and transcript editing are fully enabled for demonstration
- Summary generation and email sharing are simulated; sending an email shows a mock confirmation
- No limits are imposed on Demo mode usage per session
- The "Sign In" button is always visible in Demo mode
- Signing in transitions the user to Paid mode, enabling real uploads and persistent data
- The Tour and UI make the distinction between Demo and Paid modes clear; no banners or forced prompts are required
- Demo mode usage, Tour start/completion, and "Sign In" button clicks are tracked with a privacy-friendly analytics tool
- Demo mode meets all accessibility and mobile-responsiveness standards of the main app
- Demo mode content and workflow are implemented in client code, using static/mock data
- Demo mode is available in all environments (dev, staging, prod)

Dependencies: None

---

### Story S5.5: Automatic WAV Conversion for Audio Uploads
As a user uploading audio files, I want the system to automatically convert any non-WAV audio file to WAV format before transcription, so that my files are always compatible and transcription quality is maximized.

Acceptance Criteria:
- All uploaded audio files in non-WAV formats (e.g., MP3, M4A, FLAC, OGG, WEBM) are automatically converted to WAV format before being sent to the transcription service.
- Conversion uses a reliable tool (e.g., FFmpeg or equivalent library) and produces WAV files compatible with Azure Speech Services (PCM, 16kHz, mono preferred).
- If conversion fails, the user receives a clear error message and guidance for supported formats.
- Conversion operations and errors are logged for monitoring and debugging.
- No unnecessary conversion is performed if the file is already a valid WAV.
- The system handles conversion efficiently, even for large files, without excessive memory usage.


### Story S5.2: Payment Processing & Token Management Integration
As a paid user, I want to securely purchase and manage tokens/credits so that I can process meetings beyond the demo limits.

Acceptance Criteria:
- Integration with PCI-compliant payment provider (e.g., Stripe) for secure transactions
- Users can purchase token/credit packages via secure payment flow
- Payment process uses HTTPS and never exposes sensitive data to client
- Purchased tokens/credits are atomically assigned to user account and reflected in balance
- Users can view transaction history and download receipts
- Email notifications for successful payments, failures, and refunds
- Admin dashboard for payment and user balance management

Dependencies: S5.1

---

### Story S5.3: Persistent Upload Progress & Meeting History (Paid Users)
As a paid user, I want my upload progress and meeting history to persist across browser refreshes and sessions so that I can resume work and access past meetings.

Acceptance Criteria:
- Upload progress and meeting history are saved to user account in backend (Paid mode only)
- Data is restored on login or page refresh for paid users
- Real-time updates to progress and history
- Error handling for data sync failures

Dependencies: S5.1, S5.2

---

### Story S5.4: Accessibility Compliance Enhancements
As a user with accessibility needs, I want all interactive UI components to be fully accessible so that I can use the application with assistive technologies.

Acceptance Criteria:
- All UI components (chips, buttons, progress bars, dialogs, etc.) include ARIA labels, roles, and tabIndex
- UI follows WCAG 2.1 guidelines for color contrast, focus indicators, and semantic HTML
- Keyboard navigation is supported throughout the app

Dependencies: None

---

## Integration Notes

- Azure AD B2C setup required for Paid mode authentication
- Stripe (or equivalent) integration for payment processing
- Backend API endpoints for token management, upload progress, and meeting history
- Accessibility improvements may require updates to frontend component library usage
- Demo mode analytics may require integration with a privacy-friendly analytics tool

## Success Metrics

- User mode selection, sign-in, and demo experience work as specified
- Payment processing is secure, reliable, and user-friendly
- Paid users see persistent upload progress and meeting history
- Accessibility audits pass with no critical issues
- Demo mode analytics provide actionable insights

## Foundation for Next Sprint

- Enables advanced meeting features for paid users
- Provides infrastructure for future monetization and reporting
- Establishes accessibility and onboarding baseline for all future UI work

## Technical Rationale

These stories are chosen to enable monetization, user account management, onboarding, and accessibility, which are critical for production launch and compliance. Dependencies are minimized to allow parallel work on accessibility and demo onboarding while core account/payment features are implemented.

## User Stories

### Story S5.1: User Mode Selection & Data Persistence
As a user, I want to choose between Demo/Public (static demo) and Paid (account-based) modes so that my experience matches my privacy and persistence needs.

Acceptance Criteria:
- System provides clear option to select Demo/Public or Paid mode at entry or sign-in
- Demo/Public mode: application serves only static/demo content; no uploads, file processing, or progress tracking occurs
- All upload and meeting features in Demo/Public mode are simulated with static examples
- Paid mode: authenticated users have access to upload and meeting features, with persistent data
- Data retention and privacy policies are clearly communicated for each mode

Dependencies: None

---

### Story S5.2: Payment Processing & Token Management Integration
As a paid user, I want to securely purchase and manage tokens/credits so that I can process meetings beyond the demo limits.

Acceptance Criteria:
- Integration with PCI-compliant payment provider (e.g., Stripe) for secure transactions
- Users can purchase token/credit packages via secure payment flow
- Payment process uses HTTPS and never exposes sensitive data to client
- Purchased tokens/credits are atomically assigned to user account and reflected in balance
- Users can view transaction history and download receipts
- Email notifications for successful payments, failures, and refunds
- Admin dashboard for payment and user balance management

Dependencies: S5.1

---

### Story S5.3: Persistent Upload Progress & Meeting History (Paid Users)
As a paid user, I want my upload progress and meeting history to persist across browser refreshes and sessions so that I can resume work and access past meetings.

Acceptance Criteria:
- Upload progress and meeting history are saved to user account in backend (Paid mode only)
- Data is restored on login or page refresh for paid users
- Real-time updates to progress and history
- Error handling for data sync failures

Dependencies: S5.1, S5.2

---

### Story S5.4: Accessibility Compliance Enhancements
As a user with accessibility needs, I want all interactive UI components to be fully accessible so that I can use the application with assistive technologies.

Acceptance Criteria:
- All UI components (chips, buttons, progress bars, dialogs, etc.) include ARIA labels, roles, and tabIndex
- UI follows WCAG 2.1 guidelines for color contrast, focus indicators, and semantic HTML
- Keyboard navigation is supported throughout the app

Dependencies: None

---

## Integration Notes

- Azure AD B2C setup required for Paid mode authentication
- Stripe (or equivalent) integration for payment processing
- Backend API endpoints for token management, upload progress, and meeting history
- Accessibility improvements may require updates to frontend component library usage

## Success Metrics

- User mode selection and data persistence work as specified for both modes
- Payment processing is secure, reliable, and user-friendly
- Paid users see persistent upload progress and meeting history
- Accessibility audits pass with no critical issues

## Foundation for Next Sprint

- Enables advanced meeting features for paid users
- Provides infrastructure for future monetization and reporting
- Establishes accessibility baseline for all future UI work

## Technical Rationale

These stories are chosen to enable monetization, user account management, and accessibility, which are critical for production launch and compliance. Dependencies are minimized to allow parallel work on accessibility while core account/payment features are implemented.
