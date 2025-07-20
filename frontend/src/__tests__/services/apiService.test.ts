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