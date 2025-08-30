import { useEffect } from 'react';
import { useAppMode } from '../contexts/AppModeContext';
import { useEnhancedSessionStore } from '../stores/enhancedSessionStore';

/**
 * Hook that syncs AppModeContext with EnhancedSessionStore
 * Ensures store mode stays in sync with context mode
 */
export const useModeSync = () => {
  const { mode } = useAppMode();
  const { setMode, currentMode } = useEnhancedSessionStore();
  
  useEffect(() => {
    if (mode !== currentMode) {
      setMode(mode);
    }
  }, [mode, currentMode, setMode]);
  
  return { 
    currentMode: mode,
    store: useEnhancedSessionStore()
  };
};
