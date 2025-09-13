// apiService.mock.ts
// Mock implementation of ApiService for frontend mock mode
import type { ApiResponse, HealthStatus, DetailedHealthStatus, TranscriptionResponse, SpeakerMappingRequest, SpeakerMappingResponse, MeetingSummary, MeetingSummaryRequest } from '../types/index';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockTranscription: TranscriptionResponse = {
  transcriptionId: 'mock-123',
  fileName: 'mock-audio.wav',
  fileSize: 1570000, // 1.57 MB in bytes, matches both displays
  status: 'Completed',
  // No speaker names in the transcribedText, just the text content
  transcribedText:
    'Finished the login page and started on the API integration. Today will work on the summary feature. No blockers.\n' +
    'Fixed the bug in the speaker mapping and reviewed the pull requests. Today plan to write more tests. Blocked on API docs.\n' +
    'Updated the UI for mobile responsiveness and helped with onboarding. Today will pair with someone on the summary. No blockers.\n' +
    'Deployed the latest build to staging and verified analytics. Today will monitor error logs and update documentation. Blocked by missing credentials.',
  speakerSegments: [
    { start: 0, end: 10, text: 'Yesterday I finished the login page and started on the API integration. Today I will work on the summary feature. No blockers.', speaker: 'Speaker 1' },
    { start: 11, end: 20, text: 'I fixed the bug in the speaker mapping and reviewed the pull requests. Today I plan to write more tests. Blocked on API docs.', speaker: 'Speaker 2' },
    { start: 21, end: 30, text: 'I updated the UI for mobile responsiveness and helped with onboarding. Today I will pair with someone on the summary. No blockers.', speaker: 'Speaker 3' },
    { start: 31, end: 40, text: 'I deployed the latest build to staging and verified analytics. Today I will monitor error logs and update documentation. Blocked by missing credentials.', speaker: 'Speaker 4' }
  ],
  processingTimeMs: 45000, // 45 seconds
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  confidenceScore: 0.99,
  detectedLanguage: 'en',
  duration: 40,
  speakerCount: 4,
  hasSpeakerDiarization: true,
  // Provide default speakerMappings for all detected speakers, but with empty names to simulate 'unnamed'
  speakerMappings: [
    { speakerId: 'Speaker 1', name: '', role: '', transcriptionId: 'mock-123' },
    { speakerId: 'Speaker 2', name: '', role: '', transcriptionId: 'mock-123' },
    { speakerId: 'Speaker 3', name: '', role: '', transcriptionId: 'mock-123' },
    { speakerId: 'Speaker 4', name: '', role: '', transcriptionId: 'mock-123' }
  ]
};

const mockSummary: MeetingSummary = {
  summaryId: 'mock-summary-' + Date.now(),
  transcriptionId: 'mock-123',
  meetingOverview: 'Daily standup meeting where the development team shared progress updates. Speaker 1 completed login page work and will focus on summary feature. Speaker 2 fixed speaker mapping bugs and reviewed PRs but is blocked on API documentation. Speaker 3 improved UI mobile responsiveness and onboarding, plans to pair on summary work. Speaker 4 deployed to staging and verified analytics but is blocked by missing credentials for monitoring tasks.',
  actionItemsByRole: [
    {
      speakerId: 'Speaker 1',
      speakerName: 'Speaker 1',
      speakerRole: 'Frontend Developer',
      actionItems: [
        { description: 'Work on the summary feature', isExplicitAssignment: true, confidence: 0.95 },
        { description: 'Continue API integration work', isExplicitAssignment: false, confidence: 0.80 }
      ]
    },
    {
      speakerId: 'Speaker 2',
      speakerName: 'Speaker 2', 
      speakerRole: 'QA Engineer',
      actionItems: [
        { description: 'Write more tests', isExplicitAssignment: true, confidence: 0.92 },
        { description: 'Resolve API documentation blocker', isExplicitAssignment: true, confidence: 0.88 }
      ]
    },
    {
      speakerId: 'Speaker 3',
      speakerName: 'Speaker 3',
      speakerRole: 'UI/UX Developer', 
      actionItems: [
        { description: 'Pair with someone on the summary', isExplicitAssignment: true, confidence: 0.90 },
        { description: 'Continue mobile responsiveness work', isExplicitAssignment: false, confidence: 0.75 }
      ]
    },
    {
      speakerId: 'Speaker 4',
      speakerName: 'Speaker 4',
      speakerRole: 'DevOps Engineer',
      actionItems: [
        { description: 'Monitor error logs', isExplicitAssignment: true, confidence: 0.95 },
        { description: 'Update documentation', isExplicitAssignment: true, confidence: 0.85 },
        { description: 'Resolve missing credentials issue', isExplicitAssignment: true, confidence: 0.98 }
      ]
    }
  ],
  unassignedActionItems: [
    { description: 'Resolve API documentation access for Speaker 2', confidence: 0.70, reason: 'External dependency blocking testing work' },
    { description: 'Provide missing credentials for Speaker 4', confidence: 0.85, reason: 'Required for error monitoring and documentation tasks' }
  ],
  metadata: {
    participants: ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'],
    speakerCount: 4,
    duration: '40s'
  },
  generation: {
    generatedAt: new Date().toISOString(),
    processingTimeMs: 200,
    tokenCount: 450,
    isEditable: true
  }
};

