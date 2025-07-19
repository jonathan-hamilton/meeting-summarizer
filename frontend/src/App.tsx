import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { HealthCheck } from "./components/HealthCheck";
import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import type { TranscriptionResponse } from "./types";
import "./App.css";

// Lazy load demo component only when needed
const TranscriptDisplayDemo = React.lazy(
  () => import("./demo/TranscriptDisplayDemo")
);

// Main app content component
const AppContent: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);

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
          <IconButton color="inherit" onClick={toggleTheme}>
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
            {/* Development Demo Mode - Only show in development */}
            {import.meta.env.DEV && (
              <Grid size={12}>
                <React.Suspense
                  fallback={<Typography>Loading demo...</Typography>}
                >
                  <TranscriptDisplayDemo />
                </React.Suspense>
              </Grid>
            )}

            {/* Regular App Content - Always show */}
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
                  />
                ))}
              </Grid>
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
