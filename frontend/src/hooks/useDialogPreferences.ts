import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { userProfileService } from '../services/userProfileService';
import type { DialogPreferences, UpdateDialogPreferencesRequest } from '../types';

interface UseDialogPreferencesResult {
  preferences: DialogPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: UpdateDialogPreferencesRequest) => Promise<void>;
  hasAcknowledgedLegalDisclaimer: boolean;
  hasSeenAiChatDiscovery: boolean;
}

export const useDialogPreferences = (): UseDialogPreferencesResult => {
  const { user, isAuthenticated } = useAuthStore();
  const [preferences, setPreferences] = useState<DialogPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences when user is authenticated
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated || !user?.id) {
        console.log('useDialogPreferences: Not authenticated or no user ID', { isAuthenticated, userId: user?.id });
        setPreferences(null);
        setIsLoading(false);
        return;
      }

      console.log('useDialogPreferences: Loading preferences for user', user.id);
      setIsLoading(true);
      setError(null);

      try {
        const prefs = await userProfileService.getDialogPreferences(user.id);
        console.log('useDialogPreferences: Loaded preferences:', prefs);
        setPreferences(prefs);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dialog preferences';
        setError(errorMessage);
        console.error('Failed to load dialog preferences:', err);
        
        // Fallback to localStorage if API fails (migration period)
        try {
          const fallbackPrefs: DialogPreferences = {
            hasAcknowledgedLegalDisclaimer: localStorage.getItem('meeting-summary-legal-accepted') === 'true',
            hasSeenAiChatDiscovery: localStorage.getItem('chat_discovery_shown') === 'true'
          };
          console.log('useDialogPreferences: Using fallback preferences:', fallbackPrefs);
          setPreferences(fallbackPrefs);
        } catch (localError) {
          console.error('Fallback to localStorage also failed:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user?.id]);

  // Update preferences function
  const updatePreferences = useCallback(async (updates: UpdateDialogPreferencesRequest) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User must be authenticated to update preferences');
    }

    setError(null);

    try {
      await userProfileService.updateDialogPreferences(user.id, updates);
      
      // Update local state
      setPreferences(prev => {
        if (!prev) return prev;
        
        const now = new Date().toISOString();
        const updated = { ...prev };
        
        if (updates.hasAcknowledgedLegalDisclaimer !== undefined) {
          updated.hasAcknowledgedLegalDisclaimer = updates.hasAcknowledgedLegalDisclaimer;
          if (updates.hasAcknowledgedLegalDisclaimer) {
            updated.legalDisclaimerAcknowledgedAt = now;
          }
        }
        
        if (updates.hasSeenAiChatDiscovery !== undefined) {
          updated.hasSeenAiChatDiscovery = updates.hasSeenAiChatDiscovery;
          if (updates.hasSeenAiChatDiscovery) {
            updated.aiChatDiscoveryShownAt = now;
          }
        }
        
        return updated;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dialog preferences';
      setError(errorMessage);
      console.error('Failed to update dialog preferences:', err);
      throw err;
    }
  }, [isAuthenticated, user?.id]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    hasAcknowledgedLegalDisclaimer: preferences?.hasAcknowledgedLegalDisclaimer ?? false,
    hasSeenAiChatDiscovery: preferences?.hasSeenAiChatDiscovery ?? false
  };
};