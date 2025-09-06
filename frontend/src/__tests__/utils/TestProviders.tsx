/**
 * Test Providers - Comprehensive Context Provider Wrapper for Testing
 * Provides all necessary context providers for component testing
 */

import React from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppModeProvider } from '../../contexts/AppModeContext';
import type { AppMode } from '../../contexts/AppModeContext';

// Mock tour store for tests
vi.mock('../../stores/tourStore', () => ({
  useTourStore: vi.fn(() => ({
    isActive: false,
    currentStep: 0,
    isCurrentStep: vi.fn((_step: number) => false),
    triggerStepAction: vi.fn(),
    closeStep: vi.fn(),
    getTotalSteps: vi.fn(() => 17),
  }))
}));

interface TestProvidersProps {
  children: ReactNode;
  initialMode?: AppMode;
  initialPath?: string;
}

/**
 * Comprehensive test provider wrapper
 * Includes all context providers needed for component testing
 */
export const TestProviders: React.FC<TestProvidersProps> = ({ 
  children, 
  initialPath = '/'
}) => {
  // Mock window.location for router
  if (initialPath !== '/') {
    Object.defineProperty(window, 'location', {
      value: { pathname: initialPath },
      writable: true,
    });
  }

  return (
    <BrowserRouter>
      <AppModeProvider>
        {children}
      </AppModeProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render function for testing with providers
 * Use this instead of @testing-library/react render
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    initialMode?: AppMode;
    initialPath?: string;
  } = {}
) => {
  const { initialMode = 'demo', initialPath = '/' } = options;
  const { render } = require('@testing-library/react');
  
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <TestProviders initialMode={initialMode} initialPath={initialPath}>
        {children}
      </TestProviders>
    ),
  });
};

/**
 * Mock AppModeContext for tests that need specific mode behavior
 */
export const mockAppModeContext = (mode: AppMode = 'demo') => ({
  mode,
  isDemo: mode === 'demo',
  isDevelopment: mode === 'development', 
  isProduction: mode === 'production',
  setMode: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
});
