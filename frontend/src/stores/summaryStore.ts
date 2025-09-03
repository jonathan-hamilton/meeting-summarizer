import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeetingSummary, MeetingSummaryRequest, SpeakerMapping, ActionItem } from '../types';
import type { AppMode } from '../contexts/AppModeContext';
import { createApiService } from '../services/apiServiceFactory';

interface SummaryState {
  // Current summary data
  summary: MeetingSummary | null;
  
  // Unified action items (AI-generated + user-created, all editable)
  actionItems: ActionItem[];
  
  // Loading and error states
  isGenerating: boolean;
  error: string | null;
  lastGeneratedAt: string | null;
  
  // Actions
  generateSummary: (transcriptText: string, speakerMappings: SpeakerMapping[], mode?: AppMode) => Promise<void>;
  clearSummary: () => void;
  clearError: () => void;
  
  // Unified action item actions
  addActionItem: (actionItem: Omit<ActionItem, 'id'>) => void;
  updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (id: string) => void;
  reorderActionItems: (newOrder: ActionItem[]) => void;
  clearActionItems: () => void;
  setActionItems: (actionItems: ActionItem[]) => void; // For bulk setting from AI
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set) => ({
      // Initial state
      summary: null,
      actionItems: [],
      isGenerating: false,
      error: null,
      lastGeneratedAt: null,

      // Generate meeting summary action
      generateSummary: async (transcriptText: string, speakerMappings: SpeakerMapping[], mode?: AppMode) => {
        set({ isGenerating: true, error: null });
        
        try {
          // Use provided mode (should always be provided from AppModeContext)
          // Fallback to demo mode if not provided (safer default)
          const apiMode = mode || 'demo';
          
          // Get the appropriate API service based on mode only
          const apiService = createApiService(apiMode);
          
          // Clean up speaker mappings to ensure valid data
          const cleanedMappings = speakerMappings.map(mapping => ({
            ...mapping,
            source: mapping.source || 'AutoDetected', // Ensure source is set
            email: mapping.email || undefined // Clean empty emails
          }));

          const request: MeetingSummaryRequest = {
            Transcript: transcriptText, // S3.4: PascalCase for backend
            SpeakerMappings: cleanedMappings // S3.4: PascalCase for backend
          };

          const response = await apiService.generateMeetingSummary(request);
          
          if (response.success && response.data) {
            // Convert AI-generated action items to unified format
            const convertedActionItems: ActionItem[] = [];
            
            // Convert role-based action items
            response.data.actionItemsByRole.forEach(roleGroup => {
              roleGroup.actionItems.forEach(item => {
                convertedActionItems.push({
                  id: crypto.randomUUID(),
                  description: item.description,
                  assignedTo: roleGroup.speakerName || roleGroup.speakerId,
                  confidence: item.confidence,
                  isExplicitAssignment: item.isExplicitAssignment,
                  createdAt: new Date().toISOString()
                });
              });
            });
            
            // Convert unassigned action items
            response.data.unassignedActionItems.forEach(item => {
              convertedActionItems.push({
                id: crypto.randomUUID(),
                description: item.description,
                assignedTo: 'Unassigned',
                confidence: item.confidence,
                isExplicitAssignment: false,
                createdAt: new Date().toISOString()
              });
            });
            
            set({ 
              summary: response.data, 
              actionItems: convertedActionItems, // Populate unified action items
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
          console.error('Summary generation error details:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            speakerMappings,
            transcriptLength: transcriptText.length
          });
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
      },

      // Action item actions
      addActionItem: (actionItemData: Omit<ActionItem, 'id'>) => {
        const newActionItem: ActionItem = {
          ...actionItemData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          actionItems: [...state.actionItems, newActionItem]
        }));
      },

      updateActionItem: (id: string, updates: Partial<ActionItem>) => {
        set((state) => ({
          actionItems: state.actionItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        }));
      },

      deleteActionItem: (id: string) => {
        set((state) => ({
          actionItems: state.actionItems.filter(item => item.id !== id)
        }));
      },

      reorderActionItems: (newOrder: ActionItem[]) => {
        set({ actionItems: newOrder });
      },

      setActionItems: (actionItems: ActionItem[]) => {
        set({ actionItems });
      },

      clearActionItems: () => {
        set({ actionItems: [] });
      }
    }),
    {
      name: 'meeting-summary-store',
      // Persist summary data and action items, not loading states
      partialize: (state) => ({ 
        summary: state.summary,
        actionItems: state.actionItems,
        lastGeneratedAt: state.lastGeneratedAt
      }),
    }
  )
);
