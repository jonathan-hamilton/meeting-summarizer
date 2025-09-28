export interface TranscriptionJobStatus {
  jobId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  submittedAt: string;
  completedAt?: string;
  estimatedDurationMinutes: number;
  fileName: string;
  errorMessage?: string;
  processingMethod: 'fast'; // Fast transcription only after S6.13 migration
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