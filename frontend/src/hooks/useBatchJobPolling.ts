import { useState, useEffect, useRef, useCallback } from 'react';
import { createApiService } from '../services/apiServiceFactory';
import { useAppMode } from '../contexts/AppModeContext';
import type { BatchJobStatus } from '../types/batchJob';

interface UseBatchJobPollingOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds, default 30 seconds
  maxRetries?: number;
}

interface UseBatchJobPollingReturn {
  batchJob: BatchJobStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  retry: () => void;
}

/**
 * Hook for polling batch job status
 * Automatically stops polling when job is completed or failed
 */
export const useBatchJobPolling = (
  options: UseBatchJobPollingOptions = {}
): UseBatchJobPollingReturn => {
  const {
    enabled = true,
    pollInterval = 30000, // 30 seconds
    maxRetries = 3
  } = options;

  const { mode } = useAppMode();
  const apiService = createApiService(mode);
  
  const [batchJob, setBatchJob] = useState<BatchJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const jobIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const fetchJobStatus = useCallback(async (jobId: string) => {
    if (!mountedRef.current) return;
    
    try {
      const response = await apiService.getBatchJobStatus(jobId);
      
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setBatchJob(response.data);
        setError(null);
        retryCountRef.current = 0;

        // Stop polling if job is completed or failed
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          setIsPolling(false);
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
          }
          return;
        }

        // Schedule next poll if still processing
        if (isPolling && enabled && (response.data.status === 'submitted' || response.data.status === 'processing')) {
          pollTimeoutRef.current = setTimeout(() => {
            fetchJobStatus(jobId);
          }, pollInterval);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch job status');
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`Batch job polling error (attempt ${retryCountRef.current}/${maxRetries}): ${errorMessage}`);
        
        // Retry with exponential backoff
        const retryDelay = Math.min(pollInterval * Math.pow(2, retryCountRef.current - 1), 60000);
        pollTimeoutRef.current = setTimeout(() => {
          fetchJobStatus(jobId);
        }, retryDelay);
      } else {
        // Max retries reached
        console.error('Batch job polling failed after max retries:', errorMessage);
        setError(`Failed to get job status: ${errorMessage}`);
        setIsPolling(false);
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
      }
    }
  }, [apiService, isPolling, enabled, pollInterval, maxRetries]);

  const startPolling = useCallback((jobId: string) => {
    // Note: We don't check 'enabled' here because startPolling is called explicitly
    // and should override the enabled state. The enabled parameter is for auto-start behavior.
    
    jobIdRef.current = jobId;
    setIsPolling(true);
    setError(null);
    retryCountRef.current = 0;

    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    // Start immediate fetch, then schedule periodic polling
    fetchJobStatus(jobId);
  }, [enabled, fetchJobStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    if (jobIdRef.current) {
      retryCountRef.current = 0;
      setError(null);
      startPolling(jobIdRef.current);
    }
  }, [startPolling]);

  // Auto-stop polling when disabled
  useEffect(() => {
    if (!enabled && isPolling) {
      stopPolling();
    }
  }, [enabled, isPolling, stopPolling]);

  return {
    batchJob,
    isPolling,
    error,
    startPolling,
    stopPolling,
    retry
  };
};
