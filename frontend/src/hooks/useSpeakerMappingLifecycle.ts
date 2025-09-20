/**
 * Speaker Mapping Lifecycle Hook
 * Manages when speaker mappings should be cleared vs persisted based on authentication and navigation context
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSpeakerSessionStore } from '../stores/speakerSessionStore';

export const useSpeakerMappingLifecycle = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { clearSession } = useSpeakerSessionStore();
  
  // Track previous authentication state and user to detect sign-in/sign-out events
  const prevAuthState = useRef({ isAuthenticated, userId: user?.id });
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip initial render to avoid clearing on app startup
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevAuthState.current = { isAuthenticated, userId: user?.id };
      return;
    }

    const currentUserId = user?.id;
    const previousUserId = prevAuthState.current.userId;
    const wasAuthenticated = prevAuthState.current.isAuthenticated;

    // Case 1: User signed out - clear all speaker mappings
    if (wasAuthenticated && !isAuthenticated) {
      console.log('🧹 User signed out - clearing speaker mappings');
      clearSession();
    }
    
    // Case 2: User signed in as different user - clear all speaker mappings
    else if (isAuthenticated && currentUserId && previousUserId && currentUserId !== previousUserId) {
      console.log('🧹 Different user signed in - clearing speaker mappings');
      clearSession();
    }
    
    // Case 3: User signed in for first time (session timeout recovery) - clear all speaker mappings
    else if (!wasAuthenticated && isAuthenticated && currentUserId) {
      console.log('🧹 User signed in after session timeout - clearing speaker mappings');
      clearSession();
    }

    // Update previous state for next comparison
    prevAuthState.current = { isAuthenticated, userId: currentUserId };
  }, [isAuthenticated, user?.id, clearSession]);

  // Navigation-based logic is handled elsewhere - this hook only handles authentication changes
  // Speaker mappings should persist during navigation within the same authenticated session
};