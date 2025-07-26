import React, { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload,
  AudioFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Upload,
  Psychology,
  Done,
} from "@mui/icons-material";
import { apiService } from "../services/apiService";
import type { TranscriptionResponse } from "../types";

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
  maxFileSize?: number; // in bytes, default 500MB
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
    completed: uploadFile.status === "completed",
    active: uploadFile.status === "uploading",
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
    icon: <Done />,
    completed: uploadFile.status === "completed",
    active: false,
    error: uploadFile.status === "error",
  },
];

const FileUpload: React.FC<FileUploadProps> = ({
  onTranscriptionComplete,
  maxFileSize = 500 * 1024 * 1024, // 500MB
  acceptedFileTypes = [".mp3", ".wav", ".m4a", ".flac", ".ogg"],
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    [onTranscriptionComplete]
  );

  const onDrop = useCallback(
    <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[]) => {
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
    [uploadFileToServer]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": acceptedFileTypes,
    },
    maxSize: maxFileSize,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

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

  const getStatusColor = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "error":
        return "error";
      case "uploading":
        return "warning";
      case "pending":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          width: "100%",
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          backgroundColor: isDragActive ? "primary.50" : "background.paper",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "primary.50",
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload
          sx={{
            fontSize: 48,
            color: isDragActive ? "primary.main" : "grey.400",
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? "Drop your audio files here"
            : "Drag & drop audio files here, or click to select"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supported formats: {acceptedFileTypes.join(", ")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {formatFileSize(maxFileSize)}
        </Typography>
        <Button variant="contained" startIcon={<CloudUpload />} sx={{ mt: 2 }}>
          Select Files
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

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
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
                      <Chip
                        label={uploadFile.status}
                        size="small"
                        color={
                          getStatusColor(uploadFile.status) as
                            | "success"
                            | "error"
                            | "warning"
                            | "info"
                            | "default"
                        }
                      />
                    </Box>

                    {/* File size */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {formatFileSize(uploadFile.file.size)}
                    </Typography>

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

                    {/* Upload Progress Bar */}
                    {uploadFile.status === "uploading" && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={uploadFile.progress}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {uploadFile.progress < 90
                            ? `Uploading... ${uploadFile.progress}%`
                            : "Processing transcription..."}
                        </Typography>
                      </Box>
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
                          {uploadFile.result.processingTimeMs}ms
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
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUpload;
