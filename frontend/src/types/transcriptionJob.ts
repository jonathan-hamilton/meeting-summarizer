export interface TranscriptionJobStatus {
  jobId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  submittedAt: string;
  completedAt?: string;
  estimatedDurationMinutes: number;
  fileName: string;
  errorMessage?: string;
  processingMethod: 'fast' | 'batch'; // Support both during transition
  refundIssued: boolean;
  processingDuration?: string;
  results?: any; // TranscriptionResult when completed
}

export interface TranscriptionJobSubmissionResponse {
  jobId: string;
  status: string;
  estimatedTime: string;
  checkStatusUrl: string;
  submittedAt: string;
}

// Legacy interface for backward compatibility during migration
export interface BatchJobStatus extends TranscriptionJobStatus {
  retryCount: number;
  maxRetries: number;
}

export interface BatchJobSubmissionResponse extends TranscriptionJobSubmissionResponse {
  // Keep existing structure for compatibility
}