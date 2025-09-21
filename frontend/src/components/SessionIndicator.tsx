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
import { getContrastRatio, getBestTextColor } from "../theme/colorContrast";
import { useAccessibilityStore } from "../stores/accessibilityStore";

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
  
  const { highContrast } = useAccessibilityStore();

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

    // WCAG AA compliant colors (4.5:1 contrast ratio minimum)
    const statusColors = {
      active: {
        bg: highContrast ? '#1b5e20' : '#2e7d32', // Dark green for better contrast
        text: '#ffffff',
        hover: highContrast ? '#0d4e14' : '#1b5e20',
      },
      warning: {
        bg: highContrast ? '#e65100' : '#ef6c00', // Dark orange for better contrast  
        text: '#ffffff', // White text instead of black for better contrast
        hover: highContrast ? '#bf360c' : '#e65100',
      },
      expired: {
        bg: highContrast ? '#b71c1c' : '#c62828', // Dark red for better contrast
        text: '#ffffff',
        hover: highContrast ? '#8b0000' : '#b71c1c',
      },
      default: {
        bg: highContrast ? '#212121' : '#424242', // Dark gray for better contrast
        text: '#ffffff',
        hover: highContrast ? '#000000' : '#212121',
      },
    };

    const colors = statusColors[status] || statusColors.default;
    
    // Verify contrast ratio meets WCAG AA standards
    const contrastRatio = getContrastRatio(colors.text, colors.bg);
    const textColor = contrastRatio >= 4.5 ? colors.text : getBestTextColor(colors.bg);

    return {
      ...baseStyles,
      backgroundColor: colors.bg,
      color: textColor,
      border: `2px solid ${highContrast ? textColor : 'transparent'}`,
      '&:hover': {
        backgroundColor: colors.hover,
      },
      // Enhanced focus indicator for accessibility
      '&:focus-visible': {
        outline: `3px solid ${textColor}`,
        outlineOffset: '2px',
      },
    };
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
