# TranscriptDisplay Demo Component

## Purpose
This demo component provides comprehensive testing and showcasing of the S1.2 TranscriptDisplay component functionality.

## Features
- **Interactive Testing**: Switch between different transcript scenarios
- **Live Validation**: Test all S1.2 acceptance criteria in real-time
- **Visual Examples**: Demonstrate speaker diarization, simple transcripts, error states, and loading states
- **Copy Functionality Testing**: Validate clipboard operations work correctly

## Usage

### Development Testing
To use this demo component during development:

1. **Temporarily import in App.tsx**:
```tsx
import TranscriptDisplayDemo from "./demo/TranscriptDisplayDemo";
```

2. **Add to your component tree**:
```tsx
<TranscriptDisplayDemo />
```

3. **Remove when done testing**

### What You Can Test
- ✅ Speaker diarization with colored chips and accordions
- ✅ Simple transcript display without speaker segments  
- ✅ Error state handling and messaging
- ✅ Loading state with spinner
- ✅ Copy functionality for segments and full transcripts
- ✅ Metadata display (file size, processing time, confidence)
- ✅ Time formatting and accessibility features

## Test Scenarios Included
1. **Speaker Diarization**: Multi-speaker meeting with 3 speakers, timestamps, confidence scores
2. **Simple Transcript**: Single-speaker presentation without diarization
3. **Error State**: Failed transcription with error message
4. **Loading State**: Simulated processing with 3-second demo

## When to Use
- **Feature Development**: Testing new TranscriptDisplay features
- **Bug Fixes**: Reproducing and verifying fixes
- **Stakeholder Demos**: Showing component capabilities
- **Integration Testing**: Validating with other components
- **Visual Regression**: Ensuring UI consistency

## Important Notes
- **Not for Production**: This component should never be included in production builds
- **Development Only**: Use only during active development and testing
- **Regular Browser Required**: Copy functionality requires full browser (not VS Code Simple Browser)
- **Comprehensive Coverage**: Tests all S1.2 acceptance criteria

## File Location
`/src/demo/TranscriptDisplayDemo.tsx`

Keep this component for future S1.2-related development and testing needs!
