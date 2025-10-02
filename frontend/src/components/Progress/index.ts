// Export all Progress components for easy importing
export { default as FileUploadProgress } from './FileUploadProgress';
export { default as GlobalProgressIndicator, CompactGlobalProgress } from './GlobalProgressIndicator';
export { 
  default as ProgressNotificationComponent,
  NotificationQueueManager,
  useProgressNotification,
  createProgressNotification 
} from './ProgressNotification';

// Re-export progress context
export {
  ProgressProvider,
  useProgress,
  useFileProgress,
  useGlobalProgress,
} from '../../contexts/ProgressContext';

// Re-export types for convenience
export type {
  FileProgressData,
  GlobalProgressData,
  ProgressEstimation,
  ProcessingStage,
  ProgressStatus,
  ProgressNotification,
} from '../../types/progress';

// Re-export utility functions
export {
  PROCESSING_STAGES,
  getCumulativeProgress,
  formatTimeRemaining,
  getNextStage,
} from '../../types/progress';

// Re-export progress estimator
export {
  progressEstimator,
  estimateFileProcessingTime,
  calculateTimeRemaining,
  recordActualProcessingTime,
} from '../../services/progressEstimator';