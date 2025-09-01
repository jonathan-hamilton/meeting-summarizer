# Demo Mode & Tour System Requirements

This document contains all requirements related to demo experience, guided tours, and user onboarding.

## Demo Mode Experience & Tour

### Core Demo Mode Features
- **REQ-DEMO-1**: The application shall default to Demo mode for all users who have not signed in
- **REQ-DEMO-2**: In Demo mode, the AppBar shall be visually distinct (e.g., different color) and display "Demo" next to the title. The AppBar color and label must be clearly different from Paid mode
- **REQ-DEMO-3**: A prominent "Sign In" button shall be present in the AppBar, replacing the previous toggle. In Paid mode, this becomes a "Sign Out" button
- **REQ-DEMO-4**: Demo mode shall provide a step-by-step interactive Tour using tooltips, popovers, or dialogs, guiding users through the main features and workflow. The Tour shall always start automatically when the user lands on the /demo page
- **REQ-DEMO-5**: The Tour shall be closable at any time, and users can navigate forward/backward through Tour steps. All demo features are only available through the guided tour

### Tour Step Management
- **REQ-DEMO-22**: System shall implement tour step tracking with numbered steps and step-specific content
- **REQ-DEMO-23**: Tour steps shall include Step 9 (Summary) with specific guidance for summary generation
- **REQ-DEMO-24**: Tour overlays shall be positioned absolutely with high z-index (9999) to appear over other content
- **REQ-DEMO-25**: Tour steps shall include close functionality with individual step closure tracking
- **REQ-DEMO-26**: Tour content shall be centered and clearly visible with appropriate contrast (grey.700 background, white text)
- **REQ-DEMO-27**: Tour system shall implement automatic step progression based on user actions and workflow completion
- **REQ-DEMO-28**: Tour shall provide navigation controls (forward/backward/skip/close) with functional step transitions

## Demo Mode Simulated & Interactive Features

### Simulated Workflows
- **REQ-DEMO-6**: Demo mode shall simulate the full workflow: upload (via a button, not file picker), progress, speaker mapping, transcript editing, summary generation, and email sharing, all using static/mock data only
- **REQ-DEMO-7**: All features shall be interactive: users can edit speaker mappings, reassign transcript segments, edit the summary, and use the email dialog, but all actions are simulated and operate on static/mock data
- **REQ-DEMO-8**: No real uploads, API calls, or emails are performed in Demo mode. Demo mode is strictly static and does not persist any data or interact with the backend
- **REQ-DEMO-9**: Tooltips and UI messaging shall clearly indicate that all actions are simulated and no real data is processed or sent

## Demo Mode Restrictions

### Functional Limitations
- **REQ-DEMO-10**: Upload is simulated: clicking "Upload" triggers a mock upload/progress sequence. No file picker or real upload is available in Demo mode
- **REQ-DEMO-11**: Speaker mapping and transcript editing are fully enabled for demonstration, but only affect static/mock data
- **REQ-DEMO-12**: Summary generation and email sharing are simulated; sending an email shows a mock confirmation dialog only
- **REQ-DEMO-13**: No limits are imposed on Demo mode usage per session

## Demo Mode Transition & Messaging

### Mode Switching
- **REQ-DEMO-14**: The "Sign In" button is always visible in Demo mode. Clicking it opens a dialog to sign in and switch to Paid mode
- **REQ-DEMO-15**: Signing in transitions the user to Paid mode, enabling real uploads and persistent data. The demo session is not preserved after sign-in
- **REQ-DEMO-16**: The Tour and UI shall make the distinction between Demo and Paid modes clear; no banners or forced prompts are required, but visual cues (AppBar color, label, tooltips) must be present

## Demo Mode Analytics & Abuse Prevention

### Usage Tracking
- **REQ-DEMO-17**: The system shall use a privacy-friendly analytics tool to track Demo mode usage, including page loads, Tour start/completion events, and "Sign In" button clicks. Analytics implementation may be deferred until after initial launch
- **REQ-DEMO-18**: No session or IP-based limits are required unless abuse is observed post-launch, but analytics shall be reviewed for potential abuse patterns

## Demo Mode Accessibility & Technical Implementation

### Technical Architecture
- **REQ-DEMO-19**: Demo mode shall meet all accessibility and mobile-responsiveness standards of the main app
- **REQ-DEMO-20**: Demo mode content and workflow shall be implemented in client code, using static/mock data. Demo and Paid modes must have completely separate state management (e.g., Zustand stores), and demo logic must not leak into paid mode. Duplication is preferred over conditional logic for demo/paid separation
- **REQ-DEMO-21**: Demo mode shall be available in all environments (dev, staging, prod) and always accessible at /demo, even if the user is signed in

## Development Environment Support

