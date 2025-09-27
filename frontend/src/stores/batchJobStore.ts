import { create } from 'zustand';
import type { BatchJobStatus } from '../types/batchJob';

// Session storage keys for batch job persistence
const BATCH_JOB_STORAGE_KEY = 'meetingSummary_activeBatchJob';

// Helper functions for session storage
const saveToStorage = (job: BatchJobStatus | null) => {
  try {
    if (job && (job.status === 'submitted' || job.status === 'processing')) {
      sessionStorage.setItem(BATCH_JOB_STORAGE_KEY, JSON.stringify({
        jobId: job.jobId,
        status: job.status,
        fileName: job.fileName,
        submittedAt: job.submittedAt,
        progressPercentage: job.progressPercentage
      }));
    } else {
      sessionStorage.removeItem(BATCH_JOB_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save batch job to storage:', error);
  }
};

const loadFromStorage = (): { jobId: string; status: string; fileName: string } | null => {
  try {
    const stored = sessionStorage.getItem(BATCH_JOB_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load batch job from storage:', error);
    return null;
  }
};

// Animation-friendly update debouncer for batch jobs
const createBatchJobDebouncer = () => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastUpdate: BatchJobStatus | null = null;
  
  return {
    scheduleUpdate: (job: BatchJobStatus, callback: (job: BatchJobStatus) => void) => {
      lastUpdate = job;
      
      // For critical updates (status changes), update immediately
      if (job.status === 'completed' || job.status === 'failed') {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        callback(job);
        return;
      }
      
      // For progress updates, debounce to avoid interrupting animations
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastUpdate) {
          callback(lastUpdate);
        }
        timeoutId = null;
        lastUpdate = null;
      }, 200); // 200ms debounce for progress updates
    },
    
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastUpdate = null;
    }
  };
};

const batchJobDebouncer = createBatchJobDebouncer();

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
  
  // Animation-friendly polling intervals
  getOptimalPollInterval: () => number;
  
  // Actions
  startBatchJob: (jobId: string) => void;
  updateJobStatus: (job: BatchJobStatus) => void;
  setPolling: (isPolling: boolean) => void;
  setPollingError: (error: string | null) => void;
  incrementRetry: () => void;
  resetRetries: () => void;
  clearBatchJob: () => void;
  initializeFromStorage: () => void;
  
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
    
    // Save initial job info to session storage
    saveToStorage({ jobId } as BatchJobStatus);
  },

  // Update the current job status with animation-friendly debouncing
  updateJobStatus: (job: BatchJobStatus) => {
    const state = get();
    
    // Only update if this is the job we're tracking
    if (state.currentJobId === job.jobId) {
      // Use debounced updates to prevent animation interruption
      batchJobDebouncer.scheduleUpdate(job, (debouncedJob) => {
        set(() => ({
          currentJob: debouncedJob,
          pollingError: null, // Clear any previous errors
          retryCount: 0, // Reset retry count on successful update
        }));
        
        // Persist active jobs to session storage
        saveToStorage(debouncedJob);
        
        console.log(`🔄 Batch job ${debouncedJob.jobId} progress: ${debouncedJob.progressPercentage}% (${debouncedJob.status})`);
        
        // Stop polling if job is completed or failed
        if (debouncedJob.status === 'completed' || debouncedJob.status === 'failed') {
          set((state) => ({
            ...state,
            isPolling: false,
          }));
          console.log(`✅ Batch job ${debouncedJob.jobId} finished: ${debouncedJob.status}`);
          
          // Clear from storage when completed/failed
          saveToStorage(null);
        }
      });
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
    batchJobDebouncer.clear();
    saveToStorage(null);
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

  // Get optimal polling interval based on job progress and status
  getOptimalPollInterval: () => {
    const state = get();
    
    // If no job, use default
    if (!state.currentJob) {
      return state.pollInterval;
    }
    
    const job = state.currentJob;
    
    // For early stages, poll more frequently to show quick progress
    if (job.status === 'submitted' || job.progressPercentage < 10) {
      return 5000; // 5 seconds
    }
    
    // For active processing, use medium frequency to balance updates vs performance
    if (job.status === 'processing' && job.progressPercentage < 90) {
      return 15000; // 15 seconds
    }
    
    // For near completion, poll more frequently for responsive completion
    if (job.progressPercentage >= 90) {
      return 8000; // 8 seconds
    }
    
    // Default to configured interval
    return state.pollInterval;
  },
  
  // Initialize from session storage (call on app start)
  initializeFromStorage: () => {
    const stored = loadFromStorage();
    if (stored && (stored.status === 'submitted' || stored.status === 'processing')) {
      console.log('📱 Restoring batch job from session storage:', stored.jobId);
      set(() => ({
        currentJobId: stored.jobId,
        currentJob: null, // Will be fetched by polling
        isPolling: true,
        pollingError: null,
        retryCount: 0,
      }));
    }
  },
}));