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
  Grid,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import "./styles/accessibility.css";
import { useAppMode } from "./contexts/AppModeContext";
import { useModeSync } from "./hooks/useModeSync";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { useSessionStore } from "./stores/sessionStore";

import { useAuthStore } from "./stores/authStore";
import { useTokenStore } from "./stores/tokenStore";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { useSpeakerMappingLifecycle } from "./hooks/useSpeakerMappingLifecycle";
import { useAccessibilityStore } from "./stores/accessibilityStore";

// Lazy load dialog components to reduce initial bundle size
// Health dialog component removed
const SessionTimeoutWarningDialog = React.lazy(() => import("./components/SessionTimeoutWarningDialog").then(m => ({ default: m.SessionTimeoutWarningDialog })));
const UserProfileDialog = React.lazy(() => import("./components/UserProfileDialog").then(m => ({ default: m.UserProfileDialog })));
const TokenPurchaseDialog = React.lazy(() => import("./components/TokenPurchaseDialog").then(m => ({ default: m.TokenPurchaseDialog })));


import FileUpload from "./components/FileUpload/FileUpload";
import MeetingHistoryPage from "./components/MeetingHistory/MeetingHistoryPage";
import TranscriptDisplay from "./components/TranscriptDisplay";
import TranscriptPage from "./components/TranscriptPage";
import EmailVerificationDialog from "./components/EmailVerificationDialog";

import { sessionManager } from "./services/sessionManager";
import { AppHeader } from "./components/layout/AppHeader";
import { GlobalDialogs } from "./components/layout/GlobalDialogs";
import { useTranscriptionJobStore } from "./stores/transcriptionJobStore";

import type { TranscriptionResponse } from "./types";
import "./App.css";

