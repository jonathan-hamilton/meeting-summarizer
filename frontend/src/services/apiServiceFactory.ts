import realApiService from './apiService';
import mockApiService from './apiService.mock';
import demoApiService from './demoApiService';
import type { AppMode } from '../contexts/AppModeContext';

/**
 * API Service Factory
 * Returns appropriate API service based on current mode
 */
export const createApiService = (mode: AppMode) => {
  switch (mode) {
    case 'demo':
      return demoApiService;
    case 'development':
      return mockApiService;
    case 'production':
      return realApiService;
    default:
      return demoApiService;
  }
};

/**
 * Default API service for backward compatibility
 * This will be replaced with mode-aware service selection
 */
export default realApiService;
