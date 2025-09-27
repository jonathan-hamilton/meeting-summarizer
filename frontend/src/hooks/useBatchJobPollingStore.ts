import { useCallback, useEffect, useRef } from 'react';
import { useBatchJobStore } from '../stores/batchJobStore';
import { apiService } from '../services/apiService';

interface UseBatchJobPollingProps {
  onJobCompleted?: (jobId: string) => void;
  onJobFailed?: (jobId: string, error?: string) => void;
}

export const useBatchJobPollingStore = ({ 
  onJobCompleted,
  onJobFailed 
}: UseBatchJobPollingProps = {}) => {
  const {
    currentJobId,
    currentJob,
    isPolling,
    pollingError,
    getOptimalPollInterval,
    startBatchJob,
    updateJobStatus,
    setPolling,
    setPollingError,
    incrementRetry,
    resetRetries,
    clearBatchJob,
    shouldContinuePolling,
    canRetry,
  } = useBatchJobStore();

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount (but don't interfere with store-based polling)
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const fetchJobStatus = useCallback(async (jobId: string) => {
    // Check if polling should continue using store state instead of component mount status
    if (!useBatchJobStore.getState().isPolling) {
      return;
    }
    
    try {
      const response = await apiService.getBatchJobStatus(jobId);
      
      // Check if polling is still active in store
      if (!useBatchJobStore.getState().isPolling) return;

      if (response.success && response.data) {
        updateJobStatus(response.data);

        // Handle job completion callbacks
        if (response.data.status === 'completed') {
          onJobCompleted?.(jobId);
        } else if (response.data.status === 'failed') {
          onJobFailed?.(jobId, response.data.errorMessage);
        }

        // Schedule next poll if needed with optimal interval
        if (shouldContinuePolling()) {
          const optimalInterval = getOptimalPollInterval();
          pollTimeoutRef.current = setTimeout(() => {
            fetchJobStatus(jobId);
          }, optimalInterval);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch job status');
      }
    } catch (err) {
      // Check if polling is still active in store
      if (!useBatchJobStore.getState().isPolling) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`❌ STORE POLLING: Error fetching job ${jobId}:`, errorMessage);
      
      // Retry logic
      if (canRetry()) {
        incrementRetry();
        const retryInterval = getOptimalPollInterval();
        console.warn(`🔄 STORE POLLING: Retrying in ${retryInterval}ms (attempt ${useBatchJobStore.getState().retryCount})`);
        
        pollTimeoutRef.current = setTimeout(() => {
          fetchJobStatus(jobId);
        }, retryInterval);
      } else {
        // Max retries reached
        console.error(`❌ STORE POLLING: Max retries reached for job ${jobId}`);
        setPollingError(`Failed to get job status: ${errorMessage}`);
        setPolling(false);
        onJobFailed?.(jobId, errorMessage);
      }
    }
  }, [
    updateJobStatus,
    shouldContinuePolling,
    getOptimalPollInterval,
    canRetry,
    incrementRetry,
    setPollingError,
    setPolling,
    onJobCompleted,
    onJobFailed
  ]);

  const startPolling = useCallback((jobId: string) => {
    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    // Start tracking in store
    startBatchJob(jobId);
    resetRetries();

    // Start immediate fetch
    fetchJobStatus(jobId);
  }, [startBatchJob, resetRetries, fetchJobStatus]);

  const stopPolling = useCallback(() => {
    setPolling(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, [setPolling]);

  const retry = useCallback(() => {
    if (currentJobId) {
      resetRetries();
      setPollingError(null);
      fetchJobStatus(currentJobId);
    }
  }, [currentJobId, resetRetries, setPollingError, fetchJobStatus]);

  return {
    currentJobId,
    currentJob,
    isPolling,
    pollingError,
    startPolling,
    stopPolling,
    retry,
    clearBatchJob,
  };
};