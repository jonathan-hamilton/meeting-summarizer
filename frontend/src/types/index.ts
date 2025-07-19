// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Health Check Types
export interface HealthStatus {
  status: string;
  timestamp: string;
  version?: string;
  service?: string;
  environment?: string;
}

export interface DetailedHealthStatus extends HealthStatus {
  version: string;
  service: string;
  environment: string;
  upTime: number;
  machineName: string;
  processorCount: number;
  workingSet: number;
  dependencies: {
    openAI?: string;
    database?: string;
  };
}

// File Upload Types
export interface SpeakerSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence?: number;
}

export interface TranscriptionResponse {
  transcriptionId: string;
  fileName: string;
  fileSize: number;
  status: string;
  transcribedText?: string;
  speakerSegments?: SpeakerSegment[];
  errorMessage?: string;
  processingTimeMs: number;
  createdAt: string;
  completedAt?: string;
  confidenceScore?: number;
  detectedLanguage?: string;
  duration?: number;
  speakerCount?: number;
  hasSpeakerDiarization?: boolean;
}

// Environment Types
export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  debug?: boolean;
}

// HTTP Client Types
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Common UI Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}
