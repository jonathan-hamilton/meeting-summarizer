import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Paper,
  Divider,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import TranscriptDisplay from "../components/TranscriptDisplay";
import FileUpload from "../components/FileUpload";
import type { TranscriptionResponse } from "../types";

// Mock data for comprehensive S1.2 testing
const mockSpeakerDiarization: TranscriptionResponse = {
  transcriptionId: "demo-speakers-123",
  fileName: "team-meeting.mp3",
  fileSize: 2048576, // 2 MB
  status: "Completed",
  transcribedText:
    "Hello everyone, welcome to our quarterly review meeting. Thank you for joining us today. Let me start by reviewing our key achievements this quarter.",
  speakerSegments: [
    {
      start: 0.0,
      end: 3.5,
      text: "Hello everyone, welcome to our quarterly review meeting.",
      speaker: "Speaker 1",
      confidence: 0.97,
    },
    {
      start: 3.5,
      end: 6.2,
      text: "Thank you for joining us today.",
      speaker: "Speaker 2",
      confidence: 0.94,
    },
    {
      start: 6.2,
      end: 10.8,
      text: "Let me start by reviewing our key achievements this quarter.",
      speaker: "Speaker 1",
      confidence: 0.96,
    },
    {
      start: 10.8,
      end: 14.5,
      text: "Great idea! I think we should also discuss the upcoming project milestones.",
      speaker: "Speaker 3",
      confidence: 0.92,
    },
  ],
  processingTimeMs: 3200,
  createdAt: "2025-07-19T10:30:00Z",
  completedAt: "2025-07-19T10:30:03Z",
  confidenceScore: 0.95,
  detectedLanguage: "en",
};

const mockSimpleTranscript: TranscriptionResponse = {
  transcriptionId: "demo-simple-456",
  fileName: "presentation.wav",
  fileSize: 5242880, // 5 MB
  status: "Completed",
  transcribedText:
    "Welcome to today's presentation on artificial intelligence and machine learning. We'll be covering the latest developments in natural language processing and how they apply to business applications.",
  processingTimeMs: 4800,
  createdAt: "2025-07-19T10:25:00Z",
  completedAt: "2025-07-19T10:25:05Z",
  confidenceScore: 0.98,
  detectedLanguage: "en",
};

const mockFailedTranscript: TranscriptionResponse = {
  transcriptionId: "demo-failed-789",
  fileName: "corrupted-audio.mp4",
  fileSize: 1536000, // 1.5 MB
  status: "Failed",
  errorMessage: "Audio format not supported or file is corrupted",
  processingTimeMs: 1200,
  createdAt: "2025-07-19T10:20:00Z",
  completedAt: "2025-07-19T10:20:01Z",
};

const TranscriptDisplayDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<
    "speakers" | "simple" | "failed" | "loading"
  >("speakers");
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [s13Results, setS13Results] = useState<TranscriptionResponse[]>([]);

  // S1.3 Integration: Handle transcription completion from FileUpload
  const handleTranscriptionComplete = (result: TranscriptionResponse) => {
    setS13Results((prev) => [result, ...prev]);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDemoChange = (
    demo: "speakers" | "simple" | "failed" | "loading"
  ) => {
    if (demo === "loading") {
      setIsLoading(true);
      // Simulate loading for 3 seconds
      setTimeout(() => {
        setIsLoading(false);
        setCurrentDemo("speakers");
      }, 3000);
    } else {
      setIsLoading(false);
      setCurrentDemo(demo);
    }
  };

  const getCurrentTranscription = () => {
    switch (currentDemo) {
      case "speakers":
        return mockSpeakerDiarization;
      case "simple":
        return mockSimpleTranscript;
      case "failed":
        return mockFailedTranscript;
      default:
        return mockSpeakerDiarization;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            🧪 <strong>Development Demo Mode</strong> - This component is for
            testing and development purposes only. It should not be included in
            production builds.
          </Typography>
        </Alert>

        <Typography variant="h3" component="h1" gutterBottom align="center">
          Sprint 1 Component Demo & Testing
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
        >
          Interactive testing for S1.2 TranscriptDisplay and S1.3 FileUpload
          Integration
        </Typography>

        {/* Demo Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="demo tabs"
          >
            <Tab label="S1.2 - TranscriptDisplay Testing" />
            <Tab label="S1.3 - FileUpload Integration Testing" />
          </Tabs>
        </Box>

        {/* S1.2 Demo Tab */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h4" component="h2" gutterBottom>
              S1.2 TranscriptDisplay Component Demo
            </Typography>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              align="center"
              color="text.secondary"
            >
              Functional Testing of All S1.2 Acceptance Criteria
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Test Scenarios
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant={
                    currentDemo === "speakers" && !isLoading
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => handleDemoChange("speakers")}
                >
                  Speaker Diarization
                </Button>
                <Button
                  variant={
                    currentDemo === "simple" && !isLoading
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => handleDemoChange("simple")}
                >
                  Simple Transcript
                </Button>
                <Button
                  variant={
                    currentDemo === "failed" && !isLoading
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => handleDemoChange("failed")}
                >
                  Error State
                </Button>
                <Button
                  variant={isLoading ? "contained" : "outlined"}
                  onClick={() => handleDemoChange("loading")}
                >
                  Loading State
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                S1.2 Acceptance Criteria Validation
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" component="div">
                  ✅{" "}
                  <strong>
                    Frontend displays transcription results with clear speaker
                    labels
                  </strong>
                  <br />✅{" "}
                  <strong>Transcript text is formatted for readability</strong>
                  <br />✅{" "}
                  <strong>Speaker segments are visually distinguished</strong>
                  <br />✅{" "}
                  <strong>
                    Loading state shown during transcription processing
                  </strong>
                  <br />✅{" "}
                  <strong>
                    Error messages displayed for failed transcriptions
                  </strong>
                  <br />✅{" "}
                  <strong>
                    Transcript content is selectable for copy/paste
                  </strong>
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TranscriptDisplay
                transcription={getCurrentTranscription()}
                loading={isLoading}
              />
            </Paper>

            <Paper sx={{ p: 3, mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Manual Testing Checklist
              </Typography>
              <Typography variant="body1" component="div">
                <strong>🔧 Copy Functionality Troubleshooting:</strong>
                <br />
                • Open browser DevTools (F12) and check Console for errors
                <br />
                • Ensure you're on localhost (clipboard API requires secure
                context)
                <br />
                • Try both modern and fallback copy methods
                <br />
                • Watch for visual feedback (button color change)
                <br />
                • Check if alert messages appear for permission issues
                <br />
                <br />
                <strong>1. Speaker Diarization Test:</strong>
                <br />
                • Verify different speakers have different colors
                <br />
                • Check accordion expansion/collapse works
                <br />
                • Test copy buttons for individual segments
                <br />
                • Test copy button for full transcript
                <br />
                • Verify timestamps are formatted correctly
                <br />
                • Check metadata chips display properly
                <br />
                <br />
                <strong>2. Simple Transcript Test:</strong>
                <br />
                • Verify single transcript without speaker segments
                <br />
                • Check "Transcript" header (not "Speaker Transcript")
                <br />
                • Test copy functionality for simple text
                <br />
                <br />
                <strong>3. Error State Test:</strong>
                <br />
                • Verify error message is clearly displayed
                <br />
                • Check file information is shown even for failed transcriptions
                <br />
                • Ensure no copy buttons appear for failed transcriptions
                <br />
                <br />
                <strong>4. Loading State Test:</strong>
                <br />
                • Verify spinner appears during loading
                <br />
                • Check "Processing transcription..." message
                <br />
                • Ensure no content is shown while loading
                <br />
                <br />
                <strong>5. Accessibility Test:</strong>
                <br />
                • Use Tab key to navigate between copy buttons
                <br />
                • Verify ARIA labels are announced by screen readers
                <br />
                • Check text selection works properly
                <br />• Test keyboard navigation
              </Typography>
            </Paper>
          </Box>
        )}

        {/* S1.3 Demo Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h4" component="h2" gutterBottom>
              S1.3 FileUpload Integration Demo
            </Typography>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              align="center"
              color="text.secondary"
            >
              End-to-End Transcription Workflow Testing
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                🔄 Live File Upload & Transcription Testing
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Test the complete S1.3 workflow by uploading real audio files to
                the backend API. The FileUpload component will automatically
                trigger transcription and display results below.
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>⚠️ Backend Required:</strong> Make sure the .NET API
                  server is running on localhost:5029 for file upload and
                  transcription to work properly.
                </Typography>
              </Alert>

              <FileUpload
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </Paper>

            {/* Display S1.3 Results */}
            {s13Results.length > 0 && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  🎯 Live Transcription Results ({s13Results.length})
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Results from the S1.3 integration workflow. Each successful
                  upload will appear here and demonstrate the complete pipeline
                  working together.
                </Typography>

                <Stack spacing={3}>
                  {s13Results.map((result) => (
                    <TranscriptDisplay
                      key={result.transcriptionId}
                      transcription={result}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                📋 S1.3 Acceptance Criteria Checklist
              </Typography>
              <Typography variant="body2" component="div">
                <strong>Test the following S1.3 requirements:</strong>
                <br />
                <br />
                <strong>
                  1. File Upload Triggers Transcription Automatically:
                </strong>
                <br />
                • Upload an audio file using drag & drop or file picker
                <br />
                • Verify transcription starts immediately after file selection
                <br />
                • Check that no manual "transcribe" button is needed
                <br />
                <br />
                <strong>
                  2. Progress Indicators Show Upload and Transcription Status:
                </strong>
                <br />
                • Verify workflow stepper shows File Selected → Uploading →
                Processing → Complete
                <br />
                • Check upload progress bar updates correctly
                <br />
                • Verify "Uploading..." vs "Processing transcription..."
                messages
                <br />
                • Check queue summary chips (completed, processing, failed
                counts)
                <br />
                <br />
                <strong>
                  3. Successful Transcription Displays Results Immediately:
                </strong>
                <br />
                • Verify TranscriptDisplay appears automatically after
                completion
                <br />
                • Check success alert shows processing time and speaker count
                <br />
                • Verify results appear in "Live Transcription Results" section
                above
                <br />
                <br />
                <strong>
                  4. Failed Transcriptions Show Clear Error Messages:
                </strong>
                <br />
                • Try uploading an invalid file type (e.g., .txt)
                <br />
                • Verify clear error message in workflow stepper
                <br />
                • Check error state shows in upload queue
                <br />
                <br />
                <strong>
                  5. User Can Upload New Files After Completing Transcription:
                </strong>
                <br />
                • Upload multiple files in sequence
                <br />
                • Verify each file gets its own workflow stepper
                <br />
                • Check queue handles multiple simultaneous uploads
                <br />
                <br />
                <strong>
                  6. Transcription Results Persist Until New File is Uploaded:
                </strong>
                <br />
                • Verify completed transcriptions remain visible
                <br />
                • Check results are maintained across component re-renders
                <br />
                • Test that results accumulate (newest first)
                <br />
                <br />
                <strong>7. Integration Testing:</strong>
                <br />
                • Verify S1.2 TranscriptDisplay renders uploaded results
                correctly
                <br />
                • Test copy functionality works on live transcription results
                <br />
                • Check speaker diarization data flows properly from backend
                <br />• Verify metadata (file size, processing time, speaker
                count) is accurate
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default TranscriptDisplayDemo;
