# Speaker Management Requirements

This document contains all requirements related to speaker identification, mapping, and CRUD operations.

## Speaker Identification Enhancement

### Automatic Detection
- **REQ-SPK-1**: System shall detect speaker self-introductions in the first 5 minutes of recordings
- **REQ-SPK-2**: System shall extract speaker names from common introduction patterns ("Hi, this is John", "My name is Sarah", etc.)
- **REQ-SPK-3**: System shall identify role/title information when mentioned during introductions ("Product Manager", "Senior Developer", etc.)
- **REQ-SPK-4**: System shall associate detected names with corresponding speaker voice patterns throughout the meeting
- **REQ-SPK-5**: System shall provide confidence scores for auto-detected speaker names and roles
- **REQ-SPK-6**: System shall pre-populate speaker mapping interface with detected names while allowing user verification/correction
- **REQ-SPK-7**: System shall distinguish between speaker names and other mentioned names in the conversation
- **REQ-SPK-8**: System shall handle multiple introduction formats and informal speech patterns
- **REQ-SPK-9**: System shall display auto-detected speakers in the upload progress interface for immediate user feedback
- **REQ-SPK-10**: System shall fall back to manual speaker mapping when auto-detection confidence is below threshold

### Manual Speaker Management
- **REQ-SPK-11**: System shall allow users to manually add speakers not detected by automatic transcription
- **REQ-SPK-12**: System shall allow users to remove incorrectly detected speakers from the mapping interface
- **REQ-SPK-13**: System shall provide clear visual distinction between auto-detected and manually-added speakers
- **REQ-SPK-14**: System shall validate that at least one speaker exists before allowing save operation
- **REQ-SPK-15**: System shall persist manually-added speakers with appropriate metadata for future reference
- **REQ-SPK-16**: System shall display all speakers (auto-detected and manually-added) in the main Speaker Mappings interface
- **REQ-SPK-17**: System shall show manually-added speakers in "Mapped Speakers" section when they have name/role assigned
- **REQ-SPK-18**: System shall show manually-added speakers in "Unmapped Speakers" section when they lack complete mapping information
- **REQ-SPK-19**: System shall update speaker mapping display in real-time when speakers are added/removed in the dialog

### Speaker Override Capabilities
- **REQ-SPK-20**: System shall allow users to manually override any speaker mapping assignment when API detection is incorrect
- **REQ-SPK-21**: System shall provide an "Edit Mapping" option for each speaker that allows modification of name and role assignments
- **REQ-SPK-22**: System shall clearly indicate when speaker mappings have been manually overridden vs auto-detected
- **REQ-SPK-23**: System shall preserve original auto-detected mappings as fallback when user overrides are cleared
- **REQ-SPK-24**: System shall validate manual override inputs to prevent duplicate speaker names within the same meeting
- **REQ-SPK-25**: System shall allow users to override transcript segment speaker assignments to correct AI misidentification
- **REQ-SPK-26**: System shall provide visual indicator on confidence scores when speaker has been manually reassigned to segment
- **REQ-SPK-27**: System shall invalidate and mark confidence percentages when segment speaker assignment is manually overridden
- **REQ-SPK-28**: System shall dynamically update speaker mapping counts to reflect actual mapped vs unmapped speakers
- **REQ-SPK-29**: System shall automatically update unmapped speaker chip displays when speakers are successfully mapped
- **REQ-SPK-30**: System shall replace generic speaker labels with mapped speaker names in transcript segment displays
- **REQ-SPK-31**: System shall provide real-time feedback in Speaker Mappings section showing current mapping status
- **REQ-SPK-32**: System shall maintain segment-level speaker override history for audit and revert capabilities

## Speaker Deletion Operations

