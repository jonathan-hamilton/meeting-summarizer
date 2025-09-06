/**
 * Global Mock for TourStore - Comprehensive Tour System Mock
 */

import { vi } from 'vitest';

// Mock the complete TourStore interface
export const mockTourStoreState = {
  // Basic state
  isActive: false,
  currentStep: 0,
  totalSteps: 18,
  
  // Store actions
  startTour: vi.fn(),
  stopTour: vi.fn(),
  nextStep: vi.fn(),
  previousStep: vi.fn(),
  goToStep: vi.fn(),
  
  // Query methods
  getTotalSteps: vi.fn().mockReturnValue(18),
  getCurrentStepConfig: vi.fn().mockReturnValue({
    title: 'Test Step',
    description: 'Test step description',
    target: 'test-target',
    type: 'acknowledgment',
    component: 'FileUpload'
  }),
  isCurrentStep: vi.fn().mockReturnValue(false),
  isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
  
  // Tour actions
  triggerStepAction: vi.fn(),
  completeStep: vi.fn(),
  
  // Process control
  canUpload: vi.fn().mockReturnValue(true),
  canManageSpeakers: vi.fn().mockReturnValue(true),
  canSaveSpeakers: vi.fn().mockReturnValue(true),
};

// Create the Zustand store mock
export const mockUseTourStore = vi.fn((selector?: any) => {
  if (selector) {
    return selector(mockTourStoreState);
  }
  return mockTourStoreState;
});

// Create getState mock for direct store access (like useTourStore.getState())
(mockUseTourStore as any).getState = vi.fn(() => mockTourStoreState);

// Mock the tour store module
vi.mock('../../stores/tourStore', () => ({
  useTourStore: mockUseTourStore
}));
