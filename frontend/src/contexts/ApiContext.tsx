import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAppMode } from './AppModeContext';
import { createApiService } from '../services/apiServiceFactory';

interface ApiContextType {
  apiService: any; // Will be typed based on actual service interface
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const { mode } = useAppMode();
  
  const apiService = createApiService(mode);
  
  return (
    <ApiContext.Provider value={{ apiService }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
