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
  speakerMappings?: SpeakerMapping[]; // S2.2: Speaker mappings
}

// Speaker Mapping Types (S2.2)
export interface SpeakerMapping {
  speakerId: string; // "Speaker 1", "Speaker 2", etc.
  name: string; // "John Smith"
  role: string; // "Manager", "Developer", etc.
  transcriptionId: string;
}

export interface SpeakerMappingRequest {
  transcriptionId: string;
  mappings: SpeakerMapping[];
}

export interface SpeakerMappingResponse {
  transcriptionId: string;
  mappings: SpeakerMapping[];
  lastUpdated: string;
  mappedSpeakerCount: number;
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

// Summary Types (S2.4)
export const SummaryStyle = {
  Brief: 'Brief',
  Detailed: 'Detailed',
  ActionItems: 'ActionItems',
  KeyDecisions: 'KeyDecisions',
  ExecutiveSummary: 'ExecutiveSummary'
} as const;

export type SummaryStyle = typeof SummaryStyle[keyof typeof SummaryStyle];

export interface SummaryRequest {
  transcript: string;
  style: SummaryStyle;
  targetRole?: string;
  maxTokens?: number;
  speakerMappings?: SpeakerMapping[];
}

export interface TranscriptionSummaryRequest {
  transcriptionId: string;
  style: SummaryStyle;
  targetRole?: string;
  maxTokens?: number;
}

export interface SummaryResult {
  summaryId: string;
  transcriptionId: string;
  summaryType: SummaryStyle;
  content: string;
  actionItems?: string[];
  keyDecisions?: string[];
  nextSteps?: string[];
  generatedAt: string;
  generatedFor?: string;
  processingTimeMs: number;
  tokenCount: number;
  usedSpeakerMappings: boolean;
}

export interface SummaryOptions {
  style: SummaryStyle;
  targetRole?: string;
  maxTokens: number;
  temperature: number;
}

export type ExportFormat = 'text' | 'markdown' | 'html';

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
