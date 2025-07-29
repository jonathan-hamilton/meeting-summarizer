# Sprint 3 User Stories - Speaker Override Persistence & Advanced Features

## Sprint Overview

Sprint 3 completes the comprehensive speaker management system initiated in Sprint 2 with privacy-first session-based persistence. This sprint focuses on session-scoped speaker override functionality, segment-level speaker control, and enhanced export capabilities while maintaining strict data minimization principles. The application remains intentionally session-based to protect user privacy and minimize data retention.

## Sprint 3 Goals

- Validate Sprint 3 foundation work through comprehensive test coverage for Zustand stores and session management
- Complete speaker override workflow with session-based revert capabilities and user privacy protection
- Enable segment-level speaker reassignment for granular transcript accuracy during active sessions
- Implement enhanced export capabilities with immediate download and sharing options
- Build robust testing framework addressing performance, security, and error handling
- Establish clear user communication about session-based data handling and privacy protection
- Create foundation for privacy-conscious enterprise features

## Progress Tracker

| Story ID | Title | Status | Dependencies |
|----------|-------|--------|--------------|
| S3.0 | Foundation Test Coverage Updates | IN PROGRESS 🔄 | Sprint 2 completion, existing test infrastructure |
| S3.1 | Session-Based Speaker Override & Privacy Controls | PENDING 🔄 | S2.7 - Manual Speaker Override Interface |
| S3.2 | Speaker CRUD Operations Interface | PENDING 🔄 | S2.7 - Manual Speaker Override Interface |
| S3.3 | Segment-Level Speaker Override Interface | PENDING 🔄 | S3.2 - Speaker CRUD Operations Interface |
| S3.4 | Enhanced Export and Sharing (Session-Based) | PENDING 🔄 | S2.4 - Summary Display, Complete speaker workflow |
| S3.5 | User Privacy Communication & Data Controls | PENDING 🔄 | S3.1 - Session-Based Override System |
| S3.6 | Performance and Security Testing Suite | PENDING 🔄 | None |

## Technical Foundation Improvements ✅ COMPLETE

### Layout & Responsive Design Enhancement (2025-01-22)

**Completion Status:** ✅ COMPLETE
**Impact:** Improved user experience across all device types and screen sizes

**Implementation Summary:**

- Implemented responsive layout centering system for all viewport sizes
- Added breakpoint-based responsive margins (16px mobile → 64px ultrawide)
- Fixed component width consistency throughout application workflow
- Enhanced visual design with professional-grade responsive behavior
- **COMPLETED:** Resolved dynamic width inconsistency between FileUpload and TranscriptDisplay components using Grid container improvements

**Technical Achievements:**
✅ Viewport-based positioning with flexbox centering architecture
✅ Material-UI breakpoint system integration (xs/sm/md/lg/xl)
✅ Cross-component width consistency and responsive behavior
✅ Improved accessibility and professional appearance
✅ **COMPLETED:** Dynamic layout reflow prevention with Grid system width constraints
✅ **NEW:** Console debugging cleanup - Removed extensive debug logging for production readiness

## S3.0 Foundation Test Coverage - IN PROGRESS 🔄

### Increment 1: Zustand Store Testing ✅ COMPLETE (2025-07-28)

**Implementation Summary:**
- Created comprehensive test files for `speakerStore.ts` and `speakerMappingStore.ts`
- Implemented 76 total tests covering all Zustand store functionality
- Added missing Zustand dependency (`"zustand": "5.0.2"`) to package.json
- Validated store integration patterns and business logic accuracy

**Technical Achievements:**
✅ Complete unit test coverage for `speakerStore.ts` (33 tests)
✅ Comprehensive test coverage for `speakerMappingStore.ts` (43 tests)
✅ State management behavior validation for all CRUD operations
✅ Computed selectors testing: `getMappedCount()`, `getUnmappedSpeakers()`, etc.
✅ Store initialization and state transition verification
✅ Error handling and edge case coverage
✅ Business logic validation matching implementation behavior
✅ Integration testing for complex multi-step workflows

**Test Coverage Achieved:**
- **speakerStore.test.ts**: Initial state, CRUD operations, selectors, validation functions
- **speakerMappingStore.test.ts**: UI state management, edit mode operations, validation system
- **Quality Metrics**: 76 tests with comprehensive coverage of store functionality
- **Mock Management**: Proper console output mocking and test isolation

**Remaining S3.0 Work:**
- Increment 2: ✅ COMPLETED (2025-01-28) - Created comprehensive tests for sessionManager.ts and useSessionManagement.ts 
- Increment 3: Update SpeakerMapping.test.tsx for memoization effectiveness validation
- Increment 4: Component integration testing updates
- Increment 5: Frontend test infrastructure improvements

**Files Created:**
```
frontend/src/__tests__/stores/speakerStore.test.ts
frontend/src/__tests__/stores/speakerMappingStore.test.ts
```

**Dependencies Updated:**
```json
{
  "dependencies": {
    "zustand": "5.0.2"
  }
}
```

