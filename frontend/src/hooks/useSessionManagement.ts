/**
 * React Hook for Session Management (S3.1)
 * Provides session state management, privacy controls, and override tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionManager, type SessionStatus, type PrivacyControls } from '../services/sessionManager';
import { apiService, type SessionOverrideRequest } from '../services/apiService';

export interface UseSessionManagementReturn {
  // Session state
  sessionStatus: SessionStatus;
  privacyControls: PrivacyControls;
  isLoading: boolean;
  error: string | null;

  // Override operations
  applyOverride: (speakerId: string, newName: string) => Promise<boolean>;
  revertOverride: (speakerId: string) => Promise<boolean>;
  clearAllData: () => Promise<boolean>;

  // Session management
  extendSession: () => void;
  refreshStatus: () => void;
}

/**
 * Custom hook for session-based speaker override management
 */
export const useSessionManagement = (): UseSessionManagementReturn => {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    isActive: true,
    sessionId: '',
    sessionDuration: 0,
    lastActivity: new Date(),
    dataSize: '0 B',
    hasOverrides: false,
    overrideCount: 0
  });

  const [privacyControls, setPrivacyControls] = useState<PrivacyControls>({
    sessionStatus: 'active',
    sessionDuration: 0,
    lastActivity: new Date(),
    dataSize: '0 B',
    clearAllData: async () => {},
    extendSession: () => {},
    exportBeforeClear: async () => {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update session status from session manager
   */
  const updateStatus = useCallback(() => {
    const status = sessionManager.getSessionStatus();
    const controls = sessionManager.getPrivacyControls();
    
    setSessionStatus(status);
    setPrivacyControls(controls);
  }, []);

  /**
   * Apply a session-based speaker override
   */
  const applyOverride = useCallback(async (speakerId: string, newName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: SessionOverrideRequest = {
        speakerId,
        newName,
        sessionId: sessionManager.getSessionId()
      };

      const response = await apiService.applySessionOverride(request);

      if (response.success) {
        updateStatus();
        return true;
      } else {
        setError(response.message || 'Failed to apply override');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to apply override: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateStatus]);

  /**
   * Revert a session-based speaker override
   */
  const revertOverride = useCallback(async (speakerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.revertSessionOverride(speakerId);

      if (response.success) {
        updateStatus();
        return true;
      } else {
        setError(response.message || 'Failed to revert override');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to revert override: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateStatus]);

  /**
   * Clear all session data for privacy
   */
  const clearAllData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.clearSessionData();

      if (response.success) {
        updateStatus();
        return true;
      } else {
        setError(response.message || 'Failed to clear session data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to clear session data: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateStatus]);

  /**
   * Extend session by updating activity
   */
  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    updateStatus();
  }, [updateStatus]);

  /**
   * Refresh session status manually
   */
  const refreshStatus = useCallback(() => {
    updateStatus();
  }, [updateStatus]);

  // Set up session status listeners and periodic updates
  useEffect(() => {
    // Initial status update
    updateStatus();

    // Subscribe to session status changes
    const unsubscribe = sessionManager.onStatusChange((status) => {
      setSessionStatus(status);
    });

    // Periodic status refresh every 30 seconds
    const interval = setInterval(() => {
      updateStatus();
    }, 30000);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [updateStatus]);

  // Update privacy controls when session status changes
  useEffect(() => {
    const controls = sessionManager.getPrivacyControls();
    setPrivacyControls(controls);
  }, [sessionStatus]);

  return {
    sessionStatus,
    privacyControls,
    isLoading,
    error,
    applyOverride,
    revertOverride,
    clearAllData,
    extendSession,
    refreshStatus
  };
};

export default useSessionManagement;
