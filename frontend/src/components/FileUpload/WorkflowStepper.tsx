import React, { useEffect, useState, useCallback } from 'react';
import { Box, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, AudioFile, Upload, Psychology } from '@mui/icons-material';
import type { FileUploadFile, BatchJobStatus } from './types';

interface WorkflowStepperProps {
  uploadFile: FileUploadFile;
  batchJob?: BatchJobStatus;
}

interface StepperStep {
  label: string;
  icon: React.ReactElement;
  completed: boolean;
  active: boolean;
  error: boolean;
}

// Smooth progress transition hook
const useSmoothProgress = (targetProgress: number, shouldAnimate: boolean = true) => {
  const [displayProgress, setDisplayProgress] = useState(targetProgress);
  
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayProgress(targetProgress);
      return;
    }
    
    // Smooth progress animation to prevent jarring jumps
    const difference = Math.abs(targetProgress - displayProgress);
    if (difference <= 1) {
      setDisplayProgress(targetProgress);
      return;
    }
    
    const animationFrame = requestAnimationFrame(() => {
      const increment = difference > 10 ? 2 : 1;
      setDisplayProgress(prev => {
        if (targetProgress > prev) {
          return Math.min(prev + increment, targetProgress);
        } else {
          return Math.max(prev - increment, targetProgress);
        }
      });
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [targetProgress, displayProgress, shouldAnimate]);
  
  return displayProgress;
};

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  uploadFile,
  batchJob,
}) => {
  const [realTimeProgress, setRealTimeProgress] = useState<{
    status?: string;
    progressPercentage?: number;
    jobId?: string;
  }>({});

  // Smooth progress animation to prevent UI jank
  const currentProgress = batchJob?.progressPercentage || realTimeProgress.progressPercentage || 0;
  const smoothProgress = useSmoothProgress(currentProgress, true);

  // Debounced update handler to prevent excessive re-renders during rapid updates
  const debouncedProgressUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (update: typeof realTimeProgress) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setRealTimeProgress(update);
        }, 50); // 50ms debounce for smooth animations
      };
    })(),
    []
  );

  useEffect(() => {
    const handleBatchJobProgress = (event: CustomEvent) => {
      const update = event.detail;
      if (batchJob && update.jobId === batchJob.jobId) {
        debouncedProgressUpdate({
          status: update.status,
          progressPercentage: update.progressPercentage,
          jobId: update.jobId
        });
      }
    };

    const handleMeetingProgress = (event: CustomEvent) => {
      const update = event.detail;
      if (update.batchJobId && batchJob && update.batchJobId === batchJob.jobId) {
        debouncedProgressUpdate({
          status: update.status,
          progressPercentage: update.progressPercentage,
          jobId: update.batchJobId
        });
      }
    };

    window.addEventListener('batchJobProgress', handleBatchJobProgress as EventListener);
    window.addEventListener('meetingProgress', handleMeetingProgress as EventListener);

    return () => {
      window.removeEventListener('batchJobProgress', handleBatchJobProgress as EventListener);
      window.removeEventListener('meetingProgress', handleMeetingProgress as EventListener);
    };
  }, [batchJob?.jobId, debouncedProgressUpdate]);

  const getUnifiedWorkflowSteps = (): StepperStep[] => {
    if (batchJob) {
      const currentStatus = realTimeProgress.status || batchJob.status;
      // Use smooth progress to prevent jarring animation jumps
      const currentProgress = smoothProgress;
      
      return [
        { label: "File Selected", icon: <AudioFile />, completed: true, active: false, error: false },
        { label: "Uploading", icon: <Upload />, completed: true, active: false, error: false },
        { 
          label: currentProgress > 0 ? `Processing (${currentProgress}%)` : "Processing & Transcription",
          icon: <Psychology />,
          completed: currentStatus === 'completed',
          active: currentStatus === 'submitted' || currentStatus === 'processing',
          error: currentStatus === 'failed'
        },
        { label: "Complete", icon: <CheckCircle />, completed: currentStatus === 'completed', active: false, error: currentStatus === 'failed' }
      ];
    } else {
      const steps = [
        { label: "File Selected", icon: <AudioFile />, completed: true, active: false, error: false },
        { 
          label: "Uploading", 
          icon: <Upload />, 
          completed: uploadFile.status === "completed" || (uploadFile.status === "uploading" && uploadFile.progress > 90),
          active: uploadFile.status === "uploading" && uploadFile.progress <= 90,
          error: uploadFile.status === "error"
        },
        { 
          label: "Processing & Transcription", 
          icon: <Psychology />, 
          completed: uploadFile.status === "completed",
          active: uploadFile.status === "uploading" && uploadFile.progress > 90,
          error: uploadFile.status === "error"
        },
        { label: "Complete", icon: <CheckCircle />, completed: uploadFile.status === "completed", active: false, error: uploadFile.status === "error" }
      ];
      return steps;
    }
  };

  const getActiveStep = (): number => {
    const steps = getUnifiedWorkflowSteps();
    
    // First, check for any active steps
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].active) {
        return i;
      }
    }
    
    // If no active steps, check if all steps are completed
    const allCompleted = steps.every(step => step.completed);
    if (allCompleted) {
      return steps.length; // This tells Material-UI that no step is currently active
    }
    
    // If no active steps and not all completed, find the last completed step
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].completed) {
        return i;
      }
    }
    
    return 0;
  };

  const steps = getUnifiedWorkflowSteps();

  return (
    <Box sx={{ mt: 2 }}>
      <Stepper
        activeStep={getActiveStep()}
        orientation="horizontal"
        sx={{
          "& .MuiStepConnector-root": { top: 10, left: "calc(-50% + 10px)", right: "calc(50% + 10px)" },
          "& .MuiStepLabel-root": { flexDirection: "column", "& .MuiStepLabel-label": { fontSize: "0.75rem", marginTop: "4px" } }
        }}
      >
        {steps.map((step, index) => (
          <Step key={`step-${index}`} completed={step.completed} disabled={uploadFile.status === "error" && !step.error}>
            <StepLabel
              error={step.error}
              icon={step.active ? <CircularProgress size={20} /> : step.error ? <ErrorIcon color="error" /> : step.completed ? <CheckCircle color="success" /> : step.icon}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {realTimeProgress.jobId && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
             Real-time updates enabled
          </Box>
        </Box>
      )}
    </Box>
  );
};