### Deletion Workflow
- **REQ-SPK-DEL-1**: System shall allow users to delete speaker mappings from the mapping interface
- **REQ-SPK-DEL-2**: When a speaker mapping is deleted, the system shall remove the speaker from the total speaker count
- **REQ-SPK-DEL-3**: Transcript segments previously assigned to deleted speakers shall display "Unassigned" as the speaker label
- **REQ-SPK-DEL-4**: Speaker count display shall update to reflect only remaining speakers (e.g., "0/2" becomes "0/1" when one speaker is deleted)
- **REQ-SPK-DEL-5**: Auto-detected speaker chips at the top of transcript component shall be removed when corresponding speaker is deleted
- **REQ-SPK-DEL-6**: System shall provide confirmation dialog before permanently deleting speaker mappings
- **REQ-SPK-DEL-7**: Dialog state shall remain consistent after successful speaker deletion operations
- **REQ-SPK-DEL-8**: Parent component speaker counts and displays shall update immediately after deletion is saved
- **REQ-SPK-DEL-9**: Backend DELETE endpoint shall return success response when speaker mappings are deleted
- **REQ-SPK-DEL-10**: System shall preserve transcript content and timestamps when speaker mappings are deleted
- **REQ-SPK-DEL-11**: Deleted speaker mappings shall not be recoverable within the same session
- **REQ-SPK-DEL-12**: System shall handle deletion of all speakers, resulting in all segments showing "Unassigned"

## Speaker CRUD Operations Interface

### Core Interface Components
- **REQ-SPK-CRUD-1**: System shall provide an "Edit/Delete Mappings" button in the top right of the TranscriptDisplay component
- **REQ-SPK-CRUD-2**: System shall open a dedicated SpeakerMappingDialog when "Edit/Delete Mappings" button is clicked
- **REQ-SPK-CRUD-3**: SpeakerMappingDialog shall display all current speaker mappings with Name and Role fields
- **REQ-SPK-CRUD-4**: Each speaker entry in the dialog shall have a pencil icon for editing operations
- **REQ-SPK-CRUD-5**: Each speaker entry in the dialog shall have a trash can icon for deletion operations
- **REQ-SPK-CRUD-6**: System shall provide "Close" and "Update Mappings" buttons at the bottom of the dialog
- **REQ-SPK-CRUD-7**: "Update Mappings" button shall only be enabled when changes have been made in the dialog
- **REQ-SPK-CRUD-8**: System shall validate all speaker mapping changes before allowing updates
- **REQ-SPK-CRUD-9**: Dialog shall maintain state consistency during all CRUD operations

### Create Operations
- **REQ-SPK-CREATE-1**: System shall provide "Add New Speaker" functionality in the SpeakerMappingDialog
- **REQ-SPK-CREATE-2**: System shall allow users to specify Name and Role when creating new speaker mappings
- **REQ-SPK-CREATE-3**: System shall validate new speaker entries to prevent duplicate names within the same meeting
- **REQ-SPK-CREATE-4**: System shall generate unique speaker IDs for manually created speakers
- **REQ-SPK-CREATE-5**: Newly created speakers shall be immediately available for transcript segment assignment
- **REQ-SPK-CREATE-6**: System shall preserve creation metadata (timestamp, user) for manually added speakers

### Update Operations
- **REQ-SPK-UPDATE-1**: System shall allow in-line editing of Name and Role fields for existing speakers
- **REQ-SPK-UPDATE-2**: System shall provide real-time validation during speaker mapping updates
- **REQ-SPK-UPDATE-3**: System shall preserve original auto-detected values when speakers are manually updated
- **REQ-SPK-UPDATE-4**: Updated speaker names shall be reflected immediately in transcript segment displays
- **REQ-SPK-UPDATE-5**: System shall maintain update history for audit purposes within the session
- **REQ-SPK-UPDATE-6**: System shall validate that speaker name changes don't conflict with existing speakers
- **REQ-SPK-UPDATE-7**: System shall allow reverting manual updates back to original auto-detected values

