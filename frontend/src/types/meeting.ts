// Meeting History Types for S6.5 Frontend Integration

export interface MeetingListItem {
  id: string;
  title: string;
  description: string | null;
  originalFileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  status: 'Uploaded' | 'Transcribing' | 'Transcribed' | 'Summarizing' | 'Completed' | 'Failed' | 'Deleted';
  processingStatus?: string; // For SignalR updates compatibility
  speakerCount: number;
  tokensConsumed: number;
  createdAt: string;
  completedAt: string | null;
  lastAccessedAt: string;
  
  // Computed display properties from backend
  formattedFileSize: string;
  formattedDuration: string;
  progressPercentage: number;
  formattedProcessingDuration: string;
}

export interface MeetingResponse {
  id: string;
  userId: string;
  batchJobId: string | null;
  transcriptBlobUrl: string | null;
  resultsJson: string | null;
  fileName: string;
  title: string | null;
  processingStatus: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  duration: number | null;
  processingTimeMs: number | null;
  speakerCount: number | null;
  fileSize: number;
  confidenceScore: number | null;
  participants: string | null;
  uploadedAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}



// Request types
export interface GetMeetingsRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  sortBy?: 'uploadedAt' | 'title' | 'duration' | 'processingStatus';
  sortDirection?: 'asc' | 'desc';
}

// Store state types
export interface MeetingHistoryState {
  meetings: MeetingListItem[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchQuery: string;
  statusFilter: 'All' | 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  sortBy: 'uploadedAt' | 'title' | 'duration' | 'processingStatus';
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

export interface MeetingHistoryActions {
  loadMeetings: () => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'All' | 'Pending' | 'InProgress' | 'Completed' | 'Failed') => void;
  setSorting: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  updateMeetingFromSignalR: (update: Partial<MeetingListItem>) => void;
  clearError: () => void;
}