// Progress-related type definitions for the React/MUI progress system

export interface FileProgressData {
  fileId: string;
  fileName: string;
  fileSize: number;
  currentStage: ProcessingStage;
  percentage: number;
  estimatedCompletion?: Date;
  timeRemaining?: number; // milliseconds
  error?: string;
  status: ProgressStatus;
  startTime: Date;
  endTime?: Date;
}

export interface GlobalProgressData {
  activeUploads: number;
  completedUploads: number;
  failedUploads: number;
  totalProgress: number; // Overall percentage for all active uploads
  estimatedTimeRemaining?: number; // milliseconds for all uploads
}

export interface ProgressEstimation {
  uploadTime: number;      // Estimated upload time in milliseconds
  processingTime: number;  // Estimated processing time in milliseconds
  transcriptionTime: number; // Estimated transcription time in milliseconds
  summarizationTime: number; // Estimated summarization time in milliseconds
  totalTime: number;       // Total estimated time in milliseconds
}

export interface EstimationSettings {
  uploadSpeedMbps: number;        // Assumed upload speed in Mbps
  processingTimePerMb: number;    // Processing time per MB in milliseconds
  transcriptionTimePerMinute: number; // Transcription time per audio minute in milliseconds
  summarizationBaseTime: number;  // Base summarization time in milliseconds
}

export type ProcessingStage = 
  | 'upload' 
  | 'processing' 
  | 'transcription' 
  | 'summarization' 
  | 'complete';

export type ProgressStatus = 
  | 'pending'
  | 'active' 
  | 'paused'
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface StageInfo {
  stage: ProcessingStage;
  label: string;
  description: string;
  icon: string;
  weight: number; // Percentage of total time (0.0 to 1.0)
}

export interface ProgressNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  fileId?: string;
  timestamp: Date;
  autoHide?: boolean;
  duration?: number; // milliseconds
}

// Type guards and utility types
export const isValidProcessingStage = (stage: string): stage is ProcessingStage => {
  return ['upload', 'processing', 'transcription', 'summarization', 'complete'].includes(stage);
};

export const isValidProgressStatus = (status: string): status is ProgressStatus => {
  return ['pending', 'active', 'paused', 'completed', 'failed', 'cancelled'].includes(status);
};

// Default estimation settings - Updated for fast transcription performance
export const DEFAULT_ESTIMATION_SETTINGS: EstimationSettings = {
  uploadSpeedMbps: 25, // Faster upload assumption based on logs
  processingTimePerMb: 200, // Much faster processing: 0.2 seconds per MB
  transcriptionTimePerMinute: 1000, // Very fast transcription: ~1 second per audio minute (27s for 27min file)
  summarizationBaseTime: 3000, // 3 seconds base time for summarization
};

// Stage definitions with weights
export const PROCESSING_STAGES: Record<ProcessingStage, StageInfo> = {
  upload: {
    stage: 'upload',
    label: 'Uploading',
    description: 'Transferring file to server',
    icon: '⬆️',
    weight: 0.2, // 20% of total time
  },
  processing: {
    stage: 'processing',
    label: 'Processing',
    description: 'Validating and preparing audio',
    icon: '⚙️',
    weight: 0.3, // 30% of total time
  },
  transcription: {
    stage: 'transcription',
    label: 'Transcribing',
    description: 'Converting speech to text',
    icon: '🎵',
    weight: 0.4, // 40% of total time
  },
  summarization: {
    stage: 'summarization',
    label: 'Summarizing',
    description: 'Generating meeting summary',
    icon: '📝',
    weight: 0.1, // 10% of total time
  },
  complete: {
    stage: 'complete',
    label: 'Complete',
    description: 'Processing finished',
    icon: '✅',
    weight: 0.0, // No additional time
  },
};

// Utility function to get next stage
export const getNextStage = (currentStage: ProcessingStage): ProcessingStage | null => {
  const stages: ProcessingStage[] = ['upload', 'processing', 'transcription', 'summarization', 'complete'];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
};

// Utility function to calculate cumulative progress up to a stage
export const getCumulativeProgress = (stage: ProcessingStage, stageProgress: number = 0): number => {
  const stages: ProcessingStage[] = ['upload', 'processing', 'transcription', 'summarization'];
  const currentIndex = stages.indexOf(stage);
  
  if (currentIndex === -1) return 100; // Complete stage
  
  let cumulativeWeight = 0;
  for (let i = 0; i < currentIndex; i++) {
    cumulativeWeight += PROCESSING_STAGES[stages[i]].weight;
  }
  
  // Add current stage progress
  cumulativeWeight += PROCESSING_STAGES[stage].weight * (stageProgress / 100);
  
  return Math.round(cumulativeWeight * 100);
};

// Utility function to format time remaining
export const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};