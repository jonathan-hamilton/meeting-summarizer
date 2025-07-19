import type { TranscriptionResponse } from '../../types';

// Mock transcription data for testing
export const mockTranscriptionResponseWithSpeakers: TranscriptionResponse = {
  transcriptionId: 'test-123',
  fileName: 'test-meeting.mp3',
  fileSize: 1048576, // Exactly 1 MB
  status: 'Completed',
  transcribedText: 'Hello everyone, how are you today? I am doing well, thank you for asking.',
  speakerSegments: [
    {
      start: 0.0,
      end: 2.5,
      text: 'Hello everyone, how are you today?',
      speaker: 'Speaker 1',
      confidence: 0.95,
    },
    {
      start: 2.5,
      end: 5.0,
      text: 'I am doing well, thank you for asking.',
      speaker: 'Speaker 2',
      confidence: 0.92,
    },
  ],
  processingTimeMs: 2500,
  createdAt: '2025-07-19T10:00:00Z',
  completedAt: '2025-07-19T10:00:02Z',
  confidenceScore: 0.93,
  detectedLanguage: 'en',
  duration: 5.0,
  speakerCount: 2,
  hasSpeakerDiarization: true,
};

export const mockTranscriptionResponseSimpleText: TranscriptionResponse = {
  transcriptionId: 'test-456',
  fileName: 'simple-audio.wav',
  fileSize: 512000,
  status: 'Completed',
  transcribedText: 'This is a simple transcription without speaker segments.',
  processingTimeMs: 1500,
  createdAt: '2025-07-19T10:05:00Z',
  completedAt: '2025-07-19T10:05:01Z',
  confidenceScore: 0.88,
  detectedLanguage: 'en',
};

export const mockTranscriptionResponseFailed: TranscriptionResponse = {
  transcriptionId: 'test-789',
  fileName: 'failed-audio.mp3',
  fileSize: 2048000,
  status: 'Failed',
  errorMessage: 'Audio file format not supported',
  processingTimeMs: 500,
  createdAt: '2025-07-19T10:10:00Z',
};

export const mockTranscriptionResponseLoading: TranscriptionResponse = {
  transcriptionId: 'test-loading',
  fileName: 'processing-audio.mp3',
  fileSize: 1536000,
  status: 'Processing',
  processingTimeMs: 0,
  createdAt: '2025-07-19T10:15:00Z',
};
