import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload,
  AudioFile,
  CheckCircle,
  Error as ErrorIcon,
  Upload,
  Psychology,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import { useAppMode } from "../contexts/AppModeContext";
import { useTourStore } from "../stores/tourStore";
import { TourPopover } from "./TourPopover";
import InsufficientTokensDialog from "./InsufficientTokensDialog";
import { createApiService } from "../services/apiServiceFactory";
import { useEnhancedSessionStore } from "../stores/enhancedSessionStore";
import { useBatchJobPollingStore } from "../hooks/useBatchJobPollingStore";
import type { TranscriptionResponse } from "../types";
import type { BatchJobStatus } from "../types/batchJob";

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
  maxFileSize?: number; // in bytes, default 1GB
  acceptedFileTypes?: string[];
  isAuthDialogOpen?: boolean; // Hide tour when auth dialogs are open
}

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  result?: TranscriptionResponse;
  error?: string;
}

interface TokenError {
  required: number;
  available: number;
  estimatedDuration: number;
  fileName: string;
}

// Unified workflow steps for both regular and batch transcription
const getUnifiedWorkflowSteps = (uploadFile: UploadFile, batchJob?: BatchJobStatus) => {
  // For batch jobs (5+ minutes)
  if (batchJob) {
    return [
      {
        label: "File Uploaded",
        icon: <AudioFile />,
        completed: true,
        active: false,
        error: false,
      },
      {
        label: "Job Submitted",
        icon: <Upload />,
        completed: batchJob.status !== "submitted",
        active: batchJob.status === "submitted",
        error: batchJob.status === "failed",
      },
      {
        label: `Azure Processing (${batchJob.progressPercentage}%)`,
        icon: <Psychology />,
        completed: batchJob.status === "completed",
        active: batchJob.status === "processing",
        error: batchJob.status === "failed",
        progress: batchJob.progressPercentage,
      },
      {
        label: "Complete",
        icon: <CheckCircle />,
        completed: batchJob.status === "completed",
        active: false,
        error: batchJob.status === "failed",
      },
    ];
  }
  
  // For regular jobs (< 5 minutes) - existing logic
  return [
    {
      label: "File Selected",
      icon: <AudioFile />,
      completed: true,
      active: false,
      error: false,
    },
    {
      label: "Uploading",
      icon: <Upload />,
      completed: uploadFile.status === "completed" || (uploadFile.status === "uploading" && uploadFile.progress > 90),
      active: uploadFile.status === "uploading" && uploadFile.progress <= 90,
      error: uploadFile.status === "error",
    },
    {
      label: "Processing & Transcription",
      icon: <Psychology />,
      completed: uploadFile.status === "completed",
      active: uploadFile.status === "uploading" && uploadFile.progress > 90,
      error: uploadFile.status === "error",
    },
    {
      label: "Complete",
      icon: <CheckCircle />,
      completed: uploadFile.status === "completed",
      active: false,
      error: uploadFile.status === "error",
    },
  ];
};

// Demo workflow steps for the simulated transcription process
const getDemoWorkflowSteps = (isSimulating: boolean, progress: number) => [
  {
    label: "File Selected",
    icon: <AudioFile />,
    completed: true,
    active: false,
  },
  {
    label: "Uploading",
    icon: <Upload />,
    completed: !isSimulating || progress === 100,
    active: isSimulating && progress <= 90,
    error: false,
  },
  {
    label: "Processing & Transcription",
    icon: <Psychology />,
    completed: !isSimulating && progress === 100,
    active: isSimulating && progress > 90,
    error: false,
  },
  {
    label: "Complete",
    icon: <RadioButtonUnchecked />,
    completed: !isSimulating && progress === 100,
    active: false,
    error: false,
  },
];

