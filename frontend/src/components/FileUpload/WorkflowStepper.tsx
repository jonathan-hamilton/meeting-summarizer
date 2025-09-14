import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { 
  CheckCircle, 
  Error as ErrorIcon, 
  CloudUpload, 
  Schedule, 
  Psychology 
} from '@mui/icons-material';
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

// Unified workflow step generation
const getUnifiedWorkflowSteps = (
  uploadFile: FileUploadFile, 
  batchJob?: BatchJobStatus
): StepperStep[] => {
  if (batchJob) {
    // Batch job workflow
    return [
      {
        label: "Upload",
        icon: <CloudUpload />,
        completed: true,
        active: false,
        error: false,
      },
      {
        label: "Queued",
        icon: <Schedule />,
        completed: batchJob.status !== 'submitted',
        active: batchJob.status === 'submitted',
        error: batchJob.status === 'failed',
      },
      {
        label: "Processing",
        icon: <Psychology />,
        completed: batchJob.status === 'completed',
        active: batchJob.status === 'processing',
        error: batchJob.status === 'failed',
      },
    ];
  } else {
    // Regular upload workflow
    return [
      {
        label: "Upload",
        icon: <CloudUpload />,
        completed: uploadFile.status === "completed" || uploadFile.progress >= 100,
        active: uploadFile.status === "uploading" && uploadFile.progress < 90,
        error: uploadFile.status === "error",
      },
      {
        label: "Process",
        icon: <Psychology />,
        completed: uploadFile.status === "completed",
        active: uploadFile.status === "uploading" && uploadFile.progress >= 90,
        error: uploadFile.status === "error",
      },
      {
        label: "Complete",
        icon: <CheckCircle />,
        completed: uploadFile.status === "completed",
        active: false,
        error: false,
      },
    ];
  }
};

// Demo workflow steps
const getDemoWorkflowSteps = (isActive: boolean, progress: number): StepperStep[] => {
  return [
    {
      label: "Upload",
      icon: <CloudUpload />,
      completed: progress > 30,
      active: isActive && progress <= 30,
      error: false,
    },
    {
      label: "Process", 
      icon: <Psychology />,
      completed: progress >= 90,
      active: isActive && progress > 30 && progress < 90,
      error: false,
    },
    {
      label: "Complete",
      icon: <CheckCircle />,
      completed: progress >= 100,
      active: isActive && progress >= 90 && progress < 100,
      error: false,
    },
  ];
};

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  uploadFile,
  batchJob,
  isDemo = false,
  simulatedProgress = 0
}) => {
  const getActiveStep = () => {
    if (isDemo) {
      if (simulatedProgress <= 30) return 0;
      if (simulatedProgress < 90) return 1;
      if (simulatedProgress < 100) return 2;
      return 3;
    }

    if (batchJob) {
      switch (batchJob.status) {
        case 'submitted': return 1;
        case 'processing': return 2;
        case 'completed': return 3;
        case 'failed': return 1;
        default: return 0;
      }
    } else {
      switch (uploadFile.status) {
        case "pending": return 0;
        case "uploading": return uploadFile.progress > 90 ? 2 : 1;
        case "completed": return 3;
        case "error": return 1;
        default: return 0;
      }
    }
  };

  const steps = isDemo 
    ? getDemoWorkflowSteps(true, simulatedProgress)
    : getUnifiedWorkflowSteps(uploadFile, batchJob);

  return (
    <Box sx={{ mt: 2 }}>
      <Stepper
        activeStep={getActiveStep()}
        orientation="horizontal"
        sx={{
          "& .MuiStepConnector-root": {
            top: 10,
            left: "calc(-50% + 10px)",
            right: "calc(50% + 10px)",
          },
          "& .MuiStepLabel-root": {
            flexDirection: "column",
            "& .MuiStepLabel-label": {
              fontSize: "0.75rem",
              marginTop: "4px",
            },
          },
        }}
      >
        {steps.map((step, index) => (
          <Step
            key={`step-${index}`}
            completed={step.completed}
            disabled={uploadFile.status === "error" && !step.error}
          >
            <StepLabel
              error={step.error}
              icon={
                step.active ? (
                  <CircularProgress size={20} />
                ) : step.error ? (
                  <ErrorIcon color="error" />
                ) : step.completed ? (
                  <CheckCircle color="success" />
                ) : (
                  step.icon
                )
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};