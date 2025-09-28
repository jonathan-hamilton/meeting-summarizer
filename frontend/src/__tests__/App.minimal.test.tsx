import { describe, it, expect, vi } from 'vitest';

// Import global mocks - these provide comprehensive store mocking
import './mocks/speakerSessionStoreMock';

// Use the proven renderWithProviders pattern from working tests
import { renderWithProviders } from './utils/TestProviders';

// Mock hooks that App uses
vi.mock('../hooks/useModeSync', () => ({
  useModeSync: () => ({})
}));

vi.mock('../hooks/useSessionManagement', () => ({
  useSessionManagement: () => ({
    privacyControls: {
      showPrivacyPolicy: false,
      shouldForceShow: false
    }
  })
}));

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: () => ({
    addTranscript: vi.fn()
  })
}));

// Mock API services
vi.mock('../services/apiServiceFactory', () => ({
  createApiService: vi.fn(() => ({
    getHealth: vi.fn(),
    getOpenAIStatus: vi.fn()
  }))
}));

vi.mock('../services/sessionManager', () => ({
  sessionManager: {
    onStatusChange: vi.fn(() => () => {})
  }
}));

// Mock all the heavy components that App imports
vi.mock('../components/SessionIndicator', () => ({
  SessionIndicator: () => <div data-testid="session-indicator">Session Indicator</div>
}));

vi.mock('../components/FileUpload', () => ({
  default: () => <div data-testid="file-upload">File Upload</div>
}));

vi.mock('../components/TranscriptDisplay', () => ({
  default: () => <div data-testid="transcript-display">Transcript Display</div>
}));

// Mock lazy components
vi.mock('../components/HealthDialog', () => ({
  HealthDialog: () => <div data-testid="health-dialog">Health Dialog</div>
}));

vi.mock('../components/SessionTimeoutWarningDialog', () => ({
  SessionTimeoutWarningDialog: () => <div data-testid="timeout-dialog">Timeout Dialog</div>
}));

vi.mock('../components/PrivacyPolicyDialog', () => ({
  PrivacyPolicyDialog: () => <div data-testid="privacy-dialog">Privacy Dialog</div>
}));

vi.mock('../components/HelpDialog', () => ({
  HelpDialog: () => <div data-testid="help-dialog">Help Dialog</div>
}));

import App from '../App';

describe('App Component - Minimal Test', () => {
  it('can render without crashing', () => {
    expect(() => {
      renderWithProviders(<App />, { initialMode: 'development' });
    }).not.toThrow();
  });
});
