import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { AudioFile, CheckCircle, Psychology, Clear } from '@mui/icons-material';
import { WorkflowStepper } from './WorkflowStepper';
import { TranscriptionHandler } from './TranscriptionHandler';
// Import removed - formatDuration not used
import type { FileUploadFile } from './types';
import type { TranscriptionJobStatus } from '../../types/transcriptionJob';

interface UploadProgressProps {
  uploadFiles: FileUploadFile[];
  transcriptionJob?: TranscriptionJobStatus | null;
  isPolling?: boolean;
  transcriptionError?: string | null;
  onClearFile?: (fileId: string) => void;
  onRetryFile?: (fileId: string) => void;
  onRetryTranscriptionJob?: () => void;
}

const getStatusIcon = (status: FileUploadFile["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle color="success" />;
    case "error":
      return <AudioFile color="error" />;
    case "uploading":
    case "processing":
    case "pending":
      return <AudioFile color="primary" />;
    default:
      return <AudioFile />;
  }
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploadFiles,
  transcriptionJob,
  isPolling = false,
  transcriptionError,
  onClearFile,
  onRetryFile: _onRetryFile, // Unused for now
  onRetryTranscriptionJob
}) => {
  if (uploadFiles.length === 0) {
    return null;
  }

  return (
    <List>
      {uploadFiles.map((uploadFile) => {
        // Simple progress calculation
        const progressPercentage = uploadFile.status === 'completed' 
          ? 100 // Only show 100% when truly completed
          : uploadFile.status === 'processing'
          ? 50 // Show 50% when processing (transcribing)
          : uploadFile.progress; // Use upload progress for uploading state

        return (
        <ListItem key={uploadFile.id} divider>
          <Box sx={{ display: "flex", alignItems: "flex-start", mr: 2 }}>
            {getStatusIcon(uploadFile.status)}
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            {/* File name and status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="body1">
                {uploadFile.file.name}
              </Typography>
            </Box>

            {/* Workflow Progress Stepper with real-time progress */}
            <WorkflowStepper 
              uploadStatus={uploadFile.status}
              processingStatus={uploadFile.status === 'processing' ? 'processing' : 
                              uploadFile.status === 'completed' ? 'completed' : 
                              uploadFile.status === 'error' ? 'error' : 'pending'} // Handle error status
              isComplete={uploadFile.status === 'completed'} // S6.13: Complete when upload/transcription finishes
              progressPercentage={progressPercentage}
            />

            {/* Enhanced Progress Display */}
            {uploadFile.status === 'processing' && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ flexGrow: 1 }}>
                    {progressPercentage > 0 
                      ? `Transcribing... ${Math.round(progressPercentage)}% complete`
                      : 'Transcribing... Please wait'
                    }
                  </Typography>
                  {progressPercentage > 0 && (
                    <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.6rem' }}>
                      ● Processing
                    </Typography>
                  )}
                </Box>
                <LinearProgress 
                  variant={progressPercentage > 0 ? "determinate" : "indeterminate"}
                  value={progressPercentage}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            )}

            {/* Upload Progress Display */}
            {uploadFile.status === 'uploading' && uploadFile.progress > 0 && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ flexGrow: 1 }}>
                    Uploading... {Math.round(uploadFile.progress)}% complete
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate"
                  value={uploadFile.progress}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            )}

            {/* Transcription Job Status Information */}
            {transcriptionJob && (
              <TranscriptionHandler 
                transcriptionJob={transcriptionJob!}
                isPolling={isPolling}
                transcriptionError={transcriptionError}
                onRetry={onRetryTranscriptionJob}
              />
            )}

            {/* Error Display */}
            {uploadFile.error && (
              <Alert 
                severity="error" 
                sx={{ mt: 1 }}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Try again with a different file">
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={() => onClearFile?.(uploadFile.id)}
                      >
                        <Clear />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                {uploadFile.error}
              </Alert>
            )}

            {/* Success Display */}
            {uploadFile.result && (
              <Alert severity="success" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {uploadFile.successMessage || `✅ Transcription completed in ${
                    uploadFile.result.processingTimeMs && !isNaN(uploadFile.result.processingTimeMs) 
                      ? formatTime(Math.round(uploadFile.result.processingTimeMs / 1000))
                      : "N/A"
                  }`}
                </Typography>
                {uploadFile.result.speakerCount &&
                  uploadFile.result.speakerCount > 1 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Psychology sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" display="block">
                        Detected {uploadFile.result.speakerCount} speakers
                      </Typography>
                    </Box>
                  )}
              </Alert>
            )}
          </Box>
        </ListItem>
        );
      })}
    </List>
  );
};