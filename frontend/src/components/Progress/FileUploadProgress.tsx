import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as UploadIcon,
  Settings as ProcessingIcon,
  Transcribe as TranscribeIcon,
} from '@mui/icons-material';
import type { FileProgressData, ProcessingStage } from '../../types/progress';
import { PROCESSING_STAGES, formatTimeRemaining } from '../../types/progress';

interface FileUploadProgressProps {
  progressData: FileProgressData;
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onShowDetails?: (fileId: string) => void;
  compact?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-1px)',
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.mode === 'light' 
    ? theme.palette.grey[200] 
    : theme.palette.grey[800],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.secondary.main} 100%)`,
  },
}));

const StageChip = styled(Chip)(() => ({
  fontWeight: 600,
  minWidth: 120,
  '& .MuiChip-icon': {
    fontSize: '1.1rem',
  },
}));

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  progressData,
  onCancel,
  onRetry,
  onShowDetails,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    fileId,
    fileName,
    fileSize,
    currentStage,
    percentage,
    timeRemaining,
    error,
    status,
  } = progressData;

  // Get stage icon and color
  const stageConfig = useMemo(() => {
    const getStageIcon = (stage: ProcessingStage) => {
      switch (stage) {
        case 'upload': return <UploadIcon />;
        case 'processing': return <ProcessingIcon />;
        case 'transcription': return <TranscribeIcon />;
        case 'complete': return <CheckCircleIcon />;
        default: return <InfoIcon />;
      }
    };

    const getStageColor = (stage: ProcessingStage) => {
      switch (stage) {
        case 'upload': return 'info';
        case 'processing': return 'warning';
        case 'transcription': return 'primary';
        case 'complete': return 'success';
        default: return 'default';
      }
    };

    // Override for cancelled status
    if (status === 'cancelled') {
      return {
        icon: <CancelIcon />,
        color: 'warning',
        label: 'Cancelled',
        description: 'Upload cancelled by user',
      };
    }

    return {
      icon: getStageIcon(currentStage),
      color: getStageColor(currentStage),
      label: PROCESSING_STAGES[currentStage]?.label || currentStage,
      description: PROCESSING_STAGES[currentStage]?.description || '',
    };
  }, [currentStage, status]);

  // Format file size
  const formattedSize = useMemo(() => {
    const sizeMB = fileSize / (1024 * 1024);
    return sizeMB < 1 
      ? `${(fileSize / 1024).toFixed(1)} KB`
      : `${sizeMB.toFixed(1)} MB`;
  }, [fileSize]);

  // Determine progress color based on status
  const progressColor = useMemo(() => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      default: return 'primary';
    }
  }, [status]);

  // Render compact version for mobile or small spaces
  if (compact) {
    return (
      <Box 
        sx={{ 
          p: isMobile ? 2 : 1, // More padding on mobile for touch-friendly design
          border: 1, 
          borderColor: 'divider', 
          borderRadius: isMobile ? 2 : 1, // Larger border radius on mobile
          mb: isMobile ? 2 : 1, // More spacing between items on mobile
          minHeight: isMobile ? 80 : 'auto', // Minimum height for touch targets
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Header with file name, percentage, and actions */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box flex={1} minWidth={0}>
            <Typography 
              variant={isMobile ? "body1" : "body2"} 
              noWrap 
              sx={{ 
                fontWeight: 500,
                fontSize: isMobile ? '0.95rem' : '0.875rem',
              }}
            >
              {fileName}
            </Typography>
            {isMobile && (
              <Typography variant="caption" color="text.secondary">
                {formattedSize}
              </Typography>
            )}
          </Box>
          
          {/* Actions with touch-friendly sizing */}
          <Box display="flex" alignItems="center" gap={isMobile ? 1 : 0.5}>
            <Typography 
              variant={isMobile ? "body2" : "caption"} 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {percentage}%
            </Typography>
            
            {/* Action buttons with S8.3 touch optimization */}
            {(status === 'failed' && onRetry) && (
              <IconButton 
                size={isMobile ? "medium" : "small"}
                onClick={() => onRetry(fileId)}
                color="primary"
                sx={{ 
                  minHeight: isMobile ? 44 : 'auto', // S8.3 touch target
                  minWidth: isMobile ? 44 : 'auto',
                }}
                aria-label={`Retry upload for ${fileName}`}
              >
                <UploadIcon fontSize={isMobile ? "medium" : "small"} />
              </IconButton>
            )}
            
            {((status === 'active' || status === 'pending') && onCancel) && (
              <IconButton 
                size={isMobile ? "medium" : "small"}
                onClick={() => onCancel(fileId)}
                color="error"
                sx={{ 
                  minHeight: isMobile ? 44 : 'auto', // S8.3 touch target
                  minWidth: isMobile ? 44 : 'auto',
                }}
                aria-label={`Cancel upload for ${fileName}`}
              >
                <CancelIcon fontSize={isMobile ? "medium" : "small"} />
              </IconButton>
            )}
          </Box>
        </Box>
        
        {/* Progress bar with enhanced mobile styling */}
        <StyledLinearProgress 
          variant="determinate" 
          value={percentage} 
          color={progressColor}
          sx={{
            height: isMobile ? 6 : 4, // Slightly thicker on mobile for better visibility
            mb: 1,
          }}
          aria-label={`Upload progress for ${fileName}`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        
        {/* Status and time info */}
        <Box display="flex" alignItems="center" justifyContent={timeRemaining ? "space-between" : "center"} flexWrap="wrap">
          <StageChip
            icon={stageConfig.icon}
            label={isMobile ? stageConfig.label : stageConfig.label.substring(0, 8) + '...'} // Truncate on very small screens
            color={stageConfig.color as any}
            size={isMobile ? "medium" : "small"}
            variant="outlined"
            sx={{
              minHeight: isMobile ? 32 : 'auto', // Touch-friendly chip height
              fontSize: isMobile ? '0.75rem' : '0.6875rem',
            }}
          />
          {timeRemaining && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.6875rem' }}
            >
              {formatTimeRemaining(timeRemaining)}
            </Typography>
          )}
        </Box>
        
        {/* Error message for mobile */}
        {error && (
          <Box 
            sx={{ 
              mt: 1, 
              p: 1, 
              backgroundColor: theme.palette.error.light,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ErrorIcon color="error" fontSize="small" />
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Full version for desktop and tablets
  return (
    <StyledCard elevation={2}>
      <CardContent sx={{ 
        pb: '16px !important',
        p: isMobile ? 2 : 3, // Responsive padding
      }}>
        {/* Header with file name and actions */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box flex={1} minWidth={0}>
            <Typography 
              variant="h6" 
              component="h3" 
              noWrap
              sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
            >
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formattedSize}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            {onShowDetails && (
              <Tooltip title="Show details">
                <IconButton 
                  size={isMobile ? "medium" : "small"}
                  onClick={() => onShowDetails(fileId)}
                  sx={{ 
                    minHeight: isMobile ? 44 : 'auto', // S8.3 touch target
                    minWidth: isMobile ? 44 : 'auto',
                  }}
                  aria-label={`Show details for ${fileName}`}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {status === 'failed' && onRetry && (
              <Tooltip title="Retry upload">
                <IconButton 
                  size={isMobile ? "medium" : "small"}
                  onClick={() => onRetry(fileId)}
                  color="primary"
                  sx={{ 
                    minHeight: isMobile ? 44 : 'auto', // S8.3 touch target
                    minWidth: isMobile ? 44 : 'auto',
                  }}
                  aria-label={`Retry upload for ${fileName}`}
                >
                  <UploadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {(status === 'active' || status === 'pending') && onCancel && (
              <Tooltip title="Cancel upload">
                <IconButton 
                  size={isMobile ? "medium" : "small"}
                  onClick={() => onCancel(fileId)}
                  color="error"
                  sx={{ 
                    minHeight: isMobile ? 44 : 'auto', // S8.3 touch target
                    minWidth: isMobile ? 44 : 'auto',
                  }}
                  aria-label={`Cancel upload for ${fileName}`}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Progress bar */}
        <Box mb={2}>
          <StyledLinearProgress 
            variant="determinate" 
            value={percentage} 
            color={progressColor}
            sx={{ height: isMobile ? 8 : 6 }} // Responsive height
            aria-label={`Upload progress for ${fileName}`}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${percentage}% complete, ${stageConfig.label} stage`}
          />
        </Box>

        {/* Status information */}
        <Box display="flex" alignItems="center" justifyContent={timeRemaining && status === 'active' ? "space-between" : "center"} flexWrap="wrap" gap={1}>
          <StageChip
            icon={stageConfig.icon}
            label={stageConfig.label}
            color={stageConfig.color as any}
            variant={status === 'active' ? 'filled' : 'outlined'}
            sx={{ minHeight: isMobile ? 36 : 'auto' }} // Touch-friendly chip
          />
          
          {(timeRemaining && status === 'active') && (
            <Box display="flex" alignItems="center" gap={2}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.9rem' : '0.875rem' }}
              >
                {percentage}%
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.9rem' : '0.875rem' }}
              >
                {formatTimeRemaining(timeRemaining)} remaining
              </Typography>
            </Box>
          )}
          
          {(!timeRemaining || status !== 'active') && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.9rem' : '0.875rem' }}
            >
              {percentage}%
            </Typography>
          )}
        </Box>

        {/* Stage description */}
        {!compact && stageConfig.description && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block' }}
          >
            {stageConfig.description}
          </Typography>
        )}

        {/* Error message */}
        {error && (
          <Box 
            sx={{ 
              mt: 2, 
              p: 1, 
              backgroundColor: theme.palette.error.light,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ErrorIcon color="error" fontSize="small" />
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default FileUploadProgress;