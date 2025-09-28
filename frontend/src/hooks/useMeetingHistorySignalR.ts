import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMeetingHistoryStore } from '../stores/meetingHistoryStore';
import { getMeetingProgressSignalRService } from '../services/meetingProgressSignalR';
import type { MeetingProgressUpdate } from '../services/meetingProgressSignalR';
import type { MeetingListItem } from '../types/meeting';

/**
 * Hook to integrate SignalR meeting progress updates with the meeting history store
 * Automatically connects when authenticated and updates meeting status live
 */
export const useMeetingHistorySignalR = () => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { updateMeetingFromSignalR } = useMeetingHistoryStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const signalRService = getMeetingProgressSignalRService();

    const handleMeetingProgress = (update: MeetingProgressUpdate) => {
      // Convert SignalR update to meeting list item update format
      const meetingUpdate: Partial<MeetingListItem> = {
        id: update.meetingId,
        processingStatus: update.status as any,
        progressPercentage: update.progressPercentage,
      };

      // If the meeting is completed, we might get additional data
      // The backend should send the completion timestamp
      if (update.status === 'Completed' && update.updatedAt) {
        meetingUpdate.completedAt = update.updatedAt;
      }

      // Update the meeting in the store
      updateMeetingFromSignalR(meetingUpdate);
    };

    const connectAndSubscribe = async () => {
      try {
        // Connect if not already connected
        if (!signalRService.isConnected) {
          await signalRService.connect(accessToken);
        }

        // Subscribe to meeting progress updates
        signalRService.onMeetingProgressUpdate(handleMeetingProgress);

        console.log('📡 Meeting History SignalR: Connected and subscribed to meeting progress');
      } catch (error) {
        console.warn('📡 Meeting History SignalR: Failed to connect (non-critical):', error);
        // SignalR connection failure is not critical - the app should still work
        // Live updates just won't be available
      }
    };

    connectAndSubscribe();

    // Cleanup function
    return () => {
      // Note: We don't disconnect SignalR here because other parts of the app might be using it
      // The SignalR service manages its own lifecycle
      console.log('📡 Meeting History SignalR: Unsubscribing from meeting progress updates');
    };
  }, [isAuthenticated, accessToken, updateMeetingFromSignalR]);
};