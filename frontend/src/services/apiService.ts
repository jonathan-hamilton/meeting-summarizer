import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  HealthStatus, 
  DetailedHealthStatus, 
  RequestConfig, 
  TranscriptionResponse,
  TranscriptionResult,
  SpeakerMappingRequest,
  SpeakerMappingResponse,
  MeetingSummaryRequest,
  MeetingSummary,
  SavedSummary,
  SavedActionItem,
  SaveSummaryRequest,
  SaveActionItemRequest,
  UpdateSavedSummaryRequest,
  UpdateSavedActionItemRequest
} from '../types';
import { sessionManager, type SessionOverrideAction } from './sessionManager';
import { useAuthStore } from '../stores/authStore';

// Session-based override types for S3.1
export interface SessionOverrideRequest {
  speakerId: string;
  newName: string;
  sessionId?: string;
}

export interface SessionOverrideResponse {
  success: boolean;
  sessionId: string;
  originalName?: string;
  newName: string;
  speakerId: string;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // TODO: Fix environment variable loading issue
    // See docs/technical-debt.md for details
    // Using hardcoded URL until VITE_API_BASE_URL loading is resolved
    this.baseURL = 'http://localhost:5029';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add Authorization header if user is authenticated
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.accessToken) {
          config.headers.Authorization = `Bearer ${authState.accessToken}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        console.error('❌ Response Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data,
        });

        // Handle 401 Unauthorized - token might be expired
        if (error.response?.status === 401) {
          const authState = useAuthStore.getState();
          if (authState.isAuthenticated) {
            console.warn('🔄 Access token expired, user will need to re-authenticate');
            // Note: Automatic token refresh could be implemented here
            // For now, we'll let the auth store handle re-authentication
            authState.logout();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Minimal logging to avoid console spam
      console.log(`🚀 API ${config.method?.toUpperCase()} ${config.url} (timeout: ${config.timeout}ms)`);
      
      const response = await this.client.request<T>(config);
      
      console.log(`✅ API SUCCESS ${config.method?.toUpperCase()} ${config.url} (${response.status})`);
      
      return {
        data: response.data,
        success: true,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string; code?: string };
      
      // Specific timeout and network error detection
      const isTimeout = axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout');
      const isNetworkError = axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error');
      
      console.error(`❌ API ERROR ${config.method?.toUpperCase()} ${config.url}`, {
        status: axiosError.response?.status,
        message: axiosError.message,
        code: axiosError.code,
        isTimeout,
        isNetworkError
      });
      
      // Get user-friendly error message based on status code
      const getUserFriendlyMessage = (status?: number, rawMessage?: string, errorData?: any): string => {
        // Prefer backend error message if available and user-friendly
        if (errorData?.message && !errorData.message.includes('status code')) {
          return errorData.message;
        }
        if (errorData?.error && !errorData.error.includes('status code')) {
          return errorData.error;
        }
        
        // Provide user-friendly messages for common HTTP status codes
        switch (status) {
          case 503:
            return 'Internal server error, please try again';
          case 502:
            return 'Service temporarily unavailable, please try again';
          case 500:
            return 'Internal server error, please try again';
          case 504:
            return 'Request timed out, please try again';
          case 401:
            return 'Authentication required. Please sign in again.';
          case 403:
            return 'Access denied. You do not have permission for this action.';
          case 404:
            return 'The requested resource was not found.';
          case 400:
            return 'Invalid request. Please check your input and try again.';
          case 429:
            return 'Too many requests. Please wait a moment and try again.';
          default:
            // For timeouts and network errors
            if (isTimeout) return 'Request timed out, please try again';
            if (isNetworkError) return 'Network connection error, please check your internet and try again';
            
            // Fallback for any status code errors
            if (rawMessage && rawMessage.includes('status code')) {
              return 'Internal server error, please try again';
            }
            
            return rawMessage || 'An error occurred';
        }
      };
      
      const errorData = axiosError.response?.data || {};
      const userFriendlyMessage = getUserFriendlyMessage(
        axiosError.response?.status, 
        axiosError.message, 
        errorData
      );
      
      return {
        success: false,
        message: userFriendlyMessage,
        errors: errorData.errors || [userFriendlyMessage],
        errorData: errorData,
      };
    }
  }

  // Health check endpoints
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request<HealthStatus>({
      method: 'GET',
      url: '/api/health',
    });
  }

  async getDetailedHealth(): Promise<ApiResponse<DetailedHealthStatus>> {
    return this.request<DetailedHealthStatus>({
      method: 'GET',
      url: '/api/health/detailed',
    });
  }

  // File upload and transcription endpoints
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<TranscriptionResponse>> {
    console.log(`📁 UPLOAD START: ${file.name} (${file.size} bytes)`);
    
    const startTime = Date.now();
    const formData = new FormData();
    formData.append('AudioFile', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 3600000, // 60 minutes timeout to ensure profitability
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted % 25 === 0) { // Only log every 25%
            console.log(`📊 UPLOAD ${file.name}: ${percentCompleted}%`);
          }
          onProgress(percentCompleted);
        }
      };
    }

    try {
      const result = await this.request<TranscriptionResponse>({
        method: 'POST',
        url: '/api/summary/transcribe',
        data: formData,
        ...config,
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ UPLOAD SUCCESS: ${file.name} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ UPLOAD FAILED: ${file.name} (${duration}ms)`, error);
      throw error;
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      timeout: config?.timeout,
      headers: config?.headers,
    });
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      timeout: config?.timeout,
      headers: config?.headers,
    });
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      timeout: config?.timeout,
      headers: config?.headers,
    });
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      timeout: config?.timeout,
      headers: config?.headers,
    });
  }

  // Speaker Mapping endpoints (S2.2)
  async saveSpeakerMappings(request: SpeakerMappingRequest): Promise<ApiResponse<SpeakerMappingResponse>> {
    console.log('=== SAVING SPEAKER MAPPINGS DEBUG ===');
    console.log('Request:', request);
    console.log('TranscriptionId being sent:', request.transcriptionId);
    console.log('Number of mappings:', request.mappings?.length || 0);
    console.log('Email fields in mappings:', request.mappings?.map(m => ({ speakerId: m.speakerId, email: m.email })));
    
    return this.request<SpeakerMappingResponse>({
      method: 'POST',
      url: '/api/SpeakerMapping/map',
      data: request,
    });
  }

  async getSpeakerMappings(transcriptionId: string): Promise<ApiResponse<SpeakerMappingResponse>> {
    console.log('=== LOADING SPEAKER MAPPINGS DEBUG ===');
    console.log('Loading mappings for transcriptionId:', transcriptionId);
    
    const response = await this.request<SpeakerMappingResponse>({
      method: 'GET',
      url: `/api/SpeakerMapping/${transcriptionId}`,
    });
    
    console.log('API Response:', response);
    console.log('Email fields in loaded mappings:', response.data?.mappings?.map(m => ({ speakerId: m.speakerId, email: m.email })));
    
    return response;
  }

  async deleteSpeakerMappings(transcriptionId: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/SpeakerMapping/${transcriptionId}`,
    });
  }

  // Session-based override methods (S3.1)
  async applySessionOverride(request: SessionOverrideRequest): Promise<ApiResponse<SessionOverrideResponse>> {
    // Update session activity when making API calls
    sessionManager.updateActivity();
    
    // Include session ID in request
    const sessionRequest = {
      ...request,
      sessionId: sessionManager.getSessionId()
    };

    const response = await this.request<SessionOverrideResponse>({
      method: 'POST',
      url: '/api/SpeakerMapping/session/override',
      data: sessionRequest,
    });

    // Store override action in session manager if successful
    if (response.success && response.data) {
      const overrideAction: SessionOverrideAction = {
        action: 'Override',
        originalValue: response.data.originalName,
        newValue: response.data.newName,
        timestamp: new Date(),
        fieldModified: 'speakerName'
      };
      
      sessionManager.storeOverride(request.speakerId, overrideAction);
    }

    return response;
  }

  async revertSessionOverride(speakerId: string): Promise<ApiResponse<SessionOverrideResponse>> {
    // Update session activity
    sessionManager.updateActivity();
    
    const response = await this.request<SessionOverrideResponse>({
      method: 'POST',
      url: '/api/SpeakerMapping/session/revert',
      data: {
        speakerId,
        sessionId: sessionManager.getSessionId()
      },
    });

    // Store revert action in session manager if successful
    if (response.success && response.data) {
      const revertAction: SessionOverrideAction = {
        action: 'Revert',
        originalValue: response.data.newName, // The override that was reverted
        newValue: response.data.originalName, // Back to original
        timestamp: new Date(),
        fieldModified: 'speakerName'
      };
      
      sessionManager.storeOverride(speakerId, revertAction);
    }

    return response;
  }

  async clearSessionData(): Promise<ApiResponse<void>> {
    // Update session activity
    sessionManager.updateActivity();
    
    const response = await this.request<void>({
      method: 'POST',
      url: '/api/SpeakerMapping/session/clear',
      data: {
        sessionId: sessionManager.getSessionId()
      },
    });

    // Clear local session data if server clear was successful
    if (response.success) {
      await sessionManager.clearSessionData();
    }

    return response;
  }

  async getSessionStatus(): Promise<ApiResponse<{ sessionId: string; isActive: boolean; overrideCount: number }>> {
    // Update session activity
    sessionManager.updateActivity();
    
    return this.request<{ sessionId: string; isActive: boolean; overrideCount: number }>({
      method: 'GET',
      url: `/api/SpeakerMapping/session/status/${sessionManager.getSessionId()}`,
    });
  }

  // S3.4: Meeting Summary endpoint
  async generateMeetingSummary(request: MeetingSummaryRequest): Promise<ApiResponse<MeetingSummary>> {
    return this.request<MeetingSummary>({
      method: 'POST',
      url: '/api/summary/meeting-summary',
      data: request,
      timeout: 60000, // 1 minute for AI generation
    });
  }

  async getSummarizationStatus(): Promise<ApiResponse<{ status: string; service: string; isAvailable: boolean }>> {
    return this.request<{ status: string; service: string; isAvailable: boolean }>({
      method: 'GET',
      url: '/api/summary/status',
    });
  }

  // Legacy Summary Generation Methods (S2.4 compatibility)
  async generateSummary(request: { 
    transcript: string; 
    style: string; 
    targetRole?: string; 
    maxTokens?: number; 
  }): Promise<ApiResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: '/api/summary/generate',
      data: request,
      timeout: 60000, // 1 minute for AI generation
    });
  }

  async generateTranscriptionSummary(transcriptionId: string, request: { 
    transcriptionId: string; 
    style: string; 
    targetRole?: string; 
    maxTokens?: number; 
  }): Promise<ApiResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/api/summary/${transcriptionId}/summarize`,
      data: request,
      timeout: 60000, // 1 minute for AI generation
    });
  }

  // Batch Job Methods
  async getBatchJobStatus(jobId: string): Promise<ApiResponse<import('../types/batchJob').BatchJobStatus>> {
    console.log(`🌐 API SERVICE: About to make HTTP request for job ${jobId}`);
    console.log(`🌐 URL: ${this.baseURL}/api/batchjob/${jobId}/status`);
    
    try {
      const response = await this.request<import('../types/batchJob').BatchJobStatus>({
        method: 'GET',
        url: `/api/batchjob/${jobId}/status`,
      });
      
      console.log(`🌐 API SERVICE: Got HTTP response for job ${jobId}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ API SERVICE: HTTP request failed for job ${jobId}:`, error);
      throw error;
    }
  }

  async getBatchJobTranscript(jobId: string): Promise<ApiResponse<TranscriptionResult>> {
    console.log(`📄 API SERVICE: About to fetch transcript for job ${jobId}`);
    console.log(`📄 URL: ${this.baseURL}/api/batchjob/${jobId}/transcript`);
    
    try {
      const response = await this.request<TranscriptionResult>({
        method: 'GET',
        url: `/api/batchjob/${jobId}/transcript`,
        timeout: 60000, // 1 minute for large transcript retrieval
      });
      
      console.log(`📄 API SERVICE: Got transcript response for job ${jobId}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ API SERVICE: Transcript request failed for job ${jobId}:`, error);
      throw error;
    }
  }

  async getUserBatchJobs(status?: string, limit?: number): Promise<ApiResponse<import('../types/batchJob').BatchJobStatus[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/batchjob?${queryString}` : '/api/batchjob';
    
    return this.request<import('../types/batchJob').BatchJobStatus[]>({
      method: 'GET',
      url,
    });
  }

  // OpenAI Toggle Methods
  async getOpenAIStatus(): Promise<ApiResponse<{ isEnabled: boolean; mode: string }>> {
    return this.request<{ isEnabled: boolean; mode: string }>({
      method: 'GET',
      url: '/api/health/openai-status',
    });
  }

  async toggleOpenAI(enabled: boolean): Promise<ApiResponse<{ isEnabled: boolean; mode: string; message: string }>> {
    return this.request<{ isEnabled: boolean; mode: string; message: string }>({
      method: 'POST',
      url: '/api/health/toggle-openai',
      data: enabled,
    });
  }

  // Meeting History API Methods (S6.5)
  async getMeetings(params?: { 
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ 
    items: import('../types/meeting').MeetingListItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('pageNumber', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.set('searchTerm', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.set('sortDirection', params.sortDirection);

    return this.get(`/api/meetings?${queryParams.toString()}`);
  }

  async getMeetingById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api/meetings/${id}`);
  }

  async deleteMeeting(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete(`/api/meetings/${id}`);
  }

  /**
   * Download meeting transcript as a text file with speaker mappings applied
   * @param meetingId Meeting ID to export
   * @returns Promise that resolves when file download starts
   */
  async downloadMeetingTranscript(meetingId: string): Promise<void> {
    try {
      console.log(`Starting download for meeting ID: ${meetingId}`);
      const response = await this.client.get(`/api/meetings/${meetingId}/export`, {
        responseType: 'blob',
        headers: {
          'Accept': 'text/plain'
        }
      });
      console.log('Download response received:', response.status, response.statusText);

      // Extract filename from Content-Disposition header or use default
      let filename = `meeting-${meetingId}-transcript.txt`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download meeting transcript:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Provide more specific error message
      if (error.response?.status === 404) {
        throw new Error('Meeting not found or you do not have access to it.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 400) {
        throw new Error('Meeting has no transcript available to export.');
      } else {
        throw new Error(`Failed to download transcript: ${error.response?.statusText || error.message}`);
      }
    }
  }

  /**
   * Download transcript as PDF for the specified transcription ID
   * @param transcriptionId Transcription ID to export as PDF
   * @returns Promise that resolves when file download starts
   */
  async downloadTranscriptPdf(transcriptionId: string): Promise<void> {
    try {
      console.log(`Starting PDF download for transcription ID: ${transcriptionId}`);
      const response = await this.client.get(`/api/export/transcript/${transcriptionId}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      console.log('PDF download response received:', response.status, response.statusText);

      // Extract filename from Content-Disposition header or use default
      let filename = `meeting-transcript-${new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-')}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`PDF download completed: ${filename}`);
    } catch (error: any) {
      console.error('Failed to download transcript PDF:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Provide more specific error message
      if (error.response?.status === 404) {
        throw new Error('Transcript not found or you do not have access to it.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 400) {
        throw new Error('Transcript data is not available for PDF generation.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred while generating PDF. Please try again later.');
      } else {
        throw new Error(`Failed to download PDF: ${error.response?.statusText || error.message}`);
      }
    }
  }

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }

  // ============================================================================
  // Summary Persistence API Methods (S6.10)
  // ============================================================================

  /**
   * Get all saved summaries for a user
   */
  async getUserSummaries(userId: string): Promise<ApiResponse<SavedSummary[]>> {
    try {
      const response = await this.client.get(`/api/savedsummary/user/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error getting user summaries:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to get user summaries',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Get a specific saved summary by ID
   */
  async getSavedSummary(summaryId: string, userId: string): Promise<ApiResponse<SavedSummary>> {
    try {
      const response = await this.client.get(`/api/savedsummary/${summaryId}?userId=${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error getting saved summary:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to get saved summary',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Save a new summary
   */
  async saveSummary(userId: string, request: SaveSummaryRequest): Promise<ApiResponse<SavedSummary>> {
    try {
      const response = await this.client.post(`/api/savedsummary/user/${userId}`, request);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error saving summary:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to save summary',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Update an existing summary
   */
  async updateSavedSummary(summaryId: string, userId: string, request: UpdateSavedSummaryRequest): Promise<ApiResponse<SavedSummary>> {
    try {
      const response = await this.client.put(`/api/savedsummary/${summaryId}?userId=${userId}`, request);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error updating saved summary:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to update saved summary',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Delete a saved summary
   */
  async deleteSavedSummary(summaryId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await this.client.delete(`/api/savedsummary/${summaryId}?userId=${userId}`);
      return {
        success: true
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error deleting saved summary:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to delete saved summary',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Add an action item to a saved summary
   */
  async addSavedActionItem(summaryId: string, userId: string, request: SaveActionItemRequest): Promise<ApiResponse<SavedActionItem>> {
    try {
      const response = await this.client.post(`/api/savedsummary/${summaryId}/actionitems?userId=${userId}`, request);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error adding saved action item:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to add saved action item',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Update a saved action item
   */
  async updateSavedActionItem(summaryId: string, actionItemId: string, userId: string, request: UpdateSavedActionItemRequest): Promise<ApiResponse<SavedActionItem>> {
    try {
      const response = await this.client.put(`/api/savedsummary/${summaryId}/actionitems/${actionItemId}?userId=${userId}`, request);
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error updating saved action item:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to update saved action item',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Delete a saved action item
   */
  async deleteSavedActionItem(summaryId: string, actionItemId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await this.client.delete(`/api/savedsummary/${summaryId}/actionitems/${actionItemId}?userId=${userId}`);
      return {
        success: true
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error deleting saved action item:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to delete saved action item',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }

  /**
   * Estimate audio file duration without uploading the full file
   */
  async estimateDuration(fileSizeBytes: number, fileName: string): Promise<ApiResponse<{ durationMinutes: number; fileName: string; fileSizeBytes: number }>> {
    try {
      const response = await this.client.post('/api/summary/estimate-duration', {
        fileSizeBytes,
        fileName
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: any; status?: number }; message?: string };
      console.error('Error estimating duration:', error);
      const errorData = axiosError.response?.data || {};
      return {
        success: false,
        message: errorData.message || errorData.error || axiosError.message || 'Failed to estimate duration',
        errors: errorData.errors || [errorData.message || errorData.error || axiosError.message || 'Unknown error'],
        errorData: errorData,
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
