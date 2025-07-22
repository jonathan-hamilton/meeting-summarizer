import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Brightness4, Brightness7, Science } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { HealthCheck } from "./components/HealthCheck";
import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import { SpeakerReassignmentDemo } from "./components/SpeakerReassignmentDemo";
import type { TranscriptionResponse } from "./types";
import "./App.css";

// Lazy load demo component only when needed (currently disabled)
/* 
const TranscriptDisplayDemo = React.lazy(
  () => import("./demo/TranscriptDisplayDemo")
);
const SpeakerMappingDemo = React.lazy(
  () => import("./demo/SpeakerMappingDemo")
);
const SummaryDisplayDemo = React.lazy(
  () => import("./demo/SummaryDisplayDemo")
);
*/

// Main app content component
const AppContent: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);
  const [showDemo, setShowDemo] = useState(false);
  const [enableSpeakerReassignment, setEnableSpeakerReassignment] =
    useState(false);

  const handleTranscriptionComplete = (result: TranscriptionResponse) => {
    setTranscriptionResults((prev) => [result, ...prev]);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Summarizer
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={enableSpeakerReassignment}
                onChange={(e) => setEnableSpeakerReassignment(e.target.checked)}
                sx={{ color: "white" }}
              />
            }
            label="Enable Speaker Reassignment"
            sx={{ color: "white", mr: 2 }}
          />
          <Button
            color="inherit"
            startIcon={<Science />}
            onClick={() => setShowDemo(!showDemo)}
            sx={{ mr: 1 }}
          >
            {showDemo ? "Hide Demo" : "Speaker Demo"}
          </Button>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom align="center">
            Meeting Summarizer
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            AI-Powered Meeting Transcription and Summarization
          </Typography>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            {/* Demo Content */}
            {showDemo && (
              <Grid size={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>Demo Mode:</strong> This demonstrates speaker
                  reassignment functionality. The demo works with the
                  session-based backend API running on localhost:5029.
                </Alert>
                <SpeakerReassignmentDemo />
              </Grid>
            )}

            {/* Regular App Content */}
            {!showDemo && (
              <>
                <Grid size={12}>
                  <HealthCheck />
                </Grid>

                <Grid size={12}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    Upload Audio File
                  </Typography>
                  <FileUpload
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                </Grid>

                {transcriptionResults.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="h4" component="h2" gutterBottom>
                      Transcription Results
                    </Typography>
                    {transcriptionResults.map((result) => (
                      <TranscriptDisplay
                        key={result.transcriptionId}
                        transcription={result}
                        enableSpeakerReassignment={enableSpeakerReassignment}
                      />
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>
      </Container>
    </>
  );
};

// Main app component with theme provider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
