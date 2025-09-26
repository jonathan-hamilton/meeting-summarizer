import React, { useCallback, useState } from "react";
import type { FileRejection } from "react-dropzone";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  CircularProgress
} from "@mui/material";
import { CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import { useAppMode } from "../../contexts/AppModeContext";
import InsufficientTokensDialog from "../InsufficientTokensDialog";
import CostEstimationDialog from "../CostEstimationDialog";
import { createApiService } from "../../services/apiServiceFactory";
// import { useEnhancedSessionStore } from "../../stores/enhancedSessionStore"; // Not used due to interface mismatch
import { useUploadQueueStore } from '../../stores/uploadQueueStore';
import { useBatchJobPollingStore } from "../../hooks/useBatchJobPollingStore";
import { useTokenStore } from "../../stores/tokenStore";
import type { TranscriptionResponse } from "../../types";

import { FileDropzone } from "./FileDropzone";
import { UploadProgress } from "./UploadProgress";
import { validateFiles } from "./validation";
import { getTokenCalculation, getFileEstimation } from "./tokenUtils";
import type { FileUploadFile } from "./types";
// import { useSignalRBatchProgress } from "../../hooks/useSignalRProgress"; // Unused for now

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
  onPurchaseTokens?: () => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  isAuthDialogOpen?: boolean;
  onClearPreviousData?: () => void;
  hasPreviousResults?: boolean;
}

