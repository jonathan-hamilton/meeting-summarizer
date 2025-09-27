import React from 'react';
import {
  Box,
  Alert,
  Typography,
  LinearProgress,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import type { BatchJobStatus } from '../../types/batchJob';

interface BatchJobHandlerProps {
  batchJob: BatchJobStatus;
  isPolling: boolean;
  batchError?: string | null;
  onRetry?: () => void;
}

export const BatchJobHandler: React.FC<BatchJobHandlerProps> = ({
  batchJob,
  isPolling,
  batchError,
  onRetry
}) => {
  const getSeverity = () => {
    if (batchError || batchJob.status === 'failed') return 'error';
    switch (batchJob.status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'info';
    }
  };

  // Convert technical error messages to user-friendly messages
  const getUserFriendlyError = (error: string): { title: string; message: string; suggestion: string } => {
    if (error.includes('503') || error.includes('Service Unavailable')) {
      return {
        title: 'Processing Service Temporarily Unavailable',
        message: 'Our transcription service is currently experiencing high demand or temporary maintenance.',
        suggestion: 'Please try uploading your file again in a few minutes. Your tokens have not been charged.'
      };
    }
    
    if (error.includes('502') || error.includes('Bad Gateway')) {
      return {
        title: 'Connection Issue',
        message: 'There was a temporary connection problem with our processing service.',
        suggestion: 'Please try again. If the problem persists, contact support.'
      };
    }
    
    if (error.includes('timeout') || error.includes('Request timeout')) {
      return {
        title: 'Processing Taking Longer Than Expected',
        message: 'Your file is taking longer to process than usual.',
        suggestion: 'Longer audio files may take several minutes. Please wait or try again later.'
      };
    }
    
    if (error.includes('401') || error.includes('Unauthorized')) {
      return {
        title: 'Authentication Issue',
        message: 'Your session may have expired.',
        suggestion: 'Please sign out and sign back in to continue.'
      };
    }
    
    if (error.includes('429') || error.includes('Too Many Requests')) {
      return {
        title: 'Rate Limit Reached',
        message: 'You\'re uploading files too quickly.',
        suggestion: 'Please wait a moment before uploading another file.'
      };
    }
    
    // Generic network or server error
    return {
      title: 'Processing Error',
      message: 'We encountered an issue while processing your file.',
      suggestion: 'Please try uploading your file again. If the problem continues, contact our support team.'
    };
  };

  const formatJobError = (errorMessage: string) => {
    const friendly = getUserFriendlyError(errorMessage);
    return friendly;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Alert 
        severity={getSeverity()} 
        sx={{ mb: 1 }}
        icon={batchJob.status === 'failed' || batchError ? <ErrorIcon /> : undefined}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {batchJob.status === 'failed' || batchError 
            ? 'Processing Failed' 
            : `Processing: ${(batchJob as any).fileName}`
          }
        </Typography>
        
        {!batchError && !batchJob.errorMessage && (
          <>
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
          </>
        )}
        
        {/* Display user-friendly error messages */}
        {(batchJob.errorMessage || batchError) && (
          <>
            {(() => {
              const errorToFormat = batchJob.errorMessage || batchError || '';
              const friendly = formatJobError(errorToFormat);
              return (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {friendly.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {friendly.message}
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {friendly.suggestion}
                  </Typography>
                  
                  {onRetry && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={onRetry}
                      >
                        Try Again
                      </Button>
                    </Box>
                  )}
                </Box>
              );
            })()}
          </>
        )}
      </Alert>
    </Box>
  );
};