# Action Item Management Requirements

This document contains all requirements related to action item CRUD operations, drag & drop functionality, and assignment features.

## Core Data Model & State Management

### Data Structure
- **REQ-ACTMGMT-1**: System shall extend ActionItem interface with unique identifier (id) and assignedTo fields for CRUD operations
- **REQ-ACTMGMT-2**: System shall use crypto.randomUUID() for generating unique action item identifiers
- **REQ-ACTMGMT-3**: System shall integrate action item management with existing summaryStore using Zustand for state persistence
- **REQ-ACTMGMT-4**: System shall replace ActionItemsByRole structure with flat ActionItem array using assignedTo field for grouping
- **REQ-ACTMGMT-5**: System shall compute speaker groupings dynamically in components rather than maintaining separate grouped structures
- **REQ-ACTMGMT-6**: System shall transform legacy ActionItemsByRole data to new ActionItem structure with proper migration

## User Interface & Interaction Design

### Interface Components
- **REQ-ACTMGMT-7**: System shall provide "ADD ACTION ITEM" button at the top of the Action Items section in SummaryDisplay
- **REQ-ACTMGMT-8**: System shall implement UpsertActionItemDialog for both create and edit operations with speaker assignment
- **REQ-ACTMGMT-9**: System shall provide pencil edit icon on each action item row for direct editing access
- **REQ-ACTMGMT-10**: System shall pre-populate UpsertActionItemDialog with existing action item details when editing
- **REQ-ACTMGMT-11**: System shall default new action items to "Unassigned" status in creation dialog
- **REQ-ACTMGMT-12**: System shall include speaker dropdown with all meeting participants and "Unassigned" option
- **REQ-ACTMGMT-13**: System shall support manually-added speakers in assignment dropdown alongside auto-detected speakers

### Visual Layout & Spacing
- **REQ-ACTMGMT-45**: System shall use flexbox layout for action item display with precise spacing control between item numbers and descriptions (0.5 gap units)
- **REQ-ACTMGMT-46**: System shall ensure action item numbers have consistent width (20px minimum) and flex-shrink: 0 to prevent layout distortion

## CRUD Operations

### Create Operations
- **REQ-ACTMGMT-14**: System shall implement Create operation allowing users to add new action items with description and speaker assignment
- **REQ-ACTMGMT-17**: System shall validate that action item descriptions are non-empty before allowing save operations
- **REQ-ACTMGMT-18**: System shall prevent duplicate action items with same description and assignee combination
- **REQ-ACTMGMT-19**: System shall validate speaker assignments against available meeting participants only

### Update Operations
- **REQ-ACTMGMT-15**: System shall implement Update operation allowing users to modify action item description and reassign ownership
- **REQ-ACTMGMT-32**: System shall maintain form state during validation failures to preserve user input

### Delete Operations
- **REQ-ACTMGMT-16**: System shall implement Delete operation with confirmation dialog to prevent accidental removal

## Drag & Drop Functionality

### Core Drag & Drop Features
- **REQ-ACTMGMT-20**: System shall implement drag and drop functionality using @dnd-kit/core library for action item reassignment
- **REQ-ACTMGMT-21**: System shall allow dragging action items between speaker sections and to/from unassigned area
- **REQ-ACTMGMT-22**: System shall provide visual feedback during drag operations with appropriate cursor indicators
- **REQ-ACTMGMT-23**: System shall highlight valid drop zones when drag operation is active
- **REQ-ACTMGMT-24**: System shall validate drop targets and prevent assignment to non-meeting participants
- **REQ-ACTMGMT-25**: System shall handle invalid drop attempts by resetting item to original position
- **REQ-ACTMGMT-26**: System shall display error message via Snackbar for unsuccessful drop operations
- **REQ-ACTMGMT-27**: System shall prevent duplicate assignments through drag and drop with clear error messaging

## Validation & Error Handling

### Input Validation
- **REQ-ACTMGMT-28**: System shall validate action items on dialog save button press for create and edit operations
- **REQ-ACTMGMT-29**: System shall validate drag and drop operations at drop time with immediate feedback
- **REQ-ACTMGMT-30**: System shall use consistent Snackbar error messaging matching existing application patterns
- **REQ-ACTMGMT-31**: System shall provide specific error messages for validation failures (empty description, duplicate assignment, invalid speaker)

## Integration & Downstream Effects

### System Integration
- **REQ-ACTMGMT-33**: System shall update copy functionality to reflect modified action items in clipboard content
- **REQ-ACTMGMT-34**: System shall integrate modified action items into email sharing functionality
- **REQ-ACTMGMT-35**: System shall maintain action item modifications in email composition and sending
- **REQ-ACTMGMT-36**: System shall preserve action item edits throughout session until browser window closure
- **REQ-ACTMGMT-37**: System shall work consistently in both Demo and Production modes
- **REQ-ACTMGMT-38**: System shall integrate with tour system for guided demonstration of action item management features

## Component Architecture

