# User Modes & Demo Mode Requirements

## User Modes & Data Persistence

- REQ-USER-1: The system shall provide two user modes: Demo/Public (anonymous) and Paid (account-based).
- REQ-USER-2: In Demo/Public mode, the application shall serve only static/demo content. No actual uploads, file processing, or progress tracking shall occur in this mode. All upload and meeting features are simulated with static examples.
- REQ-USER-3: In Paid mode, authenticated users shall have upload progress, meeting history, and related data persist across browser refreshes and sessions.
- REQ-USER-4: The system shall clearly communicate data retention and privacy policies for each mode.

## Demo Mode Experience & Tour

- REQ-DEMO-1: The application shall default to Demo mode for all users who have not signed in.
- REQ-DEMO-2: In Demo mode, the AppBar shall be visually distinct (e.g., different color) and display “Demo” in the title.
- REQ-DEMO-3: A prominent “Sign In” button shall be present in the AppBar, replacing the previous toggle.
- REQ-DEMO-4: Demo mode shall provide a step-by-step interactive Tour using tooltips, guiding users through the main features and workflow.
- REQ-DEMO-5: The Tour shall be closable at any time, and users can navigate forward/backward through Tour steps.

## Demo Mode Simulated & Interactive Features

- REQ-DEMO-6: Demo mode shall simulate the full workflow: upload (via a button, not file picker), progress, speaker mapping, transcript editing, summary generation, and email sharing.
- REQ-DEMO-7: All features shall be interactive: users can edit speaker mappings, reassign transcript segments, edit the summary, and use the email dialog.
- REQ-DEMO-8: All actions in Demo mode operate on static/mock data; no real uploads, API calls, or emails are performed.
- REQ-DEMO-9: Tooltips and UI messaging shall clearly indicate that all actions are simulated and no real data is processed or sent.

## Demo Mode Restrictions

- REQ-DEMO-10: Upload is simulated: clicking “Upload” triggers a mock upload/progress sequence.
- REQ-DEMO-11: Speaker mapping and transcript editing are fully enabled for demonstration.
- REQ-DEMO-12: Summary generation and email sharing are simulated; sending an email shows a mock confirmation.
- REQ-DEMO-13: No limits are imposed on Demo mode usage per session.

## Demo Mode Transition & Messaging

- REQ-DEMO-14: The “Sign In” button is always visible in Demo mode.
- REQ-DEMO-15: Signing in transitions the user to Paid mode, enabling real uploads and persistent data.
- REQ-DEMO-16: The Tour and UI shall make the distinction between Demo and Paid modes clear; no banners or forced prompts are required.

## Demo Mode Analytics & Abuse Prevention

- REQ-DEMO-17: The system shall use a privacy-friendly analytics tool to track Demo mode usage, including page loads, Tour start/completion events, and “Sign In” button clicks.
- REQ-DEMO-18: No session or IP-based limits are required unless abuse is observed post-launch, but analytics shall be reviewed for potential abuse patterns.

## Demo Mode Accessibility & Technical Implementation

- REQ-DEMO-19: Demo mode shall meet all accessibility and mobile-responsiveness standards of the main app.
- REQ-DEMO-20: Demo mode content and workflow shall be implemented in client code, using static/mock data.
- REQ-DEMO-21: Demo mode shall be available in all environments (dev, staging, prod).
