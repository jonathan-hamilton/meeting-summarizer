import React, { useState, useEffect, useCallback, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { useNavigate, useLocation } from "react-router-dom";

// Accessibility testing setup for development
declare global {
  const __DEV_AXE_ENABLED__: boolean;
}

if (typeof __DEV_AXE_ENABLED__ !== 'undefined' && __DEV_AXE_ENABLED__) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
import {
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Switch,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import { 
  Brightness4, 
  Brightness7, 
  History as HistoryIcon,
  Home as HomeIcon,
  Help as HelpIcon,
  AccountCircle as AccountIcon,
} from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { useAppMode } from "./contexts/AppModeContext";
import { useModeSync } from "./hooks/useModeSync";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { useSessionStore } from "./stores/sessionStore";
import { useTourStore } from "./stores/tourStore";
import { useUserProfileDialogOpen } from "./stores/userProfileStore";
import { useAuthStore } from "./stores/authStore";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { useSpeakerMappingLifecycle } from "./hooks/useSpeakerMappingLifecycle";
import { useAccessibilityStore } from "./stores/accessibilityStore";

// Lazy load dialog components to reduce initial bundle size
// Health dialog component removed
const SessionTimeoutWarningDialog = React.lazy(() => import("./components/SessionTimeoutWarningDialog").then(m => ({ default: m.SessionTimeoutWarningDialog })));
const PrivacyPolicyDialog = React.lazy(() => import("./components/PrivacyPolicyDialog").then(m => ({ default: m.PrivacyPolicyDialog })));
const HelpDialog = React.lazy(() => import("./components/HelpDialog").then(m => ({ default: m.HelpDialog })));
const UserProfileDialog = React.lazy(() => import("./components/UserProfileDialog").then(m => ({ default: m.UserProfileDialog })));
const AuthManager = React.lazy(() => import("./components/auth").then(m => ({ default: m.AuthManager })));

import { SessionIndicator } from "./components/SessionIndicator";
import FileUpload from "./components/FileUpload";
import MeetingHistoryPage from "./components/MeetingHistory/MeetingHistoryPage";
import TranscriptDisplay from "./components/TranscriptDisplay";
import TranscriptPage from "./components/TranscriptPage";
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
  const { mode: appMode, setMode: setAppMode, signOut: goToDemo } = useAppMode();
  useModeSync(); // Sync mode between context and store
  const { privacyControls } = useSessionManagement();
  
  // Manage speaker mapping lifecycle based on authentication changes
  useSpeakerMappingLifecycle();

  // Ensure page starts at the top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { addTranscript } = useSessionStore();
  const { isActive: isTourActive, isCurrentStep } = useTourStore();
  const openProfileDialog = useUserProfileDialogOpen();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Accessibility store
  const {
    announcement,
    helpDialogOpen,
    privacyPolicyOpen,
    setHelpDialogOpen,
    setPrivacyPolicyOpen,
    announceTranscriptionComplete,
    announceModeChange,
    announceThemeChange
  } = useAccessibilityStore();
  
  // Authentication integration  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);
  // Update OpenAI state based on app mode
  const [isOpenAIEnabled, setIsOpenAIEnabled] = useState<boolean | null>(null);

  // State for forcing Privacy Policy dialog (for testing in dev mode)
  const [forceShowPrivacyPolicy, setForceShowPrivacyPolicy] = useState(false);

  // Wrapper function for theme toggle with accessibility announcement
  const handleThemeToggle = () => {
    toggleTheme();
    const newMode = mode === 'dark' ? 'light' : 'dark';
    announceThemeChange(newMode);
  };

  // Keyboard shortcuts handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + H for Help dialog
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        setHelpDialogOpen(true);
        return;
      }
      
      // Alt + T for theme toggle
      if (event.altKey && event.key === 't') {
        event.preventDefault();
        handleThemeToggle();
        return;
      }
      
      // Alt + 1 for home navigation (when authenticated)
      if (event.altKey && event.key === '1' && isAuthenticated && appMode === 'production') {
        event.preventDefault();
        navigate('/app');
        return;
      }
      
      // Alt + 2 for history navigation (when authenticated)
      if (event.altKey && event.key === '2' && isAuthenticated && appMode === 'production') {
        event.preventDefault();
        navigate('/history');
        return;
      }
      
      // Escape key to close open dialogs
      if (event.key === 'Escape') {
        if (helpDialogOpen) {
          setHelpDialogOpen(false);
        } else if (privacyPolicyOpen) {
          setPrivacyPolicyOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleThemeToggle, navigate, isAuthenticated, appMode, helpDialogOpen, privacyPolicyOpen, setHelpDialogOpen, setPrivacyPolicyOpen]);

  
  // State for development mode sign-in dialog
  const [devSignInDialogOpen, setDevSignInDialogOpen] = useState(false);
  
  // Authentication dialog states
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

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
    // Announce completion to screen readers
    announceTranscriptionComplete();
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

  // Ref callback for tour scroll - handles Step 11 when summary content mounts
  const aiSummaryRef = useCallback((node: HTMLElement | null) => {
    // Step 11: When the AI-Powered Meeting Summary element mounts and Step 11 is active
    if (node && appMode === 'demo' && isTourActive && isCurrentStep(11)) {
      // Scroll to the AI-Powered Meeting Summary heading when it mounts
      node.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [appMode, isTourActive, isCurrentStep]);

  // Health status checking removed to reduce console errors

  // Sync OpenAI state with app mode (simplified - no API calls)
  useEffect(() => {
    if (appMode === 'production') {
      setIsOpenAIEnabled(true);
    } else {
      setIsOpenAIEnabled(false);
    }
  }, [appMode]);

  const handleModeToggle = async () => {
    // Toggle between development and production modes (demo stays demo)
    if (appMode === 'production') {
      setAppMode('development');
      announceModeChange('development');
    } else if (appMode === 'development') {
      setAppMode('production');
      announceModeChange('production');
    }
  };

  const handleModeDoubleClick = () => {
    // In development mode, allow triggering Privacy Policy for testing
    if (appMode === 'development') {
      setForceShowPrivacyPolicy(true);
    }
  };

  // Health dialog functions removed

  // Sign-Out button handler
  const handleSignOutClick = async () => {
    // Production mode: sign out from auth system but stay on current page
    const { logout } = useAuthStore.getState();
    await logout();
    // Don't call signOut() which redirects to demo - just clear auth state
  };



  // Server health checking removed to reduce console errors

  // Health button color function removed

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
      {/* Skip link for keyboard navigation */}
      <Link
        href="#main-content"
        sx={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: 'primary.main',
          color: 'primary.contrastText',
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          zIndex: 10000,
          '&:focus': {
            top: '6px'
          }
        }}
      >
        Skip to main content
      </Link>
      
      {/* Live region for screen reader announcements */}
      <Box
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {announcement}
      </Box>
      
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
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
              {/* Left-aligned controls */}
              <Box sx={{ position: "absolute", left: 0, display: "flex", alignItems: "center" }}>
                {/* TRY DEMO button - for non-demo modes and when not authenticated */}
                {appMode !== 'demo' && !isAuthenticated && (
                  <Button
                    variant="outlined"
                    onClick={goToDemo}
                    sx={{ 
                      ml: 1,
                      minWidth: '100px',
                      fontWeight: 'bold',
                      borderColor: '#6B46C1',
                      color: '#6B46C1',
                      '&:hover': {
                        backgroundColor: '#6B46C1',
                        color: 'white',
                        borderColor: '#6B46C1'
                      }
                    }}
                  >
                    TRY DEMO
                  </Button>
                )}

                {/* Development controls - only visible in local development environment */}
                {import.meta.env.DEV && (
                  <>
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
                        inputProps={{ 
                          'aria-label': 'Toggle between development and production mode',
                          'aria-describedby': 'mode-switch-description'
                        }}
                        id="mode-switch"
                      />
                    </Tooltip>

                    {/* Server health status button removed */}
                  </>
                )}
              </Box>
              
              {/* Centered title */}
              <Typography variant="h4" component="h1" sx={{ 
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
                
                {/* Navigation Buttons - Only when authenticated in production mode */}
                {appMode === 'production' && isAuthenticated && (
                  <>
                    {location.pathname === '/history' ? (
                      <Tooltip title="Home">
                        <IconButton color="inherit" onClick={() => navigate('/app')}>
                          <HomeIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Meeting History">
                        <IconButton color="inherit" onClick={() => navigate('/history')}>
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}

                {/* User Profile Button - Only when authenticated in production mode */}
                {appMode === 'production' && isAuthenticated && (
                  <Tooltip title="My Account">
                    <IconButton color="inherit" onClick={openProfileDialog}>
                      <AccountIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* Authentication Button - Only show SIGN OUT when authenticated in production mode */}
                {appMode === 'production' && isAuthenticated && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSignOutClick}
                    sx={{ 
                      ml: 1,
                      minWidth: '80px',
                      fontWeight: 'bold',
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565C0'
                      }
                    }}
                  >
                    SIGN OUT
                  </Button>
                )}

                {/* Demo mode button - changed to SIGN UP for demo mode */}
                {appMode === 'demo' && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setRegisterDialogOpen(true)}
                    sx={{ 
                      ml: 1,
                      minWidth: '80px',
                      fontWeight: 'bold',
                      backgroundColor: '#9C27B0',
                      '&:hover': {
                        backgroundColor: '#7B1FA2'
                      }
                    }}
                  >
                    SIGN UP
                  </Button>
                )}
                
                <Tooltip title="Help & Privacy FAQ">
                  <IconButton 
                    color="inherit" 
                    onClick={() => setHelpDialogOpen(true)} 
                    sx={{ ml: 1 }}
                    aria-label="Help & Privacy FAQ"
                  >
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  color="inherit" 
                  onClick={handleThemeToggle} 
                  sx={{ ml: 1 }}
                  aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                >
                  {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Health dialog removed */}

          {/* Global session timeout warning dialog */}
          <Suspense fallback={null}>
            <SessionTimeoutWarningDialog />
          </Suspense>

          {/* Privacy policy dialog (production only, first visit) */}
          <Suspense fallback={null}>
            <PrivacyPolicyDialog 
              forceShow={forceShowPrivacyPolicy}
              onAccepted={() => setForceShowPrivacyPolicy(false)}
            />
          </Suspense>

          {/* Manual privacy policy dialog (footer link) */}
          <Suspense fallback={null}>
            <PrivacyPolicyDialog 
              forceShow={privacyPolicyOpen}
              onAccepted={() => setPrivacyPolicyOpen(false)}
            />
          </Suspense>

          {/* Help & FAQ dialog */}
          <Suspense fallback={null}>
            <HelpDialog 
              open={helpDialogOpen}
              onClose={() => setHelpDialogOpen(false)}
            />
          </Suspense>

          {/* User Profile dialog */}
          <Suspense fallback={null}>
            <UserProfileDialog />
          </Suspense>

          {/* Authentication dialogs */}
          <Suspense fallback={null}>
            <AuthManager 
              loginOpen={loginDialogOpen}
              registerOpen={registerDialogOpen}
              onCloseLogin={() => setLoginDialogOpen(false)}
              onCloseRegister={() => setRegisterDialogOpen(false)}
              onSwitchToLogin={() => {
                setRegisterDialogOpen(false);
                setLoginDialogOpen(true);
              }}
              onSwitchToRegister={() => {
                setLoginDialogOpen(false);
                setRegisterDialogOpen(true);
              }}
            />
          </Suspense>

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

          <main role="main" aria-label="Main content" id="main-content">
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

              {/* Authentication Notice for Production Mode */}
              {appMode === 'production' && !isAuthenticated && (
                <Box sx={{ 
                  mt: 3, 
                  p: 3, 
                  border: '2px solid #1976d2', 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  textAlign: 'center' 
                }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Sign in to access full features
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Create an account or sign in to upload audio files, process meetings, and manage your transcriptions.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setLoginDialogOpen(true)}
                      sx={{ minWidth: '120px' }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setRegisterDialogOpen(true)}
                      sx={{ minWidth: '120px' }}
                    >
                      Register
                    </Button>
                  </Box>
                </Box>
              )}

            {/* Render different content based on the current route */}
            {location.pathname === '/history' ? (
              <MeetingHistoryPage />
            ) : location.pathname.startsWith('/transcript/') ? (
              <TranscriptPage />
            ) : (
              <Grid
                container
                spacing={4}
                sx={{ mt: 2, width: "100%", minHeight: "200px" }}
              >
                <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                  <section aria-labelledby="upload-heading">
                    <Typography variant="h4" component="h3" id="upload-heading" gutterBottom>
                      Upload Audio File
                    </Typography>
                    {/* Show upload component only if not in production mode or if authenticated AND not currently loading */}
                    {(appMode !== 'production' || (isAuthenticated && !isAuthLoading)) ? (
                      <FileUpload
                        onTranscriptionComplete={handleTranscriptionComplete}
                        isAuthDialogOpen={loginDialogOpen || registerDialogOpen}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        border: '1px dashed #ccc', 
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5'
                      }}>
                        <Typography variant="body1" color="text.secondary">
                          Please sign in to upload and process audio files.
                        </Typography>
                      </Box>
                    )}
                  </section>
                </Grid>

                {transcriptionResults.length > 0 && (
                  <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                    <section 
                      aria-labelledby="transcription-heading"
                      id="transcription-results" 
                      ref={transcriptionResultsRef}
                    >
                      <Box sx={{ width: "100%" }}>
                        <Typography variant="h4" component="h3" id="transcription-heading" gutterBottom>
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
                    </section>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
          </main>
          
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

// Loading component for authentication initialization
const AuthLoadingComponent: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Initializing...
        </Typography>
      </Box>
    </Box>
  );
};

// Main app component with theme and environment providers
const App: React.FC = () => {
  const { isInitializing } = useAuthInitialization();
  
  return (
    <ThemeProvider>
      {isInitializing ? <AuthLoadingComponent /> : <AppContent />}
    </ThemeProvider>
  );
};

export default App;
