# Core Requirements for MeetingSummarizer API

## Functional Requirements

### Audio Processing

- REQ-AUD-1: System shall accept audio file uploads in common formats (MP3, WAV, M4A, MP4)
- REQ-AUD-2: System shall support real-time audio streaming for live meeting transcription
- REQ-AUD-3: System shall validate audio file size limits (max 500MB per file)
- REQ-AUD-4: System shall extract audio from video files (MP4, AVI, MOV)

### Transcription & Speaker Diarization

- REQ-TRN-1: System shall convert audio to text using Azure Speech Services as primary provider
- REQ-TRN-2: System shall support multiple languages for transcription (initially English, expandable)
- REQ-TRN-3: System shall identify and label different speakers in the audio with minimum 85% accuracy for 2-10 speakers
- REQ-TRN-4: System shall timestamp transcribed text segments with millisecond precision
- REQ-TRN-5: System shall handle poor audio quality with confidence scoring and graceful degradation
- REQ-TRN-6: System shall provide speaker confidence scores for each identified speaker segment
- REQ-TRN-7: System shall detect speaker count automatically without requiring user input
- REQ-TRN-8: System shall handle overlapping speech and identify primary speaker per segment
- REQ-TRN-9: System shall use Azure batch transcription mode for cost optimization and free diarization
- REQ-TRN-10: System shall fall back to OpenAI Whisper when Azure Speech Services fails
- REQ-TRN-11: System shall support long-duration meetings up to 60 minutes using Azure Batch Transcription API for files exceeding 5 minutes or showing truncation issues with real-time API (S4.2)
- REQ-TRN-12: System shall automatically detect when audio files require batch processing based on duration estimation and file size thresholds (S4.3)
- REQ-TRN-13: System shall provide appropriate user feedback and estimated processing times for batch transcription operations (S4.4)

### Speaker Identification Enhancement

- REQ-SPK-1: System shall detect speaker self-introductions in the first 5 minutes of recordings
- REQ-SPK-2: System shall extract speaker names from common introduction patterns ("Hi, this is John", "My name is Sarah", etc.)
- REQ-SPK-3: System shall identify role/title information when mentioned during introductions ("Product Manager", "Senior Developer", etc.)
- REQ-SPK-4: System shall associate detected names with corresponding speaker voice patterns throughout the meeting
- REQ-SPK-5: System shall provide confidence scores for auto-detected speaker names and roles
- REQ-SPK-6: System shall pre-populate speaker mapping interface with detected names while allowing user verification/correction
- REQ-SPK-7: System shall distinguish between speaker names and other mentioned names in the conversation
- REQ-SPK-8: System shall handle multiple introduction formats and informal speech patterns
- REQ-SPK-9: System shall display auto-detected speakers in the upload progress interface for immediate user feedback
- REQ-SPK-10: System shall fall back to manual speaker mapping when auto-detection confidence is below threshold
- REQ-SPK-11: System shall allow users to manually add speakers not detected by automatic transcription
- REQ-SPK-12: System shall allow users to remove incorrectly detected speakers from the mapping interface
- REQ-SPK-13: System shall provide clear visual distinction between auto-detected and manually-added speakers
- REQ-SPK-14: System shall validate that at least one speaker exists before allowing save operation
- REQ-SPK-15: System shall persist manually-added speakers with appropriate metadata for future reference
- REQ-SPK-16: System shall display all speakers (auto-detected and manually-added) in the main Speaker Mappings interface
- REQ-SPK-17: System shall show manually-added speakers in "Mapped Speakers" section when they have name/role assigned
- REQ-SPK-18: System shall show manually-added speakers in "Unmapped Speakers" section when they lack complete mapping information
- REQ-SPK-19: System shall update speaker mapping display in real-time when speakers are added/removed in the dialog
- REQ-SPK-20: System shall allow users to manually override any speaker mapping assignment when API detection is incorrect
- REQ-SPK-21: System shall provide an "Edit Mapping" option for each speaker that allows modification of name and role assignments
- REQ-SPK-22: System shall clearly indicate when speaker mappings have been manually overridden vs auto-detected
- REQ-SPK-23: System shall preserve original auto-detected mappings as fallback when user overrides are cleared
- REQ-SPK-24: System shall validate manual override inputs to prevent duplicate speaker names within the same meeting
- REQ-SPK-25: System shall allow users to override transcript segment speaker assignments to correct AI misidentification
- REQ-SPK-26: System shall provide visual indicator on confidence scores when speaker has been manually reassigned to segment
- REQ-SPK-27: System shall invalidate and mark confidence percentages when segment speaker assignment is manually overridden
- REQ-SPK-28: System shall dynamically update speaker mapping counts to reflect actual mapped vs unmapped speakers
- REQ-SPK-29: System shall automatically update unmapped speaker chip displays when speakers are successfully mapped
- REQ-SPK-30: System shall replace generic speaker labels with mapped speaker names in transcript segment displays
- REQ-SPK-31: System shall provide real-time feedback in Speaker Mappings section showing current mapping status
- REQ-SPK-32: System shall maintain segment-level speaker override history for audit and revert capabilities

### Azure Speech Services Integration