const FileUpload: React.FC<FileUploadProps> = ({
  onTranscriptionComplete,
  maxFileSize = 1024 * 1024 * 1024, // 1GB
  acceptedFileTypes = [".mp3", ".wav", ".m4a", ".flac", ".ogg"],
  isAuthDialogOpen = false,
}) => {
  const { mode, isDemo } = useAppMode();
  const { isActive: isTourActive, closeStep, triggerStepAction, isCurrentStep } = useTourStore();
  const { 
    startDemoUpload,
    demo: {
      isSimulatingUpload,
      simulatedProgress,
      selectedFileName: demoFileName,
      mockTranscripts
    }
  } = useEnhancedSessionStore();
  const apiService = createApiService(mode);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const demoCallbackCalledRef = useRef(false);

  // Batch job state and polling (using Zustand store)
  const { 
    currentJob: batchJob, 
    isPolling, 
    pollingError: batchError, 
    startPolling, 
    stopPolling,
    clearBatchJob
  } = useBatchJobPollingStore({
    onJobCompleted: async (jobId) => {
      console.log(`🎉 BATCH JOB COMPLETED: ${jobId}`);
      // This will be handled by the existing useEffect that watches batchJob.status
    },
    onJobFailed: (jobId, error) => {
      console.error(`❌ BATCH JOB FAILED: ${jobId}`, error);
    }
  });

  // Check if there's a completed file to disable upload
  const hasCompletedFile = uploadFiles.some(file => file.status === "completed");



  // Handle batch job completion - fetch transcript content when job completes
  useEffect(() => {
    if (batchJob && batchJob.status === 'completed') {
      // Job completed - now fetch the transcript content via separate endpoint
      const fetchTranscript = async () => {
        try {
          const transcriptResponse = await apiService.getBatchJobTranscript(batchJob.jobId);
          
          if (transcriptResponse.success && transcriptResponse.data) {
            const transcriptResult = transcriptResponse.data;
            
            // Transform transcript result to TranscriptionResponse format
            const transformedResult: TranscriptionResponse = {
              transcriptionId: batchJob.jobId,
              fileName: batchJob.fileName,
              fileSize: 0, // Not available in batch job response
              status: "Completed",
              transcribedText: transcriptResult.text,
              speakerSegments: transcriptResult.segments?.map((segment) => ({
                start: segment.start,
                end: segment.end,
                text: segment.text,
                speaker: segment.speaker,
                confidence: segment.confidence
              })) || [],
              errorMessage: undefined,
              processingTimeMs: batchJob.processingDuration ? 
                (new Date(batchJob.processingDuration).getTime() - new Date(batchJob.submittedAt).getTime()) : 0,
              createdAt: batchJob.submittedAt,
              completedAt: batchJob.completedAt,
              confidenceScore: transcriptResult.segments?.reduce((acc: number, seg) => 
                acc + (seg.confidence || 0), 0) / (transcriptResult.segments?.length || 1),
              detectedLanguage: transcriptResult.detectedLanguage,
              duration: transcriptResult.duration,
              speakerCount: transcriptResult.segments ? 
                new Set(transcriptResult.segments.map(s => s.speaker)).size : 0,
              hasSpeakerDiarization: (transcriptResult.segments?.length || 0) > 0
            };

            // Update the upload file status to completed with results
            setUploadFiles((prev) =>
              prev.map((f) => 
                f.status === "uploading" 
                  ? {
                      ...f,
                      status: "completed",
                      progress: 100,
                      result: transformedResult,
                    }
                  : f
              )
            );

            // Call the completion callback
            if (onTranscriptionComplete) {
              onTranscriptionComplete(transformedResult);
            }
          } else {
            // Handle transcript fetch error
            console.error('Failed to fetch transcript:', transcriptResponse.message);
            setUploadFiles((prev) =>
              prev.map((f) => 
                f.status === "uploading" 
                  ? {
                      ...f,
                      status: "error",
                      error: transcriptResponse.message || 'Failed to fetch transcript content',
                    }
                  : f
              )
            );
          }
        } catch (error) {
          // Handle network or other errors
          console.error('Error fetching transcript:', error);
          setUploadFiles((prev) =>
            prev.map((f) => 
              f.status === "uploading" 
                ? {
                    ...f,
                    status: "error",
                    error: 'Network error while fetching transcript',
                  }
                : f
            )
          );
        } finally {
          // Stop polling and clear batch job
          stopPolling();
          clearBatchJob();
        }
      };

      // Execute the transcript fetch
      fetchTranscript();
    } else if (batchJob && batchJob.status === 'failed') {
      // Handle batch job failure
      setUploadFiles((prev) =>
        prev.map((f) => 
          f.status === "uploading" 
            ? {
                ...f,
                status: "error",
                error: batchJob.errorMessage || "Batch processing failed",
              }
            : f
        )
      );
      
      // Stop polling and clear batch job
      stopPolling();
      clearBatchJob();
    }
  }, [batchJob, onTranscriptionComplete, stopPolling, clearBatchJob, apiService]);

  // Handle demo completion callback
  useEffect(() => {
    if (isDemo && !isSimulatingUpload && mockTranscripts.length > 0 && onTranscriptionComplete && !demoCallbackCalledRef.current) {
      // Demo has completed, trigger the callback once
      demoCallbackCalledRef.current = true;
      onTranscriptionComplete(mockTranscripts[0]);
    }
    
    // Reset the flag when demo starts over
    if (isDemo && isSimulatingUpload) {
      demoCallbackCalledRef.current = false;
    }
  }, [isDemo, isSimulatingUpload, mockTranscripts, onTranscriptionComplete]);

  // Format time from seconds to mm:ss or ss format
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes < 1) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const uploadFileToServer = useCallback(
    async (uploadFile: UploadFile) => {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "uploading", progress: 0 }
            : f
        )
      );
      try {
        const response = await apiService.uploadFile(
          uploadFile.file,
          (progress) => {
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
            );
          }
        );

        if (response.success && response.data) {
          // DEBUG: Log the actual response structure 
          console.log('🔍 UPLOAD RESPONSE DEBUG:', {
            success: response.success,
            dataKeys: response.data ? Object.keys(response.data) : null,
            fullResponse: response.data
          });
          
          // Check if this is a batch job response (has JobId instead of immediate transcription)
          if (('JobId' in response.data && typeof response.data.JobId === 'string') || 
              ('jobId' in response.data && typeof response.data.jobId === 'string')) {
            // This is a batch job submission response
            const batchResponse = response.data as any; // BatchJobSubmissionResponse
            const jobId = batchResponse.JobId || batchResponse.jobId;
            console.log('✅ BATCH JOB DETECTED! Job ID:', jobId);
            // Start polling immediately with the store-based hook
            startPolling(jobId);
            
            // Update file status to show it's being processed via batch
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "uploading", // Keep as uploading until batch completes
                      progress: 100, // Upload part is complete
                    }
                  : f
              )
            );
          } else {
            // This is a regular transcription response
            console.log('⚡ IMMEDIATE TRANSCRIPTION DETECTED');
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "completed",
                      progress: 100,
                      result: response.data,
                    }
                  : f
              )
            );
            if (onTranscriptionComplete) {
              onTranscriptionComplete(response.data);
            }
          }
        } else {
          // Handle API errors
          const errorData = response.errors?.[0] || response.message || "Upload failed";
          
          // Check if this is an insufficient tokens error
          if (response.message === "Insufficient tokens for batch processing" || 
              response.errorData?.error === "Insufficient tokens for batch processing") {
            // Extract token error details from the structured response
            const errorData = response.errorData || {};
            setTokenError({
              required: errorData.required || 0,
              available: errorData.available || 0,
              estimatedDuration: errorData.estimatedDuration || 0,
              fileName: uploadFile.file.name,
            });
            setTokenDialogOpen(true);
            
            // Remove the file from upload queue
            setUploadFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
          } else {
            // Handle other errors normally
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "error",
                      error: errorData,
                    }
                  : f
              )
            );
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error",
                  error: errorMessage,
                }
              : f
          )
        );
      }
    },
    [onTranscriptionComplete, apiService, startPolling]
  );

  const onDrop = useCallback(
    <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[]) => {
      // In demo mode, don't actually process files - start demo simulation instead
      if (isDemo) {
        startDemoUpload();
        // Trigger tour step advancement
        triggerStepAction('file-select');
        return;
      }
      
      // Handle rejected files
      if (fileRejections.length > 0) {
        const errorMessages = fileRejections.map((rejection) => {
          const errors = rejection.errors
            .map((error) => error.message)
            .join(", ");
          return `${rejection.file.name}: ${errors}`;
        });
        setValidationErrors(errorMessages);
        console.error("File upload errors:", errorMessages);
      } else {
        // Clear validation errors if all files are accepted
        setValidationErrors([]);
      }

      // Add accepted files to upload queue
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: "pending",
        progress: 0,
      }));

      setUploadFiles((prev) => [...prev, ...newFiles]);

      // Start uploading files automatically
      newFiles.forEach((uploadFile) => {
        uploadFileToServer(uploadFile);
      });
    },
    [uploadFileToServer, isDemo, startDemoUpload, triggerStepAction]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": acceptedFileTypes,
    },
    maxSize: maxFileSize,
    multiple: true,
    disabled: hasCompletedFile, // Disable dropzone if file has been processed
    noClick: isDemo, // In demo mode, prevent file dialog from opening
    noKeyboard: isDemo, // In demo mode, prevent keyboard interaction
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "uploading":
      case "pending":
        return <AudioFile color="primary" />;
      default:
        return <AudioFile />;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Drop Zone */}
      <Paper
        {...(hasCompletedFile || isDemo ? {} : getRootProps())}
        data-testid="dropzone"
        onClick={(e) => {
          if (isDemo && !hasCompletedFile) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Demo dropzone clicked, starting demo upload...');
            startDemoUpload();
            // Trigger tour step advancement
            triggerStepAction('file-select');
          }
        }}
        sx={{
          p: 4,
          width: "100%",
          position: "relative",
          border: "2px dashed",
          borderColor: hasCompletedFile 
            ? "grey.200" 
            : isDragActive 
              ? "primary.main" 
              : "grey.300",
          backgroundColor: hasCompletedFile 
            ? "grey.50" 
            : isDragActive 
              ? "primary.50" 
              : "background.paper",
          textAlign: "center",
          cursor: hasCompletedFile ? "default" : "pointer",
          opacity: hasCompletedFile ? 0.6 : 1,
          transition: "all 0.2s ease-in-out",
          "&:hover": hasCompletedFile ? {} : {
            borderColor: "primary.main",
            backgroundColor: "primary.50",
          },
        }}
      >
        {!hasCompletedFile && !isDemo && <input {...getInputProps()} data-testid="file-input" />}
        <CloudUpload
          sx={{
            fontSize: 48,
            color: hasCompletedFile 
              ? "grey.400" 
              : isDragActive 
                ? "primary.main" 
                : "grey.400",
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom color={hasCompletedFile ? "text.disabled" : "text.primary"}>
          {hasCompletedFile
            ? "File processing complete - Refresh page to upload another file"
            : isDemo
              ? "Click to start demo transcription"
              : isDragActive
                ? "Drop your audio files here"
                : "Drag & drop audio files here, or click to select"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isDemo 
            ? "Demo mode - Simulated transcription with mock data"
            : `Supported formats: ${acceptedFileTypes.join(", ")}`}
        </Typography>
        {isDemo && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Supported formats: {acceptedFileTypes.join(", ")}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {formatFileSize(maxFileSize)}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<CloudUpload />} 
          sx={{ mt: 2 }}
          disabled={hasCompletedFile || (isDemo && (isSimulatingUpload || mockTranscripts.length > 0))}
          onClick={(e) => {
            if (isDemo) {
              e.preventDefault();
              e.stopPropagation();
              startDemoUpload();
              // Trigger tour step advancement
              triggerStepAction('file-select');
            } else {
              // In production mode, trigger the file picker directly
              const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
              if (input) {
                input.click();
              }
            }
          }}
        >
          Select File
        </Button>

        {/* Step 1 Tour Popover - File Upload */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(1) && !isAuthDialogOpen}
          step={1}
          onClose={() => closeStep(1)}
          position={{ top: '-3px', right: '55px' }}
        />
      </Paper>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {validationErrors.map((error, index) => (
            <Alert
              key={index}
              severity="error"
              sx={{ mb: 1 }}
              onClose={() => {
                setValidationErrors((prev) =>
                  prev.filter((_, i) => i !== index)
                );
              }}
            >
              {error}
            </Alert>
          ))}
        </Box>
      )}

      {/* Demo Upload Simulation */}
      {isDemo && isSimulatingUpload && (
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Upload Queue (1)
              </Typography>
              <Chip
                icon={<CircularProgress size={16} />}
                label="1 processing"
                color="warning"
                size="small"
              />
            </Box>
            <List>
              <ListItem divider>
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", mr: 2 }}
                >
                  <AudioFile sx={{ color: "primary.main" }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  {/* File name and status */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">
                      {demoFileName}
                    </Typography>
                  </Box>

                  {/* Demo Workflow Progress Stepper */}
                  <Box sx={{ mt: 2 }}>
                    <Stepper
                    activeStep={
                      simulatedProgress <= 90 ? 1 : simulatedProgress < 100 ? 2 : 3
                    }
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
                    {getDemoWorkflowSteps(true, simulatedProgress).map((step, index) => (
                      <Step
                        key={`demo-step-${index}`}
                        completed={step.completed}
                      >
                        <StepLabel
                          icon={
                            step.active ? (
                              <CircularProgress size={20} />
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
                </Box>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* Demo Results */}
      {isDemo && !isSimulatingUpload && mockTranscripts.length > 0 && (
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Upload Queue (1)
              </Typography>
              <Chip
                icon={<CheckCircle />}
                label="Completed"
                color="success"
                size="small"
              />
            </Box>
            <List>
              <ListItem divider>
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", mr: 2 }}
                >
                  <AudioFile sx={{ color: "success.main" }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  {/* File name and status */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">
                      {demoFileName}
                    </Typography>
                  </Box>

                  {/* Demo Workflow Stepper - Completed */}
                  <Box sx={{ mt: 2 }}>
                    <Stepper
                    activeStep={3}
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
                    {getDemoWorkflowSteps(false, 100).map((step, index) => (
                      <Step
                        key={`demo-complete-step-${index}`}
                        completed={step.completed}
                      >
                        <StepLabel
                          icon={
                            step.completed ? (
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

                {/* Demo completion status similar to production */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: "success.50", borderRadius: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="body2" color="success.main" component="span">
                      <strong>Transcription completed in 45s</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <Psychology sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      Detected 3 speakers
                    </Typography>
                  </Box>
                </Box>
                </Box>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* Upload Queue */}
      {!isDemo && uploadFiles.length > 0 && (
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Upload Queue ({uploadFiles.length})
              </Typography>
              {/* Queue Summary */}
              <Box sx={{ display: "flex", gap: 1 }}>
                {uploadFiles.filter((f) => f.status === "completed").length >
                  0 && (
                  <Chip
                    icon={<CheckCircle />}
                    label={`${
                      uploadFiles.filter((f) => f.status === "completed").length
                    } completed`}
                    color="success"
                    size="small"
                  />
                )}
                {uploadFiles.filter((f) => f.status === "uploading").length >
                  0 && (
                  <Chip
                    icon={<CircularProgress size={16} />}
                    label={`${
                      uploadFiles.filter((f) => f.status === "uploading").length
                    } processing`}
                    color="warning"
                    size="small"
                  />
                )}
                {uploadFiles.filter((f) => f.status === "error").length > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${
                      uploadFiles.filter((f) => f.status === "error").length
                    } failed`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <List>
              {uploadFiles.map((uploadFile) => (
                <ListItem key={uploadFile.id} divider>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", mr: 2 }}
                  >
                    {getStatusIcon(uploadFile.status)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    {/* File name and status */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1">
                        {uploadFile.file.name}
                      </Typography>
                    </Box>

                    {/* Uploaded file size */}

                    {/* Workflow Progress Stepper */}
                    <Box sx={{ mt: 2 }}>
                      <Stepper
                        activeStep={
                          // Enhanced stepper logic for batch jobs
                          (() => {
                            if (batchJob) {
                              // Batch job stepper logic
                              switch (batchJob.status) {
                                case 'submitted': return 1;
                                case 'processing': return 2;
                                case 'completed': return 3;
                                case 'failed': return 1;
                                default: return 0;
                              }
                            } else {
                              // Regular upload stepper logic
                              switch (uploadFile.status) {
                                case "pending": return 0;
                                case "uploading": return uploadFile.progress > 90 ? 2 : 1;
                                case "completed": return 3;
                                case "error": return 1;
                                default: return 0;
                              }
                            }
                          })()
                        }
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
                        {getUnifiedWorkflowSteps(uploadFile, batchJob || undefined).map((step, index) => (
                          <Step
                            key={`${uploadFile.id}-step-${index}`}
                            completed={step.completed}
                            disabled={
                              uploadFile.status === "error" && !step.error
                            }
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

                    {/* Batch Job Status Information */}
                    {batchJob && (
                      <Box sx={{ mt: 2 }}>
                        <Alert 
                          severity={
                            batchJob.status === 'completed' ? 'success' : 
                            batchJob.status === 'failed' ? 'error' : 'info'
                          } 
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Batch Job: {batchJob.fileName}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Status: {batchJob.status.charAt(0).toUpperCase() + batchJob.status.slice(1)}
                            {batchJob.status === 'processing' && ` (${batchJob.progressPercentage}%)`}
                          </Typography>
                          {batchJob.status === 'processing' && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={batchJob.progressPercentage} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          )}
                          <Typography variant="caption" display="block">
                            Estimated Duration: {batchJob.estimatedDurationMinutes} minutes
                          </Typography>
                          {batchJob.status === 'processing' && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {isPolling ? '🔄 Checking status...' : '⏸️ Monitoring paused'}
                            </Typography>
                          )}
                          {batchJob.status === 'completed' && batchJob.processingDuration && (
                            <Typography variant="caption" display="block">
                              Processing Time: {batchJob.processingDuration}
                            </Typography>
                          )}
                          {batchJob.errorMessage && (
                            <Typography variant="caption" display="block" color="error">
                              Error: {batchJob.errorMessage}
                            </Typography>
                          )}
                        </Alert>
                      </Box>
                    )}

                    {/* Batch Job Error Display */}
                    {batchError && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          ⚠️ Batch job monitoring error: {batchError}
                        </Typography>
                        <Typography variant="caption" display="block">
                          The batch job may still be processing. Status updates will resume automatically.
                        </Typography>
                      </Alert>
                    )}

                    {/* Error Display */}
                    {uploadFile.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {uploadFile.error}
                      </Alert>
                    )}

                    {/* Success Display */}
                    {uploadFile.result && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          ✅ Transcription completed in{" "}
                          {formatTime(Math.round(uploadFile.result.processingTimeMs / 1000))}
                        </Typography>
                        {uploadFile.result.speakerCount &&
                          uploadFile.result.speakerCount > 1 && (
                            <Typography variant="caption" display="block">
                              🎙️ Detected {uploadFile.result.speakerCount}{" "}
                              speakers
                            </Typography>
                          )}
                      </Alert>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Tokens Dialog */}
      <InsufficientTokensDialog
        open={tokenDialogOpen}
        onClose={() => setTokenDialogOpen(false)}
        requiredTokens={tokenError?.required || 0}
        availableTokens={tokenError?.available || 0}
        estimatedDuration={tokenError?.estimatedDuration || 0}
        fileName={tokenError?.fileName}
        onPurchaseTokens={() => {
          // TODO: Navigate to token purchase page or open purchase dialog
          console.log('Navigate to token purchase');
        }}
        onTrySmaller={() => {
          // Clear the current error and allow user to try again
          setTokenError(null);
          console.log('User will try a smaller file');
        }}
      />
    </Box>
  );
};

export default FileUpload;
