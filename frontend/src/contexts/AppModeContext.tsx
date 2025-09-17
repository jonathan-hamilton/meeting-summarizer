import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTourStore } from '../stores/tourStore';

export type AppMode = 'demo' | 'development' | 'production';

interface AppModeContextType {
  mode: AppMode;
  isDemo: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  setMode: (mode: AppMode) => void;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

interface AppModeProviderProps {
  children: ReactNode;
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial mode based on current route
  const getInitialMode = (): AppMode => {
    if (location.pathname.startsWith('/app') || location.pathname === '/history' || location.pathname.startsWith('/transcript/')) return 'production';
    return 'demo'; // default for / and /demo
  };
  
  const [mode, setMode] = useState<AppMode>(getInitialMode());
  
  // Sync mode with current route changes
  useEffect(() => {
    const newMode = getInitialMode();
    if (newMode !== mode) {
      setMode(newMode);
    }
  }, [location.pathname, mode]);
  
  // Auto-start tour when entering demo mode
  useEffect(() => {
    if (mode === 'demo') {
      // Start tour via Zustand store
      useTourStore.getState().startTour();
    } else {
      // Stop tour when leaving demo mode
      useTourStore.getState().stopTour();
    }
  }, [mode]);
  
  const signIn = async (): Promise<void> => {
    // TODO: Implement actual authentication logic
    // For now, just navigate to production mode
    navigate('/app');
    setMode('production');
  };
  
  const signOut = (): void => {
    // TODO: Implement actual sign out logic
    // For now, just navigate to demo mode
    navigate('/demo');
    setMode('demo');
  };
  
  const contextValue: AppModeContextType = {
    mode,
    isDemo: mode === 'demo',
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
    setMode,
    signIn,
    signOut,
  };
  
  return (
    <AppModeContext.Provider value={contextValue}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = (): AppModeContextType => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};