- REQ-AZR-1: System shall create Azure AI Speech resource in West Coast US region (westus2)
- REQ-AZR-2: System shall configure authentication using API key for development, Managed Identity for production
- REQ-AZR-3: System shall use Azure batch transcription API for single-file processing with free diarization
- REQ-AZR-4: System shall implement Azure-specific error handling and retry logic
- REQ-AZR-5: System shall monitor usage against Free tier limits (5 hours/month) with usage alerts
- REQ-AZR-6: System shall transform Azure Speech Services JSON response to match existing frontend data contracts
- REQ-AZR-7: System shall map Azure speaker labels and timestamps to existing SpeakerSegment format
- REQ-AZR-8: System shall preserve Azure confidence scores and metadata for display and debugging
- REQ-AZR-9: System shall implement service abstraction layer supporting both Azure and OpenAI providers
- REQ-AZR-10: System shall provide configuration-driven service selection with factory pattern implementation

### Service Abstraction & Migration

- REQ-ABS-1: System shall implement ITranscriptionService interface for provider abstraction
- REQ-ABS-2: System shall use factory pattern with configuration-driven service selection
- REQ-ABS-3: System shall support Azure Speech Services, OpenAI, and Mock providers through common interface
- REQ-ABS-4: System shall enable provider switching without code changes through configuration
- REQ-ABS-5: System shall maintain backward compatibility with existing transcription data during migration
- REQ-ABS-6: System shall provide configuration toggle between Azure and OpenAI services during transition
- REQ-ABS-7: System shall preserve all existing speaker mapping functionality with improved accuracy

### Cost Management & Monitoring

- REQ-COST-1: System shall track API usage metrics for Azure Speech Services and OpenAI separately
- REQ-COST-2: System shall implement cost monitoring with configurable monthly spending alerts
- REQ-COST-3: System shall provide cost-per-transcription reporting for business decision making
- REQ-COST-4: System shall log service provider usage for reliability and cost analysis
- REQ-COST-5: System shall optimize service selection based on historical accuracy and cost data

### Fallback Strategy

- REQ-FALL-1: System shall attempt Azure Speech Services as primary transcription service
- REQ-FALL-2: When Azure fails, system shall automatically fall back to OpenAI Whisper service
- REQ-FALL-3: When both services fail, system shall enable "manual-only" mode with bulk segment reassignment tools
- REQ-FALL-4: System shall clearly indicate which service was used for each transcription in UI and logs
- REQ-FALL-5: System shall log fallback occurrences for service reliability monitoring and debugging

### Configuration & Validation

- REQ-CFG-1: System shall validate frontend and backend supported file types for consistency at startup
- REQ-CFG-2: System shall validate Azure Storage connection string and container access during application startup
- REQ-CFG-3: System shall provide clear error messages when Azure services are misconfigured or unavailable
- REQ-CFG-4: System shall implement graceful degradation when batch processing services are unavailable
- REQ-CFG-5: System shall validate configuration completeness for all required Azure service dependencies
- REQ-CFG-6: System shall provide configuration validation tools for development and deployment environments
- REQ-CFG-7: System shall log detailed configuration validation results for troubleshooting and monitoring

### File Processing & Optimization

- REQ-FPO-1: System shall perform audio file format validation beyond extension checking using content analysis
- REQ-FPO-2: System shall optimize audio files for Azure Speech Services processing when format conversion is beneficial
- REQ-FPO-3: System shall handle corrupted or malformed audio files with appropriate error messages
- REQ-FPO-4: System shall detect and handle edge cases in audio file metadata and format variations
- REQ-FPO-5: System shall implement memory-efficient processing for large audio file uploads (>100MB)
- REQ-FPO-6: System shall provide progress feedback for file processing operations that exceed normal timeouts

### Resource Management & Cleanup

- REQ-RMC-1: System shall automatically cleanup temporary blob storage files after successful transcription processing
- REQ-RMC-2: System shall implement scheduled cleanup of abandoned or failed transcription job artifacts
- REQ-RMC-3: System shall optimize memory usage during concurrent large file uploads and processing
- REQ-RMC-4: System shall implement proper timeout handling for batch operations with user-friendly feedback
- REQ-RMC-5: System shall monitor and log resource usage metrics for performance optimization
- REQ-RMC-6: System shall implement automatic retry mechanisms with exponential backoff for transient Azure service failures

### Development Experience & Debugging

- REQ-DEV-8: System shall provide enhanced debug logging for Azure service interactions and batch processing workflows
- REQ-DEV-9: System shall implement configuration validation scripts for local development environment setup
- REQ-DEV-10: System shall provide diagnostic endpoints for health checking Azure service connectivity and configuration
- REQ-DEV-11: System shall include detailed error context and troubleshooting guidance in development error messages
- REQ-DEV-12: System shall implement request tracing and correlation IDs for complex multi-service operations

### Speaker Deletion Operations

