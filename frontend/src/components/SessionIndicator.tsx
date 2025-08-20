/**
 * Session Indicator Component (S3.5)
 * Shows current session status with privacy-focused dialog
 */

import React from "react";
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { useSessionStore } from "../stores/sessionStore";

interface SessionIndicatorProps {
  /**
   * Current session status
   */
  status: 'active' | 'warning' | 'expired';
}

/**
 * Session indicator showing current privacy status
 */
export const SessionIndicator: React.FC<SessionIndicatorProps> = ({ 
  status
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [, forceUpdate] = React.useState(0);
  
  const { 
    totalTranscriptFileSize, 
    overrideCount,
    getSessionDurationMinutes 
  } = useSessionStore();

  // Update every minute to refresh session duration
  React.useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  /**
   * Format file size in bytes to human readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  
  const getChipSx = () => {
    const baseStyles = {
      mr: 1,
      fontWeight: 'bold',
      cursor: 'pointer',
      '& .MuiChip-icon': {
        fontSize: '0.75rem',
      },
    };

    switch (status) {
      case 'active':
        return {
          ...baseStyles,
          backgroundColor: '#4caf50', // Green background
          color: '#ffffff', // White text
          border: '2px solid #ffffff', // White border for contrast
          '&:hover': {
            backgroundColor: '#45a049',
          },
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#ff9800', // Orange background
          color: '#000000', // Black text for better contrast
          border: '2px solid #000000', // Black border
          '&:hover': {
            backgroundColor: '#f57c00',
          },
        };
      case 'expired':
        return {
          ...baseStyles,
          backgroundColor: '#f44336', // Red background
          color: '#ffffff', // White text
          border: '2px solid #ffffff', // White border
          '&:hover': {
            backgroundColor: '#d32f2f',
          },
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: '#9e9e9e', // Gray background
          color: '#ffffff', // White text
          border: '2px solid #ffffff', // White border
        };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Session Active';
      case 'warning': return 'Session Expiring';
      case 'expired': return 'Session Expired';
      default: return 'Session Unknown';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'warning': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <Chip
        icon={<SecurityIcon />}
        label={getStatusText()}
        size="small"
        sx={getChipSx()}
        onClick={() => setDialogOpen(true)}
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
              sx={{
                ...getChipSx(),
                cursor: 'default', // Not clickable in dialog
              }}
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3}>
            {/* Session Information */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" />
                Session Duration: {formatDuration(getSessionDurationMinutes())}
              </Typography>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon fontSize="small" />
                Transcript file size: {formatFileSize(totalTranscriptFileSize)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🧩 Overrides: {overrideCount}
              </Typography>
            </Box>

            {/* Privacy Information */}
            <Alert severity="info" icon={false}>
              Your data is stored temporarily in your browser session and will be
              automatically cleared when you close this tab or after 2 hours of inactivity.
            </Alert>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