### Delete Operations
- **REQ-SPK-DELETE-1**: System shall provide confirmation dialog before permanently deleting speaker mappings
- **REQ-SPK-DELETE-2**: System shall display impact preview showing affected transcript segments before deletion
- **REQ-SPK-DELETE-3**: Deleted speakers shall be removed from all transcript segment assignments
- **REQ-SPK-DELETE-4**: Transcript segments of deleted speakers shall display "Unassigned" speaker label
- **REQ-SPK-DELETE-5**: System shall update speaker counts and statistics immediately after deletion
- **REQ-SPK-DELETE-6**: System shall prevent deletion of speakers if it would result in no speakers remaining
- **REQ-SPK-DELETE-7**: Deleted speaker mappings shall not be recoverable within the same session
- **REQ-SPK-DELETE-8**: System shall cascade speaker deletion updates to all dependent components

## Speaker Management Cleanup

### Cleanup Operations
- **REQ-SPK-25**: System shall automatically remove speakers that have no assigned segments and no name/role mapping
- **REQ-SPK-26**: System shall perform speaker cleanup operation after manual speaker mapping changes
- **REQ-SPK-27**: System shall validate speaker relevance before including in speaker mapping interface
- **REQ-SPK-28**: System shall provide clear indication when speakers are removed due to lack of segments
- **REQ-SPK-29**: System shall maintain speaker mapping consistency across transcript and summary sections

## Bulk Speaker Assignment

### Multi-Selection Interface
- **REQ-BULK-1**: System shall provide "Bulk Assign" button at top of Transcription Results section
- **REQ-BULK-2**: Bulk Assign button shall be enabled only when one or more transcript segments are selected
- **REQ-BULK-3**: System shall support multi-selection of transcript segments using Ctrl+click and Shift+click
- **REQ-BULK-4**: Selected transcript segments shall have clear visual indication (highlighting, borders, or checkmarks)
- **REQ-BULK-5**: Bulk assignment dialog shall allow Name/Role/Email assignment for all selected segments simultaneously
- **REQ-BULK-6**: System shall apply bulk assignments to all selected segments and update transcript display immediately
- **REQ-BULK-7**: Bulk assignment shall validate that assignments are applied correctly across all selected segments
- **REQ-BULK-8**: System shall provide undo functionality for bulk assignment operations
- **REQ-BULK-9**: Bulk assignment dialog shall show count of selected segments for user confirmation
- **REQ-BULK-10**: System shall support partial bulk assignments (e.g., name only, role only) based on user input

## Content Management & History

### Data Persistence
- **REQ-CNT-6**: System shall persist auto-detected speaker information with confidence scores for future reference
- **REQ-CNT-7**: System shall track manual corrections to auto-detected speaker names for machine learning improvement
- **REQ-CNT-8**: System shall enable search by participant names across meeting history
- **REQ-CNT-9**: System shall maintain audit trail of manual speaker additions and removals with timestamps
- **REQ-CNT-10**: System shall preserve speaker management history for meeting reconstruction and analysis
- **REQ-CNT-11**: System shall track all manual speaker mapping overrides with user attribution and timestamps
- **REQ-CNT-12**: System shall provide option to revert manual overrides back to original auto-detected mappings

## Technical Implementation

### Natural Language Processing Requirements
**Pattern Recognition:**
- Recognition for common introduction phrases
- Named entity recognition for extracting person names and job titles
- Confidence scoring based on introduction clarity and audio quality
- Support for multiple languages and cultural introduction patterns

### Integration Points
**System Integration:**
- Enhance existing `TranscriptionResponse` model with `autoDetectedSpeakers` field
- Extend `SpeakerMappingDialog` to show auto-detected names with confidence indicators
- Update upload progress display to show detected speakers in real-time
- Modify backend transcription service to include name detection pipeline

### Quality Assurance
**Validation Requirements:**
- Minimum confidence threshold (e.g., 70%) for auto-population
- User verification required for all auto-detected names
- Fallback to manual mapping when detection fails
- Audit trail for accuracy improvement and false positive reduction

