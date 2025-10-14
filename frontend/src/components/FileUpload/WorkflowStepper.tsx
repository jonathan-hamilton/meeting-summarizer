import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { 
  CloudUpload, 
  Psychology, 
  CheckCircle,
  RadioButtonUnchecked,
  Error as ErrorIcon
} from '@mui/icons-material';
import type { WorkflowStep } from './types';

// CSS styles for animations
const animationStyles = `
  @keyframes workflowPulse {
    0% { 
      transform: scale(1); 
      opacity: 1; 
    }
    50% { 
      transform: scale(1.2); 
      opacity: 0.6; 
    }
    100% { 
      transform: scale(1); 
      opacity: 1; 
    }
  }
  
  .workflow-pulse {
    animation: workflowPulse 1s ease-in-out infinite;
    display: inline-flex;
  }
`;

interface WorkflowStepperProps {
  uploadStatus?: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  processingStatus?: 'pending' | 'processing' | 'completed' | 'error';
  isComplete?: boolean;
  progressPercentage?: number; // Add progress percentage support
}

const getStepIcon = (index: number, step: WorkflowStep, progressPercentage?: number) => {
  const iconProps = {
    fontSize: 'small' as const,
    color: (step.status === 'completed' ? 'success' : 
           step.status === 'active' ? 'primary' : 'disabled') as 'success' | 'primary' | 'disabled'
  };

  const isActive = step.status === 'active';
  const isProcessing = index === 1 && isActive; // Fast Transcription step (spinning)
  const isUploading = index === 0 && isActive; // Upload step (pulsing)

  // For processing step, show spinner with percentage if available
  if (isProcessing) {
    // Show determinate progress if we have a valid percentage, otherwise indeterminate
    const hasValidProgress = progressPercentage && progressPercentage > 0;
    
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          variant={hasValidProgress ? "determinate" : "indeterminate"}
          value={hasValidProgress ? progressPercentage : undefined}
          size={24} 
          color="primary" 
          thickness={4}
          sx={{
            '&.MuiCircularProgress-root': hasValidProgress ? {} : {
              animationDuration: '1.4s !important',
              animationTimingFunction: 'linear !important',
              animationIterationCount: 'infinite !important',
            }
          }}
        />
        {/* Show percentage text inside spinner for higher percentages */}
        {hasValidProgress && progressPercentage >= 20 && (
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography 
              variant="caption" 
              component="div" 
              sx={{ 
                fontSize: '0.6rem', 
                fontWeight: 'bold',
                color: 'primary.main'
              }}
            >
              {Math.round(progressPercentage)}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // For uploading step, show pulsing icon using inline animation
  if (isUploading) {
    const [scale, setScale] = React.useState(1);
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setScale(s => s === 1 ? 1.2 : 1);
      }, 600);
      return () => clearInterval(interval);
    }, []);

    return (
      <Box sx={{ 
        display: 'inline-flex',
        transform: `scale(${scale})`,
        transition: 'transform 0.3s ease-in-out',
      }}>
        <CloudUpload {...iconProps} />
      </Box>
    );
  }

  // Static icons for other states
  let IconComponent;
  switch (index) {
    case 0: // Upload
      IconComponent = step.status === 'error' ? ErrorIcon :
                     step.status === 'completed' ? CheckCircle : CloudUpload;
      break;
    case 1: // Processing  
      IconComponent = step.status === 'error' ? ErrorIcon :
                     step.status === 'completed' ? CheckCircle : Psychology;
      break;
    case 2: // Complete
      IconComponent = step.status === 'completed' ? CheckCircle : RadioButtonUnchecked;
      break;
    default:
      IconComponent = RadioButtonUnchecked;
  }

  return <IconComponent {...iconProps} />;
};

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  uploadStatus = 'pending',
  processingStatus = 'pending', 
  isComplete = false,
  progressPercentage
}) => {
  // Debug logging
  console.log(`🎯 WorkflowStepper RENDER - uploadStatus: ${uploadStatus}, processingStatus: ${processingStatus}, isComplete: ${isComplete}, progressPercentage: ${progressPercentage}`);
  
  // Log whenever progressPercentage changes
  React.useEffect(() => {
    if (progressPercentage !== undefined) {
      console.log(`📊 WorkflowStepper: Progress percentage changed to ${progressPercentage}%`);
    }
  }, [progressPercentage]);

  // Inject CSS animations if not already present
  React.useEffect(() => {
    const styleId = 'workflow-stepper-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = animationStyles;
      document.head.appendChild(style);
    }
  }, []);

  // Determine step statuses based on props
  const steps: WorkflowStep[] = [
    {
      label: 'Upload',
      status: uploadStatus === 'error' ? 'error' : 
              uploadStatus === 'completed' ? 'completed' : 
              uploadStatus === 'uploading' ? 'active' :
              uploadStatus === 'processing' ? 'completed' : 'pending'  // Upload is done when processing starts
    },
    {
      label: 'Transcribing',
      status: processingStatus === 'error' ? 'error' :
              processingStatus === 'completed' ? 'completed' :
              processingStatus === 'processing' ? 'active' :
              uploadStatus === 'processing' ? 'active' : // Transcribing active when upload is processing  
              uploadStatus === 'completed' && processingStatus === 'pending' ? 'active' : 'pending'
    },
    {
      label: 'Complete',
      status: isComplete ? 'completed' : 'pending'
    }
  ];

  // Debug step statuses
  console.log(`📋 Step statuses:`, steps.map(s => `${s.label}: ${s.status}`));

  const activeStep = steps.findIndex(step => step.status === 'active');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  
  // If everything is complete, show the last step as active (completed)
  const displayActiveStep = isComplete ? steps.length : 
                           activeStep !== -1 ? activeStep : completedSteps;

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Stepper 
        activeStep={displayActiveStep} 
        alternativeLabel
        sx={{ 
          '& .MuiStepLabel-root': {
            padding: '0 8px',
          },
          '& .MuiStepLabel-label': {
            fontSize: '0.75rem',
            marginTop: '4px'
          }
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.label} completed={step.status === 'completed'}>
            <StepLabel 
              StepIconComponent={() => getStepIcon(index, step, progressPercentage)}
              sx={{
                '& .MuiStepLabel-label': {
                  color: step.status === 'error' ? 'error.main' :
                         step.status === 'completed' ? 'success.main' : 
                         step.status === 'active' ? 'primary.main' : 'text.disabled'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="caption" component="span">
                  {step.label}
                </Typography>
                {/* Show progress percentage below "Transcribing" text when active and available */}
                {index === 1 && step.status === 'active' && progressPercentage && progressPercentage > 0 && (
                  <Typography 
                    variant="caption" 
                    component="div" 
                    sx={{ 
                      fontSize: '0.6rem', 
                      color: 'primary.main',
                      fontWeight: 'bold',
                      marginTop: '2px'
                    }}
                  >
                    {Math.round(progressPercentage)}% complete
                  </Typography>
                )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};