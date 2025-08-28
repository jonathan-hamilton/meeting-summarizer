# Transcription & Speaker Diarization Requirements

## Transcription & Speaker Diarization

- REQ-TRN-1: System shall convert audio to text using Azure Speech Services as primary provider
- REQ-TRN-2: System shall support multiple languages for transcription (initially English, expandable)
- REQ-TRN-3: System shall identify and label different speakers in the audio with minimum 85% accuracy for 2-10 speakers
- REQ-TRN-4: System shall timestamp transcribed text segments with millisecond precision
- REQ-TRN-5: System shall handle poor audio quality with confidence scoring and graceful degradation
- REQ-TRN-6: System shall provide speaker confidence scores for each identified speaker segment
- REQ-TRN-7: System shall detect speaker count automatically without requiring user input
- REQ-TRN-8: System shall handle overlapping speech and identify primary speaker per segment
- REQ-TRN-10: System shall fall back to OpenAI Whisper when Azure Speech Services fails

## Speaker Identification Enhancement

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
