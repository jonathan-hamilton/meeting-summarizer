// Minimal stub for sessionManager to maintain compatibility
// All session-based functionality has been removed as per architectural cleanup

// Legacy session override interface - for compatibility only
export interface SessionOverrideAction {
  action: 'Override' | 'Revert' | 'Clear';
  originalValue?: string;
  newValue?: string;
  timestamp: Date;
  fieldModified: string;
}

export interface SessionOverride {
  action: string;
  timestamp: Date;
  newValue?: string;
  originalValue?: string;
  fieldModified: string;
}

export interface SessionOverrides {
  [speakerId: string]: SessionOverride;
}

export interface SessionStatus {
  isActive: boolean;
  timeRemaining: number;
  sessionId: string | null;
  canExtend: boolean;
  sessionDuration?: number;
}

export interface PrivacyControls {
  dataRetention: number;
  allowAnalytics: boolean;
  shareWithTeam: boolean;
  sessionStatus: 'active' | 'warning' | 'expired';
  sessionDuration: number;
  dataSize: string;
}

/**
 * Minimal SessionManager stub
 * Maintains interface compatibility while removing session-based functionality
 */
export class SessionManager {
  private sessionId = 'stub-session';
  
  /**
   * Returns empty overrides object (no session tracking)
   */
  public getOverrides(): SessionOverrides {
    return {};
  }

  /**
   * No-op method for storing overrides (session functionality removed)
   */
  public storeOverride(_speakerId: string, _action: SessionOverrideAction): void {
    // No-op: Session-based override tracking has been removed
  }

  /**
   * No-op method for clearing overrides (session functionality removed)  
   */
  public clearSpeakerOverrides(): void {
    // No-op: Session-based override tracking has been removed
  }

  /**
   * Returns stub session status
   */
  public getSessionStatus(): SessionStatus {
    return {
      isActive: false,
      timeRemaining: 0,
      sessionId: this.sessionId,
      canExtend: false,
      sessionDuration: 0
    };
  }

  /**
   * Returns default privacy controls
   */
  public getPrivacyControls(): PrivacyControls {
    return {
      dataRetention: 30,
      allowAnalytics: false,
      shareWithTeam: false,
      sessionStatus: 'expired',
      sessionDuration: 0,
      dataSize: '0 MB'
    };
  }

  /**
   * Returns stub session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * No-op method for extending session
   */
  public extendSession(): void {
    // No-op: Session management has been removed
  }

  /**
   * No-op method for extending session by minutes
   */
  public extendSessionByMinutes(_minutes: number): void {
    // No-op: Session management has been removed
  }

  /**
   * No-op method for status change subscription
   */
  public onStatusChange(_callback: (status: SessionStatus) => void): () => void {
    // Return a no-op unsubscribe function
    return () => {};
  }

  /**
   * No-op method for updating activity
   */
  public updateActivity(): void {
    // No-op: Activity tracking has been removed
  }

  /**
   * No-op method for clearing session data
   */
  public async clearSessionData(): Promise<void> {
    // No-op: Session data management has been removed
  }
}

export const sessionManager = new SessionManager();