interface TokenError {
  required: number;
  available: number;
  estimatedDuration: number;
  fileName: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onTranscriptionComplete,
  onPurchaseTokens,
  maxFileSize: _maxFileSize = 1073741824, // 1GB default (unused for now)
  acceptedFileTypes: _acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm', '.aac'], // unused for now
  isAuthDialogOpen: _isAuthDialogOpen = false, // Available for future use to disable upload when auth dialogs are open
  onClearPreviousData,
  hasPreviousResults = false,
}) => {
  const { mode } = useAppMode();
  const { balance: tokenBalance, refreshBalance } = useTokenStore();
  const { uploadFiles, setUploadFiles, clearUploadQueue: storeClearUploadQueue } = useUploadQueueStore();
  
  const { currentJob: batchJob, startPolling, pollingError: batchError, isPolling } = useBatchJobPollingStore({
    onJobCompleted: useCallback((jobId: string) => {
      console.log('✅ Batch job completed:', jobId);
      
      // Find the upload file with this batch job ID and mark it as completed
      setUploadFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.batchJobId === jobId && f.status === "uploading") {
            return {
              ...f,
              status: "completed" as const,
              progress: 100,
              result: batchJob?.results,
            };
          }
          return f;
        });
        
        // Find the completed file and call the completion callback
        const completedFile = updated.find(f => f.batchJobId === jobId && f.status === "completed");
        if (completedFile?.result && onTranscriptionComplete) {
          console.log('📞 Calling onTranscriptionComplete for batch job:', jobId);
          onTranscriptionComplete(completedFile.result);
        }
        
        return updated;
      });
      
      // Refresh token balance after completion
      refreshBalance();
    }, [onTranscriptionComplete, refreshBalance]),
    
    onJobFailed: useCallback((jobId: string, error?: string) => {
      console.log('❌ Batch job failed:', jobId, error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.batchJobId === jobId
            ? { ...f, status: "error", error: error || "Batch job failed" }
            : f
        )
      );
    }, [])
  });
  
  // S6.5: Add SignalR for real-time progress updates (unused for now)
  // const signalRProgress = useSignalRBatchProgress();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  
  // Cost estimation dialog state
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const apiService = createApiService(mode);

  // Pre-flight token validation
  const validateTokenBalance = useCallback(async (file: File): Promise<{ valid: boolean; required?: number; estimatedDuration?: number }> => {
    try {
      // Refresh token balance to ensure we have the latest data
      await refreshBalance();
      
      // Get token calculation using shared utils
      const tokenCalc = getTokenCalculation(file);
      
      // Check if user has sufficient balance
      if (tokenBalance < tokenCalc.requiredTokens) {
        return {
          valid: false,
          required: tokenCalc.requiredTokens,
          estimatedDuration: tokenCalc.estimatedDuration
        };
      }
      
      return { valid: true };
      
    } catch (error) {
      console.error('Token validation failed:', error);
      // On error, allow upload to proceed (backend will handle validation)
      return { valid: true };
    }
  }, [tokenBalance, refreshBalance]);

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

        const response = await apiService.uploadFile(uploadFile.file, (progress: number) => {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress: Math.round(progress * 100) }
                : f
            )
          );
        });

        if (response.success) {
          if (response.data && 'batchJobId' in response.data && (response.data as any).batchJobId) {
            // Batch job processing
            startPolling((response.data as any).batchJobId);
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "uploading",
                      progress: 95,
                      batchJobId: (response.data as any).batchJobId,
                    }
                  : f
              )
            );
          } else {
            // Immediate transcription response
            console.log('⚡ Immediate transcription completed:', uploadFile.file.name);
            
            // Show success message mentioning history for all successful transcriptions
            const successMessage = 'Transcription completed successfully! Transcript saved to history.';
              
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "completed",
                      progress: 100,
                      result: response.data,
                      successMessage,
                    }
                  : f
              )
            );
            // Refresh token balance after successful transcription (tokens were consumed)
            refreshBalance();
            if (onTranscriptionComplete && response.data) {
              console.log('📞 Calling onTranscriptionComplete for immediate result:', uploadFile.file.name);
              onTranscriptionComplete(response.data);
            } else {
              console.log('❌ Missing callback or data for:', uploadFile.file.name, { hasCallback: !!onTranscriptionComplete, hasData: !!response.data });
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

  const handleClearFile = useCallback((fileId: string) => {
    setUploadFiles((prev) => prev.filter(f => f.id !== fileId));
  }, []);

  // Process files after cost confirmation
  const processFiles = useCallback(async (validFiles: File[]) => {
    // Pre-flight token validation for each file
    for (const file of validFiles) {
      const validation = await validateTokenBalance(file);
      
      if (!validation.valid && validation.required && validation.estimatedDuration) {
        // Show insufficient tokens dialog
        setTokenError({
          required: validation.required,
          available: tokenBalance,
          estimatedDuration: validation.estimatedDuration,
          fileName: file.name,
        });
        setTokenDialogOpen(true);
        return; // Stop processing if insufficient tokens
      }
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
  }, [uploadFileToServer, validateTokenBalance, tokenBalance]);

  const clearUploadQueue = useCallback(() => {
    console.log('🧹 Clearing upload queue');
    storeClearUploadQueue();
  }, [storeClearUploadQueue]);

  // Handle cost estimation confirmation
  const handleCostConfirm = useCallback(() => {
    if (pendingFile) {
      // Clear previous data if there are previous results
      if (hasPreviousResults && onClearPreviousData) {
        console.log('🧹 Processing 2nd+ file - clearing previous data');
        onClearPreviousData();
        clearUploadQueue();
      }
      
      processFiles([pendingFile]);
      setPendingFile(null);
    }
  }, [pendingFile, processFiles, hasPreviousResults, onClearPreviousData, clearUploadQueue]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      console.log('🎯 onDrop triggered:', { acceptedFiles: acceptedFiles.length, rejections: fileRejections.length });
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

      // For single file uploads, show cost estimation dialog first
      if (validFiles.length === 1) {
        const file = validFiles[0];
        setPendingFile(file);
        setCostDialogOpen(true);
        return;
      }

      // For multiple files, proceed with existing logic (could be enhanced later)
      await processFiles(validFiles);
    },
    [processFiles]
  );

  return (
    <Box 
      sx={{ width: "100%" }}
      component="section"
      role="region"
      aria-labelledby="file-upload-section"
    >
      <Typography 
        id="file-upload-section" 
        component="h2" 
        variant="h6" 
        sx={{ sr: '&sr-only' }}
      >
        Audio File Upload
      </Typography>
      
      {/* File Dropzone */}
      <FileDropzone onFilesDropped={onDrop} />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Box 
          sx={{ mt: 2 }}
          role="alert"
          aria-label="File validation errors"
        >
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

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
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
              onClearFile={handleClearFile}
            />
          </CardContent>
        </Card>
      )}

      {/* Cost Estimation Dialog */}
      {pendingFile && (
        <CostEstimationDialog
          open={costDialogOpen}
          onClose={() => {
            setCostDialogOpen(false);
            setPendingFile(null);
          }}
          onConfirm={handleCostConfirm}
          fileName={getFileEstimation(pendingFile).fileName}
          fileSize={getFileEstimation(pendingFile).fileSize}
          estimatedDuration={getTokenCalculation(pendingFile).estimatedDuration}
          requiredTokens={getTokenCalculation(pendingFile).requiredTokens}
          availableTokens={tokenBalance}
          hasDiscount={getTokenCalculation(pendingFile).hasDiscount}
          discountPercentage={getTokenCalculation(pendingFile).discountPercentage}
        />
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
          // Close the insufficient tokens dialog and open purchase dialog
          setTokenDialogOpen(false);
          // This should trigger opening the purchase dialog in the parent App component
          if (onPurchaseTokens) {
            onPurchaseTokens();
          }
        }}
        onTrySmaller={() => {
          setTokenError(null);
          // User will try a smaller file
        }}
      />
    </Box>
  );
};

export default FileUpload;