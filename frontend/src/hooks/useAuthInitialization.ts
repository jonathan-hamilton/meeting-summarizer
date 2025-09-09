import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to initialize authentication on app startup
 * This should be called in the root App component
 */
export const useAuthInitialization = () => {
  const { checkAuthStatus } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        await checkAuthStatus();
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initialize();
    
    return () => {
      mounted = false;
    };
  }, [checkAuthStatus]);

  return { isInitializing };
};
