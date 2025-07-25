# Core Requirements for MeetingSummarizer API

## Functional Requirements

### Audio Processing

- REQ-AUD-1: System shall accept audio file uploads in common formats (MP3, WAV, M4A, MP4)
- REQ-AUD-2: System shall support real-time audio streaming for live meeting transcription
- REQ-AUD-3: System shall validate audio file size limits (max 500MB per file)
- REQ-AUD-4: System shall extract audio from video files (MP4, AVI, MOV)

### Transcription

- REQ-TRN-1: System shall convert audio to text using speech-to-text services
- REQ-TRN-2: System shall support multiple languages for transcription
- REQ-TRN-3: System shall identify and label different speakers in the audio
- REQ-TRN-4: System shall timestamp transcribed text segments
- REQ-TRN-5: System shall handle poor audio quality with confidence scoring

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

### Summarization

- REQ-SUM-1: System shall generate concise meeting summaries from transcriptions
- REQ-SUM-2: System shall extract key topics and discussion points
- REQ-SUM-3: System shall identify action items and decisions made
- REQ-SUM-4: System shall highlight important participants and their contributions
- REQ-SUM-5: System shall provide multiple summary formats (bullet points, paragraph, executive summary)

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

### Phase 1.5: Enhanced Speaker Management (Sprint 2.5) 🔄

- Manual speaker addition and removal capabilities
- Visual distinction between auto-detected and user-added speakers
- Enhanced speaker mapping interface with full CRUD operations
- Audit trail for speaker management actions

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
