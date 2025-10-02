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
  Summarize as SummarizeIcon,
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
        case 'summarization': return <SummarizeIcon />;
        case 'complete': return <CheckCircleIcon />;
        default: return <InfoIcon />;
      }
    };

    const getStageColor = (stage: ProcessingStage) => {
      switch (stage) {
        case 'upload': return 'info';
        case 'processing': return 'warning';
        case 'transcription': return 'primary';
        case 'summarization': return 'secondary';
        case 'complete': return 'success';
        default: return 'default';
      }
    };

    return {
      icon: getStageIcon(currentStage),
      color: getStageColor(currentStage),
      label: PROCESSING_STAGES[currentStage]?.label || currentStage,
      description: PROCESSING_STAGES[currentStage]?.description || '',
    };
  }, [currentStage]);

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
          p: 1, 
          border: 1, 
          borderColor: 'divider', 
          borderRadius: 1,
          mb: 1 
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
            {fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {percentage}%
          </Typography>
        </Box>
        
        <StyledLinearProgress 
          variant="determinate" 
          value={percentage} 
          color={progressColor}
          aria-label={`Upload progress for ${fileName}`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
          <StageChip
            icon={stageConfig.icon}
            label={stageConfig.label}
            color={stageConfig.color as any}
            size="small"
            variant="outlined"
          />
          {timeRemaining && (
            <Typography variant="caption" color="text.secondary">
              {formatTimeRemaining(timeRemaining)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Full version for desktop
  return (
    <StyledCard elevation={2}>
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Header with file name and actions */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" component="h3" noWrap>
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
                  size="small" 
                  onClick={() => onShowDetails(fileId)}
                  aria-label={`Show details for ${fileName}`}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {status === 'failed' && onRetry && (
              <Tooltip title="Retry upload">
                <IconButton 
                  size="small" 
                  onClick={() => onRetry(fileId)}
                  color="primary"
                  aria-label={`Retry upload for ${fileName}`}
                >
                  <UploadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {(status === 'active' || status === 'pending') && onCancel && (
              <Tooltip title="Cancel upload">
                <IconButton 
                  size="small" 
                  onClick={() => onCancel(fileId)}
                  color="error"
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
            aria-label={`Upload progress for ${fileName}`}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${percentage}% complete, ${stageConfig.label} stage`}
          />
        </Box>

        {/* Status information */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <StageChip
            icon={stageConfig.icon}
            label={stageConfig.label}
            color={stageConfig.color as any}
            variant={status === 'active' ? 'filled' : 'outlined'}
          />
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {percentage}%
            </Typography>
            
            {timeRemaining && status === 'active' && (
              <Typography variant="body2" color="text.secondary">
                {formatTimeRemaining(timeRemaining)} remaining
              </Typography>
            )}
          </Box>
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