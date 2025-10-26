import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Collapse, 
  IconButton, 
  Chip, 
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Speed as SpeedIcon,
  NetworkWifi as NetworkIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { usePerformanceMonitoring, usePerformanceValidation } from '../hooks/usePerformanceMonitoring';

interface PerformanceDebugProps {
  enableLogging?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  defaultExpanded?: boolean;
}

/**
 * Performance debugging component for S8.6 validation
 * Shows real-time network and performance metrics
 */
export function PerformanceDebug({ 
  enableLogging = false, 
  position = 'bottom-right',
  defaultExpanded = false 
}: PerformanceDebugProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    networkInfo,
    metrics,
    validation,
    isLoading,
    bundleImpact,
    remeasure
  } = usePerformanceMonitoring(enableLogging);

  const { grade, passes } = usePerformanceValidation();

  // Position styles
  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 9999,
      maxWidth: '400px',
      minWidth: '300px'
    };

    switch (position) {
      case 'top-right':
        return { ...base, top: 16, right: 16 };
      case 'top-left':
        return { ...base, top: 16, left: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      default:
        return { ...base, bottom: 16, right: 16 };
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'warning';
      case 'F': return 'error';
      default: return 'default';
    }
  };

  const getNetworkColor = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g': return 'success';
      case '3g': return 'info';
      case '2g': return 'warning';
      case 'slow-2g': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (ms: number) => `${Math.round(ms)}ms`;

  if (isLoading) {
    return (
      <Paper sx={getPositionStyles()} elevation={3}>
        <Box p={2}>
          <Typography variant="body2">Measuring performance...</Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={getPositionStyles()} elevation={3}>
      <Box p={1}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SpeedIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              S8.6 Performance
            </Typography>
            <Chip 
              label={`Grade ${grade}`} 
              size="small" 
              color={getGradeColor(grade) as any}
              variant="outlined"
            />
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Quick Status */}
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          {passes ? (
            <Chip 
              icon={<CheckIcon />} 
              label="3G Target Met" 
              color="success" 
              size="small" 
            />
          ) : (
            <Chip 
              icon={<WarningIcon />} 
              label="Needs Optimization" 
              color="warning" 
              size="small" 
            />
          )}
          
          {networkInfo && (
            <Chip 
              icon={<NetworkIcon />} 
              label={networkInfo.effectiveType.toUpperCase()} 
              color={getNetworkColor(networkInfo.effectiveType) as any}
              size="small" 
            />
          )}
        </Box>

        <Collapse in={isExpanded}>
          <Box mt={2}>
            {/* Performance Metrics */}
            {metrics && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      DOM Content Loaded
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(metrics.domContentLoaded)}
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      First Contentful Paint
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(metrics.firstContentfulPaint)}
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      Load Complete
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(metrics.loadComplete)}
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      Time to Interactive
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(metrics.timeToInteractive)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Network Impact */}
            {bundleImpact && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Bundle Load Times (194.76kB)
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      3G (Target)
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={bundleImpact.speed3G <= 3 ? 'success.main' : 'warning.main'}
                    >
                      {bundleImpact.speed3G.toFixed(1)}s
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      4G
                    </Typography>
                    <Typography variant="body2">
                      {bundleImpact.speed4G.toFixed(1)}s
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      2G
                    </Typography>
                    <Typography variant="body2">
                      {bundleImpact.speed2G.toFixed(1)}s
                    </Typography>
                  </Box>
                  <Box flex="1 1 45%">
                    <Typography variant="caption" color="textSecondary">
                      Fast (50Mbps)
                    </Typography>
                    <Typography variant="body2">
                      {bundleImpact.speedFast.toFixed(2)}s
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Network Info */}
            {networkInfo && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Network Information
                </Typography>
                <Typography variant="caption" display="block">
                  Type: {networkInfo.effectiveType.toUpperCase()}
                </Typography>
                <Typography variant="caption" display="block">
                  Downlink: {networkInfo.downlink} Mbps
                </Typography>
                <Typography variant="caption" display="block">
                  RTT: {networkInfo.rtt}ms
                </Typography>
              </Box>
            )}

            {/* Validation Results */}
            {validation && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  3G Validation
                </Typography>
                {validation.recommendations.map((rec, index) => (
                  <Alert 
                    key={index} 
                    severity={rec.startsWith('✅') ? 'success' : rec.startsWith('🚀') ? 'info' : 'warning'}
                    sx={{ mb: 1, py: 0 }}
                  >
                    <Typography variant="caption">{rec}</Typography>
                  </Alert>
                ))}
              </Box>
            )}

            {/* Actions */}
            <Box display="flex" gap={1} justifyContent="space-between">
              <IconButton size="small" onClick={remeasure} title="Remeasure">
                <AssessmentIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="textSecondary" onClick={() => setShowDetails(!showDetails)} sx={{ cursor: 'pointer' }}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}

export default PerformanceDebug;