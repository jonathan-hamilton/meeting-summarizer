import { create } from 'zustand';
import type { TranscriptionJobStatus } from '../types/transcriptionJob';

// Session storage keys for transcription job persistence
const TRANSCRIPTION_JOB_STORAGE_KEY = 'meetingSummary_activeTranscriptionJob';

// Helper functions for session storage
const saveToStorage = (job: TranscriptionJobStatus | null) => {
  try {
    if (job && (job.status === 'submitted' || job.status === 'processing')) {
      sessionStorage.setItem(TRANSCRIPTION_JOB_STORAGE_KEY, JSON.stringify({
        jobId: job.jobId,
        status: job.status,
        fileName: job.fileName,
        submittedAt: job.submittedAt,
        progressPercentage: job.progressPercentage,
        processingMethod: job.processingMethod
      }));
    } else {
      sessionStorage.removeItem(TRANSCRIPTION_JOB_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save transcription job to storage:', error);
  }
};

const loadFromStorage = (): { jobId: string; status: string; fileName: string; processingMethod?: string } | null => {
  try {
    const stored = sessionStorage.getItem(TRANSCRIPTION_JOB_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load transcription job from storage:', error);
    return null;
  }
};

// Animation-friendly update debouncer for transcription jobs
const createTranscriptionJobDebouncer = () => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastUpdate: TranscriptionJobStatus | null = null;
  
  return {
    scheduleUpdate: (job: TranscriptionJobStatus, callback: (job: TranscriptionJobStatus) => void) => {
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
      
      // For progress updates, debounce to prevent animation stuttering
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastUpdate) {
          callback(lastUpdate);
        }
        timeoutId = null;
      }, 150); // Small delay for smoother progress animations
    },
    
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    
    flush: (callback: (job: TranscriptionJobStatus) => void) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (lastUpdate) {
        callback(lastUpdate);
      }
    }
  };
};

const transcriptionJobDebouncer = createTranscriptionJobDebouncer();

interface TranscriptionJobState {
  // Current transcription job being tracked
  currentJobId: string | null;
  currentJob: TranscriptionJobStatus | null;
  isPolling: boolean;
  pollingError: string | null;
  
  // Polling configuration optimized for Fast Transcription (45s-5min processing)
  pollInterval: number;
  maxRetries: number;
  retryCount: number;
  maxPollingDuration: number; // 6 minutes max instead of 15+
  
  // Optimized polling intervals for fast processing
  getOptimalPollInterval: () => number;
  
  // Actions
  startTranscriptionJob: (jobId: string) => void;
  updateJobStatus: (job: TranscriptionJobStatus) => void;
  setPolling: (isPolling: boolean) => void;
  setPollingError: (error: string | null) => void;
  clearJob: () => void;
  canRetry: () => boolean;
  
  // Storage management
  initializeFromStorage: () => void;
}

export const useTranscriptionJobStore = create<TranscriptionJobState>((set, get) => ({
  // Initial state
  currentJobId: null,
  currentJob: null,
  isPolling: false,
  pollingError: null,
  
  // Optimized polling configuration for Fast Transcription
  pollInterval: 5000, // Default 5 seconds (faster than old 15s)
  maxRetries: 3,
  retryCount: 0,
  maxPollingDuration: 6 * 60 * 1000, // 6 minutes max (vs old 15+ minutes)
  
  // Actions
  startTranscriptionJob: (jobId: string) => {
    set({
      currentJobId: jobId,
      currentJob: null,
      isPolling: false,
      pollingError: null,
      retryCount: 0
    });
  },

  updateJobStatus: (job: TranscriptionJobStatus) => {
    // Use debouncer for smooth animations
    transcriptionJobDebouncer.scheduleUpdate(job, (debouncedJob) => {
      set((state) => {
        const updatedState = {
          ...state,
          currentJob: debouncedJob,
          currentJobId: debouncedJob.jobId
        };
        
        // Save to session storage for persistence
        saveToStorage(debouncedJob);
        
        return updatedState;
      });
    });
  },

  setPolling: (isPolling: boolean) => {
    set({ isPolling });
  },

  setPollingError: (error: string | null) => {
    set({ pollingError: error });
  },

  clearJob: () => {
    transcriptionJobDebouncer.cancel();
    set({
      currentJobId: null,
      currentJob: null,
      isPolling: false,
      pollingError: null,
      retryCount: 0
    });
    try {
      sessionStorage.removeItem(TRANSCRIPTION_JOB_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear transcription job from storage:', error);
    }
  },

  canRetry: () => {
    const state = get();
    return state.retryCount < state.maxRetries;
  },

  // Optimized polling intervals for Fast Transcription (45s-5min processing)
  getOptimalPollInterval: () => {
    const state = get();
    
    // If no job, use default
    if (!state.currentJob) {
      return state.pollInterval;
    }
    
    const job = state.currentJob;
    const processingMethod = job.processingMethod || 'fast';
    
    // Fast Transcription optimized intervals (3s/5s/8s)
    if (processingMethod === 'fast') {
      // Early stages - poll frequently for responsive feedback
      if (job.status === 'submitted' || job.progressPercentage < 20) {
        return 3000; // 3 seconds - faster initial feedback
      }
      
      // Active processing - balanced frequency  
      if (job.status === 'processing' && job.progressPercentage < 80) {
        return 5000; // 5 seconds - balance responsiveness vs server load
      }
      
      // Near completion - responsive completion detection
      if (job.progressPercentage >= 80) {
        return 8000; // 8 seconds - responsive completion detection
      }
    }
    
    // S6.13: Fast Transcription intervals (direct processing)
    else {
      // For early stages, poll more frequently to show quick progress
      if (job.status === 'submitted' || job.progressPercentage < 10) {
        return 5000; // 5 seconds
      }
      
      // For active processing, use medium frequency
      if (job.status === 'processing' && job.progressPercentage < 90) {
        return 15000; // 15 seconds
      }
      
      // For near completion, poll more frequently
      if (job.progressPercentage >= 90) {
        return 8000; // 8 seconds
      }
    }
    
    // Default to configured interval
    return state.pollInterval;
  },
  
  // Initialize from session storage (call on app start)
  initializeFromStorage: () => {
    const stored = loadFromStorage();
    if (stored && stored.jobId) {
      set({
        currentJobId: stored.jobId,
        currentJob: {
          jobId: stored.jobId,
          status: stored.status as 'submitted' | 'processing' | 'completed' | 'failed',
          fileName: stored.fileName,
          submittedAt: '',
          progressPercentage: 0,
          estimatedDurationMinutes: 0,
          processingMethod: 'fast', // Always use fast transcription after S6.13 migration
          refundIssued: false
        }
      });
    }
  }
}));