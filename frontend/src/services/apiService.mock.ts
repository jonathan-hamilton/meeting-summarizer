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
  summaryId: 'mock-summary-1',
  transcriptionId: 'mock-123',
  meetingOverview: 'This is a mock summary of the meeting.',
  actionItemsByRole: [],
  unassignedActionItems: [],
  metadata: {
    participants: ['Speaker 1', 'Speaker 2'],
    speakerCount: 2,
    duration: '10s',
  },
  generation: {
    generatedAt: new Date().toISOString(),
    processingTimeMs: 100,
    tokenCount: 100,
    isEditable: false,
  },
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
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<TranscriptionResponse>> {
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        await delay(50);
        onProgress(i);
      }
    }
    await delay(500);
    return { data: mockTranscription, success: true };
  },
  async get<T>(url: string): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    await delay(100);
    return { data: {} as T, success: true };
  },
  async delete<T>(url: string): Promise<ApiResponse<T>> {
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
  async getSpeakerMappings(transcriptionId: string): Promise<ApiResponse<SpeakerMappingResponse>> {
    await delay(100);
    return {
      data: {
        transcriptionId,
        mappings: mockTranscription.speakerMappings || [],
        lastUpdated: new Date().toISOString(),
        mappedSpeakerCount: (mockTranscription.speakerMappings || []).length,
      },
      success: true
    };
  },
  async deleteSpeakerMappings(transcriptionId: string): Promise<ApiResponse<void>> {
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
  async generateMeetingSummary(): Promise<ApiResponse<MeetingSummary>> {
    await delay(200);
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
  getBaseURL(): string {
    return 'mock';
  },
  updateBaseURL(): void {},
};

export default apiServiceMock;
