import { create } from 'zustand';
import type { ProcessingStage, ProgressEstimation } from '../types/progress';
import { estimateFileProcessingTime, calculateTimeRemaining } from '../services/progressEstimator';

export interface FileUploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error" | "cancelled";
  progress: number;
  result?: any;
  error?: string;
  transcriptionJobId?: string;
  successMessage?: string;
  
  // Enhanced progress fields
  currentStage?: ProcessingStage;
  timeRemaining?: number; // milliseconds
  estimatedCompletion?: Date;
  startTime?: Date;
  endTime?: Date;
  estimation?: ProgressEstimation;
}

export interface TokenError {
  required: number;
  available: number;
  estimatedDuration: number;
  fileName: string;
}

export interface PendingTokenCalculation {
  tokenCalc: any; // getTokenCalculationAsync result
  fileEstimation: any; // getFileEstimationAsync result
}

interface UploadQueueState {
  uploadFiles: FileUploadFile[];
  activeUploads: Map<string, File>; // Store actual File objects for active uploads
  
  // Upload validation and error state
  validationErrors: string[];
  tokenError: TokenError | null;
  pendingFile: File | null;
  pendingTokenCalc: PendingTokenCalculation | null;
  
  // Dialog state
  tokenDialogOpen: boolean;
  costDialogOpen: boolean;
  
  // Existing methods
  setUploadFiles: (files: FileUploadFile[] | ((prev: FileUploadFile[]) => FileUploadFile[])) => void;
  addUploadFile: (file: FileUploadFile) => void;
  updateUploadFile: (id: string, updates: Partial<FileUploadFile>) => void;
  removeUploadFile: (id: string) => void;
  clearUploadQueue: () => void;
  setActiveFile: (id: string, file: File) => void;
  removeActiveFile: (id: string) => void;
  
  // New state management methods
  setValidationErrors: (errors: string[]) => void;
  removeValidationError: (index: number) => void;
  clearValidationErrors: () => void;
  setTokenError: (error: TokenError | null) => void;
  setPendingFile: (file: File | null) => void;
  setPendingTokenCalc: (calc: PendingTokenCalculation | null) => void;
  
  // Dialog methods
  openTokenDialog: () => void;
  closeTokenDialog: () => void;
  openCostDialog: () => void;
  closeCostDialog: () => void;
  
  // Enhanced progress methods
  startFileProgress: (fileId: string, file: File) => void;
  updateFileStage: (fileId: string, stage: ProcessingStage, percentage: number) => void;
  completeFileProgress: (fileId: string, success: boolean, result?: any, error?: string) => void;
  
  // Progress getters
  getGlobalProgress: () => {
    activeUploads: number;
    completedUploads: number;
    failedUploads: number;
    totalProgress: number;
    estimatedTimeRemaining?: number;
  };
}

