import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionManagement } from '../../hooks/useSessionManagement';
import { sessionManager, type SessionStatus } from '../../services/sessionManager';
import { apiService } from '../../services/apiService';
import type { ApiResponse, SessionOverrideResponse } from '../../types';

// Mock sessionManager
vi.mock('../../services/sessionManager', () => ({
  sessionManager: {
    getSessionStatus: vi.fn(),
    getPrivacyControls: vi.fn(),
    getSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    extendSession: vi.fn()
  }
}));

// Mock apiService
vi.mock('../../services/apiService', () => ({
  apiService: {
    applySessionOverride: vi.fn(),
    revertSessionOverride: vi.fn(),
    clearSessionData: vi.fn()
  }
}));

const mockSessionManager = vi.mocked(sessionManager);
const mockApiService = vi.mocked(apiService);

describe('useSessionManagement - Foundation Test Coverage (S3.0 Increment 2)', () => {
  const mockSessionStatus = {
    isActive: true,
    sessionId: 'test-session-123',
    sessionDuration: 30,
    lastActivity: new Date('2025-07-28T10:30:00Z'),
    dataSize: '2.5 KB',
    hasOverrides: true,
    overrideCount: 2
  };

  const mockPrivacyControls = {
    sessionStatus: 'active' as const,
    sessionDuration: 30,
    lastActivity: new Date('2025-07-28T10:30:00Z'),
    dataSize: '2.5 KB',
    clearAllData: vi.fn(),
    extendSession: vi.fn(),
    exportBeforeClear: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionManager.getSessionStatus.mockReturnValue(mockSessionStatus);
    mockSessionManager.getPrivacyControls.mockReturnValue(mockPrivacyControls);
    mockSessionManager.getSessionId.mockReturnValue('test-session-123');
    mockSessionManager.onStatusChange.mockReturnValue(() => {}); // Unsubscribe function
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default session status', () => {
      const { result } = renderHook(() => useSessionManagement());

      expect(result.current.sessionStatus).toEqual(mockSessionStatus);
      expect(result.current.privacyControls).toEqual(mockPrivacyControls);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set up session status listener on mount', () => {
      renderHook(() => useSessionManagement());

      expect(mockSessionManager.onStatusChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clean up listener on unmount', () => {
      const unsubscribeFn = vi.fn();
      mockSessionManager.onStatusChange.mockReturnValue(unsubscribeFn);

      const { unmount } = renderHook(() => useSessionManagement());

      unmount();

      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });

  describe('Session Status Updates', () => {
    it('should update session status when listener is triggered', () => {
      let statusListener: (status: SessionStatus) => void = () => {};
      mockSessionManager.onStatusChange.mockImplementation((listener) => {
        statusListener = listener;
        return () => {};
      });

      const { result } = renderHook(() => useSessionManagement());

      const newStatus = { ...mockSessionStatus, sessionDuration: 60 };
      
      act(() => {
        statusListener(newStatus);
      });

      expect(result.current.sessionStatus).toEqual(newStatus);
    });

    it('should refresh status manually', () => {
      const { result } = renderHook(() => useSessionManagement());

      const newStatus = { ...mockSessionStatus, sessionDuration: 45 };
      mockSessionManager.getSessionStatus.mockReturnValue(newStatus);

      act(() => {
        result.current.refreshStatus();
      });

      expect(result.current.sessionStatus).toEqual(newStatus);
    });

    it('should update privacy controls when session status changes', () => {
      const { result } = renderHook(() => useSessionManagement());

      const newControls = { ...mockPrivacyControls, sessionStatus: 'warning' as const };
      mockSessionManager.getPrivacyControls.mockReturnValue(newControls);

      act(() => {
        result.current.refreshStatus();
      });

      expect(result.current.privacyControls).toEqual(newControls);
    });
  });

  describe('Override Operations', () => {
    describe('applyOverride', () => {
      it('should successfully apply override', async () => {
        const successResponse: ApiResponse<SessionOverrideResponse> = { success: true };
        mockApiService.applySessionOverride.mockResolvedValue(successResponse);

        const { result } = renderHook(() => useSessionManagement());

        let applyResult: boolean | undefined;
        await act(async () => {
          applyResult = await result.current.applyOverride('Speaker 1', 'John Doe');
        });

        expect(applyResult).toBe(true);
        expect(mockApiService.applySessionOverride).toHaveBeenCalledWith({
          speakerId: 'Speaker 1',
          newName: 'John Doe',
          sessionId: 'test-session-123'
        });
        expect(result.current.error).toBeNull();
      });

      it('should handle apply override failure', async () => {
        const failureResponse: ApiResponse<SessionOverrideResponse> = { 
          success: false, 
          message: 'Override failed' 
        };
        mockApiService.applySessionOverride.mockResolvedValue(failureResponse);

        const { result } = renderHook(() => useSessionManagement());

        let applyResult: boolean | undefined;
        await act(async () => {
          applyResult = await result.current.applyOverride('Speaker 1', 'John Doe');
        });

        expect(applyResult).toBe(false);
        expect(result.current.error).toBe('Override failed');
      });

      it('should handle API error during apply override', async () => {
        mockApiService.applySessionOverride.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useSessionManagement());

        let applyResult: boolean | undefined;
        await act(async () => {
          applyResult = await result.current.applyOverride('Speaker 1', 'John Doe');
        });

        expect(applyResult).toBe(false);
        expect(result.current.error).toBe('Failed to apply override: Network error');
      });

      it('should set loading state during apply override', async () => {
        let resolvePromise: (value: ApiResponse<SessionOverrideResponse>) => void;
        const promise = new Promise<ApiResponse<SessionOverrideResponse>>((resolve) => {
          resolvePromise = resolve;
        });
        mockApiService.applySessionOverride.mockReturnValue(promise);

        const { result } = renderHook(() => useSessionManagement());

        act(() => {
          result.current.applyOverride('Speaker 1', 'John Doe');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolvePromise!({ success: true });
          await promise;
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe('revertOverride', () => {
      it('should successfully revert override', async () => {
        const successResponse: ApiResponse<SessionOverrideResponse> = { success: true };
        mockApiService.revertSessionOverride.mockResolvedValue(successResponse);

        const { result } = renderHook(() => useSessionManagement());

        let revertResult: boolean | undefined;
        await act(async () => {
          revertResult = await result.current.revertOverride('Speaker 1');
        });

        expect(revertResult).toBe(true);
        expect(mockApiService.revertSessionOverride).toHaveBeenCalledWith('Speaker 1');
        expect(result.current.error).toBeNull();
      });

      it('should handle revert override failure', async () => {
        const failureResponse: ApiResponse<SessionOverrideResponse> = { 
          success: false, 
          message: 'Revert failed' 
        };
        mockApiService.revertSessionOverride.mockResolvedValue(failureResponse);

        const { result } = renderHook(() => useSessionManagement());

        let revertResult: boolean | undefined;
        await act(async () => {
          revertResult = await result.current.revertOverride('Speaker 1');
        });

        expect(revertResult).toBe(false);
        expect(result.current.error).toBe('Revert failed');
      });

      it('should handle API error during revert override', async () => {
        mockApiService.revertSessionOverride.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useSessionManagement());

        let revertResult: boolean | undefined;
        await act(async () => {
          revertResult = await result.current.revertOverride('Speaker 1');
        });

        expect(revertResult).toBe(false);
        expect(result.current.error).toBe('Failed to revert override: Network error');
      });
    });

    describe('clearAllData', () => {
      it('should successfully clear all data', async () => {
        const successResponse: ApiResponse<void> = { success: true };
        mockApiService.clearSessionData.mockResolvedValue(successResponse);

        const { result } = renderHook(() => useSessionManagement());

        let clearResult: boolean | undefined;
        await act(async () => {
          clearResult = await result.current.clearAllData();
        });

        expect(clearResult).toBe(true);
        expect(mockApiService.clearSessionData).toHaveBeenCalled();
        expect(result.current.error).toBeNull();
      });

      it('should handle clear data failure', async () => {
        const failureResponse: ApiResponse<void> = { 
          success: false, 
          message: 'Clear failed' 
        };
        mockApiService.clearSessionData.mockResolvedValue(failureResponse);

        const { result } = renderHook(() => useSessionManagement());

        let clearResult: boolean | undefined;
        await act(async () => {
          clearResult = await result.current.clearAllData();
        });

        expect(clearResult).toBe(false);
        expect(result.current.error).toBe('Clear failed');
      });

      it('should handle API error during clear data', async () => {
        mockApiService.clearSessionData.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useSessionManagement());

        let clearResult: boolean | undefined;
        await act(async () => {
          clearResult = await result.current.clearAllData();
        });

        expect(clearResult).toBe(false);
        expect(result.current.error).toBe('Failed to clear session data: Network error');
      });
    });
  });

  describe('Session Management Operations', () => {
    it('should extend session', () => {
      const { result } = renderHook(() => useSessionManagement());

      act(() => {
        result.current.extendSession();
      });

      expect(mockSessionManager.extendSession).toHaveBeenCalled();
    });

    it('should update status after extending session', () => {
      const { result } = renderHook(() => useSessionManagement());

      act(() => {
        result.current.extendSession();
      });

      expect(mockSessionManager.getSessionStatus).toHaveBeenCalled();
      expect(mockSessionManager.getPrivacyControls).toHaveBeenCalled();
    });
  });

  describe('Error State Management', () => {
    it('should clear error when starting new operation', async () => {
      // First operation fails
      mockApiService.applySessionOverride.mockResolvedValue({ 
        success: false, 
        message: 'First error' 
      });

      const { result } = renderHook(() => useSessionManagement());

      await act(async () => {
        await result.current.applyOverride('Speaker 1', 'John Doe');
      });

      expect(result.current.error).toBe('First error');

      // Second operation succeeds
      mockApiService.revertSessionOverride.mockResolvedValue({ success: true });

      await act(async () => {
        await result.current.revertOverride('Speaker 1');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle unknown error types', async () => {
      mockApiService.applySessionOverride.mockRejectedValue('String error');

      const { result } = renderHook(() => useSessionManagement());

      await act(async () => {
        await result.current.applyOverride('Speaker 1', 'John Doe');
      });

      expect(result.current.error).toBe('Failed to apply override: Unknown error occurred');
    });
  });

  describe('Periodic Updates', () => {
    it('should set up periodic status refresh', () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() => useSessionManagement());

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockSessionManager.getSessionStatus).toHaveBeenCalledTimes(2); // Initial + periodic

      unmount();
      vi.useRealTimers();
    });

    it('should clean up interval on unmount', () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useSessionManagement());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple concurrent operations', async () => {
      mockApiService.applySessionOverride.mockResolvedValue({ success: true });
      mockApiService.revertSessionOverride.mockResolvedValue({ success: true });
      mockApiService.clearSessionData.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useSessionManagement());

      const operations = [
        result.current.applyOverride('Speaker 1', 'John Doe'),
        result.current.revertOverride('Speaker 2'),
        result.current.clearAllData()
      ];

      await act(async () => {
        const results = await Promise.all(operations);
        expect(results).toEqual([true, true, true]);
      });

      expect(result.current.error).toBeNull();
    });

    it('should maintain state consistency during rapid status updates', () => {
      let statusListener: (status: SessionStatus) => void = () => {};
      mockSessionManager.onStatusChange.mockImplementation((listener) => {
        statusListener = listener;
        return () => {};
      });

      const { result } = renderHook(() => useSessionManagement());

      const statusUpdates = [
        { ...mockSessionStatus, sessionDuration: 10 },
        { ...mockSessionStatus, sessionDuration: 20 },
        { ...mockSessionStatus, sessionDuration: 30 },
        { ...mockSessionStatus, sessionDuration: 40 }
      ];

      statusUpdates.forEach((status, index) => {
        act(() => {
          statusListener(status);
        });
        expect(result.current.sessionStatus.sessionDuration).toBe((index + 1) * 10);
      });
    });

    it('should handle session manager errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockSessionManager.getSessionStatus.mockImplementation(() => {
        throw new Error('Session manager error');
      });

      // The hook should handle errors internally and not crash
      let hookResult;
      
      expect(() => {
        const { result } = renderHook(() => useSessionManagement());
        hookResult = result;
      }).not.toThrow();
      
      // The hook should still be callable even if session manager has errors
      expect(hookResult).toBeDefined();
      
      // Should have logged a warning
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update session status:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should recover from temporary API failures', async () => {
      // First attempt fails
      mockApiService.applySessionOverride
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useSessionManagement());

      // First attempt should fail
      await act(async () => {
        const result1 = await result.current.applyOverride('Speaker 1', 'John Doe');
        expect(result1).toBe(false);
      });

      expect(result.current.error).toContain('Temporary failure');

      // Second attempt should succeed
      await act(async () => {
        const result2 = await result.current.applyOverride('Speaker 1', 'John Doe');
        expect(result2).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Session Status Edge Cases', () => {
    it('should handle warning session status', () => {
      const warningControls = { 
        ...mockPrivacyControls, 
        sessionStatus: 'warning' as const 
      };
      mockSessionManager.getPrivacyControls.mockReturnValue(warningControls);

      const { result } = renderHook(() => useSessionManagement());

      expect(result.current.privacyControls.sessionStatus).toBe('warning');
    });

    it('should handle expired session status', () => {
      const expiredControls = { 
        ...mockPrivacyControls, 
        sessionStatus: 'expired' as const 
      };
      mockSessionManager.getPrivacyControls.mockReturnValue(expiredControls);

      const { result } = renderHook(() => useSessionManagement());

      expect(result.current.privacyControls.sessionStatus).toBe('expired');
    });

    it('should handle empty session data', () => {
      const emptyStatus = {
        isActive: false,
        sessionId: '',
        sessionDuration: 0,
        lastActivity: new Date(),
        dataSize: '0 B',
        hasOverrides: false,
        overrideCount: 0
      };
      mockSessionManager.getSessionStatus.mockReturnValue(emptyStatus);

      const { result } = renderHook(() => useSessionManagement());

      expect(result.current.sessionStatus).toEqual(emptyStatus);
    });
  });
});