- REQ-SPK-DEL-1: System shall allow users to delete speaker mappings from the mapping interface
- REQ-SPK-DEL-2: When a speaker mapping is deleted, the system shall remove the speaker from the total speaker count
- REQ-SPK-DEL-3: Transcript segments previously assigned to deleted speakers shall display "Unassigned" as the speaker label
- REQ-SPK-DEL-4: Speaker count display shall update to reflect only remaining speakers (e.g., "0/2" becomes "0/1" when one speaker is deleted)
- REQ-SPK-DEL-5: Auto-detected speaker chips at the top of transcript component shall be removed when corresponding speaker is deleted
- REQ-SPK-DEL-6: System shall provide confirmation dialog before permanently deleting speaker mappings
- REQ-SPK-DEL-7: Dialog state shall remain consistent after successful speaker deletion operations
- REQ-SPK-DEL-8: Parent component speaker counts and displays shall update immediately after deletion is saved
- REQ-SPK-DEL-9: Backend DELETE endpoint shall return success response when speaker mappings are deleted
- REQ-SPK-DEL-10: System shall preserve transcript content and timestamps when speaker mappings are deleted
- REQ-SPK-DEL-11: Deleted speaker mappings shall not be recoverable within the same session
- REQ-SPK-DEL-12: System shall handle deletion of all speakers, resulting in all segments showing "Unassigned"

### Speaker CRUD Operations Interface

- REQ-SPK-CRUD-1: System shall provide an "Edit/Delete Mappings" button in the top right of the TranscriptDisplay component
- REQ-SPK-CRUD-2: System shall open a dedicated SpeakerMappingDialog when "Edit/Delete Mappings" button is clicked
- REQ-SPK-CRUD-3: SpeakerMappingDialog shall display all current speaker mappings with Name and Role fields
- REQ-SPK-CRUD-4: Each speaker entry in the dialog shall have a pencil icon for editing operations
- REQ-SPK-CRUD-5: Each speaker entry in the dialog shall have a trash can icon for deletion operations
- REQ-SPK-CRUD-6: System shall provide "Close" and "Update Mappings" buttons at the bottom of the dialog
- REQ-SPK-CRUD-7: "Update Mappings" button shall only be enabled when changes have been made in the dialog
- REQ-SPK-CRUD-8: System shall validate all speaker mapping changes before allowing updates
- REQ-SPK-CRUD-9: Dialog shall maintain state consistency during all CRUD operations

#### Create Operations

- REQ-SPK-CREATE-1: System shall provide "Add New Speaker" functionality in the SpeakerMappingDialog
- REQ-SPK-CREATE-2: System shall allow users to specify Name and Role when creating new speaker mappings
- REQ-SPK-CREATE-3: System shall validate new speaker entries to prevent duplicate names within the same meeting
- REQ-SPK-CREATE-4: System shall generate unique speaker IDs for manually created speakers
- REQ-SPK-CREATE-5: Newly created speakers shall be immediately available for transcript segment assignment
- REQ-SPK-CREATE-6: System shall preserve creation metadata (timestamp, user) for manually added speakers

#### Update Operations

- REQ-SPK-UPDATE-1: System shall allow in-line editing of Name and Role fields for existing speakers
- REQ-SPK-UPDATE-2: System shall provide real-time validation during speaker mapping updates
- REQ-SPK-UPDATE-3: System shall preserve original auto-detected values when speakers are manually updated
- REQ-SPK-UPDATE-4: Updated speaker names shall be reflected immediately in transcript segment displays
- REQ-SPK-UPDATE-5: System shall maintain update history for audit purposes within the session
- REQ-SPK-UPDATE-6: System shall validate that speaker name changes don't conflict with existing speakers
- REQ-SPK-UPDATE-7: System shall allow reverting manual updates back to original auto-detected values

#### Delete Operations

- REQ-SPK-DELETE-1: System shall provide confirmation dialog before permanently deleting speaker mappings
- REQ-SPK-DELETE-2: System shall display impact preview showing affected transcript segments before deletion
- REQ-SPK-DELETE-3: Deleted speakers shall be removed from all transcript segment assignments
- REQ-SPK-DELETE-4: Transcript segments of deleted speakers shall display "Unassigned" speaker label
- REQ-SPK-DELETE-5: System shall update speaker counts and statistics immediately after deletion
- REQ-SPK-DELETE-6: System shall prevent deletion of speakers if it would result in no speakers remaining
- REQ-SPK-DELETE-7: Deleted speaker mappings shall not be recoverable within the same session
- REQ-SPK-DELETE-8: System shall cascade speaker deletion updates to all dependent components

### Summarization

- REQ-SUM-1: System shall generate concise meeting summaries from transcriptions
- REQ-SUM-2: System shall extract key topics and discussion points
- REQ-SUM-3: System shall identify action items and decisions made
- REQ-SUM-4: System shall highlight important participants and their contributions
- REQ-SUM-5: System shall provide multiple summary formats (bullet points, paragraph, executive summary)

### AI-Powered Meeting Summary Generation

- REQ-AI-SUM-1: System shall generate comprehensive meeting summaries on user demand after transcript completion
- REQ-AI-SUM-2: Meeting summaries shall include a narrative overview targeting one-page length (flexible for longer meetings)
- REQ-AI-SUM-3: Meeting summaries shall include action items grouped by speaker/role using mapped speaker information
- REQ-AI-SUM-4: System shall detect both explicit task assignments ("John, handle X") and implicit commitments ("I'll look into that")
- REQ-AI-SUM-5: Action items without clear ownership shall be included with visible "Not Assigned" notation
- REQ-AI-SUM-6: System shall use speaker role mappings to organize action items by participant
- REQ-AI-SUM-7: Generated summaries shall be editable within the current session before sharing
- REQ-AI-SUM-8: System shall provide manual trigger for summary generation (not automatic)
- REQ-AI-SUM-9: System shall maintain session-based storage for generated summaries (no persistent storage)
- REQ-AI-SUM-10: System shall integrate with existing OpenAI service infrastructure for AI processing

