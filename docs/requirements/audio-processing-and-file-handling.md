# Audio Processing & File Handling Requirements

## Audio Processing

- REQ-AUD-1: System shall accept audio file uploads in common formats (MP3, WAV, M4A, MP4)
- REQ-AUD-2: System shall support real-time audio streaming for live meeting transcription
- REQ-AUD-3: System shall validate audio file size limits (max 500MB per file)
- REQ-AUD-4: System shall extract audio from video files (MP4, AVI, MOV)

## iOS Safari Specific Requirements

### File Format Compatibility
- **REQ-IOS-AUD-1**: System shall support iOS Safari with limited file format set (MP3, M4A, WAV, MP4) due to browser limitations
- **REQ-IOS-AUD-2**: System shall provide iOS-specific file format filtering in file picker to prevent user confusion
- **REQ-IOS-AUD-3**: System shall validate uploaded files against iOS-compatible formats when iOS Safari detected

### File Storage Requirements  
- **REQ-IOS-STORAGE-1**: System shall provide user guidance that iOS Safari requires files stored locally (device Files app)
- **REQ-IOS-STORAGE-2**: System shall inform iOS Safari users that cloud storage files (OneDrive, iCloud Drive) cannot be selected
- **REQ-IOS-STORAGE-3**: System shall include clear instructions for moving files from cloud storage to local storage

### Progressive Enhancement
- **REQ-IOS-UX-1**: System shall implement progressive enhancement - full experience on desktop, guided experience on iOS Safari
- **REQ-IOS-UX-2**: System shall use visible file input approach for iOS Safari instead of hidden input + programmatic triggering
- **REQ-IOS-UX-3**: System shall maintain zero regression to desktop file upload functionality

## File Processing & Optimization

- REQ-FPO-1: System shall perform audio file format validation beyond extension checking using content analysis
- REQ-FPO-2: System shall automatically convert all non-WAV audio files to WAV format prior to transcription, using a reliable conversion tool (e.g., FFmpeg or equivalent library).
- REQ-FPO-3: System shall handle conversion errors gracefully, providing clear user feedback and error messages if conversion fails.
- REQ-FPO-4: System shall ensure that all files passed to the transcription service are in a WAV format compatible with Azure Speech Services (PCM, 16kHz, mono preferred).
- REQ-FPO-5: System shall log all conversion operations and errors for monitoring and debugging purposes.
- REQ-FPO-6: System shall handle corrupted or malformed audio files with appropriate error messages
- REQ-FPO-7: System shall detect and handle edge cases in audio file metadata and format variations
- REQ-FPO-8: System shall implement memory-efficient processing for large audio file uploads (>100MB)
- REQ-FPO-9: System shall provide progress feedback for file processing operations that exceed normal timeouts

## Resource Management & Cleanup

- REQ-RMC-5: System shall monitor and log resource usage metrics for performance optimization
- REQ-RMC-6: System shall implement automatic retry mechanisms with exponential backoff for transient Azure service failures

## Accessibility Compliance

- REQ-ACC-1: All interactive UI components (chips, buttons, progress bars, dialogs, etc.) shall include consistent accessibility attributes (e.g., ARIA labels, roles, tabIndex) to support screen readers and keyboard navigation.
- REQ-ACC-2: The system shall follow WCAG 2.1 guidelines for color contrast, focus indicators, and semantic HTML structure.
