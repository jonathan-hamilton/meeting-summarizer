/**
 * Session Status Component (S3.1)
 * Displays session information, privacy controls, and data management options
 */

import React from "react";
import {
  Box,
  Card,
  CardContent,
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
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useSessionManagement } from "../hooks/useSessionManagement";

interface SessionStatusProps {
  compact?: boolean;
  showControls?: boolean;
}

/**
 * Component to display session status and privacy controls
 */
export const SessionStatus: React.FC<SessionStatusProps> = ({
  compact = false,
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
   * Calculate session progress (for warning state)
   */
  const getSessionProgress = (): number => {
    const maxDuration = 120; // 2 hours in minutes
    return Math.min((sessionStatus.sessionDuration / maxDuration) * 100, 100);
  };

  /**
   * Handle clear all data with confirmation
   */
  const handleClearData = async () => {
    setClearDialogOpen(false);
    await clearAllData();
  };

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          icon={<SecurityIcon />}
          label={getStatusLabel()}
          color={getStatusColor()}
          size="small"
          variant="outlined"
        />
        <Tooltip
          title={`${sessionStatus.overrideCount} override(s), ${sessionStatus.dataSize}`}
        >
          <Chip
            icon={<StorageIcon />}
            label={`${sessionStatus.overrideCount}`}
            size="small"
            variant="outlined"
          />
        </Tooltip>
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
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

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => {}}>
              {error}
            </Alert>
          )}

          {/* Session Information */}
          <Stack spacing={1}>
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
                <Typography variant="body2" color="warning.main">
                  Session expiring soon
                </Typography>
                <WarningIcon color="warning" fontSize="small" />
              </Box>
              <LinearProgress
                variant="determinate"
                value={getSessionProgress()}
                color="warning"
              />
            </Box>
          )}

          {/* Privacy Information */}
          <Alert severity="info" icon={<InfoIcon />}>
            Your data is stored temporarily in your browser session and will be
            automatically cleared when you close this tab or after 2 hours of
            inactivity.
          </Alert>

          {/* Controls */}
          {showControls && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {privacyControls.sessionStatus === "warning" && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={extendSession}
                  disabled={isLoading}
                >
                  Extend Session
                </Button>
              )}

              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={() => setClearDialogOpen(true)}
                disabled={isLoading || sessionStatus.overrideCount === 0}
              >
                Clear All Data
              </Button>
            </Stack>
          )}

          {/* Loading Indicator */}
          {isLoading && <LinearProgress />}
        </Stack>
      </CardContent>

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
    </Card>
  );
};

export default SessionStatus;
