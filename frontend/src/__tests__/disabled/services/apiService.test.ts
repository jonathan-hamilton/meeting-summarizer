import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import '@testing-library/jest-dom';
import axios from 'axios';
import type { HealthStatus, DetailedHealthStatus, TranscriptionResponse } from '../../types';

// Mock axios at the module level
vi.mock('axios', () => ({
  default: {
    create: vi.fn()
  }
}));

const mockedAxios = vi.mocked(axios);

interface MockAxiosInstance {
  interceptors: {
    request: { use: Mock };
    response: { use: Mock };
  };
  get: Mock;
  post: Mock;
  put: Mock;
  delete: Mock;
  head: Mock;
  defaults: { baseURL: string; timeout?: number };
}

let mockAxiosInstance: MockAxiosInstance;

describe('ApiService - Critical Test Coverage - S2.1', () => {
  let apiService: any;
  let ApiService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      head: vi.fn(),
      defaults: { baseURL: 'http://localhost:5029' }
    };
    
    (mockedAxios.create as Mock).mockReturnValue(mockAxiosInstance);
    
    // Import ApiService after mocks are set up
    const module = await import('../../services/apiService');
    ApiService = module.ApiService;
    
    // Create new instance for each test
    apiService = new ApiService();
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
      const mockResponse: HealthStatus = { 
        status: 'healthy', 
        timestamp: '2024-01-01T00:00:00Z' 
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await apiService.checkHealth();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockResponse);
    });

    it('should check detailed health endpoint', async () => {
      const mockResponse: DetailedHealthStatus = {
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
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await apiService.checkDetailedHealth();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health/detailed');
      expect(result).toEqual(mockResponse);
    });

    it('should handle health check errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Service unavailable'));

      await expect(apiService.checkHealth()).rejects.toThrow('Service unavailable');
    });
  });

  describe('File Upload and Transcription', () => {
    it('should upload file and return transcription', async () => {
      const mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse: TranscriptionResponse = {
        transcriptionId: 'test-123',
        fileName: 'test.mp3',
        fileSize: 1024,
        status: 'completed',
        transcribedText: 'Test transcription',
        speakerSegments: [],
        processingTimeMs: 1000,
        createdAt: '2024-01-01T00:00:00Z'
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await apiService.uploadAndTranscribe(mockFile);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/transcribe',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle upload with progress callback', async () => {
      const mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const mockProgressCallback = vi.fn();
      const mockResponse: TranscriptionResponse = {
        transcriptionId: 'test-123',
        fileName: 'test.mp3',
        fileSize: 1024,
        status: 'completed',
        processingTimeMs: 1000,
        createdAt: '2024-01-01T00:00:00Z'
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await apiService.uploadAndTranscribe(mockFile, mockProgressCallback);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/transcribe',
        expect.any(FormData),
        expect.objectContaining({
          onUploadProgress: mockProgressCallback
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('HTTP Methods', () => {
    it('should perform GET requests', async () => {
      const mockResponse = { data: 'test data' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.get('/test-endpoint');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual(mockResponse.data);
    });

    it('should perform POST requests', async () => {
      const mockData = { test: 'data' };
      const mockResponse = { data: 'response' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.post('/test-endpoint', mockData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should perform PUT requests', async () => {
      const mockData = { test: 'data' };
      const mockResponse = { data: 'response' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await apiService.put('/test-endpoint', mockData);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should perform DELETE requests', async () => {
      const mockResponse = { data: 'response' };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiService.delete('/test-endpoint');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual(mockResponse.data);
    });

    it('should perform HEAD requests', async () => {
      const mockResponse = { data: '', headers: { 'content-length': '1024' } };
      mockAxiosInstance.head.mockResolvedValue(mockResponse);

      const result = await apiService.head('/test-endpoint');
      
      expect(mockAxiosInstance.head).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Configuration Management', () => {
    it('should get base URL', () => {
      const result = apiService.getBaseURL();
      expect(result).toBe('http://localhost:5029');
    });

    it('should set base URL', () => {
      const newBaseURL = 'https://api.example.com';
      apiService.setBaseURL(newBaseURL);
      
      expect(mockAxiosInstance.defaults.baseURL).toBe(newBaseURL);
    });

    it('should update configuration', () => {
      const newConfig = { timeout: 15000 };
      apiService.updateConfig(newConfig);
      
      expect(mockAxiosInstance.defaults.timeout).toBe(15000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle HTTP error responses', async () => {
      const httpError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' }
        }
      };
      mockAxiosInstance.get.mockRejectedValue(httpError);

      await expect(apiService.get('/nonexistent')).rejects.toEqual(httpError);
    });

    it('should handle timeout errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Request timeout'));

      await expect(apiService.post('/slow-endpoint', {})).rejects.toThrow('Request timeout');
    });
  });
});