### Email Sharing and Distribution

- REQ-EMAIL-1: System shall provide email composition interface for sharing generated meeting summaries
- REQ-EMAIL-2: Email content shall be embedded as rich HTML with professional formatting and company branding
- REQ-EMAIL-3: System shall pre-populate email composition with meeting summary and action items
- REQ-EMAIL-4: System shall allow users to edit email content before sending
- REQ-EMAIL-5: System shall auto-suggest email recipients based on meeting participants from speaker mappings
- REQ-EMAIL-6: System shall include sender's contact information automatically in email composition
- REQ-EMAIL-7: System shall support multiple email sends to different recipients during session
- REQ-EMAIL-8: Email drafts shall be saved and editable within the current session
- REQ-EMAIL-9: System shall include clear notification that content is AI-generated in all shared emails
- REQ-EMAIL-10: System shall maintain session-based email composition (no persistent email storage)
- REQ-EMAIL-11: Email content shall include speaker roles and mappings for recipient context
- REQ-EMAIL-12: System shall integrate with SMTP services for reliable email delivery
- REQ-EMAIL-13: System shall support multiple email service providers (SendGrid, Gmail SMTP, Office 365, Mailgun)
- REQ-EMAIL-14: System shall provide configurable email service settings in application configuration
- REQ-EMAIL-15: System shall handle email delivery failures gracefully with user feedback
- REQ-EMAIL-16: System shall support real email sending for testing and production environments
- REQ-EMAIL-17: System shall validate email addresses before attempting to send
- REQ-EMAIL-18: System shall provide delivery confirmation to users upon successful email send

### Smart Email Send Controls

- REQ-EMAIL-19: System shall track email send history including timestamps, recipients, and content
- REQ-EMAIL-20: System shall display "Last sent: X minutes ago to Y recipients" information in email dialog
- REQ-EMAIL-21: System shall warn users when attempting to send to recipients who previously received the same summary
- REQ-EMAIL-22: System shall allow override of duplicate recipient warnings with explicit user confirmation
- REQ-EMAIL-23: System shall provide "Send Again" button for exact resend to previous recipients (maximum 3 times per summary)
- REQ-EMAIL-24: System shall provide "Compose New" button for sending different content or recipients (maximum 3 times per summary)
- REQ-EMAIL-25: System shall enforce send limits to prevent spam and control API costs
- REQ-EMAIL-26: System shall persist email edits within session and include modifications in sent emails
- REQ-EMAIL-27: System shall maintain send history per meeting summary for accurate tracking
- REQ-EMAIL-28: System shall provide clear visual indicators distinguishing between new sends and resends

### AI-Powered Meeting Summary Generation

- REQ-AI-SUM-1: System shall generate comprehensive Meeting Summary containing meeting overview and role-aware action items
- REQ-AI-SUM-2: System shall process completed transcripts with finalized speaker mappings to create intelligent summaries
- REQ-AI-SUM-3: System shall require manual user initiation for summary generation after speaker mapping completion
- REQ-AI-SUM-4: System shall target one-page summary length with flexibility for longer meetings based on content volume
- REQ-AI-SUM-5: System shall extract both explicit task assignments and implicit commitments from meeting dialogue
- REQ-AI-SUM-6: System shall identify action items without clear ownership and mark them as "Not Assigned" in summary
- REQ-AI-SUM-7: System shall group action items by Speaker using mapped names and roles from speaker management system
- REQ-AI-SUM-8: System shall generate single unified summary viewable by all participants (no role-specific versions)
- REQ-AI-SUM-9: System shall allow users to edit generated summaries within the active session
- REQ-AI-SUM-10: System shall maintain session-based storage for generated summaries without persistent data retention
- REQ-AI-SUM-11: System shall integrate summary generation with existing OpenAI service infrastructure
- REQ-AI-SUM-12: System shall exclude AI-generated summaries from transcript confidence scoring system
- REQ-AI-SUM-13: System shall provide export capabilities for generated summaries including PDF, email, and clipboard formats
- REQ-AI-SUM-14: System shall process speaker role information to enhance action item categorization and attribution
- REQ-AI-SUM-15: System shall maintain clear separation between transcript accuracy and AI summary generation features

### Content Management

- REQ-CNT-1: System shall store meeting recordings with metadata (date, participants, duration)
- REQ-CNT-2: System shall maintain transcription and summary history
- REQ-CNT-3: System shall allow users to edit and annotate transcriptions
- REQ-CNT-4: System shall support search functionality across meetings and summaries
- REQ-CNT-5: System shall export summaries in multiple formats (PDF, Word, plain text)
- REQ-CNT-6: System shall persist auto-detected speaker information with confidence scores for future reference
- REQ-CNT-7: System shall track manual corrections to auto-detected speaker names for machine learning improvement
- REQ-CNT-8: System shall enable search by participant names across meeting history
- REQ-CNT-9: System shall maintain audit trail of manual speaker additions and removals with timestamps
- REQ-CNT-10: System shall preserve speaker management history for meeting reconstruction and analysis
- REQ-CNT-11: System shall track all manual speaker mapping overrides with user attribution and timestamps
- REQ-CNT-12: System shall provide option to revert manual overrides back to original auto-detected mappings

### User Management

