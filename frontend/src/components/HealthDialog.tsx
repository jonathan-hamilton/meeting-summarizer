import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Refresh,
  CheckCircle,
  Error,
  Close,
  Computer,
  Memory,
  Timer,
  Storage,
} from "@mui/icons-material";
import apiService from "../services/apiService";
import type {
  HealthStatus,
  DetailedHealthStatus,
  LoadingState,
} from "../types";

interface HealthDialogProps {
  open: boolean;
  onClose: () => void;
}

export const HealthDialog: React.FC<HealthDialogProps> = ({
  open,
  onClose,
}) => {
  const [basicHealth, setBasicHealth] = useState<HealthStatus | null>(null);
  const [detailedHealth, setDetailedHealth] =
    useState<DetailedHealthStatus | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const fetchHealthData = async () => {
    setLoading({ isLoading: true, error: null });

    try {
      // Fetch basic health
      const basicResponse = await apiService.getHealth();
      if (basicResponse.success) {
        setBasicHealth(basicResponse.data || null);
      } else {
        const message = basicResponse.message || "Failed to fetch basic health";
        throw new globalThis.Error(message);
      }

      // Fetch detailed health
      const detailedResponse = await apiService.getDetailedHealth();
      if (detailedResponse.success) {
        setDetailedHealth(detailedResponse.data || null);
      } else {
        console.warn(
          "Detailed health endpoint failed:",
          detailedResponse.message
        );
      }
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || "Failed to fetch health data";
      setLoading({ isLoading: false, error: errorMessage });
      setBasicHealth(null);
      setDetailedHealth(null);
    } finally {
      if (!loading.error) {
        setLoading({ isLoading: false, error: null });
      }
    }
  };

  useEffect(() => {
    if (open) {
      fetchHealthData();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds}s`);

    return parts.join(" ");
  };

  const getHealthStatusChip = (status: string) => {
    if (status === "Healthy") {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Healthy"
          color="success"
          variant="filled"
        />
      );
    } else {
      return (
        <Chip
          icon={<Error />}
          label="Unhealthy"
          color="error"
          variant="filled"
        />
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">API Health Check</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading.isLoading && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Checking server health...
            </Typography>
          </Box>
        )}

        {loading.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Health Check Failed:</strong> {loading.error}
            </Typography>
          </Alert>
        )}

        {!loading.isLoading && !loading.error && basicHealth && (
          <Stack spacing={3}>
            {/* Basic Health Status */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Health Status
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                {getHealthStatusChip(basicHealth.status)}
                <Typography variant="body2" color="text.secondary">
                  Last checked: {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Detailed Health Information */}
            {detailedHealth && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Detailed Health Information
                  </Typography>

                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Computer fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Version:</strong> {detailedHealth.version}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Computer fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Service:</strong> {detailedHealth.service}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Storage fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Environment:</strong>{" "}
                        {detailedHealth.environment}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Computer fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Machine:</strong> {detailedHealth.machineName}
                      </Typography>
                    </Box>

                    {detailedHealth.upTime && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Timer fontSize="small" color="primary" />
                        <Typography variant="body2">
                          <strong>Uptime:</strong>{" "}
                          {formatUptime(detailedHealth.upTime)}
                        </Typography>
                      </Box>
                    )}

                    {detailedHealth.workingSet && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Memory fontSize="small" color="primary" />
                        <Typography variant="body2">
                          <strong>Memory Usage:</strong>{" "}
                          {Math.round(detailedHealth.workingSet / 1024 / 1024)}{" "}
                          MB
                        </Typography>
                      </Box>
                    )}

                    {detailedHealth.processorCount && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Computer fontSize="small" color="primary" />
                        <Typography variant="body2">
                          <strong>Processors:</strong>{" "}
                          {detailedHealth.processorCount}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={fetchHealthData}
          disabled={loading.isLoading}
          startIcon={<Refresh />}
          variant="outlined"
        >
          Refresh
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