### Increment 2: Session Management Testing ✅ COMPLETE (2025-07-28)

**Implementation Summary:**
- Created comprehensive test files for session management infrastructure
- Implemented 62 tests across 19 test groups covering all session functionality
- Added React Testing Library integration for hook testing and lifecycle management
- Validated service integration patterns and privacy control effectiveness
- Fixed TypeScript annotation quality issues and API response type safety

**Technical Achievements:**
✅ Complete unit test coverage for `sessionManager.ts` (319-line service implementation)
✅ Comprehensive React hook testing for `useSessionManagement.ts` (206-line hook)
✅ Session lifecycle testing: initialization, activity tracking, timeout handling
✅ Privacy controls validation: data cleanup, override management, status monitoring
✅ API integration testing: override operations, error handling, loading states
✅ React hook lifecycle: mounting, unmounting, status updates, periodic refresh
✅ Error handling and edge case coverage for both service and hook layers
✅ Integration testing for session consistency and concurrent operations
✅ TypeScript quality improvements: proper API response typing and generic constraints
✅ Code quality enhancements: enhanced error handling in useSessionManagement hook

**Test Coverage Achieved:**
- **sessionManager.test.ts**: Session lifecycle, timeout handling, privacy controls, override storage (33 tests)
- **useSessionManagement.test.ts**: React hook integration, API operations, state management (29 tests)
- **Quality Metrics**: 62 tests total with comprehensive coverage of session management functionality
- **Mock Management**: Proper mocking of sessionStorage, timers, API services, and window events
- **Type Safety**: Enhanced with proper generic constraints for ApiResponse types

**Files Created:**
```
frontend/src/__tests__/services/sessionManager.test.ts
frontend/src/__tests__/hooks/useSessionManagement.test.ts
```

**Files Enhanced:**
```
frontend/src/hooks/useSessionManagement.ts (error handling improvements)
frontend/src/__tests__/hooks/useSessionManagement.test.ts (TypeScript type safety improvements)
```

### Development Workflow Enhancement (2025-01-22)

**Completion Status:** ✅ COMPLETE
**Impact:** Significantly improved developer experience and testing capabilities

**Implementation Summary:**

- Created OpenAI service toggle system for development workflow
- Added real-time service status monitoring in development mode
- Enhanced backend service configuration architecture
- Implemented development-only UI controls with status indicators

**Technical Achievements:**
✅ Backend OpenAI toggle controller with REST API endpoints
✅ Frontend toggle switch with real-time status updates
✅ Service configuration enhancement supporting toggle functionality
✅ Development mode UI controls with visual status indicators

### SpeakerMapping Performance Optimization (2025-01-26)

**Completion Status:** ✅ COMPLETE
**Impact:** Significantly improved React component performance and user experience

**Implementation Summary:**
- Implemented 7-step memoization strategy for SpeakerMapping component
- Eliminated expensive re-renders and function recreation issues
- Optimized array operations and session manager calls
- Maintained exact existing functionality while improving performance

**Technical Achievements:**
✅ Memoized effective data structure (Steps 1-2)
✅ Cached expensive sessionManager operations (Step 3)
✅ Optimized callbacks with useCallback (Step 3)
✅ Memoized computed speaker data (Step 4)
✅ Pre-computed rendered lists (Steps 5-6)
✅ Final cleanup and validation (Step 7)

**Files Modified**: `frontend/src/components/SpeakerMapping.tsx`

### Speaker Management System Enhancement (2025-01-22)

**Completion Status:** ✅ COMPLETE
**Impact:** Improved session management and user experience in speaker assignment workflow

**Implementation Summary:**

- Enhanced session-based speaker override functionality
- Improved speaker name resolution throughout component hierarchy
- Better error handling and user feedback systems
- Strengthened integration between dialog and segment components

**Technical Achievements:**
✅ **Enhanced session override persistence and resolution logic
✅ Improved component integration and state management
✅ Better error handling and user feedback throughout workflow
✅ Consistent speaker name resolution across all components

### Console Debugging Cleanup & Production Readiness (2025-01-23)

**Completion Status:** ✅ COMPLETE
**Impact:** Improved application performance and production readiness

**Implementation Summary:**

- Removed extensive console debugging statements across 7 components
- Cleaned up dimensional tracking and layout debug logging
- Eliminated visual debugging components for production deployment
- Maintained proper error handling while removing development console output
- Resolved React hydration issues caused by improper HTML nesting

**Technical Achievements:**
✅ **App.tsx** - Removed dimension tracking console.log statements from layout containers
✅ **FileUpload.tsx** - Major cleanup removing debug logging and fixing ListItem nesting structure
✅ **TranscriptDisplay.tsx** - Cleaned up console logging from loading/error/main render states
✅ **ErrorBoundary.tsx** - Restored and improved with proper TypeScript imports
✅ **SummaryDisplay.tsx** - Better key generation for list items using content-based keys
✅ **SpeakerMappingDialogZustand.tsx** - Commented out entire experimental component
✅ **SpeakerReassignmentDemo.tsx** - Commented out entire demo component

