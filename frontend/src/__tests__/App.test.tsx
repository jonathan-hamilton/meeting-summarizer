import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Import global mocks - these provide comprehensive store mocking
import './mocks/tourStoreMock';
import './mocks/speakerSessionStoreMock';

// Use the proven renderWithProviders pattern from working tests
import { renderWithProviders } from './utils/TestProviders';

// Mock API services
vi.mock('../services/apiServiceFactory', () => ({
  createApiService: vi.fn(() => ({
    uploadAudio: vi.fn(),
    getHealth: vi.fn().mockResolvedValue({
      success: true,
      data: { status: 'Healthy' }
    }),
    getOpenAIStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { isEnabled: true }
    }),
    transcribeAudio: vi.fn()
  }))
}));

vi.mock('../services/apiService', () => ({
  default: {
    uploadAudio: vi.fn(),
    getHealth: vi.fn().mockResolvedValue({
      success: true,
      data: { status: 'Healthy' }
    }),
    getOpenAIStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { isEnabled: true }
    })
  }
}));

vi.mock('../services/apiService.mock', () => ({
  default: {
    uploadAudio: vi.fn(),
    getHealth: vi.fn().mockResolvedValue({
      success: true,
      data: { status: 'Healthy' }
    }),
    getOpenAIStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { isEnabled: true }
    })
  }
}));

vi.mock('../services/sessionManager', () => ({
  sessionManager: {
    startSession: vi.fn(),
    extendSession: vi.fn(),
    endSession: vi.fn(),
    isSessionActive: vi.fn(() => true),
    onStatusChange: vi.fn(() => () => {})
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main app structure', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    // Check for main app bar
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
  });

  it('displays the correct title based on app mode', () => {
    // Demo mode
    const { unmount } = renderWithProviders(<App />, { initialMode: 'demo' });
    expect(screen.getByText('Meeting Summary - Demo Mode')).toBeInTheDocument();
    unmount();

    // Development mode
    renderWithProviders(<App />, { initialMode: 'development' });
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    const themeToggle = screen.getByLabelText(/toggle.*mode/i);
    expect(themeToggle).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    const signInButton = screen.getByText('SIGN IN');
    expect(signInButton).toBeInTheDocument();
  });

  it('renders help button', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    const helpButton = screen.getByLabelText(/help/i);
    expect(helpButton).toBeInTheDocument();
  });

  it('renders privacy policy link', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    const privacyLink = screen.getByText(/privacy policy/i);
    expect(privacyLink).toBeInTheDocument();
  });

  it('renders mode indicator in demo mode', () => {
    renderWithProviders(<App />, { initialMode: 'demo' });
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
  });

  it('renders mode indicator in development mode', () => {
    renderWithProviders(<App />, { initialMode: 'development' });
    expect(screen.getByText(/development mode/i)).toBeInTheDocument();
  });

  it('does not render mode indicator in production mode', () => {
    renderWithProviders(<App />, { initialMode: 'production' });
    expect(screen.queryByText(/mode/i)).not.toBeInTheDocument();
  });

  it('handles theme toggle click', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    const themeToggle = screen.getByLabelText(/toggle.*mode/i);
    
    // Click to toggle theme
    fireEvent.click(themeToggle);
    
    // The theme change should be handled by the theme context
    // We can verify the button is still there and clickable
    expect(themeToggle).toBeInTheDocument();
  });

  it('has proper app structure with main content area', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    // Should have main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('has footer with session information', () => {
    renderWithProviders(<App />, { initialMode: 'development' });

    // Should have footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(screen.getByText(/session-based storage/i)).toBeInTheDocument();
  });
});
