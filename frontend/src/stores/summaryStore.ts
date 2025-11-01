import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeetingSummary, MeetingSummaryRequest, SpeakerMapping, ActionItem, SavedSummary } from '../types';
import type { AppMode } from '../contexts/AppModeContext';
import { createApiService } from '../services/apiServiceFactory';

interface SummaryState {
  // Current summary data (session state)
  summary: MeetingSummary | null;
  
  // Unified action items (AI-generated + user-created, all editable)
  actionItems: ActionItem[];
  
  // Loading and error states
  isGenerating: boolean;
  error: string | null;
  lastGeneratedAt: string | null;
  
  // Persistence state (S6.10)
  savedSummaries: SavedSummary[];
  selectedSavedSummary: SavedSummary | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  loadStatus: 'idle' | 'loading' | 'loaded' | 'error';
  autoSaveEnabled: boolean;
  autoSaveContext: {
    userId: string;
    fileName: string;
    meetingId?: string;
  } | null;
  
  // Session actions
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
  
  // Persistence actions (S6.10)
  saveSummary: (userId: string, title: string, transcriptFileName: string, meetingId?: string) => Promise<void>;
  loadUserSummaries: (userId: string) => Promise<void>;
  selectSavedSummary: (summaryId: string, userId: string) => Promise<void>;
  deleteSavedSummary: (summaryId: string, userId: string) => Promise<void>;
  
