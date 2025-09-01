import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface TourPopoverProps {
  /** Whether the popover should be displayed */
  open?: boolean;
  step: number;
  title: string;
  description: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStopTour?: () => void;
  totalSteps?: number;
  position?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  maxWidth?: string | number;
  anchorOrigin?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  /** Custom styling for the popover */
  sx?: object;
}

export const TourPopover: React.FC<TourPopoverProps> = ({
  open = true,
  step,
  title,
  description,
  onClose,
  onNext,
  onPrevious,
  onStopTour,
  totalSteps = 11,
  position = { top: '20px', right: '20px' },
  maxWidth = '300px',
  anchorOrigin = 'top-right',
  sx = {}
}) => {
  if (!open) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        ...position,
        p: 2,
        backgroundColor: 'grey.700',
        color: 'white',
        borderRadius: 2,
        maxWidth,
        zIndex: 9999,
        boxShadow: 3,
        pointerEvents: 'auto',
        textAlign: 'center',
        ...sx, // Apply custom styling last to override defaults
      }}
    >
      {/* Step indicator centered with close button positioned absolutely */}
      <Box sx={{ position: 'relative', mb: 1, textAlign: 'center' }}>
        <Typography variant="body1" color="primary" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
          Step {step}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ 
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            color: 'white', 
            p: 0.5,
            minWidth: '24px',
            minHeight: '24px',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Title */}
      <Typography variant="h6" component="h3" sx={{ mb: 1, fontSize: '1rem' }}>
        {title}
      </Typography>

      {/* Description */}
      <Typography variant="body2" color="white" sx={{ lineHeight: 1.4, mb: 2 }}>
        {description}
      </Typography>

      {/* Navigation buttons at bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 2 }}>
        {/* Previous button - non-functional stub */}
        <Button 
          variant="outlined"
          size="small"
          sx={{ 
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Previous
        </Button>

        {/* Step counter */}
        <Typography variant="caption" sx={{ alignSelf: 'center', color: 'grey.400' }}>
          {step} of {totalSteps}
        </Typography>

        {/* Next button - non-functional stub */}
        <Button 
          variant="outlined"
          size="small"
          sx={{ 
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Next
        </Button>
      </Box>

      {/* Stop Tour button - non-functional stub */}
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Button 
          variant="text"
          size="small"
          sx={{ 
            color: 'grey.400',
            '&:hover': {
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Stop Tour
        </Button>
      </Box>
    </Box>
  );
};

export default TourPopover;