- REQ-USR-1: System shall authenticate users via secure login mechanisms
- REQ-USR-2: System shall support role-based access control (admin, user, viewer)
- REQ-USR-3: System shall allow users to organize meetings into projects or categories
- REQ-USR-4: System shall track user activity and processing history

### Integration

- REQ-INT-1: System shall provide RESTful API endpoints for all core functions
- REQ-INT-2: System shall integrate with calendar systems (Outlook, Google Calendar)
- REQ-INT-3: System shall support webhook notifications for processing completion
- REQ-INT-4: System shall provide batch processing capabilities for multiple files

## Non-Functional Requirements

### Testing & Quality Assurance

- REQ-TST-1: System shall maintain minimum 85% test coverage for all core functionality
- REQ-TST-2: System shall include comprehensive unit tests for all Zustand state management stores
- REQ-TST-3: System shall validate session management functionality through automated testing
- REQ-TST-4: System shall include performance regression tests for optimized components
- REQ-TST-5: System shall test session-based privacy controls and data cleanup mechanisms
- REQ-TST-6: System shall include integration tests for complete speaker management workflows
- REQ-TST-7: System shall validate component behavior after performance optimizations
- REQ-TST-8: System shall test error boundaries and fallback mechanisms
- REQ-TST-9: System shall include cross-browser compatibility testing for core features
- REQ-TST-10: System shall validate accessibility compliance through automated testing

### Performance

- REQ-NFR-1: System shall process audio files within 2x the duration of the recording
- REQ-NFR-2: System shall support concurrent processing of up to 50 audio files
- REQ-NFR-3: System shall respond to API requests within 200ms for non-processing operations
- REQ-NFR-4: System shall handle files up to 4 hours in duration

### Scalability

- REQ-NFR-5: System shall scale horizontally to handle increased load
- REQ-NFR-6: System shall support multi-tenant architecture for enterprise deployment
- REQ-NFR-7: System shall queue processing requests during high-load periods

### Security

- REQ-NFR-8: System shall encrypt audio files and transcriptions at rest
- REQ-NFR-9: System shall use HTTPS for all API communications
- REQ-NFR-10: System shall implement rate limiting to prevent abuse
- REQ-NFR-11: System shall comply with data privacy regulations (GDPR, CCPA)
- REQ-NFR-12: System shall provide audit logging for all user actions

### Privacy & Data Handling

- REQ-PRI-1: System shall use session-based data storage with automatic cleanup when browser window is closed
- REQ-PRI-2: System shall clearly communicate to users that closing their browser window will automatically clear all session data
- REQ-PRI-3: System shall display privacy indicators showing data is temporary and session-only
- REQ-PRI-4: System shall not persist user meeting data beyond the active browser session
- REQ-PRI-5: System shall provide clear messaging about automatic data deletion when session ends

### Reliability

- REQ-NFR-13: System shall achieve 99.5% uptime availability
- REQ-NFR-14: System shall implement automatic retry mechanisms for failed processing
- REQ-NFR-15: System shall provide graceful error handling and user feedback
- REQ-NFR-16: System shall backup processed data with point-in-time recovery

### Usability

- REQ-NFR-17: System shall provide clear progress indicators for long-running operations
- REQ-NFR-18: System shall return detailed error messages for troubleshooting
- REQ-NFR-19: System shall support mobile-responsive web interface
- REQ-NFR-20: System shall provide comprehensive API documentation

## Enhancement Roadmap

### Phase 1: Core Functionality (Sprint 1-2) ✅

- Basic transcription with manual speaker mapping
- Speaker role assignment interface
- AI-powered summarization

### Phase 1.5: Enhanced Speaker Management (Sprint 2.5) ✅

- Manual speaker addition and removal capabilities
- Visual distinction between auto-detected and user-added speakers
- Enhanced speaker mapping interface with full CRUD operations
- Audit trail for speaker management actions

### Phase 1.8: Foundation Test Coverage (Sprint 3.0) 🔄

- Comprehensive test coverage for Zustand state management stores
- Session management testing with privacy controls validation
- Performance optimization validation for memoized components
- Integration testing for session-based speaker workflow
- Component test updates for recent foundation improvements

### Phase 2: Smart Speaker Identification (Future Enhancement)

- Automatic speaker name detection from self-introductions
- Enhanced speaker mapping with pre-population
- Improved user experience with reduced manual work

### Phase 3: Advanced Features (Long-term)

- Voice fingerprinting for speaker recognition across meetings
- Integration with calendar systems for participant pre-identification
- Machine learning improvements based on user corrections

## Implementation Notes

### Speaker Self-Identification Technical Approach

**Natural Language Processing Requirements:**

- Pattern recognition for common introduction phrases
- Named entity recognition for extracting person names and job titles
- Confidence scoring based on introduction clarity and audio quality
- Support for multiple languages and cultural introduction patterns

**Integration Points:**

- Enhance existing `TranscriptionResponse` model with `autoDetectedSpeakers` field
- Extend `SpeakerMappingDialog` to show auto-detected names with confidence indicators
- Update upload progress display to show detected speakers in real-time
- Modify backend transcription service to include name detection pipeline

**Quality Assurance:**

- Minimum confidence threshold (e.g., 70%) for auto-population
- User verification required for all auto-detected names
- Fallback to manual mapping when detection fails
- Audit trail for accuracy improvement and false positive reduction