**Files Modified in Console Cleanup:**

- Frontend: App.tsx, FileUpload.tsx, TranscriptDisplay.tsx, ErrorBoundary.tsx, SummaryDisplay.tsx, SpeakerMappingDialogZustand.tsx, SpeakerReassignmentDemo.tsx

**Files Modified in Foundation Improvements:**

- Backend: OpenAIController.cs (NEW), service configuration files, health controller
- Frontend: App.tsx, FileUpload.tsx, speaker management components, API service

---

## User Stories

### Story S3.0: Foundation Test Coverage Updates

As a development team, we need comprehensive test coverage for the Sprint 3 foundation improvements to ensure reliability and prevent regressions before implementing new CRUD features.

#### S3.0 Acceptance Criteria

**Zustand Store Testing:** ✅ COMPLETE (Increment 1 - 2025-07-28)

✅ Complete unit test coverage for `speakerStore.ts` with all CRUD operations
✅ Test state management behaviors: `addSpeaker()`, `updateSpeaker()`, `deleteSpeaker()`
✅ Validate computed selectors: `getMappedCount()`, `getUnmappedSpeakers()`, `getSpeakerMapping()`
✅ Test store initialization and state transitions
✅ Verify error handling and edge cases in state operations
- Test persistence integration with session storage (Increment 2)

**Session Management Testing:** 🔄 IN PROGRESS (Increment 2)

- Comprehensive unit tests for `sessionManager.ts` (319-line implementation)
- Test session lifecycle: initialization, activity tracking, timeout handling
- Validate privacy controls: `clearAllData()`, `extendSession()`, `exportBeforeClear()`
- Test session storage integration and automatic cleanup
- Verify session status tracking and real-time updates
- Test session timeout warnings and data preservation options

**Performance Optimization Validation:** 🔄 PENDING (Increment 3)

- Update tests for memoized `SpeakerMapping.tsx` component
- Validate performance improvements maintain exact functionality
- Test React.memo and useCallback optimizations
- Verify expensive operations are properly cached
- Test component re-render behavior under various prop changes
- Ensure optimization doesn't break existing workflows

**Component Integration Testing:**

- Update component tests for console debugging cleanup changes
- Test session-based speaker management workflow integration
- Validate Zustand store integration with React components
- Test error boundary behavior with updated components
- Verify Material-UI integration patterns remain consistent
- Test mobile responsiveness after foundation changes

**Frontend Test Infrastructure:**

- Create missing test files for new stores and services
- Update existing component tests for recent foundation changes
- Implement integration tests for session-speaker workflow
- Add mock implementations for session management services
- Create test utilities for Zustand store testing
- Update test setup for session storage mocking

#### S3.0 Dependencies

Sprint 2 completion, existing test infrastructure

#### S3.0 Developer Notes

**Priority Test Files to Create:**

```typescript
// High Priority - Missing Foundation Tests
frontend/src/__tests__/stores/speakerStore.test.ts
frontend/src/__tests__/stores/speakerMappingStore.test.ts
frontend/src/__tests__/services/sessionManager.test.ts
frontend/src/__tests__/hooks/useSessionManagement.test.ts

// Medium Priority - Update Existing Tests
frontend/src/__tests__/components/SpeakerMapping.test.tsx // Performance validation
frontend/src/__tests__/components/TranscriptDisplay.test.tsx // Session integration
frontend/src/__tests__/components/SpeakerMappingDialog.test.tsx // Zustand integration

// Integration Priority - New Workflow Tests
frontend/src/__tests__/integration/sessionSpeakerWorkflow.test.tsx
```

**Testing Strategy:**

- **Zustand Store Testing**: Use Zustand's testing utilities and React Testing Library
- **Session Management**: Mock browser sessionStorage and test timeout behaviors
- **Performance Validation**: Test component render counts and memoization effectiveness
- **Integration Testing**: Test complete user workflows with session management
- **Regression Protection**: Ensure all existing functionality remains intact

**Test Coverage Goals:**

- Zustand stores: 95% line coverage, 90% branch coverage
- Session management: 90% line coverage, 85% branch coverage
- Updated components: Maintain existing coverage levels
- Integration workflows: 80% coverage for critical paths

**Mock and Test Data:**

- Create session management mocks for consistent testing
- Build Zustand store test utilities for state manipulation
- Develop speaker mapping test data generators
- Create session timeout simulation utilities
- Build privacy controls testing helpers

**Time Estimate:** 4-6 hours (foundation test implementation and validation)

---

### Story S3.1: Session-Based Speaker Override & Privacy Controls

As a privacy-conscious user, I want my speaker override actions to be preserved during my current session with clear controls over my data, so that I can correct speaker assignments without compromising my privacy or having my meeting data stored permanently.

#### S3.1 Acceptance Criteria

**Session-Based Persistence Requirements:**

