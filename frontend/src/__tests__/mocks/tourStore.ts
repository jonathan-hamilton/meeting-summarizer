/**
 * Comprehensive Tour Store Mock for Testing
 * Provides all functions needed by components and contexts
 */
import { vi } from 'vitest';

// Mock tour step configuration
const mockTourStepConfig = {
  id: 1,
  title: "Upload Your Audio",
  description: "Click 'SELECT FILE' to select a mock audio file to transcribe.",
  transitionType: 'user-action' as const,
  triggerAction: 'file-select',
  component: 'FileUpload'
};

export const mockTourStore = {
  isActive: false,
  currentStep: 0,
  isCurrentStep: vi.fn(() => false),
  closeStep: vi.fn(),
  triggerStepAction: vi.fn(),
  isActionDisabledDuringTour: vi.fn(() => false),
  startTour: vi.fn(),
  stopTour: vi.fn(),
  getTotalSteps: vi.fn(() => 6),
  getCurrentStepConfig: vi.fn(() => mockTourStepConfig),
  goToStep: vi.fn(),
  nextStep: vi.fn(),
  previousStep: vi.fn(),
  completeTour: vi.fn(),
};

// Create the mock function that supports both hook and getState patterns
const mockUseTourStore: any = vi.fn(() => mockTourStore);
mockUseTourStore.getState = vi.fn(() => mockTourStore);

export const createTourStoreMock = () => ({
  useTourStore: mockUseTourStore,
});
