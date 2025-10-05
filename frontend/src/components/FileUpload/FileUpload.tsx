import React, { useCallback, useState, useEffect, useRef } from "react";
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
import { useTokenStore } from "../../stores/tokenStore";
import type { TranscriptionResponse } from "../../types";

import { FileDropzone } from "./FileDropzone";
import { validateFiles } from "./validation";
import { getTokenCalculation, getFileEstimation, getTokenCalculationAsync, getFileEstimationAsync } from "./tokenUtils";
import type { FileUploadFile } from "./types";

// Progress system imports
import { FileUploadProgress } from "../Progress";
import type { ProcessingStage, ProgressStatus } from "../../types/progress";
import { estimateFileProcessingTime } from "../../services/progressEstimator";

// Helper functions to map upload queue status to progress system
const mapUploadStatusToProgressStage = (status: string): ProcessingStage => {
  switch (status) {
    case 'uploading': return 'upload';
    case 'processing': return 'processing';
    case 'completed': return 'complete';
    default: return 'upload';
  }
};

const mapUploadStatusToProgressStatus = (status: string): ProgressStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'uploading': return 'active';
    case 'processing': return 'active';
    case 'completed': return 'completed';
    case 'error': return 'failed';
    default: return 'pending';
  }
};

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
  maxFileSize: _maxFileSize = 209715200, // 200MB default - Azure Fast Transcription limit
  acceptedFileTypes: _acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm'], // Azure Fast Transcription supported formats (AAC removed)
  isAuthDialogOpen: _isAuthDialogOpen = false, // Available for future use to disable upload when auth dialogs are open
  onClearPreviousData,
  hasPreviousResults = false,
}) => {
  const { mode } = useAppMode();
  const { balance: tokenBalance, refreshBalance } = useTokenStore();
  const { 
    uploadFiles, 
    setUploadFiles, 
    clearUploadQueue: storeClearUploadQueue,
    startFileProgress,
    updateFileStage,
    completeFileProgress,
  } = useUploadQueueStore();
  
  // Cleanup effect: Clear upload queue when component unmounts or when navigating away
  // This prevents old/stuck files from interfering with new uploads
  // BUT only clear completed/error files, preserve active uploads
  useEffect(() => {
    return () => {
      console.log('🧹 FileUpload component cleanup - clearing completed/error files only');
      setUploadFiles((prev) => {
        const activeFiles = prev.filter(f => 
          f.status === "uploading" || f.status === "processing" // Keep active uploads and processing
        );
        const removedCount = prev.length - activeFiles.length;
        if (removedCount > 0) {
          console.log(`🧹 Removed ${removedCount} completed/error files, kept ${activeFiles.length} active uploads`);
        }
        return activeFiles;
      });
    };
  }, [setUploadFiles]);

  // Clear upload queue when auth dialogs open (user is navigating away from upload)
  useEffect(() => {
    if (_isAuthDialogOpen) {
      console.log('🧹 Auth dialog opened - clearing upload queue to prevent interference');
      storeClearUploadQueue();
    }
  }, [_isAuthDialogOpen, storeClearUploadQueue]);

  // Track which files have already triggered completion callbacks to prevent infinite loops
  const processedFileIds = useRef<Set<string>>(new Set());

  // Clean up processed file IDs when files are removed from the queue
  useEffect(() => {
    const currentFileIds = new Set(uploadFiles.map(f => f.id));
    const processedIds = processedFileIds.current;
    
    // Remove processed IDs for files that are no longer in the queue
    for (const id of processedIds) {
      if (!currentFileIds.has(id)) {
        processedIds.delete(id);
      }
    }
  }, [uploadFiles]);

  // Watch for files completing and trigger completion callback
  useEffect(() => {
    uploadFiles.forEach(file => {
      if (file.status === 'completed' && file.result && onTranscriptionComplete && !processedFileIds.current.has(file.id)) {
        console.log('🎯 File completed, triggering completion callback:', file.file.name);
        processedFileIds.current.add(file.id);
        onTranscriptionComplete(file.result);
      }
    });
  }, [uploadFiles, onTranscriptionComplete]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  
  // Cost estimation dialog state
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTokenCalc, setPendingTokenCalc] = useState<{ 
    tokenCalc: Awaited<ReturnType<typeof getTokenCalculationAsync>>;
    fileEstimation: Awaited<ReturnType<typeof getFileEstimationAsync>>;
  } | null>(null);

  const apiService = createApiService(mode);

  // Pre-flight token validation
  const validateTokenBalance = useCallback(async (file: File): Promise<{ valid: boolean; required?: number; estimatedDuration?: number }> => {
    try {
      // Refresh token balance to ensure we have the latest data
      await refreshBalance();
      
      // Get token calculation using shared utils (API-based for accuracy)
      const tokenCalc = await getTokenCalculationAsync(file);
      
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
        // Start progress tracking with estimation
        startFileProgress(uploadFile.id, uploadFile.file);
        
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "uploading", progress: 10 }
              : f
          )
        );

        const formData = new FormData();
        formData.append("file", uploadFile.file);

        // Start synthetic progress simulation for gradual progress
        const startTime = Date.now();
        const estimation = estimateFileProcessingTime(uploadFile.file);
        const expectedDuration = estimation.totalTime; // Use actual estimation instead of hardcoded value
        
        let progressInterval: NodeJS.Timeout | null = null;
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progressPercent = Math.min(95, (elapsed / expectedDuration) * 100);
          
          // Map progress to realistic processing stages
          let stage: ProcessingStage;
          let displayProgress = Math.round(progressPercent);
          
          if (progressPercent < 15) {
            stage = 'upload';
          } else if (progressPercent < 30) {
            stage = 'processing';
          } else if (progressPercent < 85) {
            stage = 'transcription';
          } else {
            stage = 'summarization';
          }
          
          updateFileStage(uploadFile.id, stage, displayProgress);
          
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { 
                    ...f, 
                    progress: displayProgress,
                    status: progressPercent < 95 ? "processing" : "processing"
                  }
                : f
            )
          );
          
          console.log(`🎬 Synthetic progress: ${displayProgress}% (${stage}) - ${elapsed}ms elapsed`);
          
          // Stop at 95% and let completion handle the final 5%
          if (progressPercent >= 95) {
            if (progressInterval) clearInterval(progressInterval);
          }
        }, 1000); // Update every second
        
        const response = await apiService.uploadFile(uploadFile.file, (progress: number) => {
          const progressPercent = Math.round(progress); // progress is already a percentage (0-100)
          console.log(`📊 Upload progress: ${progressPercent}% for ${uploadFile.file.name}`);
          // Don't update UI here - let the synthetic progress handle it
        });

        if (response.success) {
          // Clear the progress interval since upload completed
          if (progressInterval) clearInterval(progressInterval);
          
          // First, mark upload as completed (regardless of transcription status)
        // Debug the response structure to see what transcription ID field is available
        console.log('🔍 Upload Response Data:', response.data);
        console.log('🔍 Response Headers:', response.headers);
        
        // Get meeting ID from X-Meeting-Id header (for fast transcription) or response data
        const meetingIdFromHeader = response.headers?.['x-meeting-id'] || response.headers?.['X-Meeting-Id'];
        const meetingIdFromData = response.data?.transcriptionId || (response.data as any)?.TranscriptionId || (response.data as any)?.meetingId;
        const transcriptionJobId = meetingIdFromHeader || meetingIdFromData;
        
        console.log('🔍 Available transcription ID fields:', {
          headerMeetingId: meetingIdFromHeader,
          transcriptionId: response.data?.transcriptionId,
          TranscriptionId: (response.data as any)?.TranscriptionId,
          meetingId: (response.data as any)?.meetingId
        });
        console.log('🎯 Using transcriptionJobId:', transcriptionJobId);
        
        // Check if transcription is already completed in the response
        const isAlreadyCompleted = response.data?.status === 'Completed' && response.data?.transcribedText;
        
        console.log('🔍 Transcription status check:', {
          status: response.data?.status,
          hasTranscribedText: !!response.data?.transcribedText,
          isAlreadyCompleted: isAlreadyCompleted,
          fullResponseData: response.data
        });
        
        if (isAlreadyCompleted) {
          console.log('🎯 Fast transcription completed during upload - showing immediate completion');
          
          // Complete the progress tracking
          completeFileProgress(uploadFile.id, true, response.data);
          
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    transcriptionJobId: transcriptionJobId,
                    result: response.data
                  }
                : f
            )
          );
          
          // Refresh balance since tokens were consumed
          refreshBalance();
          console.log('✅ Fast transcription completed for:', uploadFile.file.name);
        } else {
          // For fast transcription, show progress while processing
          // Start with processing status and update to completion when ready
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "processing",
                    progress: 30, // Initial progress
                    transcriptionJobId: transcriptionJobId,
                    // Store the immediate result if available, but don't mark as completed yet
                    ...(response.data?.transcribedText && { result: response.data })
                  }
                : f
            )
          );
          
          // Note: For fast transcription, the synthetic progress simulation 
          // in the upload section handles the gradual progress display
          
          // If we have immediate results, still refresh balance since tokens were consumed
          if (response.data?.transcribedText) {
            console.log('⚡ Fast transcription result available, but waiting for completion');
            refreshBalance();
          }
          
          console.log('📤 Upload completed, transcription in progress:', uploadFile.file.name);
        }
        } else {
          const errorData = response.errors?.[0] || response.message || "Upload failed";
          
          if (response.message === "Insufficient tokens to process this audio file" || 
              response.message === "Insufficient tokens for transcription processing" || 
              response.errorData?.error === "Insufficient tokens for transcription processing") {
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
    [onTranscriptionComplete, apiService]
  );

  const handleClearFile = useCallback((fileId: string) => {
    setUploadFiles((prev) => prev.filter(f => f.id !== fileId));
  }, []);

  // Process files after cost confirmation
  const processFiles = useCallback(async (validFiles: File[]) => {
    console.log('🚀 Processing files - ensuring clean upload queue state');
    
    // Only clear completed/error files, preserve active uploads
    setUploadFiles((prev) => {
      const activeJobs = prev.filter(f => f.status === "uploading" || f.status === "processing");
      if (activeJobs.length > 0) {
        console.log(`🔄 Preserving ${activeJobs.length} active uploads while starting new upload`);
        return activeJobs; // Keep only active uploads
      }
      console.log('🧹 No active uploads found, clearing all previous files');
      return []; // Clear everything if no active jobs
    });
    
    // Clear previous data when processing new files
    if (onClearPreviousData) {
      console.log('🧹 Clearing previous transcription data for new upload session');
      onClearPreviousData();
    }

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

    // Start with fresh queue - replace instead of append
    setUploadFiles(newFiles);
    newFiles.forEach((uploadFile) => {
      uploadFileToServer(uploadFile);
    });
  }, [uploadFileToServer, validateTokenBalance, tokenBalance, uploadFiles.length, onClearPreviousData, storeClearUploadQueue]);

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
        
        // Calculate token data using API for accuracy
        try {
          const [tokenCalc, fileEstimation] = await Promise.all([
            getTokenCalculationAsync(file),
            getFileEstimationAsync(file)
          ]);
          
          setPendingTokenCalc({ tokenCalc, fileEstimation });
          setCostDialogOpen(true);
        } catch (error) {
          console.error('Error calculating token data:', error);
          // Fallback to synchronous calculation if API fails
          setPendingTokenCalc(null);
          setCostDialogOpen(true);
        }
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
                {uploadFiles.filter((f) => f.status === "uploading" || f.status === "processing").length > 0 && (
                  <Chip
                    icon={
                      <CircularProgress 
                        size={16} 
                        thickness={6}
                        sx={{
                          '&.MuiCircularProgress-root': {
                            animationDuration: '1.4s !important',
                            animationTimingFunction: 'linear !important',
                            animationIterationCount: 'infinite !important',
                          }
                        }} 
                      />
                    }
                    label={`${uploadFiles.filter((f) => f.status === "uploading" || f.status === "processing").length} processing`}
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
            
            {/* Enhanced Progress System */}
            {uploadFiles.length > 0 && (
              <Box mt={2}>
                {uploadFiles.map((uploadFile) => (
                  <FileUploadProgress
                    key={uploadFile.id}
                    progressData={{
                      fileId: uploadFile.id,
                      fileName: uploadFile.file.name,
                      fileSize: uploadFile.file.size,
                      currentStage: uploadFile.currentStage || mapUploadStatusToProgressStage(uploadFile.status),
                      percentage: uploadFile.progress,
                      status: mapUploadStatusToProgressStatus(uploadFile.status),
                      error: uploadFile.error,
                      startTime: uploadFile.startTime || new Date(),
                      endTime: uploadFile.endTime,
                      timeRemaining: uploadFile.timeRemaining,
                      estimatedCompletion: uploadFile.estimatedCompletion,
                    }}
                    onCancel={handleClearFile}
                    onRetry={(fileId) => console.log('Retry not implemented yet for', fileId)}
                    compact={false}
                  />
                ))}
              </Box>
            )}
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
            setPendingTokenCalc(null);
          }}
          onConfirm={handleCostConfirm}
          fileName={pendingTokenCalc?.fileEstimation.fileName || getFileEstimation(pendingFile).fileName}
          fileSize={pendingTokenCalc?.fileEstimation.fileSize || getFileEstimation(pendingFile).fileSize}
          estimatedDuration={pendingTokenCalc?.tokenCalc.estimatedDuration || getTokenCalculation(pendingFile).estimatedDuration}
          requiredTokens={pendingTokenCalc?.tokenCalc.requiredTokens || getTokenCalculation(pendingFile).requiredTokens}
          availableTokens={tokenBalance}
          hasDiscount={pendingTokenCalc?.tokenCalc.hasDiscount || getTokenCalculation(pendingFile).hasDiscount}
          discountPercentage={pendingTokenCalc?.tokenCalc.discountPercentage || getTokenCalculation(pendingFile).discountPercentage}
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