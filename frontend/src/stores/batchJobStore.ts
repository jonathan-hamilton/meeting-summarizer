import { create } from 'zustand';
import type { BatchJobStatus } from '../types/batchJob';

interface BatchJobState {
  // Current batch job being tracked
  currentJobId: string | null;
  currentJob: BatchJobStatus | null;
  isPolling: boolean;
  pollingError: string | null;
  
  // Polling configuration
  pollInterval: number;
  maxRetries: number;
  retryCount: number;
  
  // Actions
  startBatchJob: (jobId: string) => void;
  updateJobStatus: (job: BatchJobStatus) => void;
  setPolling: (isPolling: boolean) => void;
  setPollingError: (error: string | null) => void;
  incrementRetry: () => void;
  resetRetries: () => void;
  clearBatchJob: () => void;
  
  // Computed getters
  shouldContinuePolling: () => boolean;
  canRetry: () => boolean;
}

export const useBatchJobStore = create<BatchJobState>()((set, get) => ({
  // Initial state
  currentJobId: null,
  currentJob: null,
  isPolling: false,
  pollingError: null,
  pollInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryCount: 0,

  // Start tracking a new batch job
  startBatchJob: (jobId: string) => {
    set(() => ({
      currentJobId: jobId,
      currentJob: null,
      isPolling: true,
      pollingError: null,
      retryCount: 0,
    }));
  },

  // Update the current job status
  updateJobStatus: (job: BatchJobStatus) => {
    const state = get();
    
    // Only update if this is the job we're tracking
    if (state.currentJobId === job.jobId) {
      set(() => ({
        currentJob: job,
        pollingError: null, // Clear any previous errors
        retryCount: 0, // Reset retry count on successful update
      }));
      
      // Stop polling if job is completed or failed
      if (job.status === 'completed' || job.status === 'failed') {
        set((state) => ({
          ...state,
          isPolling: false,
        }));
      }
    }
  },

  // Set polling state
  setPolling: (isPolling: boolean) => {
    set(() => ({ isPolling }));
  },

  // Set polling error
  setPollingError: (error: string | null) => {
    set(() => ({ pollingError: error }));
  },

  // Increment retry count
  incrementRetry: () => {
    set((state) => ({
      retryCount: state.retryCount + 1,
    }));
  },

  // Reset retry count
  resetRetries: () => {
    set(() => ({ retryCount: 0 }));
  },

  // Clear current batch job
  clearBatchJob: () => {
    set(() => ({
      currentJobId: null,
      currentJob: null,
      isPolling: false,
      pollingError: null,
      retryCount: 0,
    }));
  },

  // Check if polling should continue
  shouldContinuePolling: () => {
    const state = get();
    
    // If not polling, stop
    if (!state.isPolling) {
      return false;
    }
    
    // If no job fetched yet, continue polling to get initial status
    if (!state.currentJob) {
      return true;
    }
    
    // If job is still processing, continue
    const shouldContinue = (state.currentJob.status === 'submitted' || state.currentJob.status === 'processing');
    return shouldContinue;
  },

  // Check if we can retry
  canRetry: () => {
    const state = get();
    return state.retryCount < state.maxRetries;
  },
}));