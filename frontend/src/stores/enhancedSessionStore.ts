import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TranscriptionResponse, SpeakerSegment, SpeakerMapping } from '../types';
import type { AppMode } from '../contexts/AppModeContext';

interface ProductionState {
  transcripts: TranscriptionResponse[];
  totalTranscriptFileSize: number;
  overrideCount: number;
  sessionStartTime: Date;
  userSession?: {
    userId: string;
    isAuthenticated: boolean;
  };
}

interface EnhancedSessionState {
  currentMode: AppMode;
  production: ProductionState;
  
  setMode: (mode: AppMode) => void;
  addTranscript: (transcript: TranscriptionResponse) => void;
  removeTranscript: (transcriptionId: string) => void;
  incrementOverrides: () => void;
  decrementOverrides: () => void;
  resetOverrides: () => void;
  clearSession: () => void;
  getSessionDurationMinutes: () => number;
  initializeSession: () => void;
  
  getCurrentTranscripts: () => TranscriptionResponse[];
  getCurrentSegments: () => SpeakerSegment[];
  getCurrentSpeakerMappings: () => SpeakerMapping[];
  isUploadInProgress: () => boolean;
}

export const useEnhancedSessionStore = create<EnhancedSessionState>()(
  devtools(
    (set, get) => ({
      currentMode: 'development',
      
      production: {
        transcripts: [],
        totalTranscriptFileSize: 0,
        overrideCount: 0,
        sessionStartTime: new Date(),
      },
      
      setMode: (mode: AppMode) => {
        set({ currentMode: mode });
      },
      
      addTranscript: (transcript: TranscriptionResponse) => {
        set((state) => ({
          production: {
            ...state.production,
            transcripts: [...state.production.transcripts, transcript],
            totalTranscriptFileSize: state.production.totalTranscriptFileSize + (transcript.fileSize || 0),
          }
        }));
      },
      
      removeTranscript: (transcriptionId: string) => {
        set((state) => ({
          production: {
            ...state.production,
            transcripts: state.production.transcripts.filter(t => t.transcriptionId !== transcriptionId),
          }
        }));
      },
      
      incrementOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: state.production.overrideCount + 1,
          }
        }));
      },
      
      decrementOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: Math.max(0, state.production.overrideCount - 1),
          }
        }));
      },
      
      resetOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: 0,
          }
        }));
      },
      
      clearSession: () => {
        set((state) => ({
          production: {
            ...state.production,
            transcripts: [],
            totalTranscriptFileSize: 0,
            overrideCount: 0,
            sessionStartTime: new Date(),
          }
        }));
      },
      
      getSessionDurationMinutes: () => {
        const { production } = get();
        const now = new Date();
        const diffMs = now.getTime() - production.sessionStartTime.getTime();
        return Math.floor(diffMs / (1000 * 60));
      },
      
      initializeSession: () => {
        set((state) => ({
          production: {
            ...state.production,
            sessionStartTime: new Date(),
            overrideCount: 0,
          }
        }));
      },
      
      getCurrentTranscripts: () => {
        const { production } = get();
        return production.transcripts;
      },
      
      getCurrentSegments: () => {
        return [];
      },
      
      getCurrentSpeakerMappings: () => {
        return [];
      },
      
      isUploadInProgress: () => {
        return false;
      },
    }),
    {
      name: 'enhanced-session-store',
    }
  )
);
