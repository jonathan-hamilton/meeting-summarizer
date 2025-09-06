/**
 * Global Mock for SpeakerSessionStore - Complete Speaker Management Mock
 */

import { vi } from 'vitest';

// Mock the complete SpeakerSessionStore interface
export const mockSpeakerSessionStoreState = {
  // Core state
  transcript: '',
  audioFile: null,
  speakers: [],
  speakerMappings: {},
  isUploading: false,
  isProcessing: false,
  error: null,
  
  // File management
  setAudioFile: vi.fn(),
  setTranscript: vi.fn(),
  setSpeakers: vi.fn(),
  setIsUploading: vi.fn(),
  setIsProcessing: vi.fn(),
  setError: vi.fn(),
  
  // Speaker management
  setSpeakerMappings: vi.fn(),
  updateSpeakerMapping: vi.fn(),
  deleteSpeaker: vi.fn(),
  clearSpeakers: vi.fn(),
  
  // Session management
  clearSession: vi.fn(),
  resetState: vi.fn(),
  
  // Statistics
  setTranscriptionStats: vi.fn(),
  setProcessingTime: vi.fn(),
  
  // Computed getters
  getMappedSpeakers: vi.fn().mockReturnValue([]),
  getUnmappedSpeakers: vi.fn().mockReturnValue([]),
  getSpeakerCount: vi.fn().mockReturnValue(0),
};

// Create the Zustand store mock
export const mockUseSpeakerSessionStore = vi.fn(() => mockSpeakerSessionStoreState);

// Create getState mock for store access
(mockUseSpeakerSessionStore as any).getState = vi.fn(() => mockSpeakerSessionStoreState);

// Mock active speakers hook
export const mockUseActiveSpeakers = vi.fn(() => []);

// Mock the speaker session store module
vi.mock('../../stores/speakerSessionStore', () => ({
  useSpeakerSessionStore: mockUseSpeakerSessionStore,
  useActiveSpeakers: mockUseActiveSpeakers
}));