  // Auto-save management
  enableAutoSave: (userId: string, transcriptFileName: string, meetingId?: string) => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set, get) => ({
      // Initial state (session data)
      summary: null,
      actionItems: [],
      isGenerating: false,
      error: null,
      lastGeneratedAt: null,
      
      // Persistence state (S6.10)
      savedSummaries: [],
      selectedSavedSummary: null,
      saveStatus: 'idle' as const,
      loadStatus: 'idle' as const,
      autoSaveEnabled: false,
      autoSaveContext: null,

      // Generate meeting summary action
      generateSummary: async (transcriptText: string, speakerMappings: SpeakerMapping[], mode?: AppMode) => {
        set({ isGenerating: true, error: null });
        
        try {
          // Use provided mode (should always be provided from AppModeContext)
          // Fallback to production mode if not provided 
          const apiMode = mode || 'production';
          
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
      },

      // Persistence actions (S6.10)
      saveSummary: async (userId: string, title: string, transcriptFileName: string, meetingId?: string) => {
        const currentState = get();
        
        if (!currentState.summary) {
          set({ saveStatus: 'error', error: 'No summary to save' });
          return;
        }

        set({ saveStatus: 'saving' });

        try {
          const apiService = createApiService('production') as any;
          const result = await apiService.saveSummary(userId, {
            title,
            summaryData: currentState.summary,
            transcriptFileName,
            meetingId,
            actionItems: currentState.actionItems.map((item, index) => ({
              description: item.description,
              assignedTo: item.assignedTo || 'Unassigned',
              confidence: item.confidence || 0.5,
              isExplicitAssignment: item.isExplicitAssignment || false,
              sortOrder: index,
              isCompleted: false
            }))
          });

          if (result.success && result.data) {
            // Update saved summaries list
            const updatedSummaries = [...currentState.savedSummaries];
            const existingIndex = updatedSummaries.findIndex(s => s.id === result.data!.id);
            
            if (existingIndex >= 0) {
              updatedSummaries[existingIndex] = result.data;
            } else {
              updatedSummaries.unshift(result.data);
            }
            
            set({ 
              saveStatus: 'saved', 
              savedSummaries: updatedSummaries,
              selectedSavedSummary: result.data 
            });
          } else {
            set({ saveStatus: 'error', error: result.message || 'Failed to save summary' });
          }
        } catch (error) {
          console.error('Error saving summary:', error);
          set({ saveStatus: 'error', error: 'Failed to save summary' });
        }
      },

      loadUserSummaries: async (userId: string) => {
        set({ loadStatus: 'loading' });

        try {
          const apiService = createApiService('production') as any;
          const result = await apiService.getUserSummaries(userId);

          if (result.success && result.data) {
            set({ 
              loadStatus: 'loaded', 
              savedSummaries: result.data 
            });
          } else {
            set({ 
              loadStatus: 'error', 
              error: result.message || 'Failed to load summaries' 
            });
          }
        } catch (error) {
          console.error('Error loading summaries:', error);
          set({ loadStatus: 'error', error: 'Failed to load summaries' });
        }
      },

      selectSavedSummary: async (summaryId: string, userId: string) => {
        set({ loadStatus: 'loading' });

        try {
          const apiService = createApiService('production') as any;
          const result = await apiService.getSavedSummary(summaryId, userId);

          if (result.success && result.data) {
            console.log('🔍 DEBUG: Raw API response:', result.data);
            console.log('🔍 DEBUG: SummaryData type:', typeof result.data.summaryData);
            console.log('🔍 DEBUG: SummaryData preview:', result.data.summaryData);
            
            // Load the saved summary data into current session
            set({ 
              summary: result.data.summaryData,
              actionItems: result.data.actionItems.map((item: any) => ({
                id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
                description: item.title || item.description,
                assignedTo: item.assignedTo || 'Unassigned',
                confidence: item.confidence || 0.5,
                isExplicitAssignment: item.isExplicitlyAssigned || false,
                sourceText: item.description
              })),
              selectedSavedSummary: result.data,
              loadStatus: 'loaded',
              lastGeneratedAt: result.data.createdAt
            });
          } else {
            set({ 
              loadStatus: 'error', 
              error: result.message || 'Failed to load summary' 
            });
          }
        } catch (error) {
          console.error('Error loading summary:', error);
          set({ loadStatus: 'error', error: 'Failed to load summary' });
        }
      },

      deleteSavedSummary: async (summaryId: string, userId: string) => {
        try {
          const apiService = createApiService('production') as any;
          const result = await apiService.deleteSavedSummary(summaryId, userId);

          if (result.success) {
            const currentState = get();
            const updatedSummaries = currentState.savedSummaries.filter(s => s.id !== summaryId);
            
            set({ 
              savedSummaries: updatedSummaries,
              selectedSavedSummary: currentState.selectedSavedSummary?.id === summaryId 
                ? null 
                : currentState.selectedSavedSummary
            });
          } else {
            set({ error: result.message || 'Failed to delete summary' });
          }
        } catch (error) {
          console.error('Error deleting summary:', error);
          set({ error: 'Failed to delete summary' });
        }
      },

      // Auto-save management
      enableAutoSave: (userId: string, transcriptFileName: string, meetingId?: string) => {
        set({ 
          autoSaveEnabled: true,
          autoSaveContext: {
            userId,
            fileName: transcriptFileName,
            meetingId
          }
        });
        
        // Set up auto-save interval (every 30 seconds)
        const autoSaveInterval = setInterval(async () => {
          const currentState = get();
          if (currentState.autoSaveEnabled && currentState.summary) {
            await currentState.triggerAutoSave();
          }
        }, 30000);

        // Store interval ID for cleanup
        (window as any).__autoSaveInterval = autoSaveInterval;
      },

      disableAutoSave: () => {
        set({ 
          autoSaveEnabled: false,
          autoSaveContext: null 
        });
        
        // Clear interval
        if ((window as any).__autoSaveInterval) {
          clearInterval((window as any).__autoSaveInterval);
          delete (window as any).__autoSaveInterval;
        }
      },

      triggerAutoSave: async () => {
        const currentState = get();
        if (!currentState.summary || !currentState.autoSaveEnabled || !currentState.autoSaveContext) return;

        const { userId, fileName, meetingId } = currentState.autoSaveContext;

        try {
          // Auto-save logic - save with auto-generated title if not already saved
          if (!currentState.selectedSavedSummary) {
            const autoTitle = `Auto-saved ${new Date().toLocaleString()}`;
            await currentState.saveSummary(userId, autoTitle, fileName, meetingId);
          } else {
            // Update existing saved summary
            const apiService = createApiService('production') as any;
            await apiService.updateSavedSummary(currentState.selectedSavedSummary.id, userId, {
              summaryData: currentState.summary,
              actionItems: currentState.actionItems.map((item, index) => ({
                description: item.description,
                assignedTo: item.assignedTo || 'Unassigned',
                confidence: item.confidence || 0.5,
                isExplicitAssignment: item.isExplicitAssignment || false,
                sortOrder: index,
                isCompleted: false
              }))
            });
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
          set({ saveStatus: 'error', error: 'Auto-save failed' });
        }
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