- Manual speaker overrides are preserved only during the current browser session
- Original auto-detected values are maintained as fallback when overrides are cleared
- Override metadata includes session timestamp for revert functionality
- All override data is automatically cleared when the browser session ends
- No persistent storage of user meeting data beyond the active session

**Privacy Protection Requirements:**

- Clear visual indicators showing data is session-only and will not be permanently stored
- User notification system explaining session-based data handling with clear messaging that closing the browser window will automatically clear all session data
- Session timeout warnings with data preservation options
- Privacy policy integration explaining session-based approach

**Revert Functionality:**

- [Revert to Original] option available for each overridden speaker during session
- Bulk revert option to restore all speakers to auto-detected values
- Revert confirmation dialog prevents accidental data loss
- Session-scoped override tracking for undo/redo functionality
- Clear visual feedback when revert operations complete successfully

#### S3.1 Dependencies

S2.7 - Manual Speaker Override Interface (prerequisite for override functionality)

#### S3.1 Developer Notes

**Backend Implementation:**

- Extend current InMemorySpeakerMappingService with session-based override tracking
- Implement session-scoped override metadata (OriginalName, OriginalRole, IsOverridden, SessionTimestamp)
- Create session-based revert functionality without persistent audit trail
- Add automatic session cleanup and data deletion mechanisms

**Data Models:**

```csharp
public class SessionSpeakerMappingWithOverride : SpeakerMapping
{
    public string? OriginalName { get; set; }
    public string? OriginalRole { get; set; }
    public bool IsOverridden { get; set; }
    public DateTime? SessionTimestamp { get; set; }
    public string SessionId { get; set; }
}

public class SessionOverrideTracker
{
    public string SessionId { get; set; }
    public Dictionary<string, SessionOverrideAction> Actions { get; set; }
    public DateTime SessionStarted { get; set; }
    public DateTime LastActivity { get; set; }
}

public class SessionOverrideAction
{
    public string Action { get; set; } // Override, Revert, Clear
    public string? OriginalValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime Timestamp { get; set; }
}
```

**Frontend Integration:**

- Implement session-based API service with clear session management
- Add privacy indicators and session status display in SpeakerMappingDialog
- Create session timeout warnings and data preservation dialogs
- Add privacy policy modal explaining session-based approach with clear messaging that data is automatically cleared when the browser window is closed

**Time Estimate:** 6-8 hours (backend-heavy implementation)

#### S3.1 Implementation Progress

**Current Status:** Core session infrastructure complete, but UI integration and privacy controls missing.

**Completed Components:**

✅ **Session Management Infrastructure (COMPLETE)**

- Implemented complete session manager with 2-hour timeout and automatic cleanup
- Created session-based storage with browser sessionStorage integration
- Built session activity tracking and automatic data expiration
- Complete privacy controls interface available via sessionManager.getPrivacyControls()

✅ **Enhanced Speaker Reassignment Backend (COMPLETE)**

- Created EnhancedSpeakerSegment component with dropdown-based speaker reassignment
- Implemented real-time speaker override functionality with Material-UI Select components
- Added direct integration hooks for TranscriptDisplay component
- Backend API endpoints support session-based override tracking

✅ **SpeakerMappingDialog Integration (COMPLETE)**

- Added "Edit/Delete Mappings" button to TranscriptDisplay header for direct access to CRUD operations
- Integrated comprehensive SpeakerMappingDialog with main transcript interface
- Fixed speaker detection logic to show all detected speakers from transcript in dialog
- Implemented proper dialog state management with mapping update callbacks
- Resolved component import and prop compatibility issues for seamless functionality

✅ **Zustand State Management Implementation (COMPLETE - NEW)**

- Created centralized speaker state management using Zustand store
- Implemented CRUD operations: addSpeaker(), updateSpeaker(), deleteSpeaker()
- Added computed selectors: getMappedCount(), getUnmappedSpeakers(), getSpeakerMapping()
- Established single source of truth for speaker mappings across components
- Fixed infinite re-render loops and application crash issues
- Consolidated duplicate UI elements to single "Edit/Delete Mappings" button

✅ **Session Storage Components Built (NOT INTEGRATED)**

- SessionStatus.tsx component exists with privacy indicators and session status display
- useSessionManagement.ts hook provides complete session state management
- Components built but not integrated into main TranscriptDisplay interface

**❌ MISSING INTEGRATION (Not Actually Complete):**

🔄 **Privacy Indicators & User Notifications** - Built but not integrated into TranscriptDisplay
🔄 **Revert Functionality UI** - Session storage supports revert, but no UI buttons in speaker components
🔄 **Session Status Integration** - SessionStatus component exists but not used in main interface
🔄 **Session Timeout Warnings** - Backend supports it, no UI dialogs implemented
🔄 **Privacy Policy Modal** - Not implemented

✅ **Privacy-First Architecture Implementation (COMPLETE - NEW)**

