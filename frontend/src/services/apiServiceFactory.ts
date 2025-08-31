import realApiService from './apiService';
import mockApiService from './apiService.mock';
import demoApiService from './demoApiService';
import type { AppMode } from '../contexts/AppModeContext';

/**
 * API Service Factory
 * Returns appropriate API service based on current mode
 */
export const createApiService = (mode: AppMode) => {
  console.log('🏭 API Service Factory Selection:');
  console.log('- Mode:', mode);
  
  switch (mode) {
    case 'demo':
      console.log('- Selected: demoApiService (Demo mode - demo content)');
      return demoApiService;
    case 'development':
      console.log('- Selected: mockApiService (Development mode - mock data)');
      return mockApiService;
    case 'production':
      console.log('- Selected: realApiService (Production mode - real API calls)');
      return realApiService;
    default:
      console.warn('- Unknown mode, defaulting to demoApiService');
      return demoApiService;
  }
};

/**
 * Default API service for backward compatibility
 * This will be replaced with mode-aware service selection
 */
export default realApiService;
