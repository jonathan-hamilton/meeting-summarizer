export interface FileUploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: string;
  analysisId?: string;
  transcriptionJobId?: string;
  successMessage?: string;
  result?: {
    processingTimeMs?: number;
    speakerCount?: number;
    [key: string]: any;
  };
}

export interface WorkflowStep {
  label: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  substeps?: string[];
}

export interface UploadResponse {
  success: boolean;
  analysisId?: string;
  transcriptionJobId?: string;
  error?: string;
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
  'audio/webm'
  // Note: AAC removed - not supported by Azure Fast Transcription
] as const;

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB - Azure Fast Transcription limit
export const MAX_FILES = 10;