// Main app content component
const AppContent: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const { mode: appMode, setMode: setAppMode } = useAppMode();
  useModeSync(); // Sync mode between context and store
  const { privacyControls } = useSessionManagement();
  
  // Manage speaker mapping lifecycle based on authentication changes
  useSpeakerMappingLifecycle();

  // Ensure page starts at the top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { addTranscript } = useSessionStore();

  const navigate = useNavigate();
  const location = useLocation();
  
  // Accessibility store
  const {
    announcement,
    helpDialogOpen,
    privacyPolicyOpen,
    highContrast,
    reduceMotion,
    enhancedFocusIndicators,
    setHelpDialogOpen,
    setPrivacyPolicyOpen,
    announceTranscriptionComplete,
    announceModeChange,
    announceThemeChange
  } = useAccessibilityStore();
  
  // Authentication integration  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { refreshBalance, loadStripeConfig } = useTokenStore();
  
  // Initialize token store when user is authenticated
  useEffect(() => {
    if (isAuthenticated && appMode === 'production') {
      // Load token balance and Stripe configuration
      refreshBalance();
      loadStripeConfig();
    }
  }, [isAuthenticated, appMode, refreshBalance, loadStripeConfig]);

  // Initialize transcription job store from session storage when app starts
  const { initializeFromStorage } = useTranscriptionJobStore();
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResponse[]
  >([]);
  // Update OpenAI state based on app mode
  const [isOpenAIEnabled, setIsOpenAIEnabled] = useState<boolean | null>(null);
  
  // State for forcing Legal Acceptance dialog (for testing in dev mode)
  const [forceShowLegalAcceptance, setForceShowLegalAcceptance] = useState(false);
  
  // State for legal document dialogs
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [dmcaDialogOpen, setDmcaDialogOpen] = useState(false);
  const [disclaimerDialogOpen, setDisclaimerDialogOpen] = useState(false);
  const [privacyFooterDialogOpen, setPrivacyFooterDialogOpen] = useState(false);

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
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);
  
  // Token management dialog state
  const [tokenPurchaseDialogOpen, setTokenPurchaseDialogOpen] = useState(false);
  


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
    console.log('🎯 handleTranscriptionComplete called with:', result.transcriptionId, result.fileName);
    setTranscriptionResults((prev) => {
      console.log('🎯 Previous results:', prev.map(r => ({ id: r.transcriptionId, fileName: r.fileName })));
      
      // Check if this result is already in the array to prevent duplicates
      const exists = prev.some(r => r.transcriptionId === result.transcriptionId);
      if (exists) {
        console.log('🎯 Result already exists, skipping duplicate');
        return prev;
      }
      
      const updated = [result, ...prev];
      console.log('🎯 Updated results:', updated.map(r => ({ id: r.transcriptionId, fileName: r.fileName })));
      return updated;
    });
  };

  // Clear previous data when starting new session
  const handleClearPreviousData = useCallback(() => {
    console.log('🧹 Clearing previous transcription data');
    setTranscriptionResults([]);
  }, []);

  // Wrapper for transcription completion handling
  const handleTranscriptionCompleteWrapper = (result: TranscriptionResponse) => {
    handleTranscriptionComplete(result);
    // Also add to sessionStore for consistent session data tracking
    addTranscript(result);
    // Refresh token balance after successful transcription (tokens were consumed)
    refreshBalance();
    // Announce completion to screen readers
    announceTranscriptionComplete();
  };

  // Health status checking removed to reduce console errors

  // Sync OpenAI state with app mode (simplified - no API calls)
  useEffect(() => {
    if (appMode === 'production') {
      setIsOpenAIEnabled(true);
    } else {
      setIsOpenAIEnabled(false);
    }
  }, [appMode]);

  // Initialize accessibility settings on mount (for persisted preferences)
  useEffect(() => {
    // Force rehydration of persisted accessibility store values on app mount
    // This ensures localStorage values are applied immediately after the store is ready
    const timer = setTimeout(() => {
      // Double-check that DOM classes are applied after store rehydration
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('high-contrast-mode', highContrast);
        document.documentElement.classList.toggle('enhanced-focus-indicators', enhancedFocusIndicators);
        
        const duration = reduceMotion ? '0ms' : '300ms';
        const timing = reduceMotion ? '0ms' : 'ease-in-out';
        document.documentElement.style.setProperty('--motion-duration', duration);
        document.documentElement.style.setProperty('--motion-timing', timing);
      }
    }, 50); // Small delay to ensure store has rehydrated
    
    return () => clearTimeout(timer);
  }, []);

  // Accessibility DOM effects - handle CSS class application
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast-mode', highContrast);
    }
  }, [highContrast]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('enhanced-focus-indicators', enhancedFocusIndicators);
    }
  }, [enhancedFocusIndicators]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const duration = reduceMotion ? '0ms' : '300ms';
      const timing = reduceMotion ? '0ms' : 'ease-in-out';
      
      document.documentElement.style.setProperty('--motion-duration', duration);
      document.documentElement.style.setProperty('--motion-timing', timing);
    }
  }, [reduceMotion]);

  const handleModeToggle = async () => {
    // Toggle between development and production modes
    if (appMode === 'production') {
      setAppMode('development');
      announceModeChange('development');
    } else if (appMode === 'development') {
      setAppMode('production');
      announceModeChange('production');
    }
  };

  const handleModeDoubleClick = () => {
    // In development mode, allow triggering Legal Acceptance dialog for testing
    if (appMode === 'development') {
      setForceShowLegalAcceptance(true);
    }
  };

  // Health dialog functions removed

  // Server health checking removed to reduce console errors

  // Health button color function removed

  const getAppBarColor = () => {
    if (isOpenAIEnabled === null) return "primary"; // Default while checking
    return isOpenAIEnabled ? "primary" : "warning"; // Blue for real API, Orange for mock
  };

  const getAppBarSx = () => {
    // Use existing logic for production mode
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
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' ? '#000000' : '#dcdcdc', // Much dimmer gray for light mode
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
          <AppHeader
            onHelpClick={() => setHelpDialogOpen(true)}
            onAccessibilityClick={() => setAccessibilityPanelOpen(true)}
            onModeToggle={handleModeToggle}
            onModeDoubleClick={handleModeDoubleClick}
            onTokenPurchaseClick={() => setTokenPurchaseDialogOpen(true)}
            sessionStatus={privacyControls.sessionStatus}
            getAppBarSx={getAppBarSx}
          />

          {/* Health dialog removed */}

          {/* Global session timeout warning dialog */}
          <Suspense fallback={null}>
            <SessionTimeoutWarningDialog />
          </Suspense>

          {/* Global Dialogs Component - Consolidated modal management */}
          <Suspense fallback={null}>
            <GlobalDialogs
              // Help dialog
              helpDialogOpen={helpDialogOpen}
              onHelpDialogClose={() => setHelpDialogOpen(false)}
              
              // Privacy policy dialog
              privacyDialogForceShow={privacyPolicyOpen}
              onPrivacyDialogAccepted={() => setPrivacyPolicyOpen(false)}
              
              // Accessibility panel
              accessibilityPanelOpen={accessibilityPanelOpen}
              onAccessibilityPanelClose={() => setAccessibilityPanelOpen(false)}
              
              // Auth manager
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
              
              // Legal dialogs
              termsDialogOpen={termsDialogOpen}
              onTermsDialogClose={() => setTermsDialogOpen(false)}
              dmcaDialogOpen={dmcaDialogOpen}
              onDmcaDialogClose={() => setDmcaDialogOpen(false)}
              disclaimerDialogOpen={disclaimerDialogOpen}
              onDisclaimerDialogClose={() => setDisclaimerDialogOpen(false)}
              privacyFooterDialogOpen={privacyFooterDialogOpen}
              onPrivacyFooterDialogClose={() => setPrivacyFooterDialogOpen(false)}
              
              // Legal acceptance
              forceShowLegalAcceptance={forceShowLegalAcceptance}
              onLegalAcceptanceAccepted={() => setForceShowLegalAcceptance(false)}
            />
          </Suspense>

          {/* User Profile dialog */}
          <Suspense fallback={null}>
            <UserProfileDialog />
          </Suspense>

          {/* Token Purchase dialog */}
          <Suspense fallback={null}>
            <TokenPurchaseDialog 
              open={tokenPurchaseDialogOpen}
              onClose={() => setTokenPurchaseDialogOpen(false)}
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
            <Box sx={{ 
              py: 4, 
              width: "100%",
              backgroundColor: (theme) => 
                theme.palette.mode === 'dark' ? '#0a0a0a' : '#e8e8e8', // Much dimmer for light mode
              borderRadius: 3,
              boxShadow: (theme) => 
                theme.palette.mode === 'dark' 
                  ? '0px 2px 12px rgba(0, 0, 0, 0.8)' 
                  : '0px 2px 12px rgba(0, 0, 0, 0.15)', // Slightly stronger shadow
              px: 3,
              border: (theme) => 
                theme.palette.mode === 'dark' 
                  ? '1px solid #333333' 
                  : '1px solid #d0d0d0', // More visible border
            }}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                align="center"
                sx={{ 
                  color: (theme) => 
                    theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' // Much darker text
                }}
              >
                AI-Powered Meeting Transcription and Summarization
              </Typography>

              {/* Authentication Notice for Production Mode */}
              {appMode === 'production' && !isAuthenticated && !isAuthLoading && (
                <Box sx={{ 
                  mt: 3, 
                  p: 3, 
                  border: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '1px solid #444444' 
                      : '1px solid #c0c0c0', // More visible border
                  borderRadius: 3, 
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '#1a1a1a' 
                      : '#e0e0e0', // Much dimmer background
                  textAlign: 'center',
                  boxShadow: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '0px 2px 8px rgba(0, 0, 0, 0.6)' 
                      : '0px 2px 8px rgba(0, 0, 0, 0.12)',
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

              {/* Loading state for authentication in production mode */}
              {appMode === 'production' && isAuthLoading && (
                <Box sx={{ 
                  mt: 3, 
                  p: 3, 
                  border: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '1px solid #444444' 
                      : '1px solid #c0c0c0',
                  borderRadius: 3, 
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '#1a1a1a' 
                      : '#e0e0e0',
                  textAlign: 'center',
                  boxShadow: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? '0px 2px 8px rgba(0, 0, 0, 0.6)' 
                      : '0px 2px 8px rgba(0, 0, 0, 0.12)',
                }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Checking authentication status...
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Please wait while we verify your session.
                  </Typography>
                </Box>
              )}

            {/* Render different content based on the current route */}
            {location.pathname === '/history' ? (
              <MeetingHistoryPage />
            ) : location.pathname.startsWith('/transcript/') ? (
              <TranscriptPage />
            ) : location.pathname.startsWith('/verify-email') ? (
              <EmailVerificationDialog />
            ) : (
              <Grid
                container
                spacing={4}
                sx={{ mt: 2, width: "100%", minHeight: "200px" }}
              >
                {/* Only show upload section if not in production mode or if authenticated AND not currently loading */}
                {(appMode !== 'production' || (isAuthenticated && !isAuthLoading)) && (
                  <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                    <section aria-labelledby="upload-heading">
                      <Typography variant="h4" component="h3" id="upload-heading" gutterBottom>
                        Upload Audio File
                      </Typography>
                      <FileUpload 
                        onTranscriptionComplete={handleTranscriptionCompleteWrapper}
                        onClearPreviousData={handleClearPreviousData}
                        hasPreviousResults={transcriptionResults.length > 0}
                      />
                    </section>
                  </Grid>
                )}

                {transcriptionResults.length > 0 && (
                  <Grid size={12} sx={{ maxWidth: "100%", minWidth: "100%" }}>
                    <section 
                      aria-labelledby="transcription-heading"
                      id="transcription-results"
                    >
                      <Box sx={{ width: "100%" }}>
                        <Typography variant="h4" component="h3" id="transcription-heading" gutterBottom>
                          Transcription Results
                        </Typography>
                        {transcriptionResults.map((result) => (
                          <TranscriptDisplay
                            key={result.transcriptionId}
                            transcription={result}
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
          
          {/* Footer with legal links and company info */}
          <Box component="footer" sx={{ mt: 4, py: 2, borderTop: 1, borderColor: 'divider' }}>
            {/* First line: Copyright and support contact */}
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
              © 2025 Vertec Solutions LLC | support@meeting-summary.io
            </Typography>
            
            {/* Second line: Legal document links */}
            <Typography variant="body2" color="text.secondary" align="center">
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setTermsDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Terms
              </Link>
              |
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setPrivacyFooterDialogOpen(true)}
                sx={{ mx: 1 }}
              >
                Privacy
              </Link>
              |
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setDmcaDialogOpen(true)}
                sx={{ mx: 1 }}
              >
                DMCA
              </Link>
              |
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setDisclaimerDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                Disclaimer
              </Link>
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
