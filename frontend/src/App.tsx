import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
} from "@mui/material";
import { Brightness4, Brightness7, HealthAndSafety } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { HealthDialog } from "./components/HealthDialog";
import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import apiService from "./services/apiService";
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
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  const handleTranscriptionComplete = (result: TranscriptionResponse) => {
    setTranscriptionResults((prev) => [result, ...prev]);
  };

  const checkServerHealth = async () => {
    try {
      const response = await apiService.getHealth();
      setIsServerHealthy(
        response.success && response.data?.status === "Healthy"
      );
    } catch {
      setIsServerHealthy(false);
    }
  };

  const openHealthDialog = () => {
    setHealthDialogOpen(true);
  };

  const closeHealthDialog = () => {
    setHealthDialogOpen(false);
  };

  // Check server health on component mount and periodically
  useEffect(() => {
    // Only check health in development mode
    if (import.meta.env.DEV) {
      checkServerHealth();
      const interval = setInterval(checkServerHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const getHealthButtonColor = () => {
    if (isServerHealthy === null) return "inherit"; // Unknown state
    return isServerHealthy ? "success" : "error";
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Summarizer
          </Typography>
          {/* Only show health status button in development mode */}
          {import.meta.env.DEV && (
            <IconButton
              color={getHealthButtonColor()}
              onClick={openHealthDialog}
              sx={{ mr: 1 }}
              title={
                isServerHealthy === null
                  ? "Checking server status..."
                  : isServerHealthy
                  ? "Server is healthy"
                  : "Server is unhealthy"
              }
            >
              <HealthAndSafety />
            </IconButton>
          )}
          <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <HealthDialog open={healthDialogOpen} onClose={closeHealthDialog} />

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