- Removed all API persistence calls from speaker management components
- Converted SpeakerMappingDialog to pure session-only storage via Zustand store
- Eliminated backend storage dependencies for speaker mappings and overrides
- Updated SpeakerMapping component to initialize without API calls
- Fixed speaker count logic to properly handle detected vs manually added speakers
- Implemented session-only speaker management respecting privacy requirements
- Ensured no speaker data persists beyond browser session lifetime

### Actual Completion Status: ~90% Complete (Updated)

✅ **Speaker Management UI Improvements (COMPLETE - NEW)**

- Fixed speaker chip display logic to show original speaker IDs ("Speaker 1", "Speaker 2", etc.) consistently
- Removed redundant unmapped speakers text display to eliminate UI clutter
- Implemented confidence score strikethrough when ANY speakers are modified (privacy indicator)
- Separated segment-specific reassignment alerts from confidence strikethrough logic
- Fixed "Manage Mappings" button label for clearer user interface
- Resolved syntax errors and component import issues in TranscriptSpeakerSegment
- Ensured proper component state management for real-time UI updates

✅ **Privacy Architecture Simplified (COMPLETE - NEW)**

- Removed unnecessary manual "Clear All Data" functionality since users can simply close their browser window
- Session-based architecture automatically handles data cleanup on browser close
- Privacy messaging updated to clearly communicate that closing browser window clears all data
- Simplified user experience by removing redundant manual data clearing options

**Remaining Work (High Priority):**

1. **Connect SpeakerMappingDialog to Zustand store** for real-time CRUD operations
2. **Integrate SessionStatus component** into TranscriptDisplay header  
3. **Add revert buttons** to speaker mapping interfaces
4. **Create session timeout warning dialogs**
5. **Build privacy policy modal**
6. **Add privacy indicators** throughout the interface with clear messaging that data is automatically cleared when browser window is closed

**Technical Implementation Details:**

- Session-based data handling infrastructure complete and functional
- Speaker overrides maintained only during browser session with automatic cleanup when browser window is closed
- All session management APIs working but need UI integration
- Material-UI integration patterns established for consistent design
- Privacy architecture simplified by removing redundant manual data clearing functionality

**Next Steps:**

1. Complete API compatibility testing and validation
2. Implement privacy indicators and user notifications
3. Add revert functionality for session-based overrides
4. Build session timeout warnings and data preservation dialogs

---

### Story S3.2: Speaker CRUD Operations Interface

As a user, I want to manage speaker mappings through a comprehensive interface so that I can create, update, and delete speaker assignments with full control over my transcript accuracy.

#### S3.2 Acceptance Criteria

**CRUD Interface Requirements:**

- "Edit/Delete Mappings" button prominently displayed in the top right of TranscriptDisplay component
- Clicking the button opens a dedicated SpeakerMappingDialog for comprehensive speaker management
- Dialog displays all current speaker mappings with editable Name and Role fields
- Each speaker entry has a pencil icon for editing and trash can icon for deletion
- Dialog includes "Close" and "Update Mappings" buttons at the bottom
- "Update Mappings" button only enabled when changes have been made in the dialog

**Create Operations:**

- "Add New Speaker" functionality allows users to create new speaker mappings manually
- New speakers require Name and Role specification with real-time validation
- System prevents duplicate speaker names within the same meeting
- Newly created speakers immediately available for transcript segment assignment
- Creation metadata (timestamp, session info) preserved for audit purposes

**Update Operations:**

- In-line editing of Name and Role fields for all existing speakers
- Real-time validation prevents conflicts with existing speaker names
- Original auto-detected values preserved as fallback when speakers are manually updated
- Updated speaker names reflected immediately in transcript segment displays
- Session-scoped update history maintained for revert capabilities

**Delete Operations:**

- Confirmation dialog with impact preview before permanent speaker deletion
- Preview shows affected transcript segments and speaker count changes
- Deleted speakers removed from all transcript segment assignments with "Unassigned" labeling
- System prevents deletion if it would result in no speakers remaining
- Speaker counts and statistics updated immediately after deletion
- Cascading updates to all dependent components and displays

**Session Integration:**

- All CRUD operations integrate with session-based data handling (no persistent storage)
- Changes preserved only during current browser session with automatic cleanup
- Dialog state consistency maintained throughout all operations
- Real-time updates reflected in main TranscriptDisplay and speaker mapping components

#### S3.2 Dependencies

S2.7 - Manual Speaker Override Interface (prerequisite for override functionality)

#### S3.2 Developer Notes

**Frontend Implementation:**

- Enhance TranscriptDisplay component with "Edit/Delete Mappings" button placement
- Create comprehensive SpeakerMappingDialog with CRUD functionality using Material-UI components
- Implement state management for Create, Update, Delete operations with React hooks
- Add form validation and real-time feedback using Material-UI form components
- Create confirmation dialogs for destructive operations (deletion)

**Backend Integration:**

- Extend speaker mapping API endpoints to support full CRUD operations
- Implement session-based speaker creation with unique ID generation
- Add validation endpoints for speaker name conflicts and business rules
- Create bulk update capabilities for efficient dialog operations
- Implement cascade delete operations for speaker removal

