import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  Alert
} from '@mui/material';
import { AudioFile, CheckCircle, Psychology } from '@mui/icons-material';
import { WorkflowStepper } from './WorkflowStepper';
import { BatchJobHandler } from './BatchJobHandler';
// Import removed - formatDuration not used
import type { FileUploadFile, BatchJobStatus } from './types';

interface UploadProgressProps {
  uploadFiles: FileUploadFile[];
  batchJob?: BatchJobStatus | null;
  isPolling?: boolean;
  batchError?: string | null;
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
  batchJob,
  isPolling = false,
  batchError
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
              batchJob={batchJob || undefined} 
            />

            {/* Batch Job Status Information */}
            {batchJob && (
              <BatchJobHandler 
                batchJob={batchJob}
                isPolling={isPolling}
                batchError={batchError}
              />
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
                  {uploadFile.result.processingTimeMs && !isNaN(uploadFile.result.processingTimeMs) 
                    ? formatTime(Math.round(uploadFile.result.processingTimeMs / 1000))
                    : "N/A"}
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