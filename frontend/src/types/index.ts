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

// Speaker Mapping Types (S2.2, enhanced in S2.5)
export const SpeakerSource = {
  AutoDetected: 'AutoDetected',
  ManuallyAdded: 'ManuallyAdded'
} as const;

export type SpeakerSource = typeof SpeakerSource[keyof typeof SpeakerSource];

export interface SpeakerMapping {
  speakerId: string; // "Speaker 1", "Speaker 2", etc.
  name: string; // "John Smith"
  role: string; // "Manager", "Developer", etc.
  transcriptionId: string;
  source?: SpeakerSource; // S2.5: Track speaker origin
  // S2.7: Override tracking fields
  originalName?: string; // Original name before override
  originalRole?: string; // Original role before override
  isOverridden?: boolean; // Whether this mapping has been manually overridden
  overriddenAt?: string; // ISO timestamp when override occurred
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

// S2.7: Validation and override types
export interface ValidationError {
  field: 'name' | 'role';
  message: string;
  speakerId: string;
}

export interface SpeakerValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface EditableSpeakerMapping extends SpeakerMapping {
  isEditing?: boolean;
  validationErrors?: ValidationError[];
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

// Session-Based Override Types (S3.1)
export interface SessionOverrideRequest {
  speakerId: string;
  newName: string;
  sessionId?: string;
}

export interface SessionRevertRequest {
  speakerId: string;
  sessionId: string;
}

export interface SessionClearRequest {
  sessionId: string;
}

export interface SessionOverrideResponse {
  success: boolean;
  sessionId: string;
  speakerId: string;
  originalName?: string;
  newName: string;
}

export interface SessionStatusResponse {
  sessionId: string;
  isActive: boolean;
  overrideCount: number;
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
