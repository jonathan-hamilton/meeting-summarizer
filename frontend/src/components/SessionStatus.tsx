/**
 * Session Status Component (S3.1)
 * Displays session information, privacy controls, and data management options
 */

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Alert,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Clear as ClearIcon,
  Extension as ExtensionIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useSessionManagement } from "../hooks/useSessionManagement";

interface SessionStatusProps {
  showControls?: boolean;
}

/**
 * Component to display session status and privacy controls
 */
export const SessionStatus: React.FC<SessionStatusProps> = ({
  showControls = true,
}) => {
  const {
    sessionStatus,
    privacyControls,
    isLoading,
    error,
    clearAllData,
    extendSession,
  } = useSessionManagement();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

  /**
   * Get status color based on session state
   */
  const getStatusColor = () => {
    switch (privacyControls.sessionStatus) {
      case "active":
        return "success";
      case "warning":
        return "warning";
      case "expired":
        return "error";
      default:
        return "default";
    }
  };

  /**
   * Get status label based on session state
   */
  const getStatusLabel = () => {
    switch (privacyControls.sessionStatus) {
      case "active":
        return "Active";
      case "warning":
        return "Expiring Soon";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

  /**
   * Format session duration for display
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  /**
   * Calculate time until session expiry
   */
  const getTimeUntilExpiry = (): number => {
    const SESSION_TIMEOUT_MINUTES = 120;
    return Math.max(0, SESSION_TIMEOUT_MINUTES - privacyControls.sessionDuration);
  };

  /**
   * Handle clear all data with confirmation
   */
  const handleClearData = async () => {
    try {
      await clearAllData();
      setClearDialogOpen(false);
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to clear session data:", err);
    }
  };

  /**
   * Handle extend session
   */
  const handleExtendSession = async () => {
    try {
      await extendSession();
    } catch (err) {
      console.error("Failed to extend session:", err);
    }
  };

  return (
    <>
      {/* Session Status Button */}
      <Chip
        icon={<SecurityIcon />}
        label={`Session: ${getStatusLabel()}`}
        size="small"
        color={getStatusColor()}
        variant="outlined"
        onClick={() => setDialogOpen(true)}
        sx={{ cursor: 'pointer' }}
      />

      {/* Session Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" component="h3">
              Session Privacy Controls
            </Typography>
            <Chip
              icon={<SecurityIcon />}
              label={getStatusLabel()}
              color={getStatusColor()}
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3}>
            {/* Error Display */}
            {error && (
              <Alert severity="error" onClose={() => {}}>
                {error}
              </Alert>
            )}

            {/* Session Information */}
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color="action" />
                <Typography variant="body2">
                  Session Duration:{" "}
                  {formatDuration(sessionStatus.sessionDuration)}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <StorageIcon color="action" />
                <Typography variant="body2">
                  Data Size: {sessionStatus.dataSize}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <ExtensionIcon color="action" />
                <Typography variant="body2">
                  Overrides: {sessionStatus.overrideCount}
                </Typography>
              </Box>
            </Stack>

            {/* Session Progress Bar (for warning state) */}
            {privacyControls.sessionStatus === "warning" && (
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="caption">Session Expiring</Typography>
                  <Typography variant="caption">
                    {formatDuration(getTimeUntilExpiry())} remaining
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    ((120 - getTimeUntilExpiry()) / 120) * 100
                  }
                  color="warning"
                />
              </Box>
            )}

            {/* Privacy Notice */}
            <Alert severity="info" icon={<InfoIcon />}>
              Your data is stored temporarily in your browser session and will be
              automatically cleared when you close this tab or after 2 hours of
              inactivity.
            </Alert>

            {/* Control Buttons */}
            {showControls && (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                {privacyControls.sessionStatus === "warning" && (
                  <Tooltip title="Extend session by 2 hours">
                    <Button
                      variant="outlined"
                      onClick={handleExtendSession}
                      disabled={isLoading}
                      startIcon={<ScheduleIcon />}
                    >
                      Extend Session
                    </Button>
                  </Tooltip>
                )}
                
                <Tooltip title="Clear all session data immediately">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setClearDialogOpen(true)}
                    disabled={isLoading}
                    startIcon={<ClearIcon />}
                  >
                    Clear All Data
                  </Button>
                </Tooltip>
              </Stack>
            )}

            {/* Loading indicator */}
            {isLoading && <LinearProgress />}
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear All Session Data?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently remove all your session overrides and reset
            the interface. This action cannot be undone.
          </Typography>
          <Box mt={2}>
            <Alert severity="warning">
              <strong>{sessionStatus.overrideCount} override(s)</strong> will be
              lost.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleClearData}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionStatus;
