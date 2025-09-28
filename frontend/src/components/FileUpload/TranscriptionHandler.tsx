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
  Error as ErrorIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import type { TranscriptionJobStatus } from '../../types/transcriptionJob';

interface TranscriptionHandlerProps {
  transcriptionJob: TranscriptionJobStatus;
  isPolling: boolean;
  transcriptionError?: string | null;
  onRetry?: () => void;
}

export const TranscriptionHandler: React.FC<TranscriptionHandlerProps> = ({
  transcriptionJob,
  isPolling,
  transcriptionError,
  onRetry
}) => {
  const getSeverity = () => {
    if (transcriptionError || transcriptionJob.status === 'failed') return 'error';
    switch (transcriptionJob.status) {
      case 'completed': return 'success';
      default: return 'info';
    }
  };

  // Convert technical error messages to user-friendly messages
  const getUserFriendlyError = (error: string): { title: string; message: string; suggestion: string } => {
    if (error.includes('503') || error.includes('Service Unavailable')) {
      return {
        title: 'Processing Service Temporarily Unavailable',
        message: 'Our fast transcription service is currently experiencing high demand or temporary maintenance.',
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
    
    if (error.includes('timeout') || error.includes('taking longer than expected')) {
      return {
        title: 'Processing Taking Longer Than Expected',
        message: 'Your transcription is taking longer than our typical 2-5 minutes.',
        suggestion: 'Please check back in a few minutes or try uploading again. Large files may need more time.'
      };
    }
    
    if (error.includes('file size') || error.includes('too large')) {
      return {
        title: 'File Size Limit Exceeded',
        message: 'Your audio file is too large for fast transcription processing.',
        suggestion: 'Please use files smaller than 200MB or 2 hours duration. Consider compressing your audio file.'
      };
    }
    
    if (error.includes('file format') || error.includes('unsupported')) {
      return {
        title: 'Unsupported File Format',
        message: 'The audio file format is not supported.',
        suggestion: 'Please use supported formats: MP3, WAV, M4A, FLAC, OGG, or WEBM.'
      };
    }
    
    return {
      title: 'Processing Error',
      message: 'An unexpected error occurred during transcription.',
      suggestion: 'Please try uploading your file again. If the problem continues, contact support.'
    };
  };

  const getStatusMessage = () => {
    const processingMethod = transcriptionJob.processingMethod || 'fast';
    const isUsingFastTranscription = processingMethod === 'fast';
    
    if (transcriptionError) {
      const errorInfo = getUserFriendlyError(transcriptionError);
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 0.5 }}>
            <ErrorIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            {errorInfo.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {errorInfo.message}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            💡 {errorInfo.suggestion}
          </Typography>
        </Box>
      );
    }

    if (transcriptionJob.status === 'failed') {
      const errorMessage = transcriptionJob.errorMessage || 'Unknown error occurred';
      const errorInfo = getUserFriendlyError(errorMessage);
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 0.5 }}>
            <ErrorIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            {errorInfo.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {errorInfo.message}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            💡 {errorInfo.suggestion}
          </Typography>
        </Box>
      );
    }

    if (transcriptionJob.status === 'completed') {
      const duration = transcriptionJob.processingDuration;
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
            ✅ Transcription completed successfully!
            {isUsingFastTranscription && (
              <SpeedIcon sx={{ fontSize: 16, ml: 0.5, color: 'success.main' }} />
            )}
          </Typography>
          {duration && (
            <Typography variant="body2" color="text.secondary">
              Processed in {duration}
              {isUsingFastTranscription && ' with Fast Transcription'}
            </Typography>
          )}
        </Box>
      );
    }

    if (transcriptionJob.status === 'processing') {
      const timeEstimate = isUsingFastTranscription 
        ? "2-5 minutes" 
        : `${transcriptionJob.estimatedDurationMinutes} minutes`;
        
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            {isUsingFastTranscription ? "🚀 Fast transcription in progress..." : "🔄 Processing your meeting..."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estimated completion: {timeEstimate}
            {isUsingFastTranscription && " (96% faster processing!)"}
          </Typography>
        </Box>
      );
    }

    if (transcriptionJob.status === 'submitted') {
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            {isUsingFastTranscription ? "⚡ Preparing fast transcription..." : "📋 Job submitted successfully"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isUsingFastTranscription 
              ? "Starting high-speed processing..." 
              : "Your transcription will begin shortly..."}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  const showRetryButton = () => {
    return (transcriptionError || transcriptionJob.status === 'failed') && onRetry;
  };

  return (
    <Alert 
      severity={getSeverity()}
      sx={{ 
        width: '100%',
        '& .MuiAlert-message': {
          width: '100%',
        }
      }}
      action={
        showRetryButton() ? (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            disabled={isPolling}
          >
            Retry
          </Button>
        ) : null
      }
    >
      <Box sx={{ width: '100%' }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          {transcriptionJob.fileName}
          {transcriptionJob.processingMethod === 'fast' && (
            <Typography component="span" variant="caption" 
              sx={{ ml: 1, px: 1, py: 0.25, bgcolor: 'success.light', 
                   color: 'success.contrastText', borderRadius: 1, fontWeight: 600 }}>
              FAST
            </Typography>
          )}
        </Typography>
        
        {(transcriptionJob.status === 'submitted' || transcriptionJob.status === 'processing') && (
          <LinearProgress 
            variant="determinate" 
            value={transcriptionJob.progressPercentage} 
            sx={{ 
              mb: 1,
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: transcriptionJob.processingMethod === 'fast' ? 'success.main' : 'primary.main'
              }
            }} 
          />
        )}
        
        {getStatusMessage()}
      </Box>
    </Alert>
  );
};

// Legacy export for backward compatibility during migration
export const BatchJobHandler = TranscriptionHandler;