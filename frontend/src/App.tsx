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
  Link,
} from "@mui/material";
import { Brightness4, Brightness7, HealthAndSafety, Help as HelpIcon } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { EnvironmentProvider, useEnvironment } from "./contexts/EnvironmentProvider";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { useSessionStore } from "./stores/sessionStore";
import { HealthDialog } from "./components/HealthDialog";
import { SessionTimeoutWarningDialog } from "./components/SessionTimeoutWarningDialog";
import { PrivacyPolicyDialog } from "./components/PrivacyPolicyDialog";
import { HelpDialog } from "./components/HelpDialog";
import { SessionIndicator } from "./components/SessionIndicator";
import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import apiService from "./services/apiService";
import { sessionManager } from "./services/sessionManager";

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
  const { isProductionMode, toggleEnvironmentMode } = useEnvironment();
  const { privacyControls } = useSessionManagement();
  const { addTranscript } = useSessionStore();
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  // Update OpenAI state based on environment mode
  const [isOpenAIEnabled, setIsOpenAIEnabled] = useState<boolean | null>(null);

  // State for forcing Privacy Policy dialog (for testing in dev mode)
  const [forceShowPrivacyPolicy, setForceShowPrivacyPolicy] = useState(false);
  
  // State for manually opening privacy policy and help dialogs
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Listen for session expiry events
  useEffect(() => {
    const handleSessionStatusChange = () => {
      // Session status monitoring - no action needed here as sessionManager handles expiry
    };

    // Subscribe to session status changes from sessionManager
    const unsubscribe = sessionManager.onStatusChange(handleSessionStatusChange);
    
    return () => {
      unsubscribe();
    };
  }, [transcriptionResults.length]); // Add dependency to track changes

  const handleTranscriptionComplete = (result: TranscriptionResponse) => {
    setTranscriptionResults((prev) => [result, ...prev]);
    // Also add to sessionStore for consistent session data tracking
    addTranscript(result);
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

  // Sync OpenAI state with environment mode
  useEffect(() => {
    if (isProductionMode) {
      // In production mode, try to enable real API calls
      setIsOpenAIEnabled(true);
      apiService.toggleOpenAI(true).catch(() => {
        console.warn('Failed to enable real API calls in production mode');
      });
    } else {
      // In development mode, use mocked API calls
      setIsOpenAIEnabled(false);
      apiService.toggleOpenAI(false).catch(() => {
        console.warn('Failed to enable mock API calls in development mode');
      });
    }
  }, [isProductionMode]);

  const handleEnvironmentToggle = async () => {
    toggleEnvironmentMode();
  };

  const handleEnvironmentDoubleClick = () => {
    // In development mode, allow triggering Privacy Policy for testing
    if (!isProductionMode) {
      setForceShowPrivacyPolicy(true);
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

  const getAppBarSx = () => {
    const baseColor = getAppBarColor();
    return {
      width: "100%",
      backgroundColor: baseColor === "primary" ? "primary.main" : "warning.main",
      color: "primary.contrastText"
    };
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
        >
          <AppBar
            position="static"
            sx={getAppBarSx()}
          >
            <Toolbar sx={{ width: "100%", position: "relative", justifyContent: "center" }}>
              {/* Development controls - positioned on left */}
              {import.meta.env.DEV && (
                <Box sx={{ position: "absolute", left: 0, display: "flex", alignItems: "center" }}>
                  {/* Environment Mode Toggle Switch */}
                  <Tooltip
                    title={
                      isProductionMode
                        ? "Production mode (real API calls, Privacy Policy enabled)"
                        : "Development mode (mocked API calls) - Double-click to test Privacy Policy"
                    }
                  >
                    <Switch
                      checked={isProductionMode}
                      onChange={handleEnvironmentToggle}
                      onDoubleClick={handleEnvironmentDoubleClick}
                      color="default"
                      sx={{ mr: 1, cursor: 'pointer' }}
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
                </Box>
              )}
              
              {/* Centered title */}
              <Typography variant="h4" component="div" sx={{ 
                textAlign: "center",
                fontWeight: "bold"
              }}>
                Meeting-Summary.io
              </Typography>
              
              {/* Right-aligned controls */}
              <Box sx={{ position: "absolute", right: 0, display: "flex", alignItems: "center" }}>
                <SessionIndicator status={privacyControls.sessionStatus} />
                <Tooltip title="Help & Privacy FAQ">
                  <IconButton color="inherit" onClick={() => setHelpDialogOpen(true)} sx={{ ml: 1 }}>
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
                <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
                  {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>

          <HealthDialog open={healthDialogOpen} onClose={closeHealthDialog} />

          {/* Global session timeout warning dialog */}
          <SessionTimeoutWarningDialog />

          {/* Privacy policy dialog (production only, first visit) */}
          <PrivacyPolicyDialog 
            forceShow={forceShowPrivacyPolicy}
            onAccepted={() => setForceShowPrivacyPolicy(false)}
          />

          {/* Manual privacy policy dialog (footer link) */}
          <PrivacyPolicyDialog 
            forceShow={privacyPolicyOpen}
            onAccepted={() => setPrivacyPolicyOpen(false)}
          />

          {/* Help & FAQ dialog */}
          <HelpDialog 
            open={helpDialogOpen}
            onClose={() => setHelpDialogOpen(false)}
          />

          <Box sx={{ py: 4, width: "100%" }}>
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
                <Box sx={{ width: "100%" }}>
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
                  <Box sx={{ width: "100%" }}>
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
          
          {/* Footer with privacy link */}
          <Box component="footer" sx={{ mt: 4, py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setPrivacyPolicyOpen(true)}
                sx={{ mr: 1 }}
              >
                Privacy Policy
              </Link>
              • Session-based storage • Your data stays private
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Vertec Solutions LLC 2025
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

// Main app component with theme and environment providers
const App: React.FC = () => {
  return (
    <EnvironmentProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </EnvironmentProvider>
  );
};

export default App;