### Component Structure
- **REQ-ACTMGMT-39**: System shall implement ActionItemCard component as draggable item with edit and delete controls
- **REQ-ACTMGMT-40**: System shall implement UpsertActionItemDialog as modal for create and edit operations
- **REQ-ACTMGMT-41**: System shall implement ActionItemDropZone components for speaker sections and unassigned area
- **REQ-ACTMGMT-42**: System shall implement ActionItemsManager component to orchestrate all CRUD operations
- **REQ-ACTMGMT-43**: System shall enhance existing SummaryDisplay accordion layout to support drag and drop zones
- **REQ-ACTMGMT-44**: System shall maintain existing Material-UI styling consistency with enhanced interactive elements

## Technical Implementation Details

### State Management
- **Zustand Integration**: Extend existing summaryStore for action item state management
- **Session Persistence**: Maintain action item modifications throughout browser session
- **Real-time Updates**: Immediate UI updates for all CRUD operations
- **State Isolation**: Separate demo and production action item state

### User Experience Design
- **Intuitive Drag & Drop**: Clear visual feedback during drag operations
- **Accessible Interface**: Keyboard navigation and screen reader support
- **Consistent Styling**: Material-UI theme compliance for all components
- **Error Prevention**: Validation before destructive operations

### Data Validation
- **Required Fields**: Non-empty descriptions for all action items
- **Duplicate Prevention**: Check for identical description-assignee combinations
- **Speaker Validation**: Ensure assignments only to valid meeting participants
- **Input Sanitization**: Clean and validate all user input

### Integration Architecture
- **Email Integration**: Modified action items reflected in email content
- **Copy Functionality**: Updated clipboard content with current action items
- **Tour System**: Guided demonstration of action item features
- **Mode Compatibility**: Consistent behavior across demo and production modes

## Performance Considerations

### Optimization Requirements
- **REQ-PERF-ACTMGMT-1**: Drag and drop operations shall complete within 100ms for smooth user experience
- **REQ-PERF-ACTMGMT-2**: CRUD operations shall update UI immediately with optimistic updates
- **REQ-PERF-ACTMGMT-3**: Large action item lists (>50 items) shall maintain responsive performance
- **REQ-PERF-ACTMGMT-4**: State changes shall trigger minimal component re-renders through efficient selectors

## Accessibility Requirements

### Inclusive Design
- **REQ-ACC-ACTMGMT-1**: All drag and drop operations shall have keyboard alternatives
- **REQ-ACC-ACTMGMT-2**: Screen readers shall announce action item state changes
- **REQ-ACC-ACTMGMT-3**: Color-blind users shall distinguish action item states through icons and text
- **REQ-ACC-ACTMGMT-4**: Focus management shall follow logical tab order during dialog interactions

## Testing Requirements

### Quality Assurance
- **REQ-TEST-ACTMGMT-1**: Unit tests shall cover all CRUD operations with edge cases
- **REQ-TEST-ACTMGMT-2**: Integration tests shall validate drag and drop functionality
- **REQ-TEST-ACTMGMT-3**: User acceptance tests shall verify complete action item workflows
- **REQ-TEST-ACTMGMT-4**: Performance tests shall validate responsive behavior with large datasets

## Security Considerations

### Data Protection
- **REQ-SEC-ACTMGMT-1**: Action item data shall remain session-only without persistent storage
- **REQ-SEC-ACTMGMT-2**: User input shall be sanitized to prevent XSS attacks
- **REQ-SEC-ACTMGMT-3**: Action item modifications shall not expose sensitive meeting data
- **REQ-SEC-ACTMGMT-4**: Client-side validation shall be supplemented with server-side checks

## Integration Points

### Related Systems
- Integrates with [Speaker Management](./speaker-management.md) for assignee options
- Receives action items from [AI Summarization](./ai-summarization.md) for initial population
- Provides updated action items to [Email Communication](./email-communication.md) for sharing
- Works within [Demo Mode](./demo-mode.md) for guided feature demonstration

### Data Flow
1. **Input**: AI-generated action items from meeting summaries
2. **Processing**: User CRUD operations and drag & drop reassignments
3. **Storage**: Session-based state management with immediate UI updates
4. **Output**: Modified action items for email sharing and copy operations

## Future Enhancements

### Potential Improvements
- **Priority Levels**: Add priority indicators (High, Medium, Low) to action items
- **Due Dates**: Support deadline assignment and tracking for action items
- **Progress Tracking**: Enable status updates (Not Started, In Progress, Complete)
- **Categories**: Allow tagging action items with project or topic categories
- **Notifications**: Email reminders for assigned action items (when user accounts are implemented)

### Advanced Features
- **Template Action Items**: Pre-defined action item templates for common meeting types
- **Bulk Operations**: Select and modify multiple action items simultaneously
- **Export Options**: Generate action item reports in various formats
- **Integration**: Connect with project management tools (Jira, Asana, Trello)
- **Analytics**: Track action item completion rates and assignment patterns
