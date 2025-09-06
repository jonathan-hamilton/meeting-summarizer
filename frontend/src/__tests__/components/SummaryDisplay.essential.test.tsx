/**
 * Streamlined Test Suite for SummaryDisplay Component
 * Phase 4: High-Impact Component Coverage Push - Essential Tests
 * 
 * This test suite focuses on core functionality that can be reliably tested
 * with appropriate mocking strategies, providing solid coverage for key features.
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SummaryDisplay from '../../components/SummaryDisplay';
import type { 
  MeetingSummary, 
  ActionItem, 
  SpeakerMapping, 
  SpeakerSegment 
} from '../../types';
import type { AppMode } from '../../contexts/AppModeContext';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Zustand stores  
const mockSummaryStore = {
  summary: null as MeetingSummary | null,
  actionItems: [] as ActionItem[],
  isGenerating: false,
  error: null as string | null,
  lastGeneratedAt: null as string | null,
  generateSummary: vi.fn(),
  clearSummary: vi.fn(),
  clearError: vi.fn(),
  updateActionItem: vi.fn(),
  addActionItem: vi.fn(),
  deleteActionItem: vi.fn(),
  reorderActionItems: vi.fn(),
  clearActionItems: vi.fn(),
  setActionItems: vi.fn(),
};

const mockSpeakerSessionStore = {
  transcriptionId: 'test-transcript-123',
  currentSegments: [] as SpeakerSegment[],
  speakerMappings: [] as SpeakerMapping[], // Will be updated in setupComponent
  initializeSession: vi.fn(),
  getState: vi.fn(() => ({
    transcriptionId: 'test-transcript-123',
    currentSegments: [],
    speakerMappings: [],
    getActiveSpeakers: vi.fn(() => ['SPEAKER_01', 'SPEAKER_02']),
  })),
};

const mockTourStore = {
  isActive: false,
  currentStep: 1,
  isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
  triggerStepAction: vi.fn(),
  nextStep: vi.fn(),
  getTotalSteps: vi.fn().mockReturnValue(18),
  getCurrentStepConfig: vi.fn(),
  canAdvanceStep: vi.fn().mockReturnValue(true),
  isCurrentStep: vi.fn().mockReturnValue(false),
};

const mockAppMode = {
  mode: 'demo' as AppMode,
  setMode: vi.fn(),
};

// Mock external dependencies
vi.mock('../../stores/summaryStore', () => ({
  useSummaryStore: () => mockSummaryStore
}));

vi.mock('../../stores/speakerSessionStore', () => {
  const mockStore = {
    transcriptionId: 'test-transcript-123',
    currentSegments: [],
    speakerMappings: [], 
    initializeSession: vi.fn(),
    getActiveSpeakers: () => ['SPEAKER_01', 'SPEAKER_02'],
  };

  // Create a mock hook function that also has getState method
  const mockHook: any = (() => ({
    transcriptionId: 'test-transcript-123',
    currentSegments: [],
    speakerMappings: [],
    initializeSession: vi.fn(),
    getState: vi.fn(() => mockStore),
  }));

  // Add the getState method directly to the hook function (like real Zustand stores)
  mockHook.getState = () => mockStore;
  
  return {
    useSpeakerSessionStore: mockHook,
    __esModule: true,
  }
});

vi.mock('../../stores/tourStore', () => ({
  useTourStore: () => mockTourStore
}));

vi.mock('../../contexts/AppModeContext', () => ({
  useAppMode: () => mockAppMode
}));

// Mock child components with simplified interfaces
vi.mock('../../components/SummaryHeader', () => ({
  default: ({ summary, onShareClick }: any) => (
    <div data-testid="summary-header">
      <div>Summary Header</div>
      {summary && (
        <>
          <div data-testid="meeting-overview">{summary.meetingOverview}</div>
          <button onClick={onShareClick} data-testid="share-button">Share</button>
        </>
      )}
    </div>
  )
}));

vi.mock('../../components/ActionItemsSection', () => ({
  default: ({ actionItems }: any) => (
    <div data-testid="action-items-section">
      <div>Action Items</div>
      <div data-testid="action-items-count">{actionItems?.length || 0} items</div>
    </div>
  )
}));

vi.mock('../../components/TourPopover', () => ({
  default: ({ open, children }: any) => open ? <div data-testid="tour-popover">{children}</div> : children
}));

// Mock React.lazy EmailCompositionDialog
const mockEmailDialog = vi.fn(({ open, onClose }) => {
  if (!open) return null;
  return (
    <div data-testid="email-composition-dialog">
      <button onClick={onClose} data-testid="close-email-dialog">Close</button>
    </div>
  );
});

vi.mock('../../components/EmailCompositionDialog', () => ({
  default: mockEmailDialog
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(void 0),
  },
});

// Mock useSnackbar
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn()
  })
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockSpeakerMappings: SpeakerMapping[] = [
  {
    speakerId: 'SPEAKER_01',
    name: 'John Smith',
    role: 'Product Manager',
    email: 'john@company.com',
    source: 'ManuallyAdded',
    transcriptionId: 'test-transcript-123',
  },
  {
    speakerId: 'SPEAKER_02',
    name: 'Sarah Johnson',
    role: 'Developer',
    email: 'sarah@company.com',
    source: 'ManuallyAdded',
    transcriptionId: 'test-transcript-123',
  },
];

const mockActionItems: ActionItem[] = [
  {
    id: 'action-1',
    description: 'Review quarterly budget allocations',
    assignedTo: 'John Smith',
    confidence: 0.95,
    isExplicitAssignment: true,
    sourceText: 'John, can you review the quarterly budget allocations?',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'action-2',
    description: 'Update project timeline',
    assignedTo: 'Sarah Johnson',
    confidence: 0.88,
    isExplicitAssignment: false,
    sourceText: 'We need to update the project timeline.',
    createdAt: '2024-01-15T10:05:00Z',
  },
];

const mockMeetingSummary: MeetingSummary = {
  summaryId: 'summary-123',
  transcriptionId: 'test-transcript-123',
  meetingOverview: 'This meeting focused on Q4 planning and budget reviews. The team discussed project timelines and identified several action items.',
  actionItemsByRole: [
    {
      speakerId: 'SPEAKER_01',
      speakerName: 'John Smith',
      speakerRole: 'Product Manager',
      actionItems: [
        {
          description: 'Review quarterly budget allocations',
          isExplicitAssignment: true,
          confidence: 0.95,
          sourceText: 'John, can you review the quarterly budget allocations?',
        },
      ],
    },
  ],
  unassignedActionItems: [],
  metadata: {
    participants: ['John Smith', 'Sarah Johnson'],
    duration: '15:32',
    speakerCount: 2,
  },
  generation: {
    generatedAt: '2024-01-15T10:15:00Z',
    processingTimeMs: 2500,
    tokenCount: 750,
    isEditable: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const setupComponent = (overrides: any = {}) => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Set up default mock state
  Object.assign(mockSummaryStore, {
    summary: null,
    actionItems: [],
    isGenerating: false,
    error: null,
    lastGeneratedAt: null,
    ...overrides
  });

  Object.assign(mockSpeakerSessionStore, {
    transcriptionId: 'test-transcript-123',
    currentSegments: [],
    speakerMappings: mockSpeakerMappings,
  });

  Object.assign(mockTourStore, {
    isActive: false,
    currentStep: 1,
    isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
    triggerStepAction: vi.fn(),
    isCurrentStep: vi.fn().mockReturnValue(false),
    // Allow tour store overrides
    ...(overrides.tourStore || {})
  });

  // Default props for SummaryDisplay
  const defaultProps = {
    transcriptionId: 'test-transcript-123',
    transcriptText: 'SPEAKER_01: Let\'s start the meeting by reviewing our Q4 goals.\nSPEAKER_02: I have some concerns about the timeline.',
    speakerMappings: mockSpeakerMappings,
    detectedSpeakers: ['SPEAKER_01', 'SPEAKER_02'],
  };

  const user = userEvent.setup();
  const component = render(<SummaryDisplay {...defaultProps} />);
  
  return { ...component, user };
};

const setupWithSummary = (summaryOverrides = {}, storeOverrides = {}) => {
  return setupComponent({
    summary: { ...mockMeetingSummary, ...summaryOverrides },
    actionItems: mockActionItems,
    lastGeneratedAt: '2024-01-15T10:15:00Z',
    ...storeOverrides
  });
};

const setupWithError = (errorMessage: string) => {
  return setupComponent({
    error: errorMessage,
    isGenerating: false,
  });
};

const setupWithLoading = () => {
  return setupComponent({
    isGenerating: true,
    error: null,
  });
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('SummaryDisplay Component - Essential Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic rendering tests
  describe('Initial State & Basic Rendering', () => {
    it('renders the component with correct title', () => {
      setupComponent();
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
    });

    it('displays generate button when no summary exists', () => {
      setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).toBeEnabled();
    });

    it('shows helpful description text', () => {
      setupComponent();
      
      expect(screen.getByText(/Creates a comprehensive summary with role-aware action items/)).toBeInTheDocument();
      expect(screen.getByText(/Works with or without custom speaker names/)).toBeInTheDocument();
    });

    it('handles empty initial state gracefully', () => {
      setupComponent();
      
      expect(screen.queryByTestId('summary-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-items-section')).not.toBeInTheDocument();
    });
  });

  // Summary generation
  describe('Summary Generation', () => {
    it('calls generateSummary when generate button is clicked', async () => {
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      // Verify generateSummary was called
      expect(mockSummaryStore.generateSummary).toHaveBeenCalled();
    });

    it('passes correct parameters to generateSummary', async () => {
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      expect(mockSummaryStore.generateSummary).toHaveBeenCalledWith(
        expect.stringContaining('SPEAKER_01: Let\'s start the meeting'),
        mockSpeakerMappings,
        'demo'
      );
    });

    it('respects tour action disabled state', () => {
      // Setup the component with tour actions disabled for generate-summary
      setupComponent({
        tourStore: {
          isActionDisabledDuringTour: vi.fn((action) => action === 'generate-summary')
        }
      });
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeDisabled();
    });

    it('triggers tour step action when generate button clicked', async () => {
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      expect(mockTourStore.triggerStepAction).toHaveBeenCalledWith('generate-summary');
    });
  });

  // Summary display
  describe('Summary Display', () => {
    it('displays summary header when summary exists', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('summary-header')).toBeInTheDocument();
    });

    it('shows meeting overview content', () => {
      setupWithSummary();
      
      expect(screen.getByText('Demo Meeting Overview')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-overview')).toHaveTextContent(mockMeetingSummary.meetingOverview);
    });

    it('displays action items section when summary exists', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('action-items-section')).toBeInTheDocument();
    });

    it('shows correct action items count', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('2 items');
    });

    it('handles empty action items', () => {
      setupWithSummary({}, { actionItems: [] });
      
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('0 items');
    });
  });

  // Email integration
  describe('Email Integration', () => {
    it('opens email dialog when share button clicked', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      expect(screen.getByTestId('email-composition-dialog')).toBeInTheDocument();
    });

    it('closes email dialog', async () => {
      const { user } = setupWithSummary();
      
      // Open dialog
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      // Close dialog
      const closeButton = screen.getByTestId('close-email-dialog');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('email-composition-dialog')).not.toBeInTheDocument();
    });
  });

  // Error handling
  describe('Error Handling', () => {
    it('displays error alert when error exists', () => {
      setupWithError('Network connection failed');
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('shows close button on error alert', () => {
      setupWithError('Test error');
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('clears error when close button clicked', async () => {
      const { user } = setupWithError('Test error');
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockSummaryStore.clearError).toHaveBeenCalled();
    });
  });

  // Loading states
  describe('Loading States', () => {
    it('displays loading indicator during generation', () => {
      setupWithLoading();
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows loading text', () => {
      setupWithLoading();
      
      expect(screen.getByText('Generating meeting summary...')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });

    it('hides generate button during loading', () => {
      setupWithLoading();
      
      expect(screen.queryByRole('button', { name: /generate meeting summary/i })).not.toBeInTheDocument();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles missing transcript text gracefully', () => {
      // When transcript text is empty, component shows loading state instead of generate button
      render(
        <SummaryDisplay 
          transcriptionId="test-123"
          transcriptText=""
          speakerMappings={[]}
          detectedSpeakers={[]}
        />
      );
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
      // Component shows loading state when transcript text is empty, not disabled button
      expect(screen.queryByRole('button', { name: /generate meeting summary/i })).not.toBeInTheDocument();
    });

    it('works without speaker mappings', () => {
      render(
        <SummaryDisplay 
          transcriptionId="test-123"
          transcriptText="Test transcript"
          speakerMappings={[]}
          detectedSpeakers={[]}
        />
      );
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
    });

    it('handles very long summary content', () => {
      const longSummary = {
        ...mockMeetingSummary,
        meetingOverview: 'A'.repeat(500)
      };
      
      setupWithSummary(longSummary);
      
      expect(screen.getByTestId('meeting-overview')).toHaveTextContent('A'.repeat(500));
    });
  });

  // Basic accessibility
  describe('Accessibility', () => {
    it('provides semantic heading structure', () => {
      setupWithSummary();
      
      expect(screen.getByRole('heading', { name: /ai-powered meeting summary/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /demo meeting overview/i })).toBeInTheDocument();
    });

    it('provides accessible buttons', () => {
      setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('provides progress indicator for loading state', () => {
      setupWithLoading();
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  // Integration scenarios
  describe('Integration Scenarios', () => {
    it('transitions from empty to loaded state', async () => {
      const { rerender } = setupComponent();
      
      // Initial empty state
      expect(screen.getByRole('button', { name: /generate meeting summary/i })).toBeInTheDocument();
      expect(screen.queryByTestId('summary-header')).not.toBeInTheDocument();
      
      // Simulate summary generation completing
      Object.assign(mockSummaryStore, {
        summary: mockMeetingSummary,
        actionItems: mockActionItems,
        isGenerating: false,
      });
      
      rerender(
        <SummaryDisplay 
          transcriptionId="test-transcript-123"
          transcriptText="SPEAKER_01: Test content"
          speakerMappings={mockSpeakerMappings}
          detectedSpeakers={['SPEAKER_01']}
        />
      );
      
      expect(screen.getByTestId('summary-header')).toBeInTheDocument();
      expect(screen.getByTestId('action-items-section')).toBeInTheDocument();
    });

    it('handles error during generation', () => {
      // Start with loading
      const { rerender } = setupWithLoading();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Transition to error
      Object.assign(mockSummaryStore, {
        isGenerating: false,
        error: 'Generation failed'
      });
      
      rerender(
        <SummaryDisplay 
          transcriptionId="test-transcript-123"
          transcriptText="SPEAKER_01: Test content"
          speakerMappings={mockSpeakerMappings}
          detectedSpeakers={['SPEAKER_01']}
        />
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });
  });
});
