import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  HealthStatus, 
  DetailedHealthStatus, 
  RequestConfig, 
  TranscriptionResponse,
  SpeakerMappingRequest,
  SpeakerMappingResponse,
  SummaryRequest,
  SummaryResult,
  TranscriptionSummaryRequest
} from '../types';
import { sessionManager, type SessionOverrideAction } from './sessionManager';

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
    console.log('API Service initialized with baseURL:', this.baseURL);
    
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
        // Add auth headers here if needed
        const isDebug = import.meta.env.VITE_DEBUG === 'true';
        if (isDebug) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
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
        const isDebug = import.meta.env.VITE_DEBUG === 'true';
        if (isDebug) {
          console.log('✅ API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<T>(config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: string[] } }; message?: string };
      return {
        success: false,
        message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
        errors: axiosError.response?.data?.errors || [axiosError.message || 'Unknown error'],
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
    const formData = new FormData();
    formData.append('audioFile', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for file upload
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      };
    }

    return this.request<TranscriptionResponse>({
      method: 'POST',
      url: '/api/summary/transcribe',
      data: formData,
      ...config,
    });
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
    return this.request<SpeakerMappingResponse>({
      method: 'POST',
      url: '/api/SpeakerMapping/map',
      data: request,
    });
  }

  async getSpeakerMappings(transcriptionId: string): Promise<ApiResponse<SpeakerMappingResponse>> {
    return this.request<SpeakerMappingResponse>({
      method: 'GET',
      url: `/api/SpeakerMapping/${transcriptionId}`,
    });
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

  // Summary endpoints (S2.4)
  async generateSummary(request: SummaryRequest): Promise<ApiResponse<SummaryResult>> {
    return this.request<SummaryResult>({
      method: 'POST',
      url: '/api/summary/generate',
      data: request,
      timeout: 60000, // 1 minute for AI generation
    });
  }

  async generateTranscriptionSummary(
    transcriptionId: string, 
    request: TranscriptionSummaryRequest
  ): Promise<ApiResponse<SummaryResult>> {
    return this.request<SummaryResult>({
      method: 'POST',
      url: `/api/summary/${transcriptionId}/summarize`,
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

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
