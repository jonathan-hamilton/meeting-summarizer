import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppMode = 'demo' | 'production';

interface AppModeContextType {
  mode: AppMode;
  isDemo: boolean;
  isProduction: boolean;
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
  
  // Determine mode based on current route
  const getCurrentMode = (): AppMode => {
    return location.pathname.startsWith('/app') ? 'production' : 'demo';
  };
  
  const [mode, setMode] = useState<AppMode>(getCurrentMode());
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Update mode when route changes
  useEffect(() => {
    const newMode = getCurrentMode();
    setMode(newMode);
    
    // Auto-start tour when entering demo mode
    if (newMode === 'demo' && !isTourActive) {
      setIsTourActive(true);
      setTourStep(0);
    }
  }, [location.pathname, isTourActive]);
  
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
    isProduction: mode === 'production',
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
