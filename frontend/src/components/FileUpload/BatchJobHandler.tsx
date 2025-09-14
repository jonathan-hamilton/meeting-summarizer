import React from 'react';
import {
  Box,
  Alert,
  Typography,
  LinearProgress
} from '@mui/material';
import type { BatchJobStatus } from './types';

interface BatchJobHandlerProps {
  batchJob: BatchJobStatus;
  isPolling: boolean;
  batchError?: string | null;
}

export const BatchJobHandler: React.FC<BatchJobHandlerProps> = ({
  batchJob,
  isPolling,
  batchError
}) => {
  const getSeverity = () => {
    switch (batchJob.status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity={getSeverity()} sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          Batch Job: {(batchJob as any).fileName}
        </Typography>
        <Typography variant="caption" display="block">
          Status: {batchJob.status.charAt(0).toUpperCase() + batchJob.status.slice(1)}
          {batchJob.status === 'processing' && ` (${(batchJob as any).progressPercentage}%)`}
        </Typography>
        
        {batchJob.status === 'processing' && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(batchJob as any).progressPercentage || 0} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
        
        <Typography variant="caption" display="block">
          Estimated Duration: {(batchJob as any).estimatedDurationMinutes} minutes
        </Typography>
        
        {batchJob.status === 'processing' && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {isPolling ? '🔄 Checking status...' : '⏸️ Monitoring paused'}
          </Typography>
        )}
        
        {batchJob.status === 'completed' && (batchJob as any).processingDuration && (
          <Typography variant="caption" display="block">
            Processing Time: {(batchJob as any).processingDuration}
          </Typography>
        )}
        
        {(batchJob as any).errorMessage && (
          <Typography variant="caption" display="block" color="error">
            Error: {(batchJob as any).errorMessage}
          </Typography>
        )}
      </Alert>

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
    </Box>
  );
};