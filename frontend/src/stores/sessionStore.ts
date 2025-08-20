import { create } from 'zustand';
import type { TranscriptionResponse } from '../types';

interface SessionState {
  // Session metrics
  transcripts: TranscriptionResponse[];
  totalTranscriptFileSize: number; // Sum of all transcript file sizes
  overrideCount: number; // Number of speaker overrides
  sessionStartTime: Date; // When session started
  
  // Actions
  addTranscript: (transcript: TranscriptionResponse) => void;
  removeTranscript: (transcriptionId: string) => void;
  incrementOverrides: () => void;
  decrementOverrides: () => void;
  resetOverrides: () => void;
  clearSession: () => void;
  getSessionDurationMinutes: () => number;
  initializeSession: () => void; // Add initialization method
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  // Initial state
  transcripts: [],
  totalTranscriptFileSize: 0,
  overrideCount: 0,
  sessionStartTime: new Date(), // Initialize session start time immediately

  // Add a new transcript
  addTranscript: (transcript: TranscriptionResponse) => {
    set((state) => {
      const newTranscripts = [...state.transcripts, transcript];
      
      // Calculate transcript file size based on the actual transcript content
      const newTotalSize = newTranscripts.reduce((sum, t) => {
        // Calculate size of transcript text content (transcribedText + speaker segments)
        let transcriptSize = 0;
        
        if (t.transcribedText) {
          transcriptSize += new Blob([t.transcribedText]).size;
        }
        
        if (t.speakerSegments) {
          const segmentsText = t.speakerSegments.map(s => s.text).join(' ');
          transcriptSize += new Blob([segmentsText]).size;
        }
        
        return sum + transcriptSize;
      }, 0);
      
      return {
        transcripts: newTranscripts,
        totalTranscriptFileSize: newTotalSize,
        // Don't override sessionStartTime if it's already set
      };
    });
  },

  // Remove a transcript
  removeTranscript: (transcriptionId: string) => {
    set((state) => {
      const newTranscripts = state.transcripts.filter(t => t.transcriptionId !== transcriptionId);
      
      // Recalculate transcript file size based on remaining transcript content
      const newTotalSize = newTranscripts.reduce((sum, t) => {
        let transcriptSize = 0;
        
        if (t.transcribedText) {
          transcriptSize += new Blob([t.transcribedText]).size;
        }
        
        if (t.speakerSegments) {
          const segmentsText = t.speakerSegments.map(s => s.text).join(' ');
          transcriptSize += new Blob([segmentsText]).size;
        }
        
        return sum + transcriptSize;
      }, 0);
      
      return {
        transcripts: newTranscripts,
        totalTranscriptFileSize: newTotalSize,
      };
    });
  },

  // Override management
  incrementOverrides: () => {
    set((state) => ({ overrideCount: state.overrideCount + 1 }));
  },

  decrementOverrides: () => {
    set((state) => ({ overrideCount: Math.max(0, state.overrideCount - 1) }));
  },

  resetOverrides: () => {
    set({ overrideCount: 0 });
  },

  // Clear all session data
  clearSession: () => {
    set({
      transcripts: [],
      totalTranscriptFileSize: 0,
      overrideCount: 0,
      sessionStartTime: new Date(), // Reset session start time
    });
  },

  // Calculate session duration in minutes
  getSessionDurationMinutes: () => {
    const { sessionStartTime } = get();
    
    const now = new Date();
    const diffMs = now.getTime() - sessionStartTime.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60)); // Convert to minutes
    
    // Ensure we always return a non-negative number
    return Math.max(0, minutes);
  },

  // Initialize or reinitialize session
  initializeSession: () => {
    set((state) => ({
      ...state,
      sessionStartTime: new Date(),
    }));
  },
}));
