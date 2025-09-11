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
  results?: any; // TranscriptionResult when completed
}

export interface BatchJobSubmissionResponse {
  jobId: string;
  status: string;
  estimatedTime: string;
  checkStatusUrl: string;
  submittedAt: string;
}