### Manual Speaker Management Technical Approach

**User Interface Requirements:**

- Add/Remove speaker buttons in SpeakerMappingDialog
- Visual indicators distinguishing auto-detected (🎤) vs manually-added (➕) speakers
- Confirmation dialogs for speaker removal to prevent accidental deletion
- Validation ensuring minimum one speaker exists before save operation
- Clear labeling and accessible design following Material-UI guidelines
- **Display Integration**: All speakers (auto-detected + manually-added) appear in main Speaker Mappings interface
- **Mapped Speaker Display**: Manually-added speakers with name/role show in "Mapped Speakers" section
- **Unmapped Speaker Display**: Manually-added speakers without complete mapping show in "Unmapped Speakers" section
- **Real-time Updates**: Speaker mapping display updates immediately when speakers are added/removed in dialog
- **Manual Override Interface**: Provide intuitive editing capabilities for correcting speaker assignments
- **Override Indicators**: Visual cues to distinguish manually-overridden mappings from auto-detected ones
- **Validation Feedback**: Real-time validation to prevent conflicts in speaker assignments

**Demo Mode Interface Requirements:**

- **Demo Toggle**: Prominent but non-intrusive toggle in upper-left navigation area
- **Tooltip Integration**: Informative tooltip explaining Demo Mode benefits and functionality
- **Visual Indicators**: Clear visual indication when Demo Mode is active throughout the application
- **Sample File Integration**: Drag/drop zone should accept and recognize demo sample audio file
- **Guided Workflow**: Step-by-step prompts and guidance throughout demo experience
- **Contextual Help**: Interactive tooltips explaining features during demo workflow progression
- **Processing Simulation**: Realistic timing and animations for upload, transcription, and summarization steps
- **Demo Data Display**: High-quality presentation of sample transcript and summary content
- **Revert Functionality**: One-click option to restore original auto-detected mappings
- **Segment Speaker Override**: Click-to-edit functionality for reassigning individual transcript segments to different speakers
- **Confidence Score Invalidation**: Visual indicators showing when confidence scores are no longer relevant due to manual overrides
- **Dynamic Count Updates**: Real-time updates to "(X/Y mapped)" counters reflecting current mapping status
- **Mapped Name Display**: Replace generic "Speaker 1" labels with actual mapped names in transcript sections
- **Override Status Indicators**: Clear visual distinction between AI-assigned and manually-reassigned segments

**Backend Integration:**

- Extend SpeakerMapping model with `source` field (AutoDetected, ManuallyAdded)
- Update speaker mapping API endpoints to handle dynamic speaker lists
- Implement validation rules for speaker addition/removal operations
- Maintain backward compatibility with existing auto-detected speaker workflows
- **Segment Override Support**: Extend SpeakerSegment model to track manual speaker reassignments
- **Override Audit Trail**: Persist segment-level speaker changes with timestamps and user attribution
- **Confidence Invalidation**: Flag confidence scores as invalid when segments are manually reassigned
- **Mapping Counter Logic**: Implement real-time calculation of mapped vs unmapped speaker counts
- **Speaker Resolution**: Provide API endpoints for resolving speaker IDs to mapped names in transcript display

**Data Persistence:**

- Store manual speaker additions with creation timestamps and user metadata
- Track speaker removal actions for audit and potential recovery
- Associate manually-added speakers with transcription sessions for proper scoping
- Enable speaker list reconstruction for meeting history and analysis features

## Monetization & User Management

### Token-Based Payment System

- REQ-MON-1: System shall implement a token-based payment model where each meeting consumes tokens
- REQ-MON-2: System shall support anonymous single-token purchases with browser-based storage
- REQ-MON-3: System shall integrate with Stripe for secure payment processing
- REQ-MON-4: System shall calculate token consumption based on meeting length and processing complexity
- REQ-MON-5: System shall provide transparent pricing before user commits to payment
- REQ-MON-6: System shall support multiple token package sizes (1, 5, 10, 20 tokens)
- REQ-MON-7: System shall track token usage and remaining balance per user session
- REQ-MON-8: System shall prevent processing when insufficient tokens are available

### Demo Mode (Anonymous)

- REQ-DEM-1: System shall provide comprehensive demo mode showcasing end-to-end workflow with sample content
- REQ-DEM-2: Demo mode shall include step-by-step guided process from upload through transcription to summary
- REQ-DEM-3: Demo mode toggle shall be located in upper-left nav/menu bar with tooltip explanation
- REQ-DEM-4: Demo mode shall provide sample audio file for drag/drop upload demonstration
- REQ-DEM-5: Demo mode shall use frontend-only implementation with no API calls to backend services
- REQ-DEM-6: Demo mode shall display pre-generated high-quality transcript with 4-speaker diarization
- REQ-DEM-7: Demo mode shall showcase example summary with action items, decisions, and key points
- REQ-DEM-8: Demo mode shall include contextual tooltips explaining each feature during workflow
- REQ-DEM-9: Demo mode shall simulate realistic processing timing and animations
- REQ-DEM-10: Demo mode shall clearly indicate when active with visual indicators
- REQ-DEM-11: Demo mode shall isolate demo data from live application state
- REQ-DEM-12: Demo mode shall be available without any user registration or payment
- REQ-DEM-13: Demo mode shall provide clear explanation of file format requirements and limitations

### Trial Mode (Email/Password Registration)

