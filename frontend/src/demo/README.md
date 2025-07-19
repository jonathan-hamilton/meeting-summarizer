# Demo Components for Development Testing

This directory contains demo components for functional testing during development. These components are only available in development mode (`import.meta.env.DEV`) and are excluded from production builds.

## TranscriptDisplayDemo.tsx

A comprehensive testing interface for Sprint 1 components, providing interactive demos for both S1.2 and S1.3 features.

### Features

#### Tab 1: S1.2 TranscriptDisplay Testing
- Interactive testing of all S1.2 acceptance criteria
- Mock data scenarios: Speaker Diarization, Simple Transcript, Error State, Loading State
- Comprehensive testing checklist for manual validation
- Copy functionality testing
- Accessibility testing guidance

#### Tab 2: S1.3 FileUpload Integration Testing  
- **Live end-to-end workflow testing** with real backend integration
- File upload with automatic transcription triggering
- Workflow stepper visualization (File Selected → Uploading → Processing → Complete)
- Queue management with status tracking
- Live transcription results display using TranscriptDisplay component
- Complete S1.3 acceptance criteria testing checklist

### Usage

The demo component is automatically included in development builds when you run:

```bash
npm run dev
```

Navigate to `http://localhost:5173` and you'll see the demo interface at the top of the page.

### S1.3 Testing Requirements

**Important:** For S1.3 testing to work properly, ensure the backend API is running:

```bash
cd MeetingSummarizer.Api
dotnet run
```

The backend should be available at `http://localhost:5029` for the file upload integration to function.

### Testing Checklist

#### S1.2 Acceptance Criteria ✅
- Frontend displays transcription results with clear speaker labels
- Transcript text is formatted for readability  
- Speaker segments are visually distinguished
- Loading state shown during transcription processing
- Error messages displayed for failed transcriptions
- Transcript content is selectable for copy/paste

#### S1.3 Acceptance Criteria ✅
- File upload component triggers transcription automatically
- Progress indicators show upload and transcription status
- Successful transcription displays results immediately
- Failed transcriptions show clear error messages
- User can upload new files after completing transcription
- Transcription results persist until new file is uploaded

### Development Notes

- Demo components use realistic mock data that matches the backend API response format
- All Material-UI components follow the application's design system
- Error handling demonstrates various failure scenarios
- Accessibility features are included for screen reader testing
- The demo provides instant feedback for rapid development iteration

### File Structure

```
src/demo/
├── README.md                    # This file
└── TranscriptDisplayDemo.tsx    # Main demo component with S1.2 & S1.3 testing
```

### Removing Demo from Production

Demo components are automatically excluded from production builds via the `import.meta.env.DEV` check in `App.tsx`. No additional configuration is needed.
