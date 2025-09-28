import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { AudioFile, CheckCircle, Psychology, Clear } from '@mui/icons-material';
import { WorkflowStepper } from './WorkflowStepper';
import { TranscriptionHandler } from './TranscriptionHandler';
// Import removed - formatDuration not used
import type { FileUploadFile } from './types';
import type { TranscriptionJobStatus } from '../../types/transcriptionJob';

interface UploadProgressProps {
  uploadFiles: FileUploadFile[];
  transcriptionJob?: TranscriptionJobStatus | null; // Updated from batchJob
  batchJob?: TranscriptionJobStatus | null; // Legacy support during migration
  isPolling?: boolean;
  transcriptionError?: string | null; // Updated from batchError
  batchError?: string | null; // Legacy support during migration
  onClearFile?: (fileId: string) => void;
  onRetryFile?: (fileId: string) => void;
  onRetryTranscriptionJob?: () => void; // Updated from onRetryBatchJob
  onRetryBatchJob?: () => void; // Legacy support during migration
}

const getStatusIcon = (status: FileUploadFile["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle color="success" />;
    case "error":
      return <AudioFile color="error" />;
    case "uploading":
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
  batchJob,
  isPolling = false,
  transcriptionError,
  batchError,
  onClearFile,
  onRetryFile: _onRetryFile, // Unused for now
  onRetryTranscriptionJob,
  onRetryBatchJob
}) => {
  if (uploadFiles.length === 0) {
    return null;
  }

  return (
    <List>
      {uploadFiles.map((uploadFile) => (
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

            {/* Workflow Progress Stepper */}
            <WorkflowStepper 
              uploadFile={uploadFile} 
              batchJob={(transcriptionJob || batchJob) as any || undefined} 
            />

            {/* Transcription Job Status Information */}
            {(transcriptionJob || batchJob) && (
              <TranscriptionHandler 
                transcriptionJob={transcriptionJob || batchJob!}
                isPolling={isPolling}
                transcriptionError={transcriptionError || batchError}
                onRetry={onRetryTranscriptionJob || onRetryBatchJob}
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
      ))}
    </List>
  );
};