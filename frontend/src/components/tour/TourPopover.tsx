import React from 'react';
import {
  Popover,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Close,
  ArrowBack,
  ArrowForward,
  SkipNext,
} from '@mui/icons-material';
import { useAppMode } from '../../contexts/AppModeContext';

interface TourPopoverProps {
  stepNumber: number;
  title: string;
  description: string;
  anchorEl: HTMLElement | null;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showControls?: boolean;
  showPrevious?: boolean;
  showNext?: boolean;
  showSkip?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  isVisible?: boolean; // For development - always show when true
}

export const TourPopover: React.FC<TourPopoverProps> = ({
  stepNumber,
  title,
  description,
  anchorEl,
  placement = 'bottom',
  showControls = true,
  showPrevious = false,
  showNext = true,
  showSkip = true,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  isVisible = true, // Default to visible for development
}) => {
  const { mode, isTourActive, tourStep } = useAppMode();
  
  // In development mode, show if isVisible is true
  // In demo mode, show if tour is active and step matches
  const shouldShow = mode === 'demo' 
    ? (isTourActive && tourStep === stepNumber)
    : isVisible; // Always visible in development for positioning

  const open = Boolean(anchorEl) && shouldShow;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      disableRestoreFocus
      sx={{
        zIndex: 1300, // Above Material-UI backdrop
        '& .MuiPopover-paper': {
          maxWidth: 360,
          minWidth: 280,
        },
      }}
      anchorOrigin={{
        vertical: placement === 'top' ? 'top' : placement === 'bottom' ? 'bottom' : 'center',
        horizontal: placement === 'left' ? 'left' : placement === 'right' ? 'right' : 'center',
      }}
      transformOrigin={{
        vertical: placement === 'top' ? 'bottom' : placement === 'bottom' ? 'top' : 'center',
        horizontal: placement === 'left' ? 'right' : placement === 'right' ? 'left' : 'center',
      }}
    >
      <Paper sx={{ 
        p: 2, 
        position: 'relative',
        bgcolor: 'grey.700',
        border: '1px solid',
        borderColor: 'grey.500',
        boxShadow: 3
      }}>
        {/* Close button */}
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Step indicator */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="primary" fontWeight="bold">
            Step {stepNumber}
          </Typography>
        </Box>

        {/* Title */}
        <Typography variant="h6" component="h3" sx={{ mb: 1, pr: 4 }}>
          {title}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="white" sx={{ mb: showControls ? 2 : 0 }}>
          {description}
        </Typography>

        {/* Controls */}
        {showControls && (
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Box>
              {showPrevious && (
                <Button
                  size="small"
                  startIcon={<ArrowBack />}
                  onClick={onPrevious}
                  variant="outlined"
                >
                  Previous
                </Button>
              )}
            </Box>
            
            <Stack direction="row" spacing={1}>
              {showSkip && (
                <Button
                  size="small"
                  startIcon={<SkipNext />}
                  onClick={onSkip}
                  variant="text"
                  color="secondary"
                >
                  Skip Tour
                </Button>
              )}
              
              {showNext && (
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={onNext}
                  variant="contained"
                  color="primary"
                >
                  Next
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {/* Development mode indicator */}
        {mode !== 'demo' && import.meta.env.DEV && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              backgroundColor: 'orange',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            DEV
          </Box>
        )}
      </Paper>
    </Popover>
  );
};