### User Interface Requirements
**Interface Design:**
- Add/Remove speaker buttons in SpeakerMappingDialog
- Visual indicators distinguishing auto-detected (🎤) vs manually-added (➕) speakers
- Confirmation dialogs for speaker removal to prevent accidental deletion
- Validation ensuring minimum one speaker exists before save operation
- Clear labeling and accessible design following Material-UI guidelines

### Display Integration
**Component Updates:**
- All speakers (auto-detected + manually-added) appear in main Speaker Mappings interface
- Mapped Speaker Display: Manually-added speakers with name/role show in "Mapped Speakers" section
- Unmapped Speaker Display: Manually-added speakers without complete mapping show in "Unmapped Speakers" section
- Real-time Updates: Speaker mapping display updates immediately when speakers are added/removed in dialog

### Manual Override Interface
**Override Capabilities:**
- Intuitive editing capabilities for correcting speaker assignments
- Visual cues to distinguish manually-overridden mappings from auto-detected ones
- Real-time validation to prevent conflicts in speaker assignments
- One-click option to restore original auto-detected mappings
- Click-to-edit functionality for reassigning individual transcript segments to different speakers
- Visual indicators showing when confidence scores are no longer relevant due to manual overrides
- Real-time updates to "(X/Y mapped)" counters reflecting current mapping status
- Replace generic "Speaker 1" labels with actual mapped names in transcript sections
- Clear visual distinction between AI-assigned and manually-reassigned segments

### Backend Integration
**Data Model Extensions:**
- Extend SpeakerMapping model with `source` field (AutoDetected, ManuallyAdded)
- Update speaker mapping API endpoints to handle dynamic speaker lists
- Implement validation rules for speaker addition/removal operations
- Maintain backward compatibility with existing auto-detected speaker workflows
- Segment Override Support: Extend SpeakerSegment model to track manual speaker reassignments
- Override Audit Trail: Persist segment-level speaker changes with timestamps and user attribution
- Confidence Invalidation: Flag confidence scores as invalid when segments are manually reassigned
- Mapping Counter Logic: Implement real-time calculation of mapped vs unmapped speaker counts
- Speaker Resolution: Provide API endpoints for resolving speaker IDs to mapped names in transcript display

### Data Persistence
**Storage Requirements:**
- Store manual speaker additions with creation timestamps and user metadata
- Track speaker removal actions for audit and potential recovery
- Associate manually-added speakers with transcription sessions for proper scoping
- Enable speaker list reconstruction for meeting history and analysis features

## Integration Points

### Related Systems
- Integrates with [Audio Transcription](./audio-transcription.md) for speaker identification data
- Provides speaker information to [AI Summarization](./ai-summarization.md) for role-aware summaries
- Speaker assignments used in [Action Item Management](./action-item-management.md) for task organization
- Speaker data included in [Email Communication](./email-communication.md) for context sharing

## State Management Architecture

### Centralized State Management
- **REQ-STATE-1**: System shall implement centralized state management to eliminate multiple sources of truth for speaker data
- **REQ-STATE-2**: System shall use single SpeakerSessionStore for all speaker-related state (mappings, segments, active speakers)
- **REQ-STATE-3**: System shall automatically compute derived state (speaker stats, filtered speakers, mapping counts) from base data
- **REQ-STATE-4**: System shall eliminate duplicate filtering logic across TranscriptDisplay and SpeakerMapping components
- **REQ-STATE-5**: System shall ensure speaker filtering reflects current segment assignments (speakers without segments disappear from UI)
- **REQ-STATE-6**: System shall provide session isolation to prevent state bleeding between different transcriptions
- **REQ-STATE-7**: System shall optimize component re-renders through efficient state selectors and memoization
- **REQ-STATE-8**: System shall maintain backward compatibility during state management migration
- **REQ-STATE-9**: System shall remove legacy local component state management after successful migration
- **REQ-STATE-10**: System shall ensure state changes are atomic and trigger appropriate UI updates automatically