**Technical Implementation:**

```tsx
interface SpeakerCRUDDialog {
  open: boolean;
  speakers: SpeakerMapping[];
  onClose: () => void;
  onUpdate: (speakers: SpeakerMapping[]) => void;
  onCreate: (speaker: Partial<SpeakerMapping>) => void;
  onDelete: (speakerId: string) => void;
  hasChanges: boolean;
}

interface SpeakerFormValidation {
  nameExists: (name: string, excludeId?: string) => boolean;
  validateRequired: (field: string) => boolean;
  getValidationErrors: () => string[];
}
```

**User Experience Considerations:**

- Intuitive icon placement and hover states for discoverability
- Loading states during CRUD operations with progress indicators
- Toast notifications for successful operations and error feedback
- Keyboard navigation support for accessibility
- Mobile-responsive dialog design for cross-device compatibility

**Time Estimate:** 8-10 hours (comprehensive CRUD interface with validation)

---

### Story S3.3: Segment-Level Speaker Override Interface

As a user, I want to click on individual transcript segments and reassign them to different speakers so that I can correct AI misidentification where the wrong speaker was detected for specific portions of the conversation.

#### S3.3 Acceptance Criteria

**Segment Override Interface:**

- Click-to-edit functionality available on each transcript segment speaker chip
- Dropdown menu shows all available mapped speakers for reassignment
- Visual indicator on confidence scores when speaker has been manually reassigned to segment
- Confidence percentages marked as invalid when segment speaker assignment is manually overridden
- Real-time updates to speaker mapping counts reflecting segment-level reassignments

**Visual Feedback Requirements:**

- Generic "Speaker 1" labels replaced with actual mapped names in transcript segment displays
- Clear visual distinction between AI-assigned and manually-reassigned segments
- Dynamic count updates in "(X/Y mapped)" counters reflecting current mapping status
- Override status indicators show when segments have been manually corrected

**Integration Requirements:**

- Segment overrides integrate with session-based speaker mapping workflow
- Override changes immediately reflected in main Speaker Mappings section during session
- Segment-level changes preserved only during current browser session
- Manual overrides maintained with session-scoped revert capabilities
- Clear indicators showing temporary nature of segment assignments

#### S3.3 Dependencies

S3.2 - Speaker CRUD Operations Interface (prerequisite for comprehensive speaker management)

#### S3.3 Developer Notes

**Frontend Implementation:**

- Enhance TranscriptDisplay component with clickable speaker chips using Material-UI Select components
- Implement segment-level override state management with React hooks and context
- Create visual indicators for confidence score invalidation using Material-UI icons and styling
- Add real-time count updates for mapping status in SpeakerMappingComponent
- Implement segment selection dropdown with all mapped speakers

**Backend Implementation:**

- Extend SpeakerSegment model to track session-based speaker overrides
- Add segment-level override endpoints for session-scoped persistence (/api/segments/{id}/override)
- Implement confidence score invalidation flags in transcript data
- Create session-based tracking for segment-level speaker changes integrating with S3.1 session system

**Technical Implementation:**

```tsx
interface SpeakerSegmentWithOverride extends SpeakerSegment {
  originalSpeaker?: string;
  isManuallyAssigned?: boolean;
  overriddenAt?: string;
  overriddenBy?: string;
  confidenceInvalidated?: boolean;
}
```

**User Experience Considerations:**

- Hover states on clickable speaker chips for discoverability
- Loading states during segment reassignment operations
- Undo functionality for recent segment changes
- Keyboard navigation support for accessibility

**Time Estimate:** 6-8 hours (moderate complexity UI enhancement)

---

### Story S3.4: Enhanced Export and Sharing (Session-Based)

As a user, I want enhanced export options for my current session's meeting data so that I can immediately download and share meeting insights without requiring persistent data storage.

#### S3.4 Acceptance Criteria

**Enhanced Export Formats:**

- PDF export with professional formatting for immediate download
- Microsoft Word document export with proper heading structure and speaker attribution
- CSV export of action items and decisions for project management tools
- Plain text export with customizable formatting options
- JSON export for technical integration during session

**Immediate Download Capabilities:**

- One-click export functionality with instant download initiation
- Multiple format selection with batch download options
- Email composition with exported content as attachments
- Copy-to-clipboard functionality for quick sharing
- Print-optimized formatting for physical distribution

**Session-Based Sharing:**

- Generate temporary shareable links with configurable expiration (max 24 hours)
- Direct email sharing with exported content embedded in email body
- Social media sharing with meeting summary excerpts
- QR code generation for mobile sharing of session content
- Secure sharing tokens that expire when session ends

#### S3.4 Dependencies

S2.4 - Summary Display and Export Interface, Complete speaker workflow

#### S3.4 Developer Notes

**Frontend Implementation:**

