import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiService } from '../services/apiService';
import type { 
  MeetingHistoryState, 
  MeetingHistoryActions,
  MeetingListItem 
} from '../types/meeting';

// Debounce utility for grouped updates
const createDebouncer = () => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingUpdates: Map<string, Partial<MeetingListItem>> = new Map();
  
  return {
    addUpdate: (meetingId: string, update: Partial<MeetingListItem>, callback: () => void) => {
      // Add or merge the update
      const existing = pendingUpdates.get(meetingId) || {};
      pendingUpdates.set(meetingId, { ...existing, ...update });
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout to group updates
      timeoutId = setTimeout(() => {
        callback();
        pendingUpdates.clear();
        timeoutId = null;
      }, 100); // 100ms debounce
    },
    
    getPendingUpdates: () => new Map(pendingUpdates),
    
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingUpdates.clear();
    }
  };
};

type MeetingHistoryStore = MeetingHistoryState & MeetingHistoryActions;

// Create debouncer instance outside the store
const updateDebouncer = createDebouncer();

export const useMeetingHistoryStore = create<MeetingHistoryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      meetings: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      searchQuery: '',
      statusFilter: 'All',
      sortBy: 'uploadedAt',
      sortDirection: 'desc',
      isLoading: false,
      error: null,

      // Actions
      loadMeetings: async () => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const params = {
            page: state.currentPage,
            pageSize: state.pageSize,
            search: state.searchQuery || undefined,
            status: state.statusFilter === 'All' ? undefined : state.statusFilter,
            sortBy: state.sortBy,
            sortDirection: state.sortDirection,
          };

          const response = await apiService.getMeetings(params);
          
          if (response.success && response.data) {
            set({
              meetings: response.data.items || [],
              totalCount: response.data.totalCount || 0,
              totalPages: response.data.totalPages || 0,
              hasNextPage: response.data.hasNextPage || false,
              hasPreviousPage: response.data.hasPreviousPage || false,
              isLoading: false,
            });
          } else {
            set({
              error: response.errors?.join(', ') || response.message || 'Failed to load meetings',
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to load meetings:', error);
          set({
            error: 'Failed to load meetings. Please try again.',
            isLoading: false,
          });
        }
      },

      deleteMeeting: async (id: string) => {
        set({ error: null });

        try {
          const response = await apiService.deleteMeeting(id);
          
          if (response.success) {
            // Remove the meeting from the local state
            const state = get();
            const updatedMeetings = state.meetings.filter(meeting => meeting.id !== id);
            
            set({ 
              meetings: updatedMeetings,
              totalCount: state.totalCount - 1,
            });


          } else {
            set({ error: response.errors?.join(', ') || response.message || 'Failed to delete meeting' });
          }
        } catch (error) {
          console.error('Failed to delete meeting:', error);
          set({ error: 'Failed to delete meeting. Please try again.' });
        }
      },

      setPage: (page: number) => {
        set({ currentPage: page });
        // Auto-reload meetings when page changes
        setTimeout(() => get().loadMeetings(), 0);
      },

      setSearchQuery: (query: string) => {
        set({ 
          searchQuery: query,
          currentPage: 1, // Reset to first page on new search
        });
        // Debounce the search - only reload after user stops typing
        clearTimeout((get() as any).searchTimeout);
        const timeout = setTimeout(() => get().loadMeetings(), 500);
        set({ searchTimeout: timeout } as any);
      },

      setStatusFilter: (status: 'All' | 'Pending' | 'InProgress' | 'Completed' | 'Failed') => {
        set({ 
          statusFilter: status,
          currentPage: 1, // Reset to first page on filter change
        });
        // Auto-reload meetings when filter changes
        setTimeout(() => get().loadMeetings(), 0);
      },

      setSorting: (sortBy: string, sortDirection: 'asc' | 'desc') => {
        set({ 
          sortBy: sortBy as any,
          sortDirection,
          currentPage: 1, // Reset to first page on sort change
        });
        // Auto-reload meetings when sorting changes
        setTimeout(() => get().loadMeetings(), 0);
      },

      updateMeetingFromSignalR: (update: Partial<MeetingListItem>) => {
        const meetingId = update.id;
        
        if (!meetingId) return;
        
        // Use debouncer to group rapid updates and prevent animation interruption
        updateDebouncer.addUpdate(meetingId, update, () => {
          const currentState = get();
          const pendingUpdates = updateDebouncer.getPendingUpdates();
          
          // Apply all pending updates at once
          const updatedMeetings = currentState.meetings.map(meeting => {
            const pendingUpdate = pendingUpdates.get(meeting.id);
            if (pendingUpdate) {
              return { ...meeting, ...pendingUpdate };
            }
            return meeting;
          });
          
          // Only update if we actually have changes to apply
          if (pendingUpdates.size > 0) {
            set({ meetings: updatedMeetings });
            console.log(`📡 Applied ${pendingUpdates.size} debounced meeting updates`);
          }
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'meeting-history-store',
    }
  )
);

// Convenience hooks for specific parts of the store
export const useMeetings = () => useMeetingHistoryStore(state => state.meetings);
export const useMeetingHistoryLoading = () => useMeetingHistoryStore(state => state.isLoading);
export const useMeetingHistoryError = () => useMeetingHistoryStore(state => state.error);
export const useMeetingHistoryActions = () => useMeetingHistoryStore(state => ({
  loadMeetings: state.loadMeetings,
  deleteMeeting: state.deleteMeeting,
  setPage: state.setPage,
  setSearchQuery: state.setSearchQuery,
  setStatusFilter: state.setStatusFilter,
  setSorting: state.setSorting,
  updateMeetingFromSignalR: state.updateMeetingFromSignalR,
  clearError: state.clearError,
}));