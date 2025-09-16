import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiService } from '../services/apiService';
import type { 
  MeetingHistoryState, 
  MeetingHistoryActions,
  MeetingListItem 
} from '../types/meeting';

type MeetingHistoryStore = MeetingHistoryState & MeetingHistoryActions;

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
          
          console.log('Meeting History Store - API Response:', response);
          console.log('Meeting History Store - Response Data Structure:', JSON.stringify(response.data, null, 2));
          
          if (response.success && response.data) {
            console.log('Meeting History Store - Processing meetings:', response.data.items);
            if (response.data.items && response.data.items.length > 0) {
              console.log('Meeting History Store - First meeting structure:', JSON.stringify(response.data.items[0], null, 2));
            }
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
        const state = get();
        const meetingIndex = state.meetings.findIndex(m => m.id === update.id);
        
        if (meetingIndex >= 0) {
          const updatedMeetings = [...state.meetings];
          updatedMeetings[meetingIndex] = { 
            ...updatedMeetings[meetingIndex], 
            ...update 
          };
          
          set({ meetings: updatedMeetings });
          

        }
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