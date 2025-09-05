import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Brightness4, Brightness7, HealthAndSafety, Help as HelpIcon } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { useAppMode } from "./contexts/AppModeContext";
import { useModeSync } from "./hooks/useModeSync";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { useSessionStore } from "./stores/sessionStore";
import { useTourStore } from "./stores/tourStore";
import { HealthDialog } from "./components/HealthDialog";
import { SessionTimeoutWarningDialog } from "./components/SessionTimeoutWarningDialog";
import { PrivacyPolicyDialog } from "./components/PrivacyPolicyDialog";
import { HelpDialog } from "./components/HelpDialog";
import { SessionIndicator } from "./components/SessionIndicator";
import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import { createApiService } from "./services/apiServiceFactory";
import realApiService from "./services/apiService";
import mockApiService from "./services/apiService.mock";
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
  const { mode: appMode, setMode: setAppMode, signIn, signOut } = useAppMode();
  useModeSync(); // Sync mode between context and store
  const { privacyControls } = useSessionManagement();
  const { addTranscript } = useSessionStore();
  const { isActive: isTourActive, isCurrentStep } = useTourStore();
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  // Update OpenAI state based on app mode
  const [isOpenAIEnabled, setIsOpenAIEnabled] = useState<boolean | null>(null);
  // Use API service factory based on app mode
  const apiService = createApiService(appMode);

  // State for forcing Privacy Policy dialog (for testing in dev mode)
  const [forceShowPrivacyPolicy, setForceShowPrivacyPolicy] = useState(false);
  
  // State for manually opening privacy policy and help dialogs
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // State for development mode sign-in dialog
  const [devSignInDialogOpen, setDevSignInDialogOpen] = useState(false);

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

  // Ref callback for Step 2 tour scroll - scrolls when element is mounted and tour is on Step 2
  const transcriptionResultsRef = useCallback((node: HTMLElement | null) => {
    if (node && appMode === 'demo' && isTourActive && isCurrentStep(2)) {
      node.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [appMode, isTourActive, isCurrentStep]);

  // Ref callback for tour scroll - no longer handles Step 10 or 11 scrolling
  // Both steps now use step transition logic in tourStore for one-time scrolling
  const aiSummaryRef = useCallback((node: HTMLElement | null) => {
    // This ref is now just used for attaching to the DOM element
    // All scrolling is handled by step transition logic in tourStore
    // to ensure it only happens once when each step opens
  }, []);

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

  // Sync OpenAI state with app mode
  useEffect(() => {
    if (appMode === 'production') {
      setIsOpenAIEnabled(true);
      realApiService.toggleOpenAI(true).catch(() => {
        console.warn('Failed to enable real API calls in production mode');
      });
    } else {
      setIsOpenAIEnabled(false);
      mockApiService.toggleOpenAI(false).catch(() => {
        console.warn('Failed to enable mock API calls in development mode');
      });
    }
  }, [appMode]);

  const handleModeToggle = async () => {
    // Toggle between development and production modes (demo stays demo)
    if (appMode === 'production') {
      setAppMode('development');
    } else if (appMode === 'development') {
      setAppMode('production');
    }
  };

  const handleModeDoubleClick = () => {
    // In development mode, allow triggering Privacy Policy for testing
    if (appMode === 'development') {
      setForceShowPrivacyPolicy(true);
    }
  };

  const openHealthDialog = () => {
    setHealthDialogOpen(true);
  };

  const closeHealthDialog = () => {
    setHealthDialogOpen(false);
  };

  // Sign-In/Sign-Out button handlers
  const handleSignInClick = async () => {
    if (appMode === 'demo') {
      // Demo mode: navigate to production mode
      await signIn();
    } else if (appMode === 'development') {
      // Development mode: show stub dialog
      setDevSignInDialogOpen(true);
    }
    // Production mode: this shouldn't happen as button shows "SIGN OUT"
  };

  const handleSignOutClick = () => {
    // Production mode: navigate back to demo mode
    signOut();
  };

  const getSignInButtonText = () => {
    if (appMode === 'demo') return 'SIGN IN';
    if (appMode === 'production') return 'SIGN OUT';
    return 'SIGN IN'; // Development mode
  };

  const handleSignInButtonClick = () => {
    if (appMode === 'production') {
      handleSignOutClick();
    } else {
      handleSignInClick();
    }
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
    // Demo mode gets a purple/teal color scheme, different from production orange/blue
    if (appMode === 'demo') {
      return {
        width: "100%",
        backgroundColor: "#6B46C1", // Purple color for demo mode
        color: "#FFFFFF"
      };
    }
    
    // Production mode uses existing logic
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
              {/* Development controls - positioned on left, hidden in demo mode OR production mode */}
              {import.meta.env.DEV && appMode !== 'demo' && (
                <Box sx={{ position: "absolute", left: 0, display: "flex", alignItems: "center" }}>
                  {/* Mode Toggle Switch - Toggle between development and production modes */}
                  <Tooltip
                    title={
                      appMode === 'production'
                        ? "Production mode (real API calls, Privacy Policy enabled)"
                        : "Development mode (mocked API calls) - Double-click to test Privacy Policy"
                    }
                  >
                    <Switch
                      checked={appMode === 'production'}
                      onChange={handleModeToggle}
                      onDoubleClick={handleModeDoubleClick}
                      color="default"
                      sx={{ mr: 1, cursor: 'pointer' }}
                    />
                  </Tooltip>

                  {/* Server Health Status Button - Hidden in production mode */}
                  {appMode === 'development' && (
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
                </Box>
              )}
              
              {/* Centered title */}
              <Typography variant="h4" component="div" sx={{ 
                textAlign: "center",
                fontWeight: "bold"
              }}>
                Meeting-Summary.io {appMode === 'demo' && '(Demo)'}
              </Typography>
              
              {/* Right-aligned controls */}
              <Box sx={{ position: "absolute", right: 0, display: "flex", alignItems: "center" }}>
                {/* Hide SessionIndicator in demo mode OR production mode */}
                {appMode === 'development' && (
                  <SessionIndicator status={privacyControls.sessionStatus} />
                )}
                
                {/* Sign-In/Sign-Out Button */}
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSignInButtonClick}
                  sx={{ 
                    ml: 1,
                    minWidth: '80px',
                    fontWeight: 'bold',
                    backgroundColor: appMode === 'demo' ? '#9C27B0' : '#1976d2',
                    '&:hover': {
                      backgroundColor: appMode === 'demo' ? '#7B1FA2' : '#1565C0'
                    }
                  }}
                >
                  {getSignInButtonText()}
                </Button>
                
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

          {/* Development mode sign-in dialog */}
          <Dialog
            open={devSignInDialogOpen}
            onClose={() => setDevSignInDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Sign-In Not Available</DialogTitle>
            <DialogContent>
              <Typography>
                Sign-in functionality is not available in Development mode. 
                This mode is intended for developers to test the application with mock data.
              </Typography>
              <Typography sx={{ mt: 2 }}>
                To test sign-in functionality, switch to Production mode using the toggle switch.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDevSignInDialogOpen(false)} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

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
                  <Box 
                    id="transcription-results" 
                    ref={transcriptionResultsRef}
                    sx={{ width: "100%" }}
                  >
                    <Typography variant="h4" component="h2" gutterBottom>
                      Transcription Results
                    </Typography>
                    {transcriptionResults.map((result) => (
                      <TranscriptDisplay
                        key={result.transcriptionId}
                        transcription={result}
                        aiSummaryRef={aiSummaryRef}
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
          </Box>
        </Box>
      </Box>
    </>
  );
};

// Main app component with theme and environment providers
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
