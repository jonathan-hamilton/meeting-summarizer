import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Switch,
  Tooltip,
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
  const [isOpenAIEnabled, setIsOpenAIEnabled] = useState<boolean | null>(null);

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

  const checkOpenAIStatus = async () => {
    try {
      const response = await apiService.getOpenAIStatus();
      setIsOpenAIEnabled(
        response.success ? response.data?.isEnabled ?? null : null
      );
    } catch {
      setIsOpenAIEnabled(null);
    }
  };

  const handleOpenAIToggle = async () => {
    if (isOpenAIEnabled === null) return;

    try {
      const newState = !isOpenAIEnabled;
      const response = await apiService.toggleOpenAI(newState);
      if (response.success) {
        setIsOpenAIEnabled(newState);
      }
    } catch (error) {
      console.error("Failed to toggle OpenAI:", error);
    }
  };

  const openHealthDialog = () => {
    setHealthDialogOpen(true);
  };

  const closeHealthDialog = () => {
    setHealthDialogOpen(false);
  };

  // Check server health and OpenAI status on component mount and periodically
  useEffect(() => {
    // Only check in development mode
    if (import.meta.env.DEV) {
      checkServerHealth();
      checkOpenAIStatus();
      const interval = setInterval(() => {
        checkServerHealth();
        checkOpenAIStatus();
      }, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const getHealthButtonColor = () => {
    if (isServerHealthy === null) return "inherit"; // Unknown state
    return isServerHealthy ? "success" : "error";
  };

  const getAppBarColor = () => {
    if (isOpenAIEnabled === null) return "primary"; // Default while checking
    return isOpenAIEnabled ? "primary" : "warning"; // Blue for real API, Orange for mock
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "1200px",
            maxWidth: "1200px",
            minWidth: "1200px",
            display: "flex",
            flexDirection: "column",
            margin: "0 auto",
            px: { xs: 2, sm: 2, md: 2 }, // Reduced padding for consistency
          }}
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              console.log("📏 App Main Layout Container Dimensions:", {
                component: "App",
                element: "Main Layout Container",
                width: rect.width,
                height: rect.height,
                offsetWidth: el.offsetWidth,
                clientWidth: el.clientWidth,
                scrollWidth: el.scrollWidth,
                computedStyle: window.getComputedStyle(el).width,
                maxWidth: window.getComputedStyle(el).maxWidth,
                paddingLeft: window.getComputedStyle(el).paddingLeft,
                paddingRight: window.getComputedStyle(el).paddingRight,
                marginLeft: window.getComputedStyle(el).marginLeft,
                marginRight: window.getComputedStyle(el).marginRight,
                timestamp: new Date().toISOString(),
              });
            }
          }}
        >
          <AppBar
            position="static"
            sx={{ width: "100%" }}
            color={getAppBarColor()}
          >
            <Toolbar sx={{ width: "100%" }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Meeting Summarizer
              </Typography>
              {/* Only show development controls in development mode */}
              {import.meta.env.DEV && (
                <>
                  {/* OpenAI Toggle Switch */}
                  <Tooltip
                    title={
                      isOpenAIEnabled === null
                        ? "Checking OpenAI status..."
                        : isOpenAIEnabled
                        ? "OpenAI services enabled (real API calls)"
                        : "Mock services enabled (test mode)"
                    }
                  >
                    <Switch
                      checked={isOpenAIEnabled || false}
                      onChange={handleOpenAIToggle}
                      disabled={isOpenAIEnabled === null}
                      color="default"
                      sx={{ mr: 1 }}
                    />
                  </Tooltip>

                  {/* Server Health Status Button */}
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
                </>
              )}
              <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Toolbar>
          </AppBar>

          <HealthDialog open={healthDialogOpen} onClose={closeHealthDialog} />

          <Box sx={{ py: 4, width: "100%" }}>
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

            <Grid
              container
              spacing={4}
              sx={{ mt: 2, width: "100%", minHeight: "200px" }}
            >
              <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                <Box
                  sx={{ width: "100%" }}
                  ref={(el: HTMLDivElement | null) => {
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      console.log("📏 App FileUpload Container Dimensions:", {
                        component: "App",
                        element: "FileUpload Container Box",
                        width: rect.width,
                        height: rect.height,
                        offsetWidth: el.offsetWidth,
                        clientWidth: el.clientWidth,
                        scrollWidth: el.scrollWidth,
                        computedStyle: window.getComputedStyle(el).width,
                        marginLeft: window.getComputedStyle(el).marginLeft,
                        marginRight: window.getComputedStyle(el).marginRight,
                        timestamp: new Date().toISOString(),
                      });
                    }
                  }}
                >
                  <Typography variant="h4" component="h2" gutterBottom>
                    Upload Audio File
                  </Typography>
                  <FileUpload
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                </Box>
              </Grid>

              {transcriptionResults.length > 0 && (
                <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                  <Box
                    sx={{ width: "100%" }}
                    ref={(el: HTMLDivElement | null) => {
                      if (el) {
                        const rect = el.getBoundingClientRect();
                        console.log(
                          "📏 App TranscriptDisplay Container Dimensions:",
                          {
                            component: "App",
                            element: "TranscriptDisplay Container Box",
                            width: rect.width,
                            height: rect.height,
                            offsetWidth: el.offsetWidth,
                            clientWidth: el.clientWidth,
                            scrollWidth: el.scrollWidth,
                            computedStyle: window.getComputedStyle(el).width,
                            transcriptionResultsCount:
                              transcriptionResults.length,
                            timestamp: new Date().toISOString(),
                          }
                        );
                      }
                    }}
                  >
                    <Typography variant="h4" component="h2" gutterBottom>
                      Transcription Results
                    </Typography>
                    {transcriptionResults.map((result) => (
                      <TranscriptDisplay
                        key={result.transcriptionId}
                        transcription={result}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Box>
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