const apiServiceMock = {
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    await delay(200);
    return { data: { status: 'Healthy', timestamp: new Date().toISOString() }, success: true };
  },
  async getDetailedHealth(): Promise<ApiResponse<DetailedHealthStatus>> {
    await delay(200);
    return { data: {
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      version: 'mock',
      service: 'mock',
      environment: 'mock',
      upTime: 1000,
      machineName: 'mock-machine',
      processorCount: 4,
      workingSet: 123456,
      dependencies: { openAI: 'Healthy', database: 'Healthy' },
    }, success: true };
  },
  async uploadFile(_file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<TranscriptionResponse>> {
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        await delay(50);
        onProgress(i);
      }
    }
    await delay(500);
    return { data: mockTranscription, success: true };
  },
  async get<T>(_url: string): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async post<T>(_url: string, _data?: unknown): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async put<T>(_url: string, _data?: unknown): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async delete<T>(_url: string): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async saveSpeakerMappings(request: SpeakerMappingRequest): Promise<ApiResponse<SpeakerMappingResponse>> {
    await delay(100);
    return {
      data: {
        transcriptionId: request.transcriptionId,
        mappings: request.mappings,
        lastUpdated: new Date().toISOString(),
        mappedSpeakerCount: request.mappings.length,
      },
      success: true
    };
  },
  async getSpeakerMappings(_transcriptionId: string): Promise<ApiResponse<SpeakerMappingResponse>> {
    await delay(100);
    return {
      data: {
        transcriptionId: _transcriptionId,
        mappings: mockTranscription.speakerMappings || [],
        lastUpdated: new Date().toISOString(),
        mappedSpeakerCount: (mockTranscription.speakerMappings || []).length,
      },
      success: true
    };
  },
  async deleteSpeakerMappings(_transcriptionId: string): Promise<ApiResponse<void>> {
    await delay(100);
    return { success: true };
  },
  async applySessionOverride(): Promise<ApiResponse<any>> {
    await delay(100);
    return { success: true };
  },
  async revertSessionOverride(): Promise<ApiResponse<any>> {
    await delay(100);
    return { success: true };
  },
  async clearSessionData(): Promise<ApiResponse<void>> {
    await delay(100);
    return { success: true };
  },
  // Removed getSessionStatus to eliminate 'Session Active' chip in mock mode
  async generateMeetingSummary(_request: MeetingSummaryRequest): Promise<ApiResponse<MeetingSummary>> {
    console.log('🔧 MockApiService.generateMeetingSummary called');
    console.log('- Request:', _request);
    
    await delay(200);
    
    console.log('🔧 MockApiService.generateMeetingSummary response:', mockSummary);
    return { data: mockSummary, success: true };
  },
  async getSummarizationStatus(): Promise<ApiResponse<{ status: string; service: string; isAvailable: boolean }>> {
    await delay(100);
    return { data: { status: 'Available', service: 'MockAI', isAvailable: true }, success: true };
  },
  async generateSummary(): Promise<ApiResponse<any>> {
    await delay(200);
    return { data: { summary: mockSummary.meetingOverview }, success: true };
  },
  async generateTranscriptionSummary(): Promise<ApiResponse<any>> {
    await delay(200);
    return { data: { summary: mockSummary.meetingOverview }, success: true };
  },
  async getOpenAIStatus(): Promise<ApiResponse<{ isEnabled: boolean; mode: string }>> {
    await delay(100);
    return { data: { isEnabled: false, mode: 'mock' }, success: true };
  },
  async toggleOpenAI(enabled: boolean): Promise<ApiResponse<{ isEnabled: boolean; mode: string; message: string }>> {
    await delay(100);
    return { data: { isEnabled: !enabled, mode: 'mock', message: 'Mock mode toggled' }, success: true };
  },
  // Batch Job Methods (Mock Mode)
  async getBatchJobStatus(jobId: string): Promise<ApiResponse<import('../types/batchJob').BatchJobStatus>> {
    await delay(300);
    
    const mockBatchJob: import('../types/batchJob').BatchJobStatus = {
      jobId,
      status: 'processing',
      progressPercentage: 45,
      submittedAt: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
      estimatedDurationMinutes: 20,
      fileName: 'mock-long-meeting.wav',
      retryCount: 0,
      maxRetries: 3,
      refundIssued: false
    };
    
    return {
      success: true,
      data: mockBatchJob,
      message: 'Mock batch job status retrieved'
    };
  },

  async getBatchJobTranscript(_jobId: string): Promise<ApiResponse<import('../types').TranscriptionResult>> {
    await delay(800);
    
    const mockTranscriptResult: import('../types').TranscriptionResult = {
      text: "Speaker 1: Hello, welcome to our team meeting. Speaker 2: Thank you for joining us today. Let's start with the quarterly review.",
      segments: [
        {
          start: 0.0,
          end: 2.5,
          text: "Hello, welcome to our team meeting.",
          speaker: "Speaker 1",
          confidence: 0.95
        },
        {
          start: 2.8,
          end: 5.2,
          text: "Thank you for joining us today. Let's start with the quarterly review.",
          speaker: "Speaker 2",
          confidence: 0.92
        }
      ],
      detectedLanguage: "en-US",
      duration: 5.2
    };
    
    return {
      success: true,
      data: mockTranscriptResult,
      message: 'Mock transcript retrieved'
    };
  },

  async getUserBatchJobs(_status?: string, _limit?: number): Promise<ApiResponse<import('../types/batchJob').BatchJobStatus[]>> {
    await delay(300);
    
    const mockJobs: import('../types/batchJob').BatchJobStatus[] = [
      {
        jobId: 'mock-job-1',
        status: 'completed',
        progressPercentage: 100,
        submittedAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        completedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        estimatedDurationMinutes: 12,
        fileName: 'mock-meeting-1.wav',
        retryCount: 0,
        maxRetries: 3,
        refundIssued: false,
        processingDuration: '00:03:45'
      }
    ];
    
    return {
      success: true,
      data: mockJobs,
      message: 'Mock batch jobs retrieved'
    };
  },
  getBaseURL(): string {
    return 'mock';
  },
  updateBaseURL(): void {},
};

export default apiServiceMock;
