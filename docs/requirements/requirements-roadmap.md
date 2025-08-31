# Meeting Summarizer Requirements Roadmap

This roadmap tracks which requirements have been implemented in each sprint and which are planned for future sprints. Update this file whenever `meeting-summary.io-requirements.md` is updated. See `file update-commit.md` for process details.

---


## Sprint 1
**Implemented:**
  - REQ-AUD-1: Accept audio file uploads in common formats (MP3, WAV, M4A, MP4)
  - REQ-TRN-1: Convert audio to text using Azure Speech Services as primary provider
  - REQ-SPK-1: Detect speaker self-introductions in first 5 minutes
  - REQ-SPK-2: Extract speaker names from introduction patterns
  - REQ-SPK-3: Identify role/title information in introductions
  - REQ-SPK-4: Associate detected names with speaker voice patterns
  - REQ-SPK-5: Provide confidence scores for auto-detected speaker names/roles
  - REQ-SPK-6: Pre-populate speaker mapping with detected names
  - REQ-SPK-7: Distinguish between speaker names and other names
  - REQ-SPK-8: Handle multiple introduction formats and informal speech
  - REQ-SPK-9: Display auto-detected speakers in upload progress
  - REQ-SPK-10: Fall back to manual speaker mapping when confidence is low
  - REQ-SPK-11: Allow users to manually add speakers
  - REQ-SPK-12: Allow users to remove incorrectly detected speakers
  - REQ-SPK-13: Visual distinction between auto-detected and manually-added speakers
  - REQ-SPK-14: Validate at least one speaker before save
  - REQ-SPK-15: Persist manually-added speakers with metadata
  - REQ-SPK-16: Display all speakers in Speaker Mappings interface
  - REQ-SPK-17: Show manually-added speakers in "Mapped Speakers" section
  - REQ-SPK-18: Show manually-added speakers in "Unmapped Speakers" section
  - REQ-SPK-19: Update speaker mapping display in real-time
  - REQ-SPK-20: Allow manual override of speaker mapping assignments
  - REQ-SPK-21: Edit Mapping option for each speaker
  - REQ-SPK-22: Indicate manual overrides vs auto-detected
  - REQ-SPK-23: Preserve original auto-detected mappings as fallback
  - REQ-SPK-24: Prevent duplicate speaker names within meeting
**Planned/Future:**
  - REQ-AUD-2: Support real-time audio streaming for live transcription
  - REQ-AUD-3: Validate audio file size limits (max 500MB)
  - REQ-AUD-4: Extract audio from video files (MP4, AVI, MOV)
  - REQ-TRN-2: Support multiple languages for transcription
  - REQ-TRN-3: Identify and label different speakers (2-10) with 85% accuracy
  - REQ-TRN-4: Timestamp transcribed text segments with ms precision
  - REQ-TRN-5: Handle poor audio quality with confidence scoring
  - REQ-TRN-6: Provide speaker confidence scores per segment
  - REQ-TRN-7: Detect speaker count automatically
  - REQ-TRN-8: Handle overlapping speech, identify primary speaker
  - REQ-TRN-10: Fall back to OpenAI Whisper when Azure fails

---


## Sprint 2
**Implemented:**
  - REQ-TRN-2: Support multiple languages for transcription
  - REQ-TRN-3: Identify and label different speakers (2-10) with 85% accuracy
  - REQ-TRN-4: Timestamp transcribed text segments with ms precision
  - REQ-TRN-5: Handle poor audio quality with confidence scoring
  - REQ-TRN-6: Provide speaker confidence scores per segment
  - REQ-TRN-7: Detect speaker count automatically
  - REQ-TRN-8: Handle overlapping speech, identify primary speaker
  - REQ-TRN-10: Fall back to OpenAI Whisper when Azure fails
  - REQ-SUM-1: Generate concise meeting summaries from transcriptions
  - REQ-SUM-2: Extract key topics and discussion points
  - REQ-SUM-3: Identify action items and decisions made
  - REQ-SUM-4: Highlight important participants and their contributions
  - REQ-SUM-5: Provide multiple summary formats (bullet, paragraph, executive)
  - REQ-AI-SUM-1: Generate comprehensive meeting summaries on demand
  - REQ-AI-SUM-2: Narrative overview targeting one-page length
  - REQ-AI-SUM-3: Action items grouped by speaker/role
  - REQ-AI-SUM-4: Detect explicit and implicit task assignments
  - REQ-AI-SUM-5: Action items without clear ownership marked "Not Assigned"
  - REQ-AI-SUM-6: Use speaker role mappings to organize action items
  - REQ-AI-SUM-7: Summaries editable within session before sharing
  - REQ-AI-SUM-8: Manual trigger for summary generation
  - REQ-AI-SUM-9: Session-based storage for generated summaries
  - REQ-AI-SUM-10: Integrate with OpenAI service infrastructure
