import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getMeetingProgressSignalRService } from '../services/meetingProgressSignalR';
import type { MeetingProgressUpdate, BatchJobProgressUpdate } from '../services/meetingProgressSignalR';

interface UseSignalRProgressOptions {
  onMeetingUpdate?: (update: MeetingProgressUpdate) => void;
  onBatchJobUpdate?: (update: BatchJobProgressUpdate) => void;
  autoConnect?: boolean;
  meetingId?: string;
}

interface SignalRProgressState {
  isConnected: boolean;
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinMeetingRoom: (meetingId: string) => Promise<void>;
  leaveMeetingRoom: (meetingId: string) => Promise<void>;
}

export const useSignalRProgress = ({
  onMeetingUpdate,
  onBatchJobUpdate,
  autoConnect = true,
  meetingId
}: UseSignalRProgressOptions = {}): SignalRProgressState => {
  const { accessToken } = useAuthStore();
  const signalRServiceRef = useRef(getMeetingProgressSignalRService());
  const currentMeetingIdRef = useRef<string | undefined>(meetingId);
  const isConnectedRef = useRef(false);

  // Connect to SignalR
  const connect = useCallback(async () => {
    if (!accessToken) {
      console.warn('SignalR: Cannot connect - no access token available');
      return;
    }

    if (isConnectedRef.current) {
      console.log('SignalR: Already connected');
      return;
    }

    try {
      await signalRServiceRef.current.connect(accessToken);
      isConnectedRef.current = true;
      console.log('SignalR: Connected successfully');
    } catch (error) {
      console.error('SignalR: Connection failed:', error);
      isConnectedRef.current = false;
    }
  }, [accessToken]);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    if (!isConnectedRef.current) {
      return;
    }

    try {
      // Leave current meeting room if any
      if (currentMeetingIdRef.current) {
        await signalRServiceRef.current.leaveMeetingRoom(currentMeetingIdRef.current);
        currentMeetingIdRef.current = undefined;
      }

      signalRServiceRef.current.removeAllListeners();
      await signalRServiceRef.current.disconnect();
      isConnectedRef.current = false;
      console.log('SignalR: Disconnected successfully');
    } catch (error) {
      console.error('SignalR: Disconnect failed:', error);
    }
  }, []);

  // Join a meeting room
  const joinMeetingRoom = useCallback(async (meetingId: string) => {
    if (!isConnectedRef.current) {
      console.warn('SignalR: Cannot join meeting room - not connected');
      return;
    }

    // Leave previous room if different
    if (currentMeetingIdRef.current && currentMeetingIdRef.current !== meetingId) {
      await signalRServiceRef.current.leaveMeetingRoom(currentMeetingIdRef.current);
    }

    await signalRServiceRef.current.joinMeetingRoom(meetingId);
    currentMeetingIdRef.current = meetingId;
  }, []);

  // Leave a meeting room
  const leaveMeetingRoom = useCallback(async (meetingId: string) => {
    if (!isConnectedRef.current) {
      return;
    }

    await signalRServiceRef.current.leaveMeetingRoom(meetingId);
    if (currentMeetingIdRef.current === meetingId) {
      currentMeetingIdRef.current = undefined;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isConnectedRef.current) {
      return;
    }

    const service = signalRServiceRef.current;

    // Subscribe to meeting progress updates
    if (onMeetingUpdate) {
      service.onMeetingProgressUpdate(onMeetingUpdate);
    }

    // Subscribe to batch job progress updates
    if (onBatchJobUpdate) {
      service.onBatchJobProgressUpdate(onBatchJobUpdate);
    }

    // Cleanup function
    return () => {
      service.removeAllListeners();
    };
  }, [onMeetingUpdate, onBatchJobUpdate, isConnectedRef.current]);

  // Auto-connect when token is available
  useEffect(() => {
    if (autoConnect && accessToken && !isConnectedRef.current) {
      connect();
    }

    // Cleanup on unmount or token change
    return () => {
      if (isConnectedRef.current) {
        disconnect();
      }
    };
  }, [autoConnect, accessToken, connect, disconnect]);

  // Auto-join meeting room when meetingId changes
  useEffect(() => {
    if (meetingId && isConnectedRef.current && meetingId !== currentMeetingIdRef.current) {
      joinMeetingRoom(meetingId);
    }
  }, [meetingId, joinMeetingRoom]);

  return {
    isConnected: signalRServiceRef.current.isConnected,
    connectionState: signalRServiceRef.current.connectionState,
    connect,
    disconnect,
    joinMeetingRoom,
    leaveMeetingRoom
  };
};

// Enhanced hook that integrates with existing batch job polling store
export const useSignalRBatchProgress = () => {
  const { accessToken } = useAuthStore();
  
  const handleBatchJobUpdate = useCallback((update: BatchJobProgressUpdate) => {
    console.log('SignalR Batch Job Update:', update);
    
    // You can integrate this with your existing batch job store
    // For example, trigger a state update in useBatchJobPollingStore
    // or create a new SignalR-specific store
    
    // Dispatch a custom event that the existing components can listen to
    const customEvent = new CustomEvent('batchJobProgress', {
      detail: {
        jobId: update.jobId,
        status: update.status,
        progressPercentage: update.progressPercentage,
        statusMessage: update.statusMessage,
        updatedAt: update.updatedAt,
        meetingId: update.meetingId
      }
    });
    
    window.dispatchEvent(customEvent);
  }, []);

  const handleMeetingUpdate = useCallback((update: MeetingProgressUpdate) => {
    console.log('SignalR Meeting Update:', update);
    
    // Dispatch meeting progress event
    const customEvent = new CustomEvent('meetingProgress', {
      detail: update
    });
    
    window.dispatchEvent(customEvent);
  }, []);

  return useSignalRProgress({
    onBatchJobUpdate: handleBatchJobUpdate,
    onMeetingUpdate: handleMeetingUpdate,
    autoConnect: !!accessToken
  });
};

export default useSignalRProgress;