- Implement client-side PDF generation using jsPDF for immediate downloads
- Create email composition interface with attachment support
- Add sharing link generation with session-based token management
- Implement export progress indicators and download status feedback
- Create template customization for different export formats

**Backend Implementation:**

- Develop session-based export service with multiple format support
- Implement temporary link generation with automatic expiration
- Create email service integration for direct sharing capabilities
- Add export analytics without storing personal data
- Implement session cleanup for temporary sharing tokens

**Security Considerations:**

- Automatic link expiration when session ends
- Rate limiting for export operations to prevent abuse
- Content sanitization for external sharing
- Session-based token validation for all sharing operations

**Time Estimate:** 8-10 hours (enhanced export functionality with privacy focus)

---

### Story S3.5: User Privacy Communication & Data Controls

As a privacy-conscious user, I want clear information about how my meeting data is handled and full control over my session data, so that I can use the application with confidence in my privacy protection.

#### S3.5 Acceptance Criteria

**Privacy Communication Interface:**

- Prominent privacy indicator showing session-based data handling in main interface
- Privacy policy modal accessible from footer and first-time user flow
- Session status indicator showing current data state and session duration
- Clear messaging about automatic data deletion when session ends
- Educational tooltips explaining session-based approach benefits

**User Data Controls:**

- Session timeout warning with options to extend session or allow automatic data clearing when browser window is closed
- Export before session expiration prompts when user may lose data
- Session activity indicator showing last interaction timestamp
- Browser storage usage indicator (showing minimal footprint)
- Clear messaging that closing the browser window will automatically clear all session data

**Privacy Policy Integration:**

- Comprehensive privacy policy explaining session-based approach
- Clear explanation of what data is temporarily stored and why
- Comparison with traditional persistent storage approaches
- User rights and data control explanations
- Contact information for privacy-related questions

**User Education Features:**

- First-time user onboarding explaining privacy-first approach
- Help section with privacy and data handling FAQs
- Visual indicators distinguishing session data from permanent features
- Privacy benefits messaging (no long-term storage, enhanced security)
- Optional privacy preferences for session duration and warnings

#### S3.5 Dependencies

S3.1 - Session-Based Override System (prerequisite for privacy controls)

#### S3.5 Developer Notes

**Frontend Implementation:**

- Create privacy indicator component with real-time session status using Material-UI
- Implement privacy policy modal with clear, accessible language
- Add session management controls to main navigation and settings
- Create educational onboarding flow for new users
- Implement privacy preferences storage in browser local storage only

**Privacy Policy Content:**

- Draft comprehensive privacy policy focusing on session-based approach
- Create user-friendly explanations of data minimization benefits
- Develop FAQ section addressing common privacy concerns
- Include technical explanations for privacy-conscious users
- Add contact information and privacy rights information

**User Experience Considerations:**

- Non-intrusive privacy indicators that don't disrupt workflow
- Clear visual hierarchy for privacy controls and information
- Accessible language avoiding technical jargon
- Mobile-responsive privacy policy and controls
- Progressive disclosure of privacy information (basic to detailed)

**Session Management Features:**

```tsx
interface PrivacyControls {
  sessionStatus: 'active' | 'warning' | 'expired';
  sessionDuration: number;
  lastActivity: Date;
  dataSize: string;
  extendSession: () => void;
  exportBeforeClear: () => void;
}
```

**Time Estimate:** 4-6 hours (UI/UX focused with policy development)

---

### Story S3.6: Performance and Security Testing Suite

As a development team, we need comprehensive testing coverage for performance, security, and error handling scenarios to ensure production readiness and identify potential issues before deployment.

#### S3.6 Acceptance Criteria

**Performance Testing:**

- Large file upload testing with files exceeding 100MB to validate system limits
- Concurrent user simulation testing for multiple simultaneous transcriptions
- Memory usage profiling during long-running transcription processes
- API response time benchmarking under various load conditions
- Frontend performance testing with large transcript displays

**Security Testing:**

- Rate limiting validation to prevent API abuse and ensure fair usage
- Input validation testing for all user-facing forms and file uploads
- Authentication and authorization testing for protected endpoints
- SQL injection and XSS vulnerability testing (even with in-memory storage)
- File upload security testing including malicious file detection

**Error Handling Testing:**

- Frontend error boundary testing with simulated component failures
- Network failure simulation and recovery testing
- OpenAI API failure simulation and graceful degradation validation
- File corruption handling and user feedback testing
- Session timeout and authentication failure recovery

**Integration Testing:**

- Limited live OpenAI API testing with dedicated test account
- End-to-end workflow testing from upload to summary export
- Cross-browser compatibility testing for major browsers
- Mobile responsiveness testing for key user workflows
- Accessibility testing for screen readers and keyboard navigation

#### S3.6 Dependencies

None (foundational testing infrastructure)

#### S3.6 Developer Notes

**Testing Infrastructure:**

- Set up performance testing using tools like Lighthouse and WebPageTest
- Implement load testing using tools like Artillery or k6
- Create security testing suite using OWASP ZAP or similar tools
- Establish continuous performance monitoring and regression detection

