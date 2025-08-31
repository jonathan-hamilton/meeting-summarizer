import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppMode = 'demo' | 'development' | 'production';

interface AppModeContextType {
  mode: AppMode;
  isDemo: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  setMode: (mode: AppMode) => void;
  signIn: () => Promise<void>;
  signOut: () => void;
  tourStep: number;
  isTourActive: boolean;
  startTour: () => void;
  nextTourStep: () => void;
  previousTourStep: () => void;
  closeTour: () => void;
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
    if (location.pathname.startsWith('/app')) return 'production';
    return 'demo'; // default for / and /demo
  };
  
  const [mode, setMode] = useState<AppMode>(getInitialMode());
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Auto-start tour when entering demo mode
  useEffect(() => {
    if (mode === 'demo' && !isTourActive) {
      setIsTourActive(true);
      setTourStep(0);
    }
  }, [mode, isTourActive]);
  
  const signIn = async (): Promise<void> => {
    // TODO: Implement actual authentication logic
    // For now, just navigate to production mode
    navigate('/app');
    setMode('production');
    setIsTourActive(false);
    setTourStep(0);
  };
  
  const signOut = (): void => {
    // TODO: Implement actual sign out logic
    // For now, just navigate to demo mode
    navigate('/demo');
    setMode('demo');
    setIsTourActive(true);
    setTourStep(0);
  };

  const startTour = (): void => {
    setIsTourActive(true);
    setTourStep(0);
  };
  
  const nextTourStep = (): void => {
    if (isTourActive) {
      setTourStep(prev => prev + 1);
    }
  };
  
  const previousTourStep = (): void => {
    if (isTourActive && tourStep > 0) {
      setTourStep(prev => prev - 1);
    }
  };
  
  const closeTour = (): void => {
    setIsTourActive(false);
    setTourStep(0);
  };
  
  const contextValue: AppModeContextType = {
    mode,
    isDemo: mode === 'demo',
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
    setMode,
    signIn,
    signOut,
    tourStep,
    isTourActive,
    startTour,
    nextTourStep,
    previousTourStep,
    closeTour,
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
