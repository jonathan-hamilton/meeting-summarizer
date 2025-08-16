/**
 * Session Timeout Warning Dialog (S3.1)
 * Global auto-popup warning that appears when session is about to expire
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Stack,
  Chip,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { useSessionManagement } from "../hooks/useSessionManagement";

interface SessionTimeoutWarningDialogProps {
  /**
   * How often (in minutes) to re-show dismissed warning
   * @default 5
   */
  reappearInterval?: number;
}

/**
 * Global session timeout warning dialog that auto-appears when session is about to expire
 */
export const SessionTimeoutWarningDialog: React.FC<SessionTimeoutWarningDialogProps> = ({
  reappearInterval = 5,
}) => {
  const { privacyControls, extendSessionByMinutes } = useSessionManagement();
  
  const [isOpen, setIsOpen] = useState(false);
  const [lastDismissedTime, setLastDismissedTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  /**
   * Calculate time until session expiry in minutes
   */
  const calculateTimeRemaining = useCallback((): number => {
    const SESSION_TIMEOUT_MINUTES = 120; // Match sessionManager setting (2 hours)
    return Math.max(0, SESSION_TIMEOUT_MINUTES - privacyControls.sessionDuration);
  }, [privacyControls.sessionDuration]);

  // Update session status when privacy controls change
  useEffect(() => {
    calculateTimeRemaining();
  }, [privacyControls, calculateTimeRemaining]);

  /**
   * Update time remaining every minute
   */
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    updateTimer(); // Initial update
    
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  /**
   * Handle showing/hiding dialog based on session status and dismissal state
   */
  useEffect(() => {
    const shouldShowDialog = () => {
      // Only show if session is in warning state
      if (privacyControls.sessionStatus !== 'warning') {
        return false;
      }

      // If never dismissed, show immediately
      if (lastDismissedTime === null) {
        return true;
      }

      // If dismissed, check if enough time has passed to re-show
      const now = Date.now();
      const timeSinceDismissal = (now - lastDismissedTime) / (1000 * 60); // minutes
      
      const shouldShow = timeSinceDismissal >= reappearInterval;
      return shouldShow;
    };

    const dialogShouldShow = shouldShowDialog();
    setIsOpen(dialogShouldShow);
  }, [privacyControls.sessionStatus, lastDismissedTime, reappearInterval, isOpen]);

  /**
   * Handle "Keep working" action - extend session by 5 minutes
   */
  const handleKeepWorking = useCallback(() => {
    // Extend the session by 5 minutes
    extendSessionByMinutes(5); // 5 minutes
    setLastDismissedTime(null); // Clear dismissal timer since session is extended
    setIsOpen(false);
  }, [extendSessionByMinutes]);

  /**
   * Handle "Extend session" action - extend by 2 hours
   */
  const handleExtendSession = useCallback(() => {
    extendSessionByMinutes(120); // Extend by 2 hours (120 minutes)
    setLastDismissedTime(null); // Reset dismissal timer since session is extended
    setIsOpen(false);
  }, [extendSessionByMinutes]);

  /**
   * Format time as HH:MM:SS for testing display
   */
  const formatTimeAsHMS = (minutes: number): string => {
    const totalSeconds = Math.floor(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calculate session expiration time
   */
  const getSessionExpirationTime = (): string => {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + (timeRemaining * 60 * 1000));
    return expirationTime.toLocaleTimeString();
  };

  /**
   * Get urgency level based on time remaining
   */
  const getUrgencyLevel = (minutes: number): 'low' | 'medium' | 'high' => {
    // Adjust thresholds for testing (0.5 minute total session)
    if (minutes <= 0.08) return 'high';  // Last 5 seconds (0.08 minutes)
    if (minutes <= 0.17) return 'medium'; // Last 10 seconds (0.17 minutes)
    return 'low';
  };

  /**
   * Get appropriate color based on urgency
   */
  const getUrgencyColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'warning';
      default: return 'warning';
    }
  };

  const urgencyLevel = getUrgencyLevel(timeRemaining);
  const urgencyColor = getUrgencyColor(urgencyLevel);

  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={urgencyLevel === 'high'} // Prevent accidental dismissal when urgent
      PaperProps={{
        sx: {
          border: urgencyLevel === 'high' ? 2 : 1,
          borderColor: urgencyColor === 'error' ? 'error.main' : 'warning.main',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color={urgencyColor} />
          <Typography variant="h6" component="span">
            Session Expiring Soon
          </Typography>
          <Chip
            label={formatTimeAsHMS(timeRemaining)}
            color={urgencyColor}
            size="small"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Time remaining progress bar */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Session Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTimeAsHMS(timeRemaining)} remaining
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, 100 - (timeRemaining / 0.5) * 100)} // Match 0.5 minute total
              color={urgencyColor}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Warning message */}
          <Alert 
            severity={urgencyColor} 
            icon={<WarningIcon />}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <Typography variant="body1" gutterBottom>
              <strong>Your session will expire soon!</strong>
            </Typography>
            <Typography variant="body2">
              To protect your privacy, all session data (speaker assignments, overrides, and transcript modifications) 
              will be automatically cleared when your session expires.
            </Typography>
          </Alert>

          {/* Session info */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current session: {formatTimeAsHMS(privacyControls.sessionDuration)} active
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Session expires at: {getSessionExpirationTime()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data size: {privacyControls.dataSize}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Stack direction="row" spacing={2} width="100%">
          {/* Keep working button - less prominent */}
          <Button
            variant="outlined"
            onClick={handleKeepWorking}
            startIcon={<PlayArrowIcon />}
            disabled={urgencyLevel === 'high'} // Disable when very urgent
            sx={{ flex: 1 }}
          >
            Keep Working (+5 min)
          </Button>

          {/* Extend session button - more prominent */}
          <Button
            variant="contained"
            onClick={handleExtendSession}
            startIcon={<ScheduleIcon />}
            color={urgencyColor}
            sx={{ flex: 1 }}
          >
            Extend Session (+2 hrs)
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutWarningDialog;
