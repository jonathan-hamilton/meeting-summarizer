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
  RadioButtonUnchecked 
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
}

const getStepIcon = (index: number, step: WorkflowStep) => {
  const iconProps = {
    fontSize: 'small' as const,
    color: (step.status === 'completed' ? 'success' : 
           step.status === 'active' ? 'primary' : 'disabled') as 'success' | 'primary' | 'disabled'
  };

  const isActive = step.status === 'active';
  const isProcessing = index === 1 && isActive; // Fast Transcription step (spinning)
  const isUploading = index === 0 && isActive; // Upload step (pulsing)

  console.log(`🔍 getStepIcon - index: ${index}, step.status: ${step.status}, isActive: ${isActive}, isProcessing: ${isProcessing}, isUploading: ${isUploading}`);

  // For processing step, show CircularProgress instead of static icon
  if (isProcessing) {
    console.log(`🎯 Rendering CircularProgress for Fast Transcription step`);
    console.log(`🎯 Current motion duration:`, getComputedStyle(document.documentElement).getPropertyValue('--motion-duration'));
    return (
      <CircularProgress 
        size={20} 
        color="primary" 
        thickness={4}
        sx={{
          '&.MuiCircularProgress-root': {
            animationDuration: '1.4s !important',
            animationTimingFunction: 'linear !important',
            animationIterationCount: 'infinite !important',
          }
        }}
      />
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
      IconComponent = step.status === 'completed' ? CheckCircle : CloudUpload;
      break;
    case 1: // Processing  
      IconComponent = step.status === 'completed' ? CheckCircle : Psychology;
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
  isComplete = false
}) => {
  // Debug logging
  console.log(`🎯 WorkflowStepper - uploadStatus: ${uploadStatus}, processingStatus: ${processingStatus}, isComplete: ${isComplete}`);

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
      status: uploadStatus === 'error' ? 'pending' : 
              uploadStatus === 'completed' ? 'completed' : 
              uploadStatus === 'uploading' ? 'active' :
              uploadStatus === 'processing' ? 'completed' : 'pending'  // Upload is done when processing starts
    },
    {
      label: 'Transcribing',
      status: processingStatus === 'error' ? 'pending' :
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
              StepIconComponent={() => getStepIcon(index, step)}
              sx={{
                '& .MuiStepLabel-label': {
                  color: step.status === 'completed' ? 'success.main' : 
                         step.status === 'active' ? 'primary.main' : 'text.disabled'
                }
              }}
            >
              <Typography variant="caption" component="span">
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};