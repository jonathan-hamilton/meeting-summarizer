import realApiService from './apiService';
import mockApiService from './apiService.mock';
import demoApiService from './demoApiService';
import type { AppMode } from '../contexts/AppModeContext';

/**
 * API Service Factory
 * Returns appropriate API service based on current mode
 */
export const createApiService = (mode: AppMode, isProductionEnvironment: boolean = true) => {
  if (mode === 'demo') {
    return demoApiService;
  }
  
  // In production mode, respect the environment setting
  return isProductionEnvironment ? realApiService : mockApiService;
};

/**
 * Default API service for backward compatibility
 * This will be replaced with mode-aware service selection
 */
export default realApiService;