**Test Data Management:**

- Create standardized test audio files of various sizes and quality levels
- Develop mock data generators for large-scale testing scenarios
- Implement test environment isolation for security testing
- Create automated test data cleanup and reset procedures

**Monitoring and Reporting:**

- Implement performance metrics collection and reporting
- Create automated security scan reports
- Set up error tracking and alerting for production issues
- Establish performance benchmarks and regression detection

**Time Estimate:** 6-8 hours (testing framework and initial test suite)

---

## Integration Notes

**Sprint 3 Technical Architecture:**

```text
S2.7 Override Interface → S3.0 Foundation Tests → S3.1 Session-Based Persistence → S3.2 Speaker CRUD Operations → S3.3 Segment Override → S3.4 Enhanced Export → S3.5 Privacy Controls
       ↓                     ↓                       ↓                              ↓                            ↓                     ↓                      ↓
   Foundation           Test Coverage         Session Storage              CRUD Interface               Segment Control        Export/Share          Privacy/UX
                                  ↓
                               S3.6 Testing Suite (Cross-cutting)
```

**Key Integration Points:**

- S3.0 provides foundation test coverage for Sprint 3 infrastructure before implementing new features
- S3.1 builds directly on S2.7's override infrastructure with session-based persistence for privacy protection
- S3.2 provides comprehensive CRUD operations for speaker management through dedicated dialog interface
- S3.3 completes the override workflow with segment-level granularity building on S3.2's speaker management
- S3.4 provides immediate export capabilities without requiring persistent data storage
- S3.5 ensures users understand and control their session-based data handling
- S3.6 provides comprehensive testing coverage across all implemented features with privacy validation

**Technical Dependencies:**

- All stories build upon the completed Sprint 2 foundation (S2.1-S2.7)
- S3.0 validates Sprint 3 foundation work (Zustand stores, session management, performance optimizations)
- S3.1 requires S2.7's override interface implementation and S3.0's validated foundation for session-based persistence
- S3.2 builds on S2.7 and S3.0's tested foundation to provide comprehensive CRUD operations for speaker management
- S3.3 depends on S3.2's CRUD interface for complete speaker management before segment-level overrides
- S3.4 integrates with S2.4 export functionality and session-based speaker workflow
- S3.5 depends on S3.1's session management for privacy controls
- S3.6 validates all implemented features with focus on data privacy and session management

## Success Metrics

- **Privacy Protection**: Session-based data handling with automatic cleanup and user controls
- **Data Minimization**: Override actions preserved only during session with no permanent storage
- **Granular Control**: Users can correct individual transcript segments with immediate visual feedback
- **Export Efficiency**: Multiple export formats generate correctly for immediate download and sharing
- **Performance**: Application handles large files and concurrent users without data retention overhead
- **Security**: Session-based approach eliminates long-term data exposure risks
- **User Adoption**: Reduced privacy concerns increase user confidence and application usage
- **Transparency**: Clear communication builds trust through privacy-first approach

## Foundation for Next Sprint

Sprint 3 establishes the foundation for:

- **Sprint 4**: Advanced AI features (auto-speaker detection, meeting insights) with privacy-first approach
- **Sprint 5**: Enterprise features (team collaboration, administrative controls) with optional data retention policies
- **Sprint 6**: Privacy-conscious integrations (calendar sync, automated summaries) with user-controlled data handling
- **Sprint 7**: Analytics and insights with aggregated, non-personal data analysis

## Technical Rationale

Sprint 3 completes the comprehensive speaker management system while implementing a privacy-first architecture that minimizes data retention and maximizes user control. By implementing session-based persistence (S3.1) and segment-level control (S3.2), we provide users with complete control over speaker accuracy while ensuring their meeting data is not permanently stored.

The enhanced export capabilities (S3.3) enable immediate value extraction from meeting sessions without requiring long-term data storage. The privacy communication and control system (S3.4) builds user trust through transparency and clear data handling policies.

The comprehensive testing suite (S3.5) addresses the existing testing recommendations while ensuring production readiness across performance, security, and privacy protection scenarios. This establishes confidence for privacy-conscious users and provides regression protection for future development.

The progression from granular speaker control to enhanced export capabilities creates a natural evolution toward advanced AI features while maintaining the core value proposition of accurate, actionable meeting insights with complete user privacy protection and data minimization.

## Preserved Sprint 3 Recommendations

**Testing Priorities from Previous Planning:**

- ✅ Performance testing suite - Large file upload testing (>100MB files) [Implemented in S3.6]
- ✅ Real API integration tests - Limited live OpenAI API testing with test account [Implemented in S3.6]
- ✅ Error boundary testing - Frontend error handling and recovery [Implemented in S3.6]
- ✅ Security testing - Rate limiting and input validation [Implemented in S3.6]

All previously identified testing requirements have been incorporated into the comprehensive S3.6 Performance and Security Testing Suite story.