export const useUploadQueueStore = create<UploadQueueState>()((set, get) => ({
  uploadFiles: [],
  activeUploads: new Map(),
  
  // Initialize new state
  validationErrors: [],
  tokenError: null,
  pendingFile: null,
  pendingTokenCalc: null,
  tokenDialogOpen: false,
  costDialogOpen: false,
      
      setUploadFiles: (files) => {
        set({ 
          uploadFiles: typeof files === 'function' ? files(get().uploadFiles) : files 
        });
      },
      
      addUploadFile: (file) => {
        set((state) => ({
          uploadFiles: [...state.uploadFiles, file]
        }));
      },
      
      updateUploadFile: (id, updates) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          )
        }));
      },
      
      removeUploadFile: (id) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.filter((f) => f.id !== id)
        }));
        get().removeActiveFile(id);
      },
      
      clearUploadQueue: () => {
        set({ uploadFiles: [], activeUploads: new Map() });
      },
      
      // New state management methods
      setValidationErrors: (errors) => {
        set({ validationErrors: errors });
      },
      
      removeValidationError: (index: number) => {
        set((state) => ({
          validationErrors: state.validationErrors.filter((_, i) => i !== index)
        }));
      },
      
      clearValidationErrors: () => {
        set({ validationErrors: [] });
      },
      
      setTokenError: (error) => {
        set({ tokenError: error });
      },
      
      setPendingFile: (file) => {
        set({ pendingFile: file });
      },
      
      setPendingTokenCalc: (calc) => {
        set({ pendingTokenCalc: calc });
      },
      
      // Dialog methods
      openTokenDialog: () => {
        set({ tokenDialogOpen: true });
      },
      
      closeTokenDialog: () => {
        set({ tokenDialogOpen: false });
      },
      
      openCostDialog: () => {
        set({ costDialogOpen: true });
      },
      
      closeCostDialog: () => {
        set({ costDialogOpen: false });
      },
      
      setActiveFile: (id, file) => {
        set((state) => {
          const newActiveUploads = new Map(state.activeUploads);
          newActiveUploads.set(id, file);
          return { activeUploads: newActiveUploads };
        });
      },
      
      removeActiveFile: (id) => {
        set((state) => {
          const newActiveUploads = new Map(state.activeUploads);
          newActiveUploads.delete(id);
          return { activeUploads: newActiveUploads };
        });
      },
      
      // Enhanced progress methods
      startFileProgress: (fileId, file) => {
        const estimation = estimateFileProcessingTime(file);
        const startTime = new Date();
        
        set((state) => ({
          uploadFiles: state.uploadFiles.map((f) =>
            f.id === fileId ? {
              ...f,
              currentStage: 'upload' as ProcessingStage,
              timeRemaining: estimation.totalTime,
              estimatedCompletion: new Date(Date.now() + estimation.totalTime),
              startTime,
              estimation,
            } : f
          )
        }));
      },
      
      updateFileStage: (fileId, stage, percentage) => {
        set((state) => {
          const file = state.uploadFiles.find(f => f.id === fileId);
          if (!file?.estimation) return state;
          
          const timeRemaining = calculateTimeRemaining(file.estimation, stage, percentage);
          
          return {
            uploadFiles: state.uploadFiles.map((f) =>
              f.id === fileId ? {
                ...f,
                currentStage: stage,
                progress: percentage,
                timeRemaining,
              } : f
            )
          };
        });
      },
      
      completeFileProgress: (fileId, success, result, error) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.map((f) =>
            f.id === fileId ? {
              ...f,
              status: success ? 'completed' : 'error',
              progress: 100,
              currentStage: 'complete' as ProcessingStage,
              result: success ? result : undefined,
              error: success ? undefined : error,
              timeRemaining: undefined,
              endTime: new Date(),
            } : f
          )
        }));
      },
      
      getGlobalProgress: () => {
        const files = get().uploadFiles;
        const activeUploads = files.filter(f => f.status === 'uploading' || f.status === 'processing').length;
        const completedUploads = files.filter(f => f.status === 'completed').length;
        const failedUploads = files.filter(f => f.status === 'error').length;
        
        // Calculate overall progress (average of all active uploads)
        const activeProgresses = files
          .filter(f => f.status === 'uploading' || f.status === 'processing')
          .map(f => f.progress);
        
        const totalProgress = activeProgresses.length > 0
          ? activeProgresses.reduce((sum, p) => sum + p, 0) / activeProgresses.length
          : completedUploads > 0 ? 100 : 0;
        
        // Calculate estimated time remaining (max of all active uploads)
        const timeRemainingValues = files
          .filter(f => (f.status === 'uploading' || f.status === 'processing') && f.timeRemaining)
          .map(f => f.timeRemaining!);
        
        const estimatedTimeRemaining = timeRemainingValues.length > 0
          ? Math.max(...timeRemainingValues)
          : undefined;
        
        return {
          activeUploads,
          completedUploads,
          failedUploads,
          totalProgress,
          estimatedTimeRemaining,
        };
      }
}));