import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

interface MeetingProgressUpdate {
  meetingId: string;
  status: string;
  progressPercentage: number;
  statusMessage?: string;
  updatedAt: string;
}

export type ProgressUpdateCallback = (update: MeetingProgressUpdate) => void;

class MeetingProgressSignalRService {
  private connection: HubConnection | null = null;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async connect(token: string): Promise<void> {
    if (this.connection) {
      return; // Already connected
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/meetingProgressHub`, {
        accessTokenFactory: () => token,
        withCredentials: true,
        // Add timeout and skip negotiation for better reliability
        skipNegotiation: false,
        transport: 1, // WebSockets with fallback
        timeout: 30000 // 30 second timeout
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: any) => {
          // More aggressive retry for first few attempts, then back off
          if (retryContext.previousRetryCount < 3) {
            return 1000; // 1 second for first 3 attempts
          }
          // Exponential backoff: 2s, 4s, 8s, 16s
          return Math.min(2000 * Math.pow(2, retryContext.previousRetryCount - 3), 16000);
        }
      })
      .configureLogging(LogLevel.Warning) // Reduce noise, only warnings and errors
      .build();

    // Handle connection events with better error handling
    this.connection.onreconnecting((error: any) => {
      console.log('SignalR: Reconnecting...', error ? `(${error.message})` : '');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR: Reconnected successfully');
    });

    this.connection.onclose((error: any) => {
      console.log('SignalR: Connection closed', error?.message || 'No error');
      this.connection = null;
    });

    try {
      await this.connection.start();
      console.log('SignalR: Connected to MeetingProgressHub');
    } catch (error: any) {
      console.warn('SignalR: Failed to connect (falling back to polling):', error?.message || error);
      this.connection = null;
      // Don't throw - allow app to continue with polling fallback
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR: Disconnected from MeetingProgressHub');
      } catch (error) {
        console.error('SignalR: Error during disconnect:', error);
      } finally {
        this.connection = null;
      }
    }
  }

  // Subscribe to meeting progress updates
  onMeetingProgressUpdate(callback: (update: MeetingProgressUpdate) => void): void {
    if (!this.connection) {
      console.warn('SignalR: Cannot subscribe - not connected');
      return;
    }

    this.connection.on('MeetingProgressUpdate', callback);
  }

  // Join a specific meeting room for targeted updates
  async joinMeetingRoom(meetingId: string): Promise<void> {
    if (!this.connection) {
      console.warn('SignalR: Cannot join meeting room - not connected');
      return;
    }

    try {
      await this.connection.invoke('JoinMeetingRoom', meetingId);
      console.log(`SignalR: Joined meeting room ${meetingId}`);
    } catch (error) {
      console.error(`SignalR: Failed to join meeting room ${meetingId}:`, error);
    }
  }

  // Leave a specific meeting room
  async leaveMeetingRoom(meetingId: string): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.invoke('LeaveMeetingRoom', meetingId);
      console.log(`SignalR: Left meeting room ${meetingId}`);
    } catch (error) {
      console.error(`SignalR: Failed to leave meeting room ${meetingId}:`, error);
    }
  }

  // Check connection state
  get isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  get connectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  // Unsubscribe from all events
  off(eventName: string): void {
    if (this.connection) {
      this.connection.off(eventName);
    }
  }

  // Remove all event listeners
  removeAllListeners(): void {
    if (this.connection) {
      this.connection.off('MeetingProgressUpdate');
    }
  }
}

// Singleton instance
let signalRService: MeetingProgressSignalRService | null = null;

export const getMeetingProgressSignalRService = (baseUrl: string = ''): MeetingProgressSignalRService => {
  if (!signalRService) {
    // Use environment-specific base URL
    const apiBaseUrl = baseUrl || 
      (import.meta.env.VITE_API_BASE_URL as string) || 
      (window.location.origin.includes('localhost') ? 'https://localhost:7264' : window.location.origin);
    
    signalRService = new MeetingProgressSignalRService(apiBaseUrl);
  }
  return signalRService;
};

// Export types for use in components
export type { MeetingProgressUpdate };