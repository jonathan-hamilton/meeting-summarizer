# Phase 3: React/MUI Progress Implementation Plan

## Plan Overview

**Objective**: Implement a sophisticated, user-friendly progress system using React and Material-UI components to replace the removed SignalR infrastructure with better UX and maintainable code.

**Target Story**: S6.15 or Sprint 7.1  
**Estimated Effort**: 2-3 days  
**Dependencies**: S6.14 SignalR Removal (✅ Complete)

## Problem Statement

Currently, after removing SignalR (S6.14), we have basic progress indication but lack:
- Realistic progress estimation based on file characteristics
- Professional-looking progress indicators using MUI components
- Clear visual feedback for different processing stages
- Efficient polling strategy for completion detection
- Accessibility-compliant progress indicators

## Solution Architecture

### 1. Component Hierarchy

```
ProgressManager (Provider/Context)
├── FileUploadProgress (Individual file progress)
│   ├── ProgressHeader (File name, size, stage)
│   ├── StageIndicator (Current processing stage)
│   ├── ProgressBar (LinearProgress with percentage)
│   └── ProgressActions (Cancel, retry options)
├── GlobalProgressIndicator (Overall upload queue)
│   ├── CircularProgress (Active uploads count)
│   └── ProgressSummary (Completed/failed/pending)
└── ProgressNotification (Toast/snackbar updates)
```

### 2. Progress Estimation Algorithm

**File-Size-Based Timing:**
```typescript
interface ProgressEstimation {
  uploadTime: number;      // Based on file size + network speed
  processingTime: number;  // Based on file size + historical data
  transcriptionTime: number; // Based on audio duration estimate
  summarizationTime: number; // Fixed time ~15-30 seconds
}

// Algorithm:
// Small files (< 5MB): 30-60 seconds total
// Medium files (5-25MB): 1-3 minutes total  
// Large files (25MB+): 3-8 minutes total
```

**Processing Stages:**
1. **Upload** (20% of total time) - File transfer to server
2. **Processing** (30% of total time) - Audio format validation/conversion
3. **Transcribing** (40% of total time) - OpenAI Whisper API call
4. **Summarizing** (10% of total time) - Summary generation

### 3. State Management Strategy

**Zustand Store Enhancement:**
```typescript
interface ProgressState {
  activeUploads: Map<string, FileProgressData>;
  globalProgress: GlobalProgressData;
  estimationSettings: EstimationSettings;
  
  // Actions
  startFileProgress: (fileId: string, file: File) => void;
  updateFileProgress: (fileId: string, stage: ProcessingStage, percentage: number) => void;
  completeFileProgress: (fileId: string, result: TranscriptionResult) => void;
  failFileProgress: (fileId: string, error: string) => void;
}
```

## Implementation Tasks

### Task 1: Core Progress Components (8 hours)

**1.1 Create Progress Data Types**
- File: `src/types/progress.ts`
- Define interfaces for FileProgressData, ProcessingStage, ProgressEstimation
- Export type guards and utility functions

**1.2 Build ProgressEstimator Service**
- File: `src/services/progressEstimator.ts`
- Implement file-size-based time estimation
- Add historical data tracking for calibration
- Include network speed detection

**1.3 Create FileUploadProgress Component**
- File: `src/components/Progress/FileUploadProgress.tsx`
- Use MUI LinearProgress with custom styling
- Show current stage with icons and descriptions
- Display time remaining and percentage
- Handle cancel/retry actions

**1.4 Create GlobalProgressIndicator Component**
- File: `src/components/Progress/GlobalProgressIndicator.tsx`
- Use MUI CircularProgress for active uploads
- Show queue summary (3 uploading, 2 complete, 1 failed)
- Collapsible detailed view

### Task 2: Progress State Management (6 hours)

**2.1 Enhance UploadQueue Store**
- Add progress tracking methods to existing store
- Implement progress estimation integration
- Add completion status tracking

**2.2 Create Progress Polling Service**
- File: `src/services/progressPoller.ts`
- Smart polling with exponential backoff
- Integration with meeting status API
- Automatic cleanup of completed uploads

**2.3 Add Progress Context Provider**
- File: `src/contexts/ProgressContext.tsx`
- Wrap application with progress state
- Provide progress actions to components
- Handle global progress notifications

### Task 3: UI Integration & Polish (6 hours)

**3.1 Update FileUpload Component**
- Replace basic progress with FileUploadProgress component
- Add drag-and-drop visual feedback
- Integrate file validation with progress

**3.2 Add Progress Notifications**
- File: `src/components/Progress/ProgressNotification.tsx`
- Use MUI Snackbar for completion/error alerts
- Queue multiple notifications
- Auto-dismiss with action options

**3.3 Create Progress Dashboard View**
- File: `src/components/Progress/ProgressDashboard.tsx`
- Detailed view of all active/recent uploads
- Historical progress data and statistics
- Export to dedicated route `/progress`

**3.4 Mobile-Responsive Design**
- Ensure progress components work on mobile
- Touch-friendly cancel/retry buttons
- Appropriate sizing for small screens

### Task 4: Testing & Documentation (4 hours)

**4.1 Unit Tests**
- Test progress estimation algorithms
- Test component rendering with various states
- Test store state management and actions

**4.2 Integration Tests**
- Test full upload flow with progress
- Test polling service integration
- Test error scenarios and recovery

**4.3 Documentation Updates**
- Update component documentation
- Add progress estimation documentation
- Update user guide with new progress features

## Technical Specifications

### 1. MUI Component Configuration

