import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Grid,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { HealthCheck } from "./components/HealthCheck";
import FileUpload from "./components/FileUpload";
import type { TranscriptionResponse } from "./types";
import "./App.css";

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
                  <Paper key={result.transcriptionId} sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {result.fileName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Status: {result.status} | Processing Time:{" "}
                      {result.processingTimeMs}ms
                    </Typography>
                    {result.transcribedText && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {result.transcribedText}
                      </Typography>
                    )}
                    {result.errorMessage && (
                      <Typography variant="body1" color="error" sx={{ mt: 2 }}>
                        Error: {result.errorMessage}
                      </Typography>
                    )}
                  </Paper>
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
