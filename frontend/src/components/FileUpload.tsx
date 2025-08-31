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
  IconButton,
  Stack,
} from "@mui/material";
import {
  CloudUpload,
  AudioFile,
  CheckCircle,
  Error as ErrorIcon,
  Upload,
  Psychology,
  RadioButtonUnchecked,
  Close,
  SkipNext,
  ArrowForward,
} from "@mui/icons-material";
import { useAppMode } from "../contexts/AppModeContext";
import { createApiService } from "../services/apiServiceFactory";
import { useEnhancedSessionStore } from "../stores/enhancedSessionStore";
import type { TranscriptionResponse } from "../types";

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
  maxFileSize?: number; // in bytes, default 1GB
  acceptedFileTypes?: string[];
}

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  result?: TranscriptionResponse;
  error?: string;
}

// Workflow steps for the transcription process
const getWorkflowSteps = (uploadFile: UploadFile) => [
  {
    label: "File Selected",
    icon: <AudioFile />,
    completed: true,
    active: false,
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
    icon: <RadioButtonUnchecked />,
    completed: uploadFile.status === "completed",
    active: false,
    error: uploadFile.status === "error",
  },
];

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
  acceptedFileTypes = [".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"],
}) => {
  const { mode, isDemo, isTourActive, tourStep, nextTourStep, closeTour } = useAppMode();
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
  const demoCallbackCalledRef = useRef(false);
  
  // Tour Step 1: File Upload Button Reference
  const selectFileButtonRef = useRef<HTMLButtonElement>(null);
  
  // Tour Step 1: Position anchor for right-side placement
  const tourStep1AnchorRef = useRef<HTMLDivElement>(null);

  // Check if there's a completed file to disable upload
  const hasCompletedFile = uploadFiles.some(file => file.status === "completed");

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
        if (onTranscriptionComplete && response.data) {
          onTranscriptionComplete(response.data);
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
    [onTranscriptionComplete, apiService]
  );

  const onDrop = useCallback(
    <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[]) => {
      // In demo mode, don't actually process files - start demo simulation instead
      if (isDemo) {
        startDemoUpload();
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
    [uploadFileToServer, isDemo, startDemoUpload]
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
        sx={{
          p: 4,
          width: "100%",
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
        {!hasCompletedFile && !isDemo && <input {...getInputProps()} />}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supported formats: {acceptedFileTypes.join(", ")}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {formatFileSize(maxFileSize)}
        </Typography>
        <Button 
          ref={selectFileButtonRef}
          variant="contained" 
          startIcon={<CloudUpload />} 
          sx={{ mt: 2 }}
          disabled={hasCompletedFile || (isDemo && (isSimulatingUpload || mockTranscripts.length > 0))}
          onClick={(e) => {
            if (isDemo) {
              e.preventDefault();
              e.stopPropagation();
              console.log('Demo button clicked, starting demo upload...');
              startDemoUpload();
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
                          uploadFile.status === "pending"
                            ? 0
                            : uploadFile.status === "uploading"
                            ? uploadFile.progress > 90
                              ? 2
                              : 1
                            : uploadFile.status === "completed"
                            ? 3
                            : uploadFile.status === "error"
                            ? 1
                            : 0
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
                        {getWorkflowSteps(uploadFile).map((step, index) => (
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

      {/* Tour Step 1: File Upload - Shows in demo mode */}
      {isDemo && (
        <Box
          sx={{
            position: 'absolute',
            top: '260px',
            right: '390px',
            zIndex: 1300,
            pointerEvents: 'none' // Prevent blocking interactions
          }}
        >
          <Paper sx={{ 
            p: 2, 
            position: 'relative',
            bgcolor: 'grey.700',
            border: '1px solid',
            borderColor: 'grey.500',
            boxShadow: 3,
            maxWidth: 360,
            minWidth: 280,
            pointerEvents: 'auto' // Re-enable for the dialog itself
          }}>
            {/* Close button */}
            <IconButton
              size="small"
              onClick={closeTour}
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
              <Typography variant="body2" color="primary" fontWeight="bold">
                Step 1
              </Typography>
            </Box>

            {/* Title */}
            <Typography variant="h6" component="h3" sx={{ mb: 1, pr: 4 }}>
              Start Demo Transcription
            </Typography>

            {/* Description */}
            <Typography variant="body2" color="white" sx={{ mb: 2 }}>
              Click 'SELECT FILE' to begin the demo transcription process with our sample meeting audio. No actual file upload is needed in demo mode.
            </Typography>

            {/* Controls - Development mode: no navigation needed */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="text"
                onClick={closeTour}
                sx={{ color: 'grey.300' }}
              >
                CLOSE
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Invisible tour anchor positioned in right area - DISABLED FOR NOW */}
      {false && isDemo && (
        <div
          ref={tourStep1AnchorRef}
          style={{
            position: 'absolute',
            top: '200px',
            right: '300px',
            width: '1px',
            height: '1px',
            visibility: 'hidden',
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      )}

      {/* Debug info for tour development */}
      {isDemo && process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', top: 100, right: 20, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'grey.300', zIndex: 9999 }}>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Mode: {mode}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Demo Mode: {isDemo.toString()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Tour Active: {isTourActive.toString()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Tour Step: {tourStep}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Button Ref: {selectFileButtonRef.current ? 'Found' : 'Not found'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Tour Anchor: {tourStep1AnchorRef.current ? 'Found' : 'Not found'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Button Disabled: {(hasCompletedFile || (isDemo && (isSimulatingUpload || mockTranscripts.length > 0))).toString()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            isSimulatingUpload: {isSimulatingUpload.toString()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            mockTranscripts.length: {mockTranscripts.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