**LinearProgress Styling:**
```typescript
const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.secondary.main} 100%)`
  }
}));
```

**CircularProgress Configuration:**
```typescript
<CircularProgress 
  variant="determinate" 
  value={globalProgress} 
  size={40}
  thickness={4}
  sx={{ 
    color: (theme) => theme.palette.mode === 'light' 
      ? theme.palette.primary.main 
      : theme.palette.primary.light 
  }}
/>
```

### 2. Progress Estimation Constants

```typescript
const ESTIMATION_CONSTANTS = {
  // Base times in milliseconds
  UPLOAD_SPEED_MBPS: 10, // Assume 10 Mbps upload
  PROCESSING_TIME_PER_MB: 2000, // 2 seconds per MB
  TRANSCRIPTION_TIME_PER_MINUTE: 15000, // 15 seconds per audio minute
  SUMMARIZATION_BASE_TIME: 20000, // 20 seconds base time
  
  // Stage weights (must sum to 1.0)
  STAGE_WEIGHTS: {
    upload: 0.2,
    processing: 0.3,
    transcription: 0.4,
    summarization: 0.1
  }
};
```

### 3. API Integration Points

**Meeting Status Polling:**
```typescript
// Existing endpoint: GET /api/summary/status/{meetingId}
// Enhancement: Include progress percentage if available
interface MeetingStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100 percentage
  stage?: 'upload' | 'processing' | 'transcription' | 'summarization';
  estimatedCompletion?: string; // ISO timestamp
}
```

**Polling Strategy:**
- Initial: 1 second intervals
- After 30 seconds: 2 second intervals  
- After 2 minutes: 5 second intervals
- Max: 10 second intervals
- Stop when: status === 'completed' || 'failed'

### 4. Accessibility Requirements

**ARIA Labels:**
```typescript
<LinearProgress 
  aria-label={`Upload progress for ${fileName}`}
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuetext={`${percentage}% complete, ${stage} stage`}
/>
```

**Screen Reader Support:**
- Live region announcements for stage changes
- Descriptive progress text updates
- Keyboard navigation for cancel/retry actions

## File Structure

```
src/
├── components/
│   └── Progress/
│       ├── FileUploadProgress.tsx
│       ├── GlobalProgressIndicator.tsx
│       ├── ProgressNotification.tsx
│       ├── ProgressDashboard.tsx
│       └── ProgressStageIndicator.tsx
├── contexts/
│   └── ProgressContext.tsx
├── services/
│   ├── progressEstimator.ts
│   └── progressPoller.ts
├── types/
│   └── progress.ts
├── hooks/
│   ├── useProgressEstimation.ts
│   ├── useProgressPolling.ts
│   └── useFileProgress.ts
└── utils/
    └── progressUtils.ts
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- Progress estimation calculations
- Component rendering with different states
- Store actions and state updates
- Utility function edge cases

### Integration Tests
- Full upload flow with progress updates
- Polling service with mock API responses
- Progress context provider integration
- Error handling and recovery flows

### Visual Tests (Storybook)
- Progress components in different states
- Dark/light theme variations
- Mobile responsive layouts
- Accessibility compliance

## Success Criteria

### Functional Requirements
- ✅ File-size-based progress estimation implemented
- ✅ MUI LinearProgress and CircularProgress components integrated
- ✅ Processing stages clearly indicated to users
- ✅ Efficient polling strategy for completion detection
- ✅ Cancel/retry functionality for failed uploads
- ✅ Mobile-responsive progress indicators

### Performance Requirements
- ✅ Progress updates without re-rendering entire component tree
- ✅ Polling stops automatically when uploads complete
- ✅ Memory cleanup for completed/cancelled uploads
- ✅ Smooth animations without performance impact

### Accessibility Requirements
- ✅ ARIA labels and live regions implemented
- ✅ Keyboard navigation support
- ✅ Screen reader compatible announcements
- ✅ High contrast mode support

### User Experience Requirements
- ✅ Clear visual feedback for all processing stages
- ✅ Realistic time estimates (within 25% accuracy)
- ✅ Graceful error handling with recovery options
- ✅ Consistent progress behavior across all upload scenarios

## Implementation Timeline

**Week 1:**
- Day 1-2: Core progress components and types
- Day 3: Progress estimation service and algorithms

**Week 2:**
- Day 1: State management integration
- Day 2: UI integration and polling service
- Day 3: Testing, documentation, and polish

## Future Enhancements (Post-Implementation)

### Advanced Features
- **Historical Progress Analytics**: Track average processing times for calibration
- **Batch Upload Progress**: Handle multiple files with consolidated progress
- **Background Upload**: Continue uploads when user navigates away
- **Offline Progress**: Queue uploads when offline, process when online

### Mobile Native Integration (Sprint 7)
- **Native Progress Views**: iOS/Android specific progress indicators
- **Push Notifications**: Background upload completion notifications
- **Battery Optimization**: Efficient polling strategies for mobile

## Risk Mitigation

### Technical Risks
- **Progress Accuracy**: Implement calibration system based on historical data
- **Performance Impact**: Use React.memo and useCallback for optimization
- **Memory Leaks**: Implement proper cleanup in useEffect hooks

### UX Risks  
- **User Confusion**: Clear stage descriptions and help text
- **Long Processing Times**: Set proper expectations with realistic estimates
- **Error Recovery**: Provide clear error messages and retry mechanisms

This comprehensive plan provides a roadmap for implementing a professional, accessible, and maintainable progress system that significantly improves the user experience while maintaining code quality standards.