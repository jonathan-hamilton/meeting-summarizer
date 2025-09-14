import React, { useCallback, useState } from "react";
import type { FileRejection } from "react-dropzone";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip
} from "@mui/material";
import { CheckCircle, CircularProgress, Error as ErrorIcon } from "@mui/icons-material";
import { useAppMode } from "../contexts/AppModeContext";
import { useTourStore } from "../stores/tourStore";
import { TourPopover } from "./TourPopover";
import InsufficientTokensDialog from "./InsufficientTokensDialog";
import { createApiService } from "../services/apiServiceFactory";
import { useEnhancedSessionStore } from "../stores/enhancedSessionStore";
import { useBatchJobPollingStore } from "../hooks/useBatchJobPollingStore";
import type { TranscriptionResponse } from "../types";

import { FileDropzone } from "./FileUpload/FileDropzone";
import { UploadProgress } from "./FileUpload/UploadProgress";
import { validateFiles } from "./FileUpload/validation";
import type { FileUploadFile } from "./FileUpload/types";

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  isAuthDialogOpen?: boolean;
}

interface TokenError {
  required: number;
  available: number;
  estimatedDuration: number;
  fileName: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onTranscriptionComplete,
  maxFileSize = 1073741824, // 1GB default
  acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm', '.aac'],
  isAuthDialogOpen = false,
}) => {
  const { isDemo, mockTranscripts, startDemoUpload, isSimulatingUpload, demoFileName, simulatedProgress } = useAppMode();
  const { isTourActive, isCurrentStep, closeStep, triggerStepAction } = useTourStore();
  const { sessionToken } = useEnhancedSessionStore();
  const { batchJob, startPolling, batchError, isPolling } = useBatchJobPollingStore();

  const [uploadFiles, setUploadFiles] = useState<FileUploadFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const apiService = createApiService(sessionToken);
  const hasCompletedFile = uploadFiles.some(f => f.status === 'completed');

  const uploadFileToServer = useCallback(
    async (uploadFile: FileUploadFile) => {
      try {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "uploading", progress: 10 }
              : f
          )
        );

        const formData = new FormData();
        formData.append("file", uploadFile.file);

        const response = await apiService.uploadAndTranscribe(formData, (progress) => {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress: Math.round(progress * 100) }
                : f
            )
          );
        });

        if (response.success) {
          if (response.batchJobId) {
            console.log('⏳ BATCH JOB DETECTED - Starting polling for:', response.batchJobId);
            startPolling(response.batchJobId, uploadFile.file.name);
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "uploading",
                      progress: 95,
                      batchJobId: response.batchJobId,
                    }
                  : f
              )
            );
          } else {
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
          const errorData = response.errors?.[0] || response.message || "Upload failed";
          
          if (response.message === "Insufficient tokens for batch processing" || 
              response.errorData?.error === "Insufficient tokens for batch processing") {
            const errorData = response.errorData || {};
            setTokenError({
              required: errorData.required || 0,
              available: errorData.available || 0,
              estimatedDuration: errorData.estimatedDuration || 0,
              fileName: uploadFile.file.name,
            });
            setTokenDialogOpen(true);
            setUploadFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
          } else {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: "error", error: errorData }
                  : f
              )
            );
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: errorMessage }
              : f
          )
        );
      }
    },
    [onTranscriptionComplete, apiService, startPolling]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (isDemo) {
        startDemoUpload();
        triggerStepAction('file-select');
        return;
      }
      
      if (fileRejections.length > 0) {
        const errorMessages = fileRejections.map((rejection) => {
          const errors = rejection.errors.map((error) => error.message).join(", ");
          return `${rejection.file.name}: ${errors}`;
        });
        setValidationErrors(errorMessages);
        console.error("File upload errors:", errorMessages);
      } else {
        setValidationErrors([]);
      }

      const { validFiles, errors } = validateFiles(acceptedFiles);
      if (errors.length > 0) {
        setValidationErrors(errors);
      }

      const newFiles: FileUploadFile[] = validFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: "pending",
        progress: 0,
      }));

      setUploadFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach((uploadFile) => {
        uploadFileToServer(uploadFile);
      });
    },
    [uploadFileToServer, isDemo, startDemoUpload, triggerStepAction]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* File Dropzone */}
      <FileDropzone
        onFilesDropped={onDrop}
        isDemo={isDemo}
        hasCompletedFile={hasCompletedFile}
        isSimulatingUpload={isSimulatingUpload}
        mockTranscripts={mockTranscripts}
        onDemoStart={startDemoUpload}
        onStepAction={triggerStepAction}
      >
        {/* Step 1 Tour Popover - File Upload */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(1) && !isAuthDialogOpen}
          step={1}
          onClose={() => closeStep(1)}
          position={{ top: '-3px', right: '55px' }}
        />
      </FileDropzone>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {validationErrors.map((error, index) => (
            <Alert
              key={index}
              severity="error"
              sx={{ mb: 1 }}
              onClose={() => {
                setValidationErrors((prev) => prev.filter((_, i) => i !== index));
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Upload Queue (1)</Typography>
              <Chip
                icon={<CircularProgress size={16} />}
                label="1 processing"
                color="warning"
                size="small"
              />
            </Box>
            <Typography variant="body1">{demoFileName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Simulating upload and transcription... {simulatedProgress}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Demo Results */}
      {isDemo && !isSimulatingUpload && mockTranscripts.length > 0 && (
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Upload Queue (1)</Typography>
              <Chip icon={<CheckCircle />} label="Completed" color="success" size="small" />
            </Box>
            <Typography variant="body1">{demoFileName}</Typography>
            <Alert severity="success" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Transcription completed in 45s</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detected 3 speakers
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Upload Queue */}
      {!isDemo && uploadFiles.length > 0 && (
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Upload Queue ({uploadFiles.length})</Typography>
              
              {/* Queue Summary */}
              <Box sx={{ display: "flex", gap: 1 }}>
                {uploadFiles.filter((f) => f.status === "completed").length > 0 && (
                  <Chip
                    icon={<CheckCircle />}
                    label={`${uploadFiles.filter((f) => f.status === "completed").length} completed`}
                    color="success"
                    size="small"
                  />
                )}
                {uploadFiles.filter((f) => f.status === "uploading").length > 0 && (
                  <Chip
                    icon={<CircularProgress size={16} />}
                    label={`${uploadFiles.filter((f) => f.status === "uploading").length} processing`}
                    color="warning"
                    size="small"
                  />
                )}
                {uploadFiles.filter((f) => f.status === "error").length > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${uploadFiles.filter((f) => f.status === "error").length} failed`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            <UploadProgress 
              uploadFiles={uploadFiles}
              batchJob={batchJob}
              isPolling={isPolling}
              batchError={batchError}
            />
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
          console.log('Navigate to token purchase');
        }}
        onTrySmaller={() => {
          setTokenError(null);
          console.log('User will try a smaller file');
        }}
      />
    </Box>
  );
};

export default FileUpload;