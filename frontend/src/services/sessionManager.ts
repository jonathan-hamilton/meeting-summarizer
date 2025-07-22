/**
 * Session Management Service for privacy-first override tracking (S3.1)
 * Handles browser session storage, cleanup, and privacy controls
 */

export interface SessionOverrideTracker {
  sessionId: string;
  transcriptionId: string;
  sessionStarted: Date;
  lastActivity: Date;
  actions: Record<string, SessionOverrideAction>;
}

export interface SessionOverrideAction {
  action: 'Override' | 'Revert' | 'Clear';
  originalValue?: string;
  newValue?: string;
  timestamp: Date;
  fieldModified: string;
}

export interface SessionStatus {
  isActive: boolean;
  sessionId: string;
  sessionDuration: number; // minutes
  lastActivity: Date;
  dataSize: string; // human-readable size
  hasOverrides: boolean;
  overrideCount: number;
}

export interface PrivacyControls {
  sessionStatus: 'active' | 'warning' | 'expired';
  sessionDuration: number;
  lastActivity: Date;
  dataSize: string;
  clearAllData: () => Promise<void>;
  extendSession: () => void;
  exportBeforeClear: () => Promise<void>;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;
  private sessionStarted: Date;
  private lastActivity: Date;
  private readonly SESSION_TIMEOUT_MINUTES = 120; // 2 hours
  private readonly WARNING_THRESHOLD_MINUTES = 15; // Warning at 15 minutes before timeout
  private listeners: Set<(status: SessionStatus) => void> = new Set();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStarted = new Date();
    this.lastActivity = new Date();
    
    // Initialize session in browser storage
    this.initializeSession();
    
    // Set up periodic cleanup and activity tracking
    this.setupSessionTracking();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Generate a unique session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize session data in browser storage
   */
  private initializeSession(): void {
    const sessionData = {
      sessionId: this.sessionId,
      sessionStarted: this.sessionStarted.toISOString(),
      lastActivity: this.lastActivity.toISOString(),
      overrides: {}
    };

    // Use sessionStorage for session-scoped data
    sessionStorage.setItem('meetingSummarizerSession', JSON.stringify(sessionData));
    
    // Set up session cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.clearSessionData();
    });
  }

  /**
   * Set up periodic session tracking and cleanup
   */
  private setupSessionTracking(): void {
    // Update activity every minute
    setInterval(() => {
      this.updateActivity();
      this.notifyListeners();
    }, 60000);

    // Check for session timeout every 5 minutes
    setInterval(() => {
      this.checkSessionTimeout();
    }, 300000);
  }

  /**
   * Update last activity timestamp
   */
  public updateActivity(): void {
    this.lastActivity = new Date();
    const sessionData = JSON.parse(sessionStorage.getItem('meetingSummarizerSession') || '{}');
    sessionData.lastActivity = this.lastActivity.toISOString();
    sessionStorage.setItem('meetingSummarizerSession', JSON.stringify(sessionData));
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current session status
   */
  public getSessionStatus(): SessionStatus {
    const now = new Date();
    const sessionDurationMs = now.getTime() - this.sessionStarted.getTime();
    const sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60));
    
    const sessionData = JSON.parse(sessionStorage.getItem('meetingSummarizerSession') || '{}');
    const overrides = sessionData.overrides || {};
    const overrideCount = Object.keys(overrides).length;
    
    // Calculate approximate data size
    const dataSize = this.calculateDataSize();
    
    return {
      isActive: sessionDurationMinutes < this.SESSION_TIMEOUT_MINUTES,
      sessionId: this.sessionId,
      sessionDuration: sessionDurationMinutes,
      lastActivity: this.lastActivity,
      dataSize: dataSize,
      hasOverrides: overrideCount > 0,
      overrideCount: overrideCount
    };
  }

  /**
   * Check if session should show timeout warning
   */
  public shouldShowWarning(): boolean {
    const now = new Date();
    const sessionDurationMs = now.getTime() - this.lastActivity.getTime();
    const sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60));
    const timeUntilTimeout = this.SESSION_TIMEOUT_MINUTES - sessionDurationMinutes;
    
    return timeUntilTimeout <= this.WARNING_THRESHOLD_MINUTES && timeUntilTimeout > 0;
  }

  /**
   * Check if session has expired
   */
  public isExpired(): boolean {
    const now = new Date();
    const sessionDurationMs = now.getTime() - this.lastActivity.getTime();
    const sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60));
    
    return sessionDurationMinutes >= this.SESSION_TIMEOUT_MINUTES;
  }

  /**
   * Extend session by resetting activity timestamp
   */
  public extendSession(): void {
    this.updateActivity();
    this.notifyListeners();
  }

  /**
   * Store session override data
   */
  public storeOverride(speakerId: string, action: SessionOverrideAction): void {
    const sessionData = JSON.parse(sessionStorage.getItem('meetingSummarizerSession') || '{}');
    if (!sessionData.overrides) {
      sessionData.overrides = {};
    }
    
    sessionData.overrides[speakerId] = {
      ...action,
      timestamp: action.timestamp.toISOString()
    };
    
    sessionStorage.setItem('meetingSummarizerSession', JSON.stringify(sessionData));
    this.updateActivity();
    this.notifyListeners();
  }

  /**
   * Get stored override data
   */
  public getOverrides(): Record<string, SessionOverrideAction> {
    const sessionData = JSON.parse(sessionStorage.getItem('meetingSummarizerSession') || '{}');
    const overrides = sessionData.overrides || {};
    
    // Convert timestamp strings back to Date objects
    Object.keys(overrides).forEach(speakerId => {
      overrides[speakerId].timestamp = new Date(overrides[speakerId].timestamp);
    });
    
    return overrides;
  }

  /**
   * Clear all session data
   */
  public async clearSessionData(): Promise<void> {
    // Clear session storage
    sessionStorage.removeItem('meetingSummarizerSession');
    
    // Reset session state
    this.sessionId = this.generateSessionId();
    this.sessionStarted = new Date();
    this.lastActivity = new Date();
    
    // Reinitialize clean session
    this.initializeSession();
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Calculate approximate size of session data
   */
  private calculateDataSize(): string {
    const sessionData = sessionStorage.getItem('meetingSummarizerSession') || '';
    const sizeBytes = new Blob([sessionData]).size;
    
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    } else if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Check for session timeout and notify if needed
   */
  private checkSessionTimeout(): void {
    if (this.isExpired()) {
      this.clearSessionData();
    }
    this.notifyListeners();
  }

  /**
   * Subscribe to session status updates
   */
  public onStatusChange(listener: (status: SessionStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    const status = this.getSessionStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get privacy controls interface
   */
  public getPrivacyControls(): PrivacyControls {
    const status = this.getSessionStatus();
    let sessionStatus: 'active' | 'warning' | 'expired';
    
    if (this.isExpired()) {
      sessionStatus = 'expired';
    } else if (this.shouldShowWarning()) {
      sessionStatus = 'warning';
    } else {
      sessionStatus = 'active';
    }
    
    return {
      sessionStatus,
      sessionDuration: status.sessionDuration,
      lastActivity: status.lastActivity,
      dataSize: status.dataSize,
      clearAllData: () => this.clearSessionData(),
      extendSession: () => this.extendSession(),
      exportBeforeClear: async () => {
        // This will be implemented in S3.3 (Enhanced Export)
        console.log('Export functionality will be implemented in S3.3');
      }
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
export default sessionManager;
