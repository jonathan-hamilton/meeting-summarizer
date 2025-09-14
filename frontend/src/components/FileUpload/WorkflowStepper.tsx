import React, { useEffect, useState } from 'react';
import { Box, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, AudioFile, Upload, Psychology } from '@mui/icons-material';
import type { FileUploadFile, BatchJobStatus } from './types';

interface WorkflowStepperProps {
  uploadFile: FileUploadFile;
  batchJob?: BatchJobStatus;
  isDemo?: boolean;
  simulatedProgress?: number;
}

interface StepperStep {
  label: string;
  icon: React.ReactElement;
  completed: boolean;
  active: boolean;
  error: boolean;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  uploadFile,
  batchJob,
  isDemo = false,
  simulatedProgress = 0,
}) => {
  const [realTimeProgress, setRealTimeProgress] = useState<{
    status?: string;
    progressPercentage?: number;
    jobId?: string;
  }>({});

  useEffect(() => {
    const handleBatchJobProgress = (event: CustomEvent) => {
      const update = event.detail;
      if (batchJob && update.jobId === batchJob.jobId) {
        setRealTimeProgress({
          status: update.status,
          progressPercentage: update.progressPercentage,
          jobId: update.jobId
        });
      }
    };

    const handleMeetingProgress = (event: CustomEvent) => {
      const update = event.detail;
      if (update.batchJobId && batchJob && update.batchJobId === batchJob.jobId) {
        setRealTimeProgress({
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
  }, [batchJob?.jobId]);

  const getUnifiedWorkflowSteps = (): StepperStep[] => {
    if (batchJob) {
      const currentStatus = realTimeProgress.status || batchJob.status;
      const currentProgress = realTimeProgress.progressPercentage ?? batchJob.progressPercentage;
      
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
      return [
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
    }
  };

  const getDemoWorkflowSteps = (): StepperStep[] => {
    const isSimulating = isDemo && simulatedProgress < 100;
    
    return [
      { label: "File Selected", icon: <AudioFile />, completed: true, active: false, error: false },
      { label: "Uploading", icon: <Upload />, completed: !isSimulating || simulatedProgress === 100, active: isSimulating && simulatedProgress <= 90, error: false },
      { label: "Processing & Transcription", icon: <Psychology />, completed: !isSimulating && simulatedProgress === 100, active: isSimulating && simulatedProgress > 90, error: false },
      { label: "Complete", icon: <CheckCircle />, completed: !isSimulating && simulatedProgress === 100, active: false, error: false }
    ];
  };

  const getActiveStep = (): number => {
    const steps = isDemo ? getDemoWorkflowSteps() : getUnifiedWorkflowSteps();
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].active) return i;
    }
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].completed) return i;
    }
    return 0;
  };

  const steps = isDemo ? getDemoWorkflowSteps() : getUnifiedWorkflowSteps();

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
