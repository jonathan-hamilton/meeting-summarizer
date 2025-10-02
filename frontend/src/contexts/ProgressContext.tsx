import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { 
  FileProgressData, 
  GlobalProgressData, 
  ProgressEstimation,
  ProcessingStage 
} from '../types/progress';
import { progressEstimator } from '../services/progressEstimator';
import { getCumulativeProgress } from '../types/progress';

interface ProgressContextType {
  // Progress data
  fileProgress: Map<string, FileProgressData>;
  globalProgress: GlobalProgressData;
  
  // Progress actions
  startFileProgress: (fileId: string, file: File) => void;
  updateFileProgress: (fileId: string, stage: ProcessingStage, percentage: number) => void;
  completeFileProgress: (fileId: string, success: boolean, error?: string) => void;
  cancelFileProgress: (fileId: string) => void;
  removeFileProgress: (fileId: string) => void;
  
  // Estimation methods
  getFileEstimation: (fileId: string) => ProgressEstimation | null;
  
  // Cleanup
  clearAllProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

interface ProgressProviderProps {
  children: React.ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [fileProgress, setFileProgress] = useState<Map<string, FileProgressData>>(new Map());
  const [estimations, setEstimations] = useState<Map<string, ProgressEstimation>>(new Map());

  // Calculate global progress whenever file progress changes
  const globalProgress: GlobalProgressData = React.useMemo(() => {
    const progressArray = Array.from(fileProgress.values());
    
    const activeUploads = progressArray.filter(p => p.status === 'active').length;
    const completedUploads = progressArray.filter(p => p.status === 'completed').length;
    const failedUploads = progressArray.filter(p => p.status === 'failed').length;
    
    // Calculate overall progress (average of all active uploads)
    const activeProgresses = progressArray
      .filter(p => p.status === 'active')
      .map(p => p.percentage);
    
    const totalProgress = activeProgresses.length > 0
      ? activeProgresses.reduce((sum, p) => sum + p, 0) / activeProgresses.length
      : completedUploads > 0 ? 100 : 0;
    
    // Calculate estimated time remaining (max of all active uploads)
    const timeRemainingValues = progressArray
      .filter(p => p.status === 'active' && p.timeRemaining)
      .map(p => p.timeRemaining!);
    
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
  }, [fileProgress]);

  // Start progress tracking for a file
  const startFileProgress = useCallback((fileId: string, file: File) => {
    const estimation = progressEstimator.estimateProcessingTime(file);
    
    setEstimations(prev => new Map(prev).set(fileId, estimation));
    
    setFileProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        currentStage: 'upload',
        percentage: 0,
        estimatedCompletion: new Date(Date.now() + estimation.totalTime),
        timeRemaining: estimation.totalTime,
        status: 'active',
        startTime: new Date(),
      });
      return newMap;
    });
  }, []);

  // Update progress for a specific stage
  const updateFileProgress = useCallback((fileId: string, stage: ProcessingStage, percentage: number) => {
    setFileProgress(prev => {
      const existing = prev.get(fileId);
      if (!existing) return prev;
      
      const estimation = estimations.get(fileId);
      const cumulativePercentage = getCumulativeProgress(stage, percentage);
      
      // Calculate time remaining if we have estimation
      let timeRemaining: number | undefined;
      if (estimation) {
        timeRemaining = progressEstimator.calculateTimeRemaining(
          estimation, 
          stage, 
          percentage
        );
      }
      
      const newMap = new Map(prev);
      newMap.set(fileId, {
        ...existing,
        currentStage: stage,
        percentage: cumulativePercentage,
        timeRemaining,
      });
      return newMap;
    });
  }, [estimations]);

  // Complete file progress (success or failure)
  const completeFileProgress = useCallback((fileId: string, success: boolean, error?: string) => {
    setFileProgress(prev => {
      const existing = prev.get(fileId);
      if (!existing) return prev;
      
      // Record actual time for calibration
      const actualTime = Date.now() - existing.startTime.getTime();
      const fileSizeMB = existing.fileSize / (1024 * 1024);
      progressEstimator.recordActualTime(fileSizeMB, actualTime);
      
      const newMap = new Map(prev);
      newMap.set(fileId, {
        ...existing,
        currentStage: 'complete',
        percentage: 100,
        status: success ? 'completed' : 'failed',
        error: success ? undefined : error,
        timeRemaining: undefined,
        endTime: new Date(),
      });
      return newMap;
    });
  }, []);

  // Cancel file progress
  const cancelFileProgress = useCallback((fileId: string) => {
    setFileProgress(prev => {
      const existing = prev.get(fileId);
      if (!existing) return prev;
      
      const newMap = new Map(prev);
      newMap.set(fileId, {
        ...existing,
        status: 'cancelled',
        timeRemaining: undefined,
        endTime: new Date(),
      });
      return newMap;
    });
  }, []);

  // Remove file progress (cleanup)
  const removeFileProgress = useCallback((fileId: string) => {
    setFileProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    
    setEstimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  // Get estimation for a file
  const getFileEstimation = useCallback((fileId: string): ProgressEstimation | null => {
    return estimations.get(fileId) || null;
  }, [estimations]);

  // Clear all progress
  const clearAllProgress = useCallback(() => {
    setFileProgress(new Map());
    setEstimations(new Map());
  }, []);

  // Auto-cleanup completed/failed uploads after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setFileProgress(prev => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const newMap = new Map(prev);
        let hasChanges = false;
        
        for (const [fileId, progress] of newMap.entries()) {
          if (
            (progress.status === 'completed' || progress.status === 'failed') &&
            progress.endTime &&
            progress.endTime.getTime() < fiveMinutesAgo
          ) {
            newMap.delete(fileId);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newMap : prev;
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const contextValue: ProgressContextType = {
    fileProgress,
    globalProgress,
    startFileProgress,
    updateFileProgress,
    completeFileProgress,
    cancelFileProgress,
    removeFileProgress,
    getFileEstimation,
    clearAllProgress,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Custom hook to use progress context
export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Custom hook to get progress for a specific file
export const useFileProgress = (fileId: string): FileProgressData | null => {
  const { fileProgress } = useProgress();
  return fileProgress.get(fileId) || null;
};

// Custom hook to get global progress summary
export const useGlobalProgress = (): GlobalProgressData => {
  const { globalProgress } = useProgress();
  return globalProgress;
};

export default ProgressContext;