import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Divider,
  useTheme,
  styled,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { GlobalProgressData } from '../../types/progress';
import { formatTimeRemaining } from '../../types/progress';

interface GlobalProgressIndicatorProps {
  globalProgress: GlobalProgressData;
  className?: string;
  showDetails?: boolean;
  onShowProgressDashboard?: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: theme.zIndex.appBar - 1,
  backdropFilter: 'blur(8px)',
  backgroundColor: theme.palette.mode === 'light' 
    ? 'rgba(255, 255, 255, 0.95)'
    : 'rgba(18, 18, 18, 0.95)',
  border: `1px solid ${theme.palette.divider}`,
}));

const ProgressContainer = styled(Box)(() => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .progress-text': {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    textAlign: 'center',
  },
}));

const StatusChip = styled(Chip)(() => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
  '& .MuiChip-icon': {
    fontSize: '1rem',
  },
}));

export const GlobalProgressIndicator: React.FC<GlobalProgressIndicatorProps> = ({
  globalProgress,
  className,
  showDetails = false,
  onShowProgressDashboard,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(showDetails);
  
  const {
    activeUploads,
    completedUploads,
    failedUploads,
    totalProgress,
    estimatedTimeRemaining,
  } = globalProgress;

  const totalUploads = activeUploads + completedUploads + failedUploads;
  const hasActiveUploads = activeUploads > 0;
  const hasAnyUploads = totalUploads > 0;

  // Don't render if no uploads
  if (!hasAnyUploads) {
    return null;
  }

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <StyledCard className={className} elevation={3}>
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        {/* Main progress display */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <ProgressContainer>
              <CircularProgress
                variant="determinate"
                value={totalProgress}
                size={50}
                thickness={4}
                color={hasActiveUploads ? 'primary' : 'success'}
                sx={{
                  opacity: hasActiveUploads ? 1 : 0.7,
                }}
              />
              <Box className="progress-text">
                <Typography 
                  variant="caption" 
                  component="div" 
                  color="text.primary"
                  fontWeight="bold"
                >
                  {Math.round(totalProgress)}%
                </Typography>
              </Box>
            </ProgressContainer>

            <Box>
              <Typography variant="h6" component="h3">
                {hasActiveUploads ? 'Processing Files' : 'Uploads Complete'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalUploads} file{totalUploads !== 1 ? 's' : ''} total
              </Typography>
            </Box>
          </Box>

          {/* Quick status and expand button */}
          <Box display="flex" alignItems="center" gap={1}>
            {hasActiveUploads && estimatedTimeRemaining && (
              <Box textAlign="right" mr={1}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatTimeRemaining(estimatedTimeRemaining)} remaining
                </Typography>
              </Box>
            )}
            
            <IconButton
              onClick={handleToggleExpanded}
              size="small"
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Expandable details */}
        <Collapse in={expanded}>
          <Box mt={2}>
            <Divider sx={{ mb: 2 }} />
            
            {/* Status breakdown */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {activeUploads > 0 && (
                <StatusChip
                  icon={<UploadIcon />}
                  label={`${activeUploads} active`}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {completedUploads > 0 && (
                <StatusChip
                  icon={<CheckCircleIcon />}
                  label={`${completedUploads} completed`}
                  color="success"
                  variant="outlined"
                />
              )}
              
              {failedUploads > 0 && (
                <StatusChip
                  icon={<ErrorIcon />}
                  label={`${failedUploads} failed`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Additional information */}
            {hasActiveUploads && (
              <Box 
                sx={{ 
                  p: 1.5, 
                  backgroundColor: theme.palette.mode === 'light' 
                    ? theme.palette.grey[50] 
                    : theme.palette.grey[900],
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ScheduleIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {activeUploads === 1 
                    ? 'File is being processed in the background. You can continue using the app.'
                    : `${activeUploads} files are being processed in the background. You can continue using the app.`
                  }
                </Typography>
              </Box>
            )}

            {/* Dashboard link */}
            {onShowProgressDashboard && (
              <Box mt={2} textAlign="center">
                <Typography 
                  variant="body2" 
                  color="primary" 
                  sx={{ 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    '&:hover': {
                      textDecoration: 'none',
                    },
                  }}
                  onClick={onShowProgressDashboard}
                >
                  View detailed progress dashboard
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </StyledCard>
  );
};

// Compact version for mobile or smaller spaces
interface CompactGlobalProgressProps {
  globalProgress: GlobalProgressData;
  onClick?: () => void;
}

export const CompactGlobalProgress: React.FC<CompactGlobalProgressProps> = ({
  globalProgress,
  onClick,
}) => {
  const {
    activeUploads,
    completedUploads,
    failedUploads,
    totalProgress,
  } = globalProgress;

  const totalUploads = activeUploads + completedUploads + failedUploads;
  const hasActiveUploads = activeUploads > 0;

  // Don't render if no uploads
  if (totalUploads === 0) {
    return null;
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'background.paper',
        '&:hover': onClick ? {
          backgroundColor: 'action.hover',
        } : {},
      }}
    >
      <CircularProgress
        variant="determinate"
        value={totalProgress}
        size={32}
        thickness={4}
        color={hasActiveUploads ? 'primary' : 'success'}
      />
      
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" noWrap>
          {hasActiveUploads ? `${activeUploads} active` : 'Complete'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {totalUploads} total • {completedUploads} done
          {failedUploads > 0 && ` • ${failedUploads} failed`}
        </Typography>
      </Box>
    </Box>
  );
};

export default GlobalProgressIndicator;