### Developer Tools
- **REQ-DEV-TOGGLE-1**: In local development environments (`import.meta.env.DEV === true`), the existing environment toggle shall remain available for developers to test mock vs real API behavior
- **REQ-DEV-TOGGLE-2**: The development environment toggle shall be hidden in deployed environments (staging/production)
- **REQ-DEV-TOGGLE-3**: Demo mode shall be available in all environments independent of the development environment toggle
- **REQ-DEV-TOGGLE-4**: The development environment toggle shall only affect API implementation selection, while app mode (demo/production) affects user experience and authentication
- **REQ-DEV-TOGGLE-5**: Development mode shall support testing both demo and production app modes with either mock or real API services

## Routing & Navigation Architecture

### Route Management
- **REQ-ROUTE-1**: Default route `/` shall redirect users to `/demo` for the demo experience
- **REQ-ROUTE-2**: Demo mode shall be accessible at `/demo` with complete application functionality using static data and guided tour
- **REQ-ROUTE-3**: Production mode shall be accessible at `/app` after successful authentication, using the same components with production data
- **REQ-ROUTE-4**: Demo mode users shall transition to `/app` after successful sign-in authentication with AppModeContext state change
- **REQ-ROUTE-5**: All routes shall support direct navigation and browser refresh without loss of state through enhanced store persistence
- **REQ-ROUTE-6**: React Router DOM shall be implemented for client-side routing with mode-aware route handling
- **REQ-ROUTE-7**: Route changes shall trigger appropriate AppModeContext updates and store state management

## User Mode & Authentication Integration

### Mode Management
- **REQ-USER-1**: The application shall provide Demo (anonymous) and Production (authenticated) user modes managed through AppModeContext
- **REQ-USER-2**: Demo mode shall serve static/mock content with no actual uploads, file processing, or persistent data storage
- **REQ-USER-3**: Production mode shall enable authenticated users to access real upload functionality and persistent data storage
- **REQ-USER-4**: Sign-in process shall transition from demo mode to production mode with complete state reset and authentication validation
- **REQ-USER-5**: Sign-out process shall return users to demo mode with production state clearance and session termination

## Technical Architecture & Mode Management

### Architecture Requirements
- **REQ-ARCH-1**: The application shall use a single component tree with mode-aware behavior controlled by AppModeContext
- **REQ-ARCH-2**: Components shall remain shared but receive mode-specific data through props and context, eliminating duplication
- **REQ-ARCH-3**: State management shall use enhanced Zustand stores with mode-aware sections (demo vs production data within same store)
- **REQ-ARCH-4**: API services shall use a factory pattern with mode-aware implementations (DemoApiService vs RealApiService) selected at runtime
- **REQ-ARCH-5**: Mode separation shall be achieved through data flow control rather than component duplication

## App Mode Context & State Management

### Context Implementation
- **REQ-MODE-1**: The application shall implement AppModeContext providing mode state ('demo' | 'production') throughout the component tree
- **REQ-MODE-2**: AppModeContext shall include mode utilities (isDemo, isProduction) and mode transition methods (signIn, signOut)
- **REQ-MODE-3**: Enhanced Zustand stores shall include mode-aware sections with demo and production data separation within single stores
- **REQ-MODE-4**: Store actions shall be mode-aware, operating on appropriate data sections based on current AppModeContext
- **REQ-MODE-5**: Mode transitions shall clear demo state and initialize production state appropriately

## Service Layer & Data Flow

### Service Architecture
- **REQ-SERVICE-1**: API service factory shall return DemoApiService or RealApiService based on current mode from AppModeContext
- **REQ-SERVICE-2**: DemoApiService shall provide static/mock data for all operations with simulated delays and responses
- **REQ-SERVICE-3**: RealApiService shall maintain existing production API behavior with real backend communication
- **REQ-SERVICE-4**: Components shall receive API service through dependency injection or context, remaining unaware of implementation
- **REQ-SERVICE-5**: File upload operations shall be completely disabled in demo mode, replaced with simulated upload progression

## Component Enhancement Strategy

### Component Modifications
- **REQ-COMP-1**: Existing components shall be enhanced with mode awareness through AppModeContext consumption
- **REQ-COMP-2**: Components shall conditionally render demo-specific UI elements (tooltips, tour highlights) based on mode
- **REQ-COMP-3**: AppBar component shall display mode-specific styling and labels based on AppModeContext
- **REQ-COMP-4**: File upload components shall disable real file selection in demo mode and trigger simulated upload workflows
- **REQ-COMP-5**: All interactive components shall include demo-specific messaging and visual indicators when in demo mode

## Guided Tour System

