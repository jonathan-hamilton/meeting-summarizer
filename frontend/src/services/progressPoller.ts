import type { ProcessingStage } from '../types/progress';

interface PollingConfig {
  initialInterval: number;
  maxInterval: number;
  backoffMultiplier: number;
  maxAttempts?: number;
}

interface MeetingStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  stage?: ProcessingStage;
  estimatedCompletion?: string;
  error?: string;
}

/**
 * Service for polling meeting status with smart exponential backoff
 */
export class ProgressPollerService {
  private pollers: Map<string, {
    intervalId: NodeJS.Timeout;
    currentInterval: number;
    attempts: number;
    onUpdate: (status: MeetingStatusResponse) => void;
    onComplete: (status: MeetingStatusResponse) => void;
    onError: (error: string) => void;
  }> = new Map();

  private config: PollingConfig = {
    initialInterval: 1000,      // Start with 1 second
    maxInterval: 10000,         // Max 10 seconds
    backoffMultiplier: 1.5,     // Increase by 50% each time
    maxAttempts: 180,           // Max 3 minutes at 1s intervals
  };

  constructor(config?: Partial<PollingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Start polling for a meeting's progress
   */
  startPolling(
    meetingId: string,
    onUpdate: (status: MeetingStatusResponse) => void,
    onComplete: (status: MeetingStatusResponse) => void,
    onError: (error: string) => void
  ): void {
    // Stop existing polling for this meeting
    this.stopPolling(meetingId);

    const poller = {
      intervalId: null as any,
      currentInterval: this.config.initialInterval,
      attempts: 0,
      onUpdate,
      onComplete,
      onError,
    };

    this.pollers.set(meetingId, poller);
    this.scheduleNextPoll(meetingId);
  }

  /**
   * Stop polling for a specific meeting
   */
  stopPolling(meetingId: string): void {
    const poller = this.pollers.get(meetingId);
    if (poller) {
      clearTimeout(poller.intervalId);
      this.pollers.delete(meetingId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling(): void {
    for (const meetingId of this.pollers.keys()) {
      this.stopPolling(meetingId);
    }
  }

  /**
   * Get current polling status
   */
  getPollingStatus(): { activePollCount: number; meetingIds: string[] } {
    return {
      activePollCount: this.pollers.size,
      meetingIds: Array.from(this.pollers.keys()),
    };
  }

  private scheduleNextPoll(meetingId: string): void {
    const poller = this.pollers.get(meetingId);
    if (!poller) return;

    poller.intervalId = setTimeout(() => {
      this.pollMeetingStatus(meetingId);
    }, poller.currentInterval);
  }

  private async pollMeetingStatus(meetingId: string): Promise<void> {
    const poller = this.pollers.get(meetingId);
    if (!poller) return;

    poller.attempts++;

    try {
      // Make API call to check meeting status
      const response = await fetch(`/api/summary/status/${meetingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status: MeetingStatusResponse = await response.json();

      // Call update callback
      poller.onUpdate(status);

      // Check if processing is complete
      if (status.status === 'completed' || status.status === 'failed') {
        poller.onComplete(status);
        this.stopPolling(meetingId);
        return;
      }

      // Check for max attempts
      if (this.config.maxAttempts && poller.attempts >= this.config.maxAttempts) {
        const error = `Polling timeout: Maximum attempts (${this.config.maxAttempts}) reached`;
        console.warn(`⚠️ ${error} for meeting ${meetingId}`);
        poller.onError(error);
        this.stopPolling(meetingId);
        return;
      }

      // Schedule next poll with exponential backoff
      this.increasePollingInterval(meetingId);
      this.scheduleNextPoll(meetingId);

    } catch (error) {
      console.error(`❌ Polling error for meeting ${meetingId}:`, error);
      
      // Retry with exponential backoff, up to max attempts
      if (this.config.maxAttempts && poller.attempts >= this.config.maxAttempts) {
        poller.onError(error instanceof Error ? error.message : 'Unknown polling error');
        this.stopPolling(meetingId);
      } else {
        // Continue polling with longer interval on error
        this.increasePollingInterval(meetingId);
        this.scheduleNextPoll(meetingId);
      }
    }
  }

  private increasePollingInterval(meetingId: string): void {
    const poller = this.pollers.get(meetingId);
    if (!poller) return;

    const newInterval = Math.min(
      poller.currentInterval * this.config.backoffMultiplier,
      this.config.maxInterval
    );

    if (newInterval !== poller.currentInterval) {
      poller.currentInterval = newInterval;
    }
  }

  /**
   * Manually trigger a poll for a specific meeting (useful for testing)
   */
  async triggerPoll(meetingId: string): Promise<void> {
    await this.pollMeetingStatus(meetingId);
  }
}

// Singleton instance
export const progressPoller = new ProgressPollerService();

// Utility functions
export const startMeetingPolling = (
  meetingId: string,
  onUpdate: (status: MeetingStatusResponse) => void,
  onComplete: (status: MeetingStatusResponse) => void,
  onError: (error: string) => void
): void => {
  progressPoller.startPolling(meetingId, onUpdate, onComplete, onError);
};

export const stopMeetingPolling = (meetingId: string): void => {
  progressPoller.stopPolling(meetingId);
};

export const stopAllPolling = (): void => {
  progressPoller.stopAllPolling();
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    progressPoller.stopAllPolling();
  });
}