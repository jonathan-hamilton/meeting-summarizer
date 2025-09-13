// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
  errorData?: any; // Full error response data for structured errors
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

// Batch Job Types
export * from './batchJob';

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

// Transcription Result for batch job transcript endpoint
export interface TranscriptionResult {
  text: string;
  segments: SpeakerSegment[];
  detectedLanguage?: string;
  duration?: number;
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
  // S3.4: Email field for enhanced sharing
  email?: string; // Optional email for meeting participants
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
  field: 'name' | 'role' | 'email'; // S3.4: Add email field validation
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

// Legacy Summary Types (for backward compatibility with tests)
export type SummaryStyle = 'Brief' | 'Detailed' | 'ActionItems' | 'ExecutiveSummary';

export const SummaryStyle = {
  Brief: 'Brief' as const,
  Detailed: 'Detailed' as const,
  ActionItems: 'ActionItems' as const,
  ExecutiveSummary: 'ExecutiveSummary' as const
};

export interface SummaryResult {
  summaryId: string;
  transcriptionId: string;
  summaryType: SummaryStyle;
  content: string;
  generatedAt: string;
  processingTimeMs: number;
  tokenCount: number;
  wordCount?: number;
  characterCount?: number;
}

// S3.4: Meeting Summary Types (replacing old summary system)
export interface MeetingSummaryRequest {
  Transcript: string; // S3.4: Match backend PascalCase
  SpeakerMappings: SpeakerMapping[]; // S3.4: Match backend PascalCase
  MaxTokens?: number; // S3.4: Match backend PascalCase
}

// Legacy ActionItem interface for backward compatibility
export interface LegacyActionItem {
  description: string;
  isExplicitAssignment: boolean;
  confidence: number;
  sourceText?: string;
}

// Enhanced ActionItem interface for CRUD operations (REQ-ACTMGMT-1, REQ-ACTMGMT-2)
export interface ActionItem {
  id: string; // REQ-ACTMGMT-2: Use crypto.randomUUID()
  description: string;
  assignedTo: string; // REQ-ACTMGMT-1: Speaker ID or "Unassigned"
  confidence: number;
  isExplicitAssignment: boolean;
  sourceText?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface ActionItemsByRole {
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  actionItems: LegacyActionItem[]; // Use legacy interface during transition
}

export interface UnassignedActionItem {
  description: string;
  confidence: number;
  sourceText?: string;
  reason: string;
}

export interface MeetingMetadata {
  participants: string[];
  duration?: string;
  speakerCount: number;
}

export interface GenerationMetadata {
  generatedAt: string;
  processingTimeMs: number;
  tokenCount: number;
  isEditable: boolean;
}

export interface MeetingSummary {
  summaryId: string;
  transcriptionId: string;
  meetingOverview: string;
  actionItemsByRole: ActionItemsByRole[];
  unassignedActionItems: UnassignedActionItem[];
  metadata: MeetingMetadata;
  generation: GenerationMetadata;
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