### Tour Implementation
- **REQ-TOUR-1**: Tour system shall be integrated into enhanced stores as demo-specific state management
- **REQ-TOUR-2**: Tour shall use Material-UI Popovers and Dialogs overlaid on existing components in demo mode
- **REQ-TOUR-3**: Tour steps shall be defined as configuration covering: upload simulation, transcript viewing, speaker mapping, summary generation, and email sharing
- **REQ-TOUR-4**: Tour state shall be managed in demo section of enhanced stores with current step, completion status, and step history
- **REQ-TOUR-5**: Tour controls (skip, previous, next, close) shall be implemented as floating Material-UI components
- **REQ-TOUR-6**: Tour highlighting shall use Material-UI Backdrop and Portal components to overlay existing UI elements

## Demo Data & Simulation

### Mock Data Requirements
- **REQ-DEMO-DATA-1**: Demo mode shall use comprehensive static datasets including sample transcripts, speaker mappings, and generated summaries
- **REQ-DEMO-DATA-2**: Simulated operations shall include realistic timing delays and progress updates to mirror production behavior
- **REQ-DEMO-DATA-3**: Demo upload simulation shall progress through realistic stages (uploading, processing, transcribing, analyzing speakers)
- **REQ-DEMO-DATA-4**: All demo interactions shall provide immediate feedback while clearly indicating simulated nature through UI messaging
- **REQ-DEMO-DATA-5**: Demo speaker mapping shall include realistic auto-detected speakers with confidence scores for demonstration purposes

## Legacy Demo Mode Requirements

### Original Demo Implementation
- **REQ-DEM-1**: System shall provide anonymous demo mode with 30-second audio limit
- **REQ-DEM-2**: Demo mode shall showcase full transcription and basic summarization capabilities
- **REQ-DEM-3**: Demo mode shall disable email sharing and advanced features
- **REQ-DEM-4**: Demo mode shall limit speaker mapping to view-only functionality
- **REQ-DEM-5**: System shall clearly indicate demo limitations and upgrade path
- **REQ-DEM-6**: Demo mode shall be available without any user registration or payment
- **REQ-DEM-7**: System shall track demo usage per browser session to prevent repeated abuse
- **REQ-DEM-8**: Demo mode processing cost shall not exceed $0.01 per usage

## Development Environment Controls

### Environment-Specific Features
- **REQ-DEV-1**: System shall hide debug toggle controls in non-development environments
- **REQ-DEV-2**: Server status indicators shall be visible only in local development mode
- **REQ-DEV-3**: JSON download functionality shall be restricted to development and testing environments
- **REQ-DEV-4**: System shall implement environment detection for feature availability
- **REQ-DEV-5**: Production builds shall exclude all development-only UI elements and controls
- **REQ-DEV-6**: System shall provide environment-specific feature flags for debugging tools
- **REQ-DEV-7**: Development tools shall be accessible via configuration or environment variables only

## Performance & Accessibility

### Performance Requirements
- **REQ-PERF-DEMO-1**: Demo mode shall load within 2 seconds on standard broadband connections
- **REQ-PERF-DEMO-2**: Tour transitions shall be smooth with <100ms response times
- **REQ-PERF-DEMO-3**: Simulated operations shall provide realistic timing without excessive delays
- **REQ-PERF-DEMO-4**: Demo mode shall work efficiently on mobile devices and tablets

### Accessibility Requirements
- **REQ-ACC-DEMO-1**: Tour system shall be navigable via keyboard for users who cannot use pointing devices
- **REQ-ACC-DEMO-2**: Screen readers shall announce tour step changes and demo mode status
- **REQ-ACC-DEMO-3**: Demo mode visual indicators shall meet WCAG 2.1 color contrast requirements
- **REQ-ACC-DEMO-4**: Tour controls shall have appropriate ARIA labels and roles

## Integration Points

### Related Systems
- Provides simulated data to [Action Item Management](./action-item-management.md) for demonstration
- Works with [Speaker Management](./speaker-management.md) using mock speaker data
- Demonstrates [Email Communication](./email-communication.md) with simulated sending
- Showcases [AI Summarization](./ai-summarization.md) with pre-generated summaries

### State Isolation
- Complete separation from production state to prevent data leakage
- Independent demo store management for all application features
- Mode-aware component rendering without code duplication
- Clean state transitions between demo and production modes

## Testing Requirements

### Demo Mode Testing
- **REQ-TEST-DEMO-1**: Automated tests shall verify demo mode isolation from production features
- **REQ-TEST-DEMO-2**: Tour system shall be tested for complete workflow coverage
- **REQ-TEST-DEMO-3**: Mode transitions shall be validated for proper state management
- **REQ-TEST-DEMO-4**: Demo data integrity shall be verified across all simulated operations

## Security Considerations

### Demo Mode Security
- **REQ-SEC-DEMO-1**: Demo mode shall not expose any production API endpoints or data
- **REQ-SEC-DEMO-2**: Simulated operations shall not log sensitive information
- **REQ-SEC-DEMO-3**: Demo state shall be completely isolated from production user data
- **REQ-SEC-DEMO-4**: Analytics data collection shall respect user privacy and GDPR compliance
