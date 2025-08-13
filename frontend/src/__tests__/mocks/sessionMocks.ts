/**
 * Session Management Mocks for S3.0 Foundation Test Coverage
 * Provides comprehensive mock implementations for session management testing
 */

import { vi } from 'vitest';
import type { 
  SessionOverrideTracker, 
  SessionOverrideAction, 
  SessionStatus, 
  PrivacyControls 
} from '../../services/sessionManager';

/**
 * Mock Session Storage Implementation
 */
export const mockSessionStorage = {
  storage: new Map<string, string>(),

  getItem: vi.fn((key: string) => {
    return mockSessionStorage.storage.get(key) || null;
  }),

  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.storage.set(key, value);
  }),

  removeItem: vi.fn((key: string) => {
    mockSessionStorage.storage.delete(key);
  }),

  clear: vi.fn(() => {
    mockSessionStorage.storage.clear();
  }),

  key: vi.fn((index: number) => {
    const keys = Array.from(mockSessionStorage.storage.keys());
    return keys[index] || null;
  }),

  get length() {
    return mockSessionStorage.storage.size;
  },

  /**
   * Reset all mocks and clear storage
   */
  reset: () => {
    mockSessionStorage.storage.clear();
    vi.clearAllMocks();
  },

  /**
   * Setup with initial data
   */
  setup: (initialData: Record<string, string> = {}) => {
    mockSessionStorage.reset();
    Object.entries(initialData).forEach(([key, value]) => {
      mockSessionStorage.storage.set(key, value);
    });
  },
};

/**
 * Mock Session Manager Class
 */
export class MockSessionManager {
  private sessionId: string = 'mock-session-123';
  private sessionStarted: Date = new Date();
  private lastActivity: Date = new Date();
  private listeners: Set<(status: SessionStatus) => void> = new Set();
  private overrideTracker: SessionOverrideTracker | null = null;

  constructor() {
    this.overrideTracker = {
      sessionId: this.sessionId,
      transcriptionId: 'mock-transcription-123',
      sessionStarted: this.sessionStarted,
      lastActivity: this.lastActivity,
      actions: {},
    };
  }

  /**
   * Mock session initialization
   */
  initializeSession = vi.fn((transcriptionId: string) => {
    this.overrideTracker = {
      sessionId: this.sessionId,
      transcriptionId,
      sessionStarted: new Date(),
      lastActivity: new Date(),
      actions: {},
    };
    this.notifyListeners();
  });

  /**
   * Mock session activity tracking
   */
  trackActivity = vi.fn(() => {
    this.lastActivity = new Date();
    if (this.overrideTracker) {
      this.overrideTracker.lastActivity = this.lastActivity;
    }
    this.notifyListeners();
  });

  /**
   * Mock override tracking
   */
  trackOverride = vi.fn((
    speakerId: string,
    action: 'Override' | 'Revert' | 'Clear',
    originalValue?: string,
    newValue?: string,
    fieldModified: string = 'name'
  ) => {
    if (!this.overrideTracker) {
      throw new Error('Session not initialized');
    }

    const overrideAction: SessionOverrideAction = {
      action,
      originalValue,
      newValue,
      timestamp: new Date(),
      fieldModified,
    };

    this.overrideTracker.actions[speakerId] = overrideAction;
    this.trackActivity();
  });

  /**
   * Mock session status
   */
  getSessionStatus = vi.fn((): SessionStatus => {
    const now = new Date();
    const sessionDuration = this.overrideTracker 
      ? Math.floor((now.getTime() - this.overrideTracker.sessionStarted.getTime()) / (1000 * 60))
      : 0;

    const overrideCount = this.overrideTracker 
      ? Object.keys(this.overrideTracker.actions).length 
      : 0;

    return {
      isActive: true,
      sessionId: this.sessionId,
      sessionDuration,
      lastActivity: this.lastActivity,
      dataSize: `${overrideCount * 0.5} KB`,
      hasOverrides: overrideCount > 0,
      overrideCount,
    };
  });

  /**
   * Mock privacy controls
   */
  getPrivacyControls = vi.fn((): PrivacyControls => {
    const status = this.getSessionStatus();
    
    return {
      sessionStatus: status.sessionDuration > 105 ? 'warning' : 'active',
      sessionDuration: status.sessionDuration,
      lastActivity: this.lastActivity,
      dataSize: status.dataSize,
      clearAllData: vi.fn(async () => {
        this.overrideTracker = null;
        mockSessionStorage.clear();
        this.notifyListeners();
      }),
      extendSession: vi.fn(() => {
        this.trackActivity();
      }),
      exportBeforeClear: vi.fn(async () => {
        // Mock export functionality
        return Promise.resolve();
      }),
    };
  });

  /**
   * Mock session cleanup
   */
  clearSession = vi.fn(() => {
    this.overrideTracker = null;
    this.listeners.clear();
    mockSessionStorage.clear();
  });

  /**
   * Mock listener management
   */
  addStatusListener = vi.fn((listener: (status: SessionStatus) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  });

