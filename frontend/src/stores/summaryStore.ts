import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeetingSummary, MeetingSummaryRequest, SpeakerMapping } from '../types';
import apiService from '../services/apiService';

interface SummaryState {
  // Current summary data
  summary: MeetingSummary | null;
  
  // Loading and error states
  isGenerating: boolean;
  error: string | null;
  lastGeneratedAt: string | null;
  
  // Actions
  generateSummary: (transcriptText: string, speakerMappings: SpeakerMapping[]) => Promise<void>;
  clearSummary: () => void;
  clearError: () => void;
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set) => ({
      // Initial state
      summary: null,
      isGenerating: false,
      error: null,
      lastGeneratedAt: null,

      // Generate meeting summary action
      generateSummary: async (transcriptText: string, speakerMappings: SpeakerMapping[]) => {
        set({ isGenerating: true, error: null });
        
        try {
          const request: MeetingSummaryRequest = {
            transcript: transcriptText,
            speakerMappings: speakerMappings || []
          };

          const response = await apiService.generateMeetingSummary(request);
          
          if (response.success && response.data) {
            set({ 
              summary: response.data, 
              isGenerating: false, 
              error: null,
              lastGeneratedAt: new Date().toISOString()
            });
          } else {
            set({ 
              isGenerating: false, 
              error: response.message || 'Failed to generate meeting summary'
            });
          }
        } catch (error) {
          console.error('Summary generation error:', error);
          set({ 
            isGenerating: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred while generating the summary'
          });
        }
      },

      // Clear current summary
      clearSummary: () => {
        set({ 
          summary: null, 
          error: null, 
          lastGeneratedAt: null 
        });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'meeting-summary-store',
      // Only persist the summary data, not loading states
      partialize: (state) => ({ 
        summary: state.summary,
        lastGeneratedAt: state.lastGeneratedAt
      }),
    }
  )
);
