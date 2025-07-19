# Sprint 1 User Stories - Meeting Summarizer

## Story S1.1: Implement Audio Transcription Backend Service

As a developer, I want to implement the audio transcription service using OpenAI Whisper so that uploaded audio files can be converted to text with speaker diarization.

### S1.1 Acceptance Criteria

- Backend endpoint `/api/summary/transcribe` accepts audio file uploads
- Service integrates with OpenAI Whisper API for transcription
- Speaker diarization is enabled to identify different speakers
- Transcription response includes speaker labels (Speaker 1, Speaker 2, etc.)
- Error handling for invalid audio files and API failures
- File format validation for supported audio types (mp3, wav, m4a)

### S1.1 Dependencies

None (builds on existing scaffolding)

### S1.1 Developer Notes

- Use existing OpenAI service integration from SC-003
- Leverage TranscribeRequest model from SC-004
- Configure Whisper with speaker diarization parameters
- Return structured response with transcript text and speaker segments

---

## Story S1.2: Create Transcript Display Component

As a user, I want to view the transcribed text from my uploaded audio file so that I can review the meeting content with speaker identification.

### S1.2 Acceptance Criteria

- Frontend displays transcription results with clear speaker labels
- Transcript text is formatted for readability
- Speaker segments are visually distinguished
- Loading state shown during transcription processing
- Error messages displayed for failed transcriptions
- Transcript content is selectable for copy/paste

### S1.2 Dependencies

S1.1 - Audio Transcription Backend Service

### S1.2 Developer Notes

- Use Material-UI Typography and Card components for display
- Implement loading spinner with MUI CircularProgress
- Color-code or visually separate different speakers
- Handle long transcripts with proper scrolling
- Consider MUI Accordion for speaker segment organization

---

## Story S1.3: Integrate File Upload with Transcription Workflow

As a user, I want to upload an audio file and automatically receive the transcription so that I have a seamless end-to-end experience.

### S1.3 Acceptance Criteria

- File upload component triggers transcription automatically
- Progress indicators show upload and transcription status
- Successful transcription displays results immediately
- Failed transcriptions show clear error messages
- User can upload new files after completing transcription
- Transcription results persist until new file is uploaded

### S1.3 Dependencies

S1.1 - Audio Transcription Backend Service, S1.2 - Transcript Display Component

### S1.3 Developer Notes

- Integrate existing FileUpload component with transcription API
- Use axios for API calls with progress tracking
- Implement state management for transcription workflow
- Handle both upload and transcription loading states
- Consider MUI Stepper to show workflow progress

---

## Technical Rationale

These stories establish the core transcription pipeline that delivers immediate value to users. The dependency chain is minimal (S1.1 → S1.2 → S1.3) and creates a working end-to-end feature. This foundation enables speaker mapping and summarization features in future sprints.
