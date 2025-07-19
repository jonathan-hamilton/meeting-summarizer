import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import { Refresh, CheckCircle, Error } from "@mui/icons-material";
import apiService from "../services/apiService";
import type {
  HealthStatus,
  DetailedHealthStatus,
  LoadingState,
} from "../types";

export const HealthCheck: React.FC = () => {
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof globalThis.Error
          ? error.message
          : "Unknown error occurred";
      setLoading({ isLoading: false, error: errorMessage });
      return;
    }

    setLoading({ isLoading: false, error: null });
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "ok":
        return "success";
      case "unhealthy":
      case "error":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: "auto", mt: 4 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h2">
            API Health Check
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchHealthData}
            disabled={loading.isLoading}
            startIcon={
              loading.isLoading ? <CircularProgress size={20} /> : <Refresh />
            }
          >
            Refresh
          </Button>
        </Box>

        {loading.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Connection Error:</strong> {loading.error}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Make sure the API is running at: {apiService.getBaseURL()}
            </Typography>
          </Alert>
        )}

        {basicHealth && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Basic Health Status
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={
                  basicHealth.status.toLowerCase() === "healthy" ? (
                    <CheckCircle />
                  ) : (
                    <Error />
                  )
                }
                label={basicHealth.status}
                color={getStatusColor(basicHealth.status)}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Last checked: {new Date(basicHealth.timestamp).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
        )}

        {detailedHealth && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Detailed Health Information
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Version:</strong> {detailedHealth.version}
              </Typography>
              <Typography variant="body2">
                <strong>Service:</strong> {detailedHealth.service}
              </Typography>
              <Typography variant="body2">
                <strong>Environment:</strong> {detailedHealth.environment}
              </Typography>
              <Typography variant="body2">
                <strong>Machine:</strong> {detailedHealth.machineName}
              </Typography>
              <Typography variant="body2">
                <strong>Uptime:</strong>{" "}
                {Math.floor(detailedHealth.upTime / 1000)} seconds
              </Typography>
              <Typography variant="body2">
                <strong>Memory Usage:</strong>{" "}
                {Math.round(detailedHealth.workingSet / 1024 / 1024)} MB
              </Typography>
              <Typography variant="body2">
                <strong>Processors:</strong> {detailedHealth.processorCount}
              </Typography>
            </Stack>
          </Box>
        )}

        {!loading.isLoading && !loading.error && !basicHealth && (
          <Alert severity="info">
            Click "Refresh" to check API health status
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
