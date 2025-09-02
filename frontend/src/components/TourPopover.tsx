import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTourStore } from '../stores/tourStore';

interface TourPopoverProps {
  /** Whether the popover should be displayed */
  open?: boolean;
  step: number;
  title?: string;
  description?: string;
  onClose: () => void;
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
  totalSteps = 15,
  position = { top: '20px', right: '20px' },
  maxWidth = '300px',
  anchorOrigin = 'top-right',
  sx = {}
}) => {
  const { nextStep, previousStep, getCurrentStepConfig, canGoToNextStep } = useTourStore();
  
  if (!open) return null;
  
  // Get step configuration from store
  const stepConfig = getCurrentStepConfig();
  const displayTitle = title || stepConfig?.title || `Step ${step}`;
  const displayDescription = description || stepConfig?.description || '';
  
  // Adjust position for step 1 - move down 40px total
  const adjustedPosition = step === 1 
    ? { ...position, top: typeof position.top === 'string' 
        ? `calc(${position.top} + 40px)` 
        : (typeof position.top === 'number' ? position.top + 40 : 60) }
    : position;
  return (
    <Box
      sx={{
        position: 'absolute',
        ...adjustedPosition,
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
        {displayTitle}
      </Typography>

      {/* Description */}
      <Typography variant="body2" color="white" sx={{ lineHeight: 1.4, mb: 2 }}>
        {displayDescription}
      </Typography>

      {/* Navigation buttons - conditional display based on step */}
      <Box sx={{ display: 'flex', justifyContent: step === 1 ? 'flex-end' : 'space-between', gap: 1, mt: 2 }}>
        {/* Previous button - only show for step 2+ */}
        {step > 1 && (
          <Button 
            variant="outlined"
            size="small"
            onClick={previousStep}
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
        )}

        {/* Next button - enabled based on progression logic */}
        {(step !== 1 || canGoToNextStep()) && (
          <Button 
            variant="outlined"
            size="small"
            disabled={!canGoToNextStep()}
            onClick={canGoToNextStep() ? nextStep : undefined}
            sx={{ 
              color: canGoToNextStep() ? 'white' : 'grey.500',
              borderColor: canGoToNextStep() ? 'white' : 'grey.500',
              '&:hover': canGoToNextStep() ? {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              } : {},
              '&:disabled': {
                color: 'grey.500',
                borderColor: 'grey.500'
              }
            }}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Step counter */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'grey.400' }}>
          {step} of {totalSteps}
        </Typography>
      </Box>
    </Box>
  );
};

export default TourPopover;
