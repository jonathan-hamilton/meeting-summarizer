/**
 * Environment Context for switching between development and production modes
 * Controls both API behavior and Privacy Policy display
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface EnvironmentContextType {
  /**
   * Current environment mode
   * - true: Production mode (real API calls)
   * - false: Development mode (mocked API calls)
   */
  isProductionMode: boolean;
  
  /**
   * Toggle between production and development modes
   */
  toggleEnvironmentMode: () => void;
  
  /**
   * Set environment mode directly
   */
  setProductionMode: (isProduction: boolean) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const ENVIRONMENT_MODE_KEY = 'meetingSummarizer_environmentMode';

interface EnvironmentProviderProps {
  children: ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  // Initialize from localStorage, default to development mode for safety
  const [isProductionMode, setIsProductionModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(ENVIRONMENT_MODE_KEY);
      return stored === 'true';
    } catch (error) {
      console.warn('Unable to read environment mode from localStorage:', error);
      return false; // Default to development mode
    }
  });

  // Persist environment mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ENVIRONMENT_MODE_KEY, isProductionMode.toString());
    } catch (error) {
      console.warn('Unable to save environment mode to localStorage:', error);
    }
  }, [isProductionMode]);

  const toggleEnvironmentMode = () => {
    setIsProductionModeState(prev => !prev);
  };

  const setProductionMode = (isProduction: boolean) => {
    setIsProductionModeState(isProduction);
  };

  const contextValue: EnvironmentContextType = {
    isProductionMode,
    toggleEnvironmentMode,
    setProductionMode,
  };

  return (
    <EnvironmentContext.Provider value={contextValue}>
      {children}
    </EnvironmentContext.Provider>
  );
};

/**
 * Hook to access environment context
 */
export const useEnvironment = (): EnvironmentContextType => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

export default EnvironmentProvider;
