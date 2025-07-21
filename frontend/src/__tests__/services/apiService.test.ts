import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import '@testing-library/jest-dom';
import axios from 'axios';
import type { 
  HealthStatus, 
  DetailedHealthStatus, 
  TranscriptionResponse,
  ApiResponse
} from '../../types';

// Mock axios at the module level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios);

interface MockAxiosInstance {
  interceptors: {
    request: { use: Mock };
    response: { use: Mock };
  };
  request: Mock;
  defaults: { baseURL: string; timeout?: number };
}

let mockAxiosInstance: MockAxiosInstance;

describe('ApiService - Critical Test Coverage - S2.1', () => {
  let apiService: typeof import('../../services/apiService').default;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      request: vi.fn(),
      defaults: { baseURL: 'http://localhost:5029' },
    };
    
    (mockedAxios.create as Mock).mockReturnValue(mockAxiosInstance);
    
    // Clear module cache and re-import
    vi.resetModules();
    const module = await import('../../services/apiService');
    apiService = module.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Setup', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:5029',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should initialize with correct base URL', () => {
      expect(apiService.getBaseURL()).toBe('http://localhost:5029');
    });
  });

  describe('Health Check Operations', () => {
    it('should check basic health endpoint', async () => {
      const mockHealthStatus: HealthStatus = { 
        status: 'healthy', 
        timestamp: '2024-01-01T00:00:00Z' 
      };
      
      const mockResponse: ApiResponse<HealthStatus> = {
        data: mockHealthStatus,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockHealthStatus });

      const result = await apiService.getHealth();
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/health',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should check detailed health endpoint', async () => {
      const mockDetailedHealth: DetailedHealthStatus = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
        service: 'meeting-summarizer',
        environment: 'test',
        upTime: 12345,
        machineName: 'test-machine',
        processorCount: 4,
        workingSet: 1024,
        dependencies: {}
      };
      
      const mockResponse: ApiResponse<DetailedHealthStatus> = {
        data: mockDetailedHealth,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockDetailedHealth });

      const result = await apiService.getDetailedHealth();
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/health/detailed',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle health check errors', async () => {
      const error = new Error('Service unavailable');
      mockAxiosInstance.request.mockRejectedValue(error);

      const result = await apiService.getHealth();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Service unavailable');
    });
  });

  describe('File Upload and Transcription', () => {
    it('should upload file and return transcription', async () => {
      const mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const mockTranscription: TranscriptionResponse = {
        transcriptionId: 'test-123',
        fileName: 'test.mp3',
        fileSize: 1024,
        status: 'completed',
        transcribedText: 'Test transcription',
        speakerSegments: [],
        processingTimeMs: 1000,
        createdAt: '2024-01-01T00:00:00Z'
      };
      
      const mockResponse: ApiResponse<TranscriptionResponse> = {
        data: mockTranscription,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockTranscription });

      const result = await apiService.uploadFile(mockFile);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/summary/transcribe',
        data: expect.any(FormData),
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should upload file with progress callback', async () => {
      const mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const mockProgressCallback = vi.fn();
      const mockTranscription: TranscriptionResponse = {
        transcriptionId: 'test-123',
        fileName: 'test.mp3',
        fileSize: 1024,
        status: 'completed',
        processingTimeMs: 1000,
        createdAt: '2024-01-01T00:00:00Z'
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockTranscription });

      await apiService.uploadFile(mockFile, mockProgressCallback);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          onUploadProgress: expect.any(Function),
        })
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const error = new Error('Upload failed');
      mockAxiosInstance.request.mockRejectedValue(error);

      const result = await apiService.uploadFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Upload failed');
    });
  });

  describe('Generic HTTP Methods', () => {
    it('should perform GET requests', async () => {
      const mockData = { test: 'data' };
      const mockResponse: ApiResponse<{ test: string }> = {
        data: mockData,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });

      const result = await apiService.get('/test-endpoint');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test-endpoint',
        timeout: undefined,
        headers: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should perform POST requests', async () => {
      const mockData = { test: 'data' };
      const requestData = { input: 'test' };
      const mockResponse: ApiResponse<{ test: string }> = {
        data: mockData,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });

      const result = await apiService.post('/test-endpoint', requestData);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test-endpoint',
        data: requestData,
        timeout: undefined,
        headers: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should perform PUT requests', async () => {
      const mockData = { test: 'data' };
      const requestData = { input: 'test' };
      const mockResponse: ApiResponse<{ test: string }> = {
        data: mockData,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });

      const result = await apiService.put('/test-endpoint', requestData);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test-endpoint',
        data: requestData,
        timeout: undefined,
        headers: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should perform DELETE requests', async () => {
      const mockData = { success: true };
      const mockResponse: ApiResponse<{ success: boolean }> = {
        data: mockData,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });

      const result = await apiService.delete('/test-endpoint');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test-endpoint',
        timeout: undefined,
        headers: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('S2.4 Summary Generation Operations', () => {
    it('should generate summary from transcript', async () => {
      const mockRequest = {
        transcript: 'Meeting transcript content...',
        style: 'Brief' as const,
        targetRole: 'Product Manager',
        maxTokens: 500,
      };
      
      const mockSummaryResult = {
        summaryId: 'summary-001',
        transcriptionId: 'test-transcription-001',
        summaryType: 'Brief',
        content: 'Brief summary of the meeting...',
        generatedAt: '2024-01-01T10:00:00Z',
        processingTimeMs: 1500,
        tokenCount: 85,
        generatedFor: 'Product Manager',
        usedSpeakerMappings: false,
      };
      
      const mockResponse = {
        data: mockSummaryResult,
        success: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockSummaryResult });

      const result = await apiService.generateSummary(mockRequest);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/summary/generate',
        data: mockRequest,
        timeout: 60000,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should generate summary from transcription ID', async () => {
      const transcriptionId = 'test-transcription-001';
      const mockRequest = {
        transcriptionId,
        style: 'Detailed' as const,
        targetRole: 'Engineering Manager',
        maxTokens: 1000,
      };
      
      const mockSummaryResult = {
        summaryId: 'summary-002',
        transcriptionId,
        summaryType: 'Detailed',
        content: 'Detailed analysis of the meeting...',
        generatedAt: '2024-01-01T10:05:00Z',
        processingTimeMs: 2500,
        tokenCount: 250,
        generatedFor: 'Engineering Manager',
        usedSpeakerMappings: true,
        actionItems: ['Review code changes', 'Schedule team meeting'],
        keyDecisions: ['Approved new architecture'],
        nextSteps: ['Begin implementation phase'],
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockSummaryResult });

      const result = await apiService.generateTranscriptionSummary(transcriptionId, mockRequest);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: `/api/summary/${transcriptionId}/summarize`,
        data: mockRequest,
        timeout: 60000,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummaryResult);
    });

    it('should get summarization service status', async () => {
      const mockStatus = {
        status: 'healthy',
        service: 'OpenAI GPT-4',
        isAvailable: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockStatus });

      const result = await apiService.getSummarizationStatus();
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/summary/status',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStatus);
    });

    it('should handle summary generation with minimal request', async () => {
      const mockRequest = {
        transcript: 'Short meeting content',
        style: 'Brief' as const,
      };
      
      const mockSummaryResult = {
        summaryId: 'summary-003',
        transcriptionId: '',
        summaryType: 'Brief',
        content: 'Brief summary...',
        generatedAt: '2024-01-01T10:10:00Z',
        processingTimeMs: 800,
        tokenCount: 45,
        usedSpeakerMappings: false,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockSummaryResult });

      const result = await apiService.generateSummary(mockRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.summaryType).toBe('Brief');
    });

    it('should handle summary generation errors', async () => {
      const mockRequest = {
        transcript: 'Meeting content',
        style: 'Brief' as const,
      };
      
      const error = {
        response: {
          status: 400,
          data: { 
            message: 'Invalid request: transcript too short',
            errors: ['Transcript must be at least 10 words']
          }
        }
      };
      
      mockAxiosInstance.request.mockRejectedValue(error);

      const result = await apiService.generateSummary(mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid request: transcript too short');
      expect(result.errors).toEqual(['Transcript must be at least 10 words']);
    });

    it('should handle transcription summary with role-aware features', async () => {
      const transcriptionId = 'test-transcription-002';
      const mockRequest = {
        transcriptionId,
        style: 'ActionItems' as const,
        targetRole: 'Project Manager',
        maxTokens: 750,
      };
      
      const mockSummaryResult = {
        summaryId: 'summary-004',
        transcriptionId,
        summaryType: 'ActionItems',
        content: 'Meeting action items and next steps...',
        generatedAt: '2024-01-01T10:15:00Z',
        processingTimeMs: 1800,
        tokenCount: 120,
        generatedFor: 'Project Manager',
        usedSpeakerMappings: true,
        actionItems: [
          'Update project timeline',
          'Schedule stakeholder review',
          'Prepare budget proposal'
        ],
        nextSteps: [
          'Begin requirements gathering',
          'Set up development environment'
        ],
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockSummaryResult });

      const result = await apiService.generateTranscriptionSummary(transcriptionId, mockRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.generatedFor).toBe('Project Manager');
      expect(result.data?.actionItems).toHaveLength(3);
      expect(result.data?.usedSpeakerMappings).toBe(true);
    });

    it('should handle summarization service availability check', async () => {
      const mockStatus = {
        status: 'healthy',
        service: 'OpenAI GPT-4',
        isAvailable: true,
      };
      
      mockAxiosInstance.request.mockResolvedValue({ data: mockStatus });

      const result = await apiService.getSummarizationStatus();
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('healthy');
      expect(result.data?.service).toBe('OpenAI GPT-4');
      expect(result.data?.isAvailable).toBe(true);
    });

    it('should handle summary generation timeout', async () => {
      const mockRequest = {
        transcript: 'Very long meeting transcript content...',
        style: 'Detailed' as const,
        maxTokens: 2000,
      };
      
      const timeoutError = new Error('Request timeout - summary generation taking too long');
      mockAxiosInstance.request.mockRejectedValue(timeoutError);

      const result = await apiService.generateSummary(mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('timeout');
    });

    it('should handle different summary styles', async () => {
      const styles = ['Brief', 'Detailed', 'ActionItems', 'KeyDecisions', 'ExecutiveSummary'] as const;
      
      for (const style of styles) {
        const mockRequest = {
          transcript: 'Meeting content for testing',
          style,
        };
        
        const mockSummaryResult = {
          summaryId: `summary-${style.toLowerCase()}`,
          transcriptionId: '',
          summaryType: style,
          content: `${style} summary content...`,
          generatedAt: '2024-01-01T10:25:00Z',
          processingTimeMs: 1200,
          tokenCount: 80,
          usedSpeakerMappings: false,
        };
        
        mockAxiosInstance.request.mockResolvedValue({ data: mockSummaryResult });

        const result = await apiService.generateSummary(mockRequest);
        
        expect(result.success).toBe(true);
        expect(result.data?.summaryType).toBe(style);
      }
    });
  });

  describe('Configuration Management', () => {
    it('should get base URL', () => {
      const result = apiService.getBaseURL();
      expect(result).toBe('http://localhost:5029');
    });

    it('should update base URL', () => {
      const newBaseURL = 'https://api.example.com';
      apiService.updateBaseURL(newBaseURL);
      
      expect(mockAxiosInstance.defaults.baseURL).toBe(newBaseURL);
      expect(apiService.getBaseURL()).toBe(newBaseURL);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      const result = await apiService.get('/test');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Network Error');
      expect(result.errors).toEqual(['Network Error']);
    });

    it('should handle HTTP error responses with message', async () => {
      const httpError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { 
            message: 'Resource not found',
            errors: ['The requested resource does not exist']
          }
        },
        message: 'Request failed with status code 404'
      };
      mockAxiosInstance.request.mockRejectedValue(httpError);

      const result = await apiService.get('/nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Resource not found');
      expect(result.errors).toEqual(['The requested resource does not exist']);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockAxiosInstance.request.mockRejectedValue(timeoutError);

      const result = await apiService.post('/slow-endpoint', {});
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Request timeout');
    });

    it('should handle errors without specific message', async () => {
      const genericError = {
        response: {
          status: 500,
          data: {}
        }
      };
      mockAxiosInstance.request.mockRejectedValue(genericError);

      const result = await apiService.get('/error-endpoint');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred');
    });
  });
});