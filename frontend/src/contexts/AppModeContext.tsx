import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppMode = 'development' | 'production';

interface AppModeContextType {
  mode: AppMode;
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
    if (location.pathname.startsWith('/app') || location.pathname === '/history' || location.pathname.startsWith('/transcript/') || location.pathname.startsWith('/verify-email/')) return 'production';
    return 'production'; // Default to production mode
  };
  
  const [mode, setMode] = useState<AppMode>(getInitialMode());
  
  // Sync mode with current route changes
  useEffect(() => {
    const newMode = getInitialMode();
    if (newMode !== mode) {
      setMode(newMode);
    }
  }, [location.pathname, mode]);
  
  const signIn = async (): Promise<void> => {
    // TODO: Implement actual authentication logic
    // For now, just navigate to production mode
    navigate('/app');
    setMode('production');
  };
  
  const signOut = (): void => {
    // TODO: Implement actual sign out logic
    // For now, just navigate to home
    navigate('/');
    setMode('production');
  };
  
  const contextValue: AppModeContextType = {
    mode,
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
    // More defensive: log error but don't crash the app
    console.error('useAppMode must be used within an AppModeProvider');
    // Return safe fallback values
    return {
      mode: 'development' as AppMode,
      isDevelopment: true,
      isProduction: false,
      setMode: () => {},
      signIn: async () => {},
      signOut: () => {}
    };
  }
  return context;
};
