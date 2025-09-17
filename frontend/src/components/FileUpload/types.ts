export interface FileUploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  analysisId?: string;
  batchJobId?: string;
  result?: {
    processingTimeMs?: number;
    speakerCount?: number;
    [key: string]: any;
  };
}

export interface WorkflowStep {
  label: string;
  status: 'completed' | 'active' | 'pending';
  substeps?: string[];
}

export interface UploadResponse {
  success: boolean;
  analysisId?: string;
  batchJobId?: string;
  error?: string;
}

export interface BatchJobStatus {
  jobId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  submittedAt: string;
  completedAt?: string;
  estimatedDurationMinutes: number;
  fileName: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  refundIssued: boolean;
  processingDuration?: string;
  results?: any;
}

export const ACCEPTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/webm',
  'audio/aac'
] as const;

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_FILES = 10;