**Planned/Future:**
  - REQ-EMAIL-1: Email composition interface for sharing summaries
  - REQ-EMAIL-2: Email content as rich HTML with branding
  - REQ-EMAIL-3: Pre-populate email with summary and action items
  - REQ-EMAIL-4: Allow users to edit email content before sending
  - REQ-EMAIL-5: Auto-suggest recipients based on speaker mappings
  - REQ-EMAIL-6: Include sender's contact info in email
  - REQ-EMAIL-7: Support multiple email sends per session
  - REQ-EMAIL-8: Save/edit email drafts within session
  - REQ-EMAIL-9: Notification that content is AI-generated
  - REQ-EMAIL-10: Session-based email composition (no persistent storage)

---


## Sprint 3
**Implemented:**
  - REQ-SPK-25: Allow users to override transcript segment speaker assignments
  - REQ-SPK-26: Visual indicator on confidence scores for manual reassignment
  - REQ-SPK-27: Invalidate/mark confidence when segment is manually overridden
  - REQ-SPK-28: Update speaker mapping counts for mapped/unmapped
  - REQ-SPK-29: Update unmapped speaker chip displays on mapping
  - REQ-SPK-30: Replace generic speaker labels with mapped names
  - REQ-SPK-31: Real-time feedback in Speaker Mappings section
  - REQ-SPK-32: Maintain segment-level override history for audit/revert
  - REQ-TST-1: Maintain minimum 85% test coverage for core functionality
  - REQ-TST-2: Unit tests for all Zustand state management stores
  - REQ-TST-3: Validate session management via automated testing
  - REQ-TST-4: Performance regression tests for optimized components
  - REQ-TST-5: Test session-based privacy controls and data cleanup
  - REQ-TST-6: Integration tests for speaker management workflows
  - REQ-TST-7: Validate component behavior after optimizations
  - REQ-TST-8: Test error boundaries and fallback mechanisms
  - REQ-TST-9: Cross-browser compatibility testing for core features
  - REQ-TST-10: Validate accessibility compliance via automated testing
**Planned/Future:**
  - REQ-ACC-1: All interactive UI components include accessibility attributes
  - REQ-ACC-2: Follow WCAG 2.1 for color contrast, focus, semantic HTML
  - REQ-FPO-1: Audio file format validation beyond extension checking
  - REQ-FPO-6: Handle corrupted/malformed audio files with error messages
  - REQ-FPO-7: Detect/handle edge cases in audio file metadata/format
  - REQ-FPO-8: Memory-efficient processing for large audio files (>100MB)
  - REQ-FPO-9: Progress feedback for long file processing operations

---


## Sprint 4
**Implemented:**
  - REQ-AZR-1: Create Azure AI Speech resource in West Coast US (westus2)
  - REQ-AZR-2: Configure authentication (API key/dev, Managed Identity/prod)
  - REQ-AZR-4: Azure-specific error handling and retry logic
  - REQ-AZR-5: Monitor usage against Free tier limits with alerts
  - REQ-AZR-6: Transform Azure JSON response to match frontend contracts
  - REQ-AZR-7: Map Azure speaker labels/timestamps to SpeakerSegment format
  - REQ-AZR-8: Preserve Azure confidence scores/metadata for display/debug
  - REQ-AZR-9: Implement service abstraction layer for Azure/OpenAI
  - REQ-AZR-10: Config-driven service selection with factory pattern
  - REQ-ABS-1: Implement ITranscriptionService interface for abstraction
  - REQ-ABS-2: Use factory pattern with config-driven selection
  - REQ-ABS-3: Support Azure, OpenAI, Mock providers via common interface
  - REQ-ABS-4: Enable provider switching via configuration
  - REQ-ABS-5: Maintain backward compatibility during migration
  - REQ-ABS-6: Config toggle between Azure and OpenAI during transition
  - REQ-ABS-7: Preserve all speaker mapping functionality
  - REQ-FALL-1: Attempt Azure Speech as primary transcription service
  - REQ-FALL-2: Auto-fallback to OpenAI Whisper when Azure fails
  - REQ-FALL-3: Manual-only mode with bulk segment reassignment tools
  - REQ-FALL-4: Indicate which service was used in UI/logs
  - REQ-FALL-5: Log fallback occurrences for monitoring/debug
  - REQ-COST-1: Track API usage metrics for Azure/OpenAI separately
  - REQ-COST-2: Cost monitoring with monthly spending alerts
  - REQ-COST-3: Cost-per-transcription reporting
  - REQ-COST-4: Log service provider usage for analysis
  - REQ-COST-5: Optimize service selection based on accuracy/cost
**Planned/Future:**
  - REQ-FPO-2: Convert all non-WAV audio files to WAV before transcription
  - REQ-FPO-3: Handle conversion errors gracefully with user feedback
  - REQ-FPO-4: Ensure WAV files are compatible with Azure Speech (PCM, 16kHz, mono)
  - REQ-FPO-5: Log all conversion operations/errors
  - REQ-RMC-5: Monitor/log resource usage metrics for optimization
  - REQ-RMC-6: Automatic retry with exponential backoff for Azure failures

---


