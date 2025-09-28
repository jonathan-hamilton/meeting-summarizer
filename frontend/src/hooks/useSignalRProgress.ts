import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getMeetingProgressSignalRService } from '../services/meetingProgressSignalR';
import type { MeetingProgressUpdate } from '../services/meetingProgressSignalR';

interface UseSignalRProgressOptions {
  onMeetingUpdate?: (update: MeetingProgressUpdate) => void;
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

    // Cleanup function
    return () => {
      service.removeAllListeners();
    };
  }, [onMeetingUpdate, isConnectedRef.current]);

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

export default useSignalRProgress;