- REQ-TRL-1: System shall provide trial accounts with email/password registration
- REQ-TRL-2: Trial accounts shall receive 5 free tokens upon registration
- REQ-TRL-3: Trial mode shall support meetings up to 30 minutes in length
- REQ-TRL-4: Trial accounts shall expire after 7 days from registration
- REQ-TRL-5: System shall send email notifications at trial milestones (day 3, day 6, expiration)
- REQ-TRL-6: Trial users shall have access to all features except extended meeting length
- REQ-TRL-7: System shall prevent multiple trial accounts per email address
- REQ-TRL-8: Trial accounts shall automatically convert to registered user accounts upon token purchase
- REQ-TRL-9: System shall track trial conversion rates for optimization

### Anonymous Token Purchases

- REQ-ANO-1: System shall allow single-token purchases without account creation
- REQ-ANO-2: Anonymous tokens shall be stored in secure browser session storage
- REQ-ANO-3: Anonymous tokens shall expire after 30 days from purchase
- REQ-ANO-4: System shall provide token recovery options via email receipt
- REQ-ANO-5: Anonymous purchases shall support meetings up to 120 minutes
- REQ-ANO-6: System shall clearly communicate token storage limitations for anonymous users
- REQ-ANO-7: Anonymous users shall have option to create account to preserve remaining tokens

### Registered User Accounts

- REQ-USR-1: System shall support user registration with email/password authentication
- REQ-USR-2: Registered users shall purchase token packages (5, 10, 20 tokens)
- REQ-USR-3: User tokens shall be stored server-side with persistent access across devices
- REQ-USR-4: System shall provide user dashboard showing token balance and usage history
- REQ-USR-5: Registered users shall receive bulk purchase discounts for larger token packages
- REQ-USR-6: User accounts shall support password reset via email verification
- REQ-USR-7: System shall implement secure session management with JWT tokens
- REQ-USR-8: User data shall be encrypted and GDPR compliant
- REQ-USR-9: Registered users shall have access to meeting history and re-download capabilities

### Usage Tracking & Analytics

- REQ-TRK-1: System shall track API costs per meeting for accurate token pricing
- REQ-TRK-2: System shall monitor user behavior and conversion rates across demo/trial/paid tiers
- REQ-TRK-3: System shall implement rate limiting to prevent abuse across all user types
- REQ-TRK-4: System shall provide admin dashboard for monitoring costs and revenue
- REQ-TRK-5: System shall track token package popularity for pricing optimization
- REQ-TRK-6: System shall implement usage analytics while respecting user privacy
- REQ-TRK-7: System shall monitor and alert on unusual usage patterns or potential abuse

### Payment & Billing Integration

- REQ-PAY-1: System shall integrate with Stripe for PCI-compliant payment processing
- REQ-PAY-2: System shall support credit card payments for all token packages
- REQ-PAY-3: System shall provide email receipts for all purchases
- REQ-PAY-4: System shall implement webhook handling for payment confirmation
- REQ-PAY-5: System shall support payment refunds for unused tokens within 30 days
- REQ-PAY-6: System shall handle failed payments gracefully with user notification
- REQ-PAY-7: System shall implement fraud detection and chargeback protection
- REQ-PAY-8: System shall support multiple currencies for international users

### Business Logic & Pricing

- REQ-BIZ-1: Token pricing shall maintain minimum 200% margin over API costs
- REQ-BIZ-2: System shall dynamically adjust token consumption based on actual processing costs
- REQ-BIZ-3: System shall offer progressive discounts for bulk token purchases
- REQ-BIZ-4: System shall implement A/B testing capabilities for pricing optimization
- REQ-BIZ-5: System shall support promotional codes and discount campaigns
- REQ-BIZ-6: System shall implement usage caps to prevent unexpected high API costs
- REQ-BIZ-7: System shall provide clear cost estimation before meeting processing begins

## User Interface Enhancements

### Transcript Results Section Improvements

- REQ-UI-1: System shall implement functional status chips in Transcript Results section showing accurate processing state (S5.1)
- REQ-UI-2: Transcript Results chips shall display relevant metadata (duration, confidence, speaker count) (S5.1)
- REQ-UI-3: System shall provide interactive chips for quick filtering and navigation within transcript results (S5.1)
- REQ-UI-4: Status chips shall update in real-time to reflect current transcript processing status (S5.1)
- REQ-UI-5: System shall implement chip click handlers for enhanced user interaction and transcript navigation (S5.1)

### Upload Progress Interface Fixes

- REQ-UI-6: System shall display accurate upload progress percentage that reflects actual file upload completion (S5.1)
- REQ-UI-7: Upload progress bar shall smoothly animate from 0% to 100% without jumping or freezing (S5.1)
- REQ-UI-8: System shall provide clear visual feedback during each phase of processing (upload, transcription, speaker detection) (S5.1)
- REQ-UI-9: Upload interface shall handle large file uploads gracefully with appropriate timeout and retry mechanisms (S5.1)
- REQ-UI-10: System shall display meaningful status messages during upload progress (e.g., "Uploading audio...", "Processing transcription...", "Detecting speakers...") (S5.1)
- REQ-UI-11: Upload progress shall persist across page refreshes until processing is complete (S5.1)
- REQ-UI-12: System shall provide cancel functionality during upload with proper cleanup of partial uploads (S5.1)

### Speaker Management Cleanup

- REQ-SPK-25: System shall automatically remove speakers that have no assigned segments and no name/role mapping (S5.2)
- REQ-SPK-26: System shall perform speaker cleanup operation after manual speaker mapping changes (S5.2)
- REQ-SPK-27: System shall validate speaker relevance before including in speaker mapping interface (S5.2)
- REQ-SPK-28: System shall provide clear indication when speakers are removed due to lack of segments (S5.2)
- REQ-SPK-29: System shall maintain speaker mapping consistency across transcript and summary sections (S5.2)

### Bulk Speaker Assignment

- REQ-BULK-1: System shall provide "Bulk Assign" button at top of Transcription Results section
- REQ-BULK-2: Bulk Assign button shall be enabled only when one or more transcript segments are selected
- REQ-BULK-3: System shall support multi-selection of transcript segments using Ctrl+click and Shift+click
- REQ-BULK-4: Selected transcript segments shall have clear visual indication (highlighting, borders, or checkmarks)
- REQ-BULK-5: Bulk assignment dialog shall allow Name/Role/Email assignment for all selected segments simultaneously
- REQ-BULK-6: System shall apply bulk assignments to all selected segments and update transcript display immediately
- REQ-BULK-7: Bulk assignment shall validate that assignments are applied correctly across all selected segments
- REQ-BULK-8: System shall provide undo functionality for bulk assignment operations
- REQ-BULK-9: Bulk assignment dialog shall show count of selected segments for user confirmation
- REQ-BULK-10: System shall support partial bulk assignments (e.g., name only, role only) based on user input

### Summary Section Enhancements

- REQ-SUM-1: System shall implement functional status chips in Summary section reflecting actual generation state (S5.1)
- REQ-SUM-2: Summary section buttons shall be contextually relevant and functional for current summary state (S5.1)
- REQ-SUM-3: System shall provide clear action buttons for summary regeneration, editing, and sharing (S5.1)
- REQ-SUM-4: Summary chips shall display generation timestamp, token usage, and confidence metrics (S5.1)
- REQ-SUM-5: System shall implement summary versioning with ability to compare different generated versions (S5.1)

### Development Environment Controls

- REQ-DEV-1: System shall hide debug toggle controls in non-development environments (S5.3)
- REQ-DEV-2: Server status indicators shall be visible only in local development mode (S5.3)
- REQ-DEV-3: JSON download functionality shall be restricted to development and testing environments (S5.3)
- REQ-DEV-4: System shall implement environment detection for feature availability (S5.3)
- REQ-DEV-5: Production builds shall exclude all development-only UI elements and controls (S5.3)
- REQ-DEV-6: System shall provide environment-specific feature flags for debugging tools (S5.3)
- REQ-DEV-7: Development tools shall be accessible via configuration or environment variables only (S5.3)

## Technical Implementation Requirements

### Multi-Selection Interface

- REQ-TECH-1: System shall implement accessible multi-selection patterns following WCAG 2.1 guidelines
- REQ-TECH-2: Keyboard navigation shall support segment selection using arrow keys and space bar
- REQ-TECH-3: Screen readers shall announce selection state changes for accessibility compliance
- REQ-TECH-4: System shall provide visual feedback for selection state (colors, icons, borders)
- REQ-TECH-5: Multi-selection shall persist during page interactions until explicitly cleared

### Performance & Usability

- REQ-PERF-1: Bulk operations shall complete within 2 seconds for up to 100 selected segments
- REQ-PERF-2: UI responsiveness shall be maintained during bulk assignment operations
- REQ-PERF-3: System shall provide progress indicators for operations affecting multiple segments
- REQ-PERF-4: Large bulk operations (>50 segments) shall display progress feedback to users
- REQ-PERF-5: System shall implement optimistic UI updates for immediate user feedback

### Data Persistence & State Management

- REQ-DATA-1: Email send history shall persist for session duration and be cleared on session end
- REQ-DATA-2: Bulk assignment operations shall be atomic (all succeed or all fail)
- REQ-DATA-3: Speaker assignment changes shall trigger immediate transcript display updates
- REQ-DATA-4: System shall maintain undo/redo history for bulk operations within current session
- REQ-DATA-5: State synchronization shall ensure consistency between transcript and summary sections

### State Management Architecture (S3.6 Technical Debt Resolution)

- REQ-STATE-1: System shall implement centralized state management to eliminate multiple sources of truth for speaker data
- REQ-STATE-2: System shall use single SpeakerSessionStore for all speaker-related state (mappings, segments, active speakers)
- REQ-STATE-3: System shall automatically compute derived state (speaker stats, filtered speakers, mapping counts) from base data
- REQ-STATE-4: System shall eliminate duplicate filtering logic across TranscriptDisplay and SpeakerMapping components
- REQ-STATE-5: System shall ensure speaker filtering reflects current segment assignments (speakers without segments disappear from UI)
- REQ-STATE-6: System shall provide session isolation to prevent state bleeding between different transcriptions
- REQ-STATE-7: System shall optimize component re-renders through efficient state selectors and memoization
- REQ-STATE-8: System shall maintain backward compatibility during state management migration
- REQ-STATE-9: System shall remove legacy local component state management after successful migration
- REQ-STATE-10: System shall ensure state changes are atomic and trigger appropriate UI updates automatically
