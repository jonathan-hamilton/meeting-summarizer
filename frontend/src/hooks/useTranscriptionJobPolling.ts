import { useEffect, useRef, useCallback } from 'react';
import { useTranscriptionJobStore } from '../stores/transcriptionJobStore';

/**
 * Custom hook for polling transcription job status with optimized intervals for Fast Transcription
 * Handles the complete polling lifecycle with automatic retry logic and timeout handling
 */
export const useTranscriptionJobPolling = () => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const {
    currentJobId,
    currentJob,
    isPolling,
    pollingError,
    maxPollingDuration,
    retryCount,
    getOptimalPollInterval,
    updateJobStatus,
    setPolling,
    setPollingError,
    canRetry
  } = useTranscriptionJobStore();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPolling(false);
    startTimeRef.current = null;
  }, [setPolling]);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      if (!useTranscriptionJobStore.getState().isPolling) return;
      
      console.log(`🔄 TRANSCRIPTION POLLING: Checking status for job ${jobId}`);
      
      const response = await fetch(`/api/transcription/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.status}`);
      }

      const jobStatus = await response.json();
      
      if (!useTranscriptionJobStore.getState().isPolling) return;

      console.log(`📊 TRANSCRIPTION STATUS: ${jobStatus.status} - ${jobStatus.progressPercentage}%`);
      
      // Update the store with new status
      updateJobStatus({
        ...jobStatus,
        processingMethod: jobStatus.processingMethod || 'fast' // Default to fast transcription
      });

      // Check if job is complete
      if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
        console.log(`✅ TRANSCRIPTION COMPLETE: Job ${jobId} finished with status: ${jobStatus.status}`);
        cleanup();
      } else {
        // Check for timeout (6 minutes for Fast Transcription)
        const elapsed = Date.now() - (startTimeRef.current || Date.now());
        if (elapsed > maxPollingDuration) {
          console.warn(`⏰ TRANSCRIPTION TIMEOUT: Job ${jobId} exceeded maximum polling duration`);
          setPollingError('Transcription is taking longer than expected. Please check back later.');
          cleanup();
          return;
        }

        // Schedule next poll with optimized interval
        const nextInterval = getOptimalPollInterval();
        console.log(`⏳ TRANSCRIPTION POLL: Next check in ${nextInterval}ms`);
        
        pollingIntervalRef.current = setTimeout(() => {
          pollJobStatus(jobId);
        }, nextInterval);
      }
    } catch (error) {
      console.error(`❌ TRANSCRIPTION POLLING ERROR:`, error);
      
      if (canRetry()) {
        const retryInterval = Math.min(5000 * (retryCount + 1), 30000);
        console.warn(`🔄 TRANSCRIPTION POLLING: Retrying in ${retryInterval}ms (attempt ${useTranscriptionJobStore.getState().retryCount})`);
        
        pollingIntervalRef.current = setTimeout(() => {
          pollJobStatus(jobId);
        }, retryInterval);
      } else {
        setPollingError('Failed to check transcription status after multiple attempts');
        cleanup();
      }
    }
  }, [updateJobStatus, setPollingError, cleanup, canRetry, retryCount, getOptimalPollInterval, maxPollingDuration]);

  // Start polling
  const startPolling = useCallback((jobId: string) => {
    cleanup(); // Clean up any existing polling
    setPolling(true);
    setPollingError(null);
    startTimeRef.current = Date.now();
    
    // Start immediate poll, then continue with optimized intervals
    pollJobStatus(jobId);
  }, [cleanup, setPolling, setPollingError, pollJobStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log(`⏹️ TRANSCRIPTION POLLING: Stopped manually`);
    cleanup();
  }, [cleanup]);

  // Auto-start polling when job ID changes and job is in progress
  useEffect(() => {
    if (currentJobId && currentJob && 
        (currentJob.status === 'submitted' || currentJob.status === 'processing') && 
        !isPolling) {
      console.log(`🔄 TRANSCRIPTION AUTO-START: Beginning polling for job ${currentJobId}`);
      startPolling(currentJobId);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, currentJob?.status, isPolling, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isPolling,
    pollingError,
    startPolling,
    stopPolling,
    currentJob
  };
};