## Sprint 5
**Partially Implemented (S5.1 ~60% Complete - Incremental Progress):**
  - REQ-DEMO-1: Default to Demo mode for unsigned users ✅
  - REQ-DEMO-2: AppBar visually distinct and displays "Demo" ✅
  - REQ-USER-1: Two user modes: Demo/Public and Paid ✅
  - REQ-USER-2: Demo serves only static/demo content ✅
  - REQ-DEMO-6: Simulate full workflow with static/mock data ✅
  - REQ-DEMO-7: All features interactive on static data ✅
  - REQ-DEMO-8: All actions simulated, no real data processed ✅
  - REQ-DEMO-10: Upload simulated with mock progress ✅
  - REQ-DEMO-11: Speaker mapping/transcript editing enabled ✅
  - REQ-DEMO-12: Summary/email sharing simulated with mock confirmation ✅
  - REQ-DEMO-13: No usage limits per session in Demo mode ✅
  - REQ-DEMO-20: Demo implemented in client with static data ✅
  - REQ-DEMO-21: Demo mode available in all environments ✅
  
**In Progress/Not Yet Implemented:**
  - REQ-DEMO-3: Prominent "Sign In" button in AppBar ❌
  - REQ-DEMO-4: Step-by-step interactive Tour with tooltips ❌
  - REQ-DEMO-5: Tour closable, forward/backward navigation ❌
  - REQ-DEMO-9: Tooltips/UI messaging clarify simulation ❌
  - REQ-DEMO-14: "Sign In" always visible in Demo mode ❌
  - REQ-DEMO-15: Signing in transitions to Paid mode ❌
  - REQ-DEMO-16: Tour/UI clarify Demo vs Paid modes ❌
  - REQ-DEMO-17: Privacy-friendly analytics for Demo usage ❌
  - REQ-DEMO-18: Analytics reviewed for abuse patterns ❌
  - REQ-DEMO-19: Demo mode meets accessibility/mobile standards 🔄
  - REQ-USER-3: Paid mode persists data across sessions ❌
  - REQ-USER-4: Communicate data retention/privacy for each mode ❌
  - REQ-FPO-2: Convert all non-WAV audio files to WAV before transcription ✅

**Planned/Future:**
  - REQ-FPO-3: Handle conversion errors gracefully with user feedback
  - REQ-FPO-4: Ensure WAV files are compatible with Azure Speech (PCM, 16kHz, mono)
  - REQ-FPO-5: Log all conversion operations/errors
  - REQ-ACC-1: All interactive UI components include accessibility attributes
  - REQ-ACC-2: Follow WCAG 2.1 for color contrast, focus, semantic HTML
  - REQ-PAY-1: Integrate with PCI-compliant payment provider (e.g., Stripe)
  - REQ-PAY-2: Users can purchase tokens/credits in packages
  - REQ-PAY-3: Payment process uses HTTPS, no sensitive data stored
  - REQ-PAY-4: Purchased tokens assigned atomically to user account
  - REQ-PAY-5: Provide users with transaction history and receipts
  - REQ-PAY-6: Email notifications for payments, failures, refunds
  - REQ-PAY-7: Support refunds/chargebacks with admin review/logging
  - REQ-PAY-8: Track token consumption per meeting, real-time balance
  - REQ-PAY-9: Prevent duplicate charges, handle errors gracefully
  - REQ-PAY-10: Admin dashboard for payment management/audit
  - REQ-PAY-11: Payment/user data complies with PCI DSS, GDPR, etc.

---


## Future
**Planned/Future:**
  - REQ-BIZ-1: Token pricing maintains minimum 200% margin over API costs
  - REQ-NFR-1: Process audio files within 2x duration of recording
  - REQ-NFR-2: Support concurrent processing of up to 50 audio files
  - REQ-NFR-3: API requests respond within 200ms (non-processing)
  - REQ-NFR-4: Handle files up to 4 hours in duration
  - REQ-NFR-5: Scale horizontally for increased load
  - REQ-NFR-6: Support multi-tenant architecture for enterprise
  - REQ-NFR-7: Queue processing requests during high load
  - REQ-NFR-8: Encrypt audio files and transcriptions at rest
  - REQ-NFR-9: Use HTTPS for all API communications
  - REQ-NFR-10: Implement rate limiting to prevent abuse
  - REQ-NFR-11: Comply with data privacy regulations (GDPR, CCPA)
  - REQ-NFR-12: Provide audit logging for all user actions
  - REQ-NFR-13: Achieve 99.5% uptime availability
  - REQ-NFR-14: Automatic retry for failed processing
  - REQ-NFR-15: Graceful error handling and user feedback
  - REQ-NFR-16: Backup processed data with point-in-time recovery
  - REQ-NFR-17: Clear progress indicators for long operations
  - REQ-NFR-18: Detailed error messages for troubleshooting
  - REQ-NFR-19: Mobile-responsive web interface
  - REQ-NFR-20: Comprehensive API documentation

---

**Legend:**
- Implemented Requirements: Requirements completed in the sprint (by ID, see requirements docs for details)
- Planned/Future Requirements: Requirements tentatively planned for the sprint or future sprints

> Update this file as requirements are implemented or plans change.
