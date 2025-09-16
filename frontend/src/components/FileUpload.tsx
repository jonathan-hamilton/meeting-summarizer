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
  maxFileSize: _maxFileSize = 1073741824, // 1GB default (unused for now)
  acceptedFileTypes: _acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm', '.aac'], // unused for now
  isAuthDialogOpen = false,
}) => {
  const { mode, isDemo } = useAppMode();
  const { 
    startDemoUpload,
    demo: {
      isSimulatingUpload,
      simulatedProgress,
      selectedFileName: demoFileName,
      mockTranscripts
    }
  } = useEnhancedSessionStore();
  const { isActive: isTourActive, isCurrentStep, closeStep, triggerStepAction } = useTourStore();
  const { 
    currentJob: batchJob, 
    isPolling, 
    pollingError: batchError, 
    startPolling
  } = useBatchJobPollingStore({
    onJobCompleted: async (jobId) => {
      console.log(`🎉 BATCH JOB COMPLETED: ${jobId}`);
      // This will be handled by the existing useEffect that watches batchJob.status
    },
    onJobFailed: (jobId, error) => {
      console.error(`❌ BATCH JOB FAILED: ${jobId}`, error);
    }
  });

  const [uploadFiles, setUploadFiles] = useState<FileUploadFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const apiService = createApiService(mode);
  const hasCompletedFile = uploadFiles.some(f => f.status === 'completed');
  const demoCallbackCalledRef = useRef(false);

  // Parse TimeSpan format (HH:mm:ss or mm:ss or ss) to milliseconds
  const parseTimeSpanToMs = useCallback((timeSpanString: string): number => {
    if (!timeSpanString) return 0;
    
    const parts = timeSpanString.split(':');
    let hours = 0, minutes = 0, seconds = 0;
    
    if (parts.length === 3) {
      // HH:mm:ss format
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
      seconds = parseInt(parts[2]) || 0;
    } else if (parts.length === 2) {
      // mm:ss format
      minutes = parseInt(parts[0]) || 0;
      seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 1) {
      // ss format
      seconds = parseInt(parts[0]) || 0;
    }
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }, []);

  // Handle batch job completion - fetch transcript content when job completes
  useEffect(() => {
    if (batchJob && batchJob.status === 'completed' && !isDemo) {
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
                parseTimeSpanToMs(batchJob.processingDuration) : 0,
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
        }
      };

      fetchTranscript();
    }
  }, [batchJob, apiService, parseTimeSpanToMs, onTranscriptionComplete, isDemo]);

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

        const response = await apiService.uploadFile(uploadFile.file, (progress: number) => {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress: Math.round(progress * 100) }
                : f
            )
          );
        });

        if (response.success && response.data) {
          // Check if this is a batch job response (has JobId instead of immediate transcription)
          if (('JobId' in response.data && typeof response.data.JobId === 'string') || 
              ('jobId' in response.data && typeof response.data.jobId === 'string')) {
            // This is a batch job submission response
            const batchResponse = response.data as any;
            const jobId = batchResponse.JobId || batchResponse.jobId;
            console.log('⏳ BATCH JOB DETECTED - Starting polling for:', jobId);
            startPolling(jobId);
            
            // Update file status to show it's being processed via batch
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "uploading",
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
            if (onTranscriptionComplete && response.data) {
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

      const newFiles: FileUploadFile[] = validFiles.map((file: File) => ({
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