  private notifyListeners() {
    const status = this.getSessionStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Mock session timeout
   */
  simulateTimeout = vi.fn(() => {
    // Simulate session timeout by setting old activity time
    this.lastActivity = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    if (this.overrideTracker) {
      this.overrideTracker.lastActivity = this.lastActivity;
    }
    this.notifyListeners();
  });

  /**
   * Reset all mocks
   */
  reset = () => {
    vi.clearAllMocks();
    this.overrideTracker = null;
    this.listeners.clear();
    mockSessionStorage.reset();
  };
}

/**
 * Factory Functions for Test Data
 */
export const sessionMockFactory = {
  /**
   * Creates a mock session override tracker
   */
  createSessionOverrideTracker: (overrides: Partial<SessionOverrideTracker> = {}): SessionOverrideTracker => ({
    sessionId: 'mock-session-123',
    transcriptionId: 'mock-transcription-123',
    sessionStarted: new Date(),
    lastActivity: new Date(),
    actions: {},
    ...overrides,
  }),

  /**
   * Creates a mock session override action
   */
  createSessionOverrideAction: (overrides: Partial<SessionOverrideAction> = {}): SessionOverrideAction => ({
    action: 'Override',
    originalValue: 'Original Value',
    newValue: 'New Value',
    timestamp: new Date(),
    fieldModified: 'name',
    ...overrides,
  }),

  /**
   * Creates a mock session status
   */
  createSessionStatus: (overrides: Partial<SessionStatus> = {}): SessionStatus => ({
    isActive: true,
    sessionId: 'mock-session-123',
    sessionDuration: 30,
    lastActivity: new Date(),
    dataSize: '2.5 KB',
    hasOverrides: true,
    overrideCount: 3,
    ...overrides,
  }),

  /**
   * Creates a mock privacy controls object
   */
  createPrivacyControls: (overrides: Partial<PrivacyControls> = {}): PrivacyControls => ({
    sessionStatus: 'active',
    sessionDuration: 30,
    lastActivity: new Date(),
    dataSize: '2.5 KB',
    clearAllData: vi.fn(async () => {}),
    extendSession: vi.fn(() => {}),
    exportBeforeClear: vi.fn(async () => {}),
    ...overrides,
  }),
};

/**
 * Session Storage Test Utilities
 */
export const sessionStorageTestUtils = {
  /**
   * Setup mock session storage for testing
   */
  setupMockSessionStorage: () => {
    // Mock the global sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  },

  /**
   * Simulate session storage quota exceeded
   */
  simulateQuotaExceeded: () => {
    mockSessionStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
  },

  /**
   * Restore normal session storage behavior
   */
  restoreSessionStorage: () => {
    mockSessionStorage.setItem.mockImplementation((key: string, value: string) => {
      mockSessionStorage.storage.set(key, value);
    });
  },

  /**
   * Verify session storage interactions
   */
  verifySessionStorageInteractions: {
    wasRead: (key: string) => {
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(key);
    },
    wasWritten: (key: string, value?: string) => {
      if (value) {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(key, value);
      } else {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(key, expect.any(String));
      }
    },
    wasRemoved: (key: string) => {
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(key);
    },
    wasCleared: () => {
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    },
  },
};

/**
 * Timer Mocks for Session Timeout Testing
 */
export const timerMocks = {
  /**
   * Setup fake timers for testing
   */
  useFakeTimers: () => {
    vi.useFakeTimers();
  },

  /**
   * Restore real timers
   */
  useRealTimers: () => {
    vi.useRealTimers();
  },

  /**
   * Advance time by specified minutes
   */
  advanceByMinutes: (minutes: number) => {
    vi.advanceTimersByTime(minutes * 60 * 1000);
  },

  /**
   * Advance time by specified hours
   */
  advanceByHours: (hours: number) => {
    vi.advanceTimersByTime(hours * 60 * 60 * 1000);
  },

  /**
   * Run all pending timers
   */
  runAllTimers: () => {
    vi.runAllTimers();
  },
};

/**
 * Integration Test Helpers
 */
export const integrationTestHelpers = {
  /**
   * Setup complete session management environment for testing
   */
  setupSessionEnvironment: () => {
    const mockManager = new MockSessionManager();
    sessionStorageTestUtils.setupMockSessionStorage();
    timerMocks.useFakeTimers();
    
    return {
      mockManager,
      cleanup: () => {
        mockManager.reset();
        mockSessionStorage.reset();
        timerMocks.useRealTimers();
      },
    };
  },

  /**
   * Simulate complete session workflow
   */
  simulateSessionWorkflow: async (mockManager: MockSessionManager) => {
    // Initialize session
    mockManager.initializeSession('test-transcription-123');
    
    // Track some overrides
    mockManager.trackOverride('Speaker_1', 'Override', 'Speaker 1', 'John Doe');
    mockManager.trackOverride('Speaker_2', 'Override', 'Speaker 2', 'Jane Smith');
    
    // Simulate time passing
    timerMocks.advanceByMinutes(30);
    
    // Track activity
    mockManager.trackActivity();
    
    return mockManager.getSessionStatus();
  },
};
