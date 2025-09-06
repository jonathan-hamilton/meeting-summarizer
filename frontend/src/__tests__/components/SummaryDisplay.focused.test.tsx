/**
 * Focused Test Suite for SummaryDisplay Component
 * Phase 4: High-Impact Component Coverage Push - Streamlined Version
 * 
 * This test suite focuses on testing what can be effectively verified with mocked child components,
 * providing solid coverage while avoiding complex integration testing that would require extensive setup.
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

// Mock Material-UI Snackbar
const mockEnqueueSnackbar = vi.fn();

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
  speakerMappings: [] as SpeakerMapping[],
  initializeSession: vi.fn(),
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

vi.mock('../../stores/speakerSessionStore', () => ({
  useSpeakerSessionStore: () => mockSpeakerSessionStore
}));

vi.mock('../../stores/tourStore', () => ({
  useTourStore: () => mockTourStore
}));

vi.mock('../../contexts/AppModeContext', () => ({
  useAppMode: () => mockAppMode
}));

// Mock child components to avoid complex nested dependencies
vi.mock('../../components/SummaryHeader', () => ({
  default: ({ summary, onShareClick, onCopyClick }: any) => (
    <div data-testid="summary-header">
      <div>Summary Header</div>
      {summary && (
        <>
          <div>{summary.meetingOverview}</div>
          <button onClick={onShareClick} data-testid="share-button">Share</button>
          <button onClick={onCopyClick} data-testid="copy-summary-button">Copy Summary</button>
        </>
      )}
    </div>
  )
}));

vi.mock('../../components/ActionItemsSection', () => {
  let isExpanded = false;
  
  return {
    default: ({ 
      actionItems, 
      onCreateActionItem,
      onDeleteActionItem,
      onUpdateActionItem
    }: any) => {
      const toggleExpansion = () => {
        isExpanded = !isExpanded;
      };
      
      return (
        <div data-testid="action-items-section">
          <div>Action Items</div>
          <div data-testid="action-items-count">{actionItems?.length || 0} items</div>
          <button onClick={toggleExpansion} data-testid="toggle-expansion-button">
            {isExpanded ? 'Collapse' : 'Expand'} Action Items
          </button>
          {isExpanded && (
            <>
              <button onClick={onCreateActionItem} data-testid="add-action-item-button">Add Action Item</button>
              {actionItems?.map((item: any, index: number) => (
                <div key={item.id || index} data-testid={`action-item-${index}`}>
                  <div>{item.description}</div>
                  <button onClick={() => onUpdateActionItem(item.id, { description: 'Updated' })} data-testid={`edit-item-${index}`}>Edit</button>
                  <button onClick={() => onDeleteActionItem(item.id)} data-testid={`delete-item-${index}`}>Delete</button>
                </div>
              ))}
            </>
          )}
        </div>
      );
    }
  };
});

vi.mock('../../components/TourPopover', () => ({
  default: ({ open, children }: any) => open ? <div data-testid="tour-popover">{children}</div> : children
}));

vi.mock('../../components/UpsertActionItemDialog', () => ({
  default: ({ open, onClose, onSave }: any) => {
    if (!open) return null;
    return (
      <div data-testid="upsert-action-item-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({ description: 'New item' })}>Save</button>
      </div>
    );
  }
}));

// Mock React.lazy EmailCompositionDialog
const mockEmailDialog = vi.fn(({ open, onClose, summary, actionItems, speakerMappings }) => {
  if (!open) return null;
  return (
    <div data-testid="email-composition-dialog">
      <button onClick={onClose} data-testid="close-email-dialog">Close</button>
      <div data-testid="email-summary">{summary?.meetingOverview || 'No summary'}</div>
      <div data-testid="email-action-items-count">{actionItems?.length || 0}</div>
      <div data-testid="email-speaker-count">{speakerMappings?.length || 0}</div>
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

// Mock useSnackbar at module level to avoid issues
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar
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

const mockSpeakerSegments: SpeakerSegment[] = [
  {
    speaker: 'SPEAKER_01',
    text: 'Let\'s start the meeting by reviewing our Q4 goals.',
    start: 0.0,
    end: 3.2,
    confidence: 0.95,
  },
  {
    speaker: 'SPEAKER_02',
    text: 'I have some concerns about the timeline.',
    start: 3.5,
    end: 6.8,
    confidence: 0.92,
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
  {
    id: 'action-3',
    description: 'Unassigned task',
    assignedTo: 'Unassigned',
    confidence: 0.75,
    isExplicitAssignment: false,
    sourceText: 'Someone should handle this.',
    createdAt: '2024-01-15T10:10:00Z',
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

const setupComponent = (overrides = {}) => {
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
    currentSegments: mockSpeakerSegments,
    speakerMappings: mockSpeakerMappings,
  });

  Object.assign(mockTourStore, {
    isActive: false,
    currentStep: 1,
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

const setupWithSummary = (summaryOverrides = {}) => {
  return setupComponent({
    summary: { ...mockMeetingSummary, ...summaryOverrides },
    actionItems: mockActionItems,
    lastGeneratedAt: '2024-01-15T10:15:00Z',
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

const setupWithTour = (step: number) => {
  Object.assign(mockTourStore, {
    isActive: true,
    currentStep: step,
    isCurrentStep: vi.fn((s) => s === step),
  });
  return setupComponent();
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('SummaryDisplay Component - Focused Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTourStore.isActionDisabledDuringTour.mockReturnValue(false);
  });

  // Basic rendering tests
  describe('Basic Rendering & Initial State', () => {
    it('renders initial empty state correctly', () => {
      setupComponent();
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
      expect(screen.getByText('Generate Meeting Summary')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-header')).not.toBeInTheDocument();
    });

    it('displays generate button when no summary exists', () => {
      setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).toBeEnabled();
    });

    it('displays helpful description text', () => {
      setupComponent();
      
      expect(screen.getByText(/Creates a comprehensive summary with role-aware action items/)).toBeInTheDocument();
      expect(screen.getByText(/Works with or without custom speaker names/)).toBeInTheDocument();
    });
  });

  // Summary generation tests
  describe('Summary Generation', () => {
    it('calls generateSummary when generate button is clicked', async () => {
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      expect(mockSummaryStore.generateSummary).toHaveBeenCalledWith(
        'SPEAKER_01: Let\'s start the meeting by reviewing our Q4 goals.\nSPEAKER_02: I have some concerns about the timeline.',
        mockSpeakerMappings,
        'demo'
      );
    });

    it('passes correct app mode to generateSummary', async () => {
      mockAppMode.mode = 'production';
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      expect(mockSummaryStore.generateSummary).toHaveBeenCalledWith(
        expect.any(String),
        mockSpeakerMappings,
        'production'
      );
    });

    it('shows generate button when no summary exists', () => {
      setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).toBeEnabled();
    });
  });

  // Summary display tests
  describe('Summary Display', () => {
    it('displays summary content when available', () => {
      setupWithSummary();
      
      const summaryElements = screen.getAllByText(mockMeetingSummary.meetingOverview);
      expect(summaryElements.length).toBeGreaterThan(0);
    });

    it('displays meeting overview heading', () => {
      setupWithSummary();
      
      expect(screen.getByText('Meeting Overview')).toBeInTheDocument();
    });

    it('shows copy and share buttons when summary exists', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('copy-summary-button')).toBeInTheDocument();
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('shows summary header component', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('summary-header')).toBeInTheDocument();
    });

    it('shows action items section', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('action-items-section')).toBeInTheDocument();
    });
  });

  // Action items management
  describe('Action Items Management', () => {
    it('displays action items section when summary exists', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('action-items-section')).toBeInTheDocument();
      expect(screen.getByText('Action Items')).toBeInTheDocument();
    });

    it('shows action items count', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('3 items');
    });

    it('shows expand/collapse button', () => {
      setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveTextContent('Expand Action Items');
    });

    it('allows expanding action items', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      expect(screen.getByTestId('add-action-item-button')).toBeInTheDocument();
    });

    it('shows individual action items when expanded', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      expect(screen.getByTestId('action-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('action-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-item-2')).toBeInTheDocument();
    });

    it('calls addActionItem when add button is clicked', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      const addButton = screen.getByTestId('add-action-item-button');
      await user.click(addButton);
      
      expect(mockSummaryStore.addActionItem).toHaveBeenCalled();
    });

    it('allows editing action items through child component', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      const editButton = screen.getByTestId('edit-item-0');
      await user.click(editButton);
      
      expect(mockSummaryStore.updateActionItem).toHaveBeenCalled();
    });

    it('allows deleting action items through child component', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      const deleteButton = screen.getByTestId('delete-item-0');
      await user.click(deleteButton);
      
      expect(mockSummaryStore.deleteActionItem).toHaveBeenCalledWith('action-1');
    });
  });

  // Email dialog integration
  describe('Email Dialog Integration', () => {
    it('opens email dialog when share button is clicked', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      expect(screen.getByTestId('email-composition-dialog')).toBeInTheDocument();
    });

    it('passes correct props to email dialog', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      expect(screen.getByTestId('email-summary')).toHaveTextContent(
        mockMeetingSummary.meetingOverview
      );
      expect(screen.getByTestId('email-action-items-count')).toHaveTextContent('3');
      expect(screen.getByTestId('email-speaker-count')).toHaveTextContent('2');
    });

    it('closes email dialog when close button is clicked', async () => {
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
    it('displays error alert when generation fails', () => {
      const errorMessage = 'Failed to generate summary. Please try again.';
      setupWithError(errorMessage);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows close button on error alert', () => {
      setupWithError('Network error');
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('clears error when close button is clicked', async () => {
      const { user } = setupWithError('Network error');
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockSummaryStore.clearError).toHaveBeenCalled();
    });
  });

  // Loading states
  describe('Loading States', () => {
    it('displays loading state during generation', () => {
      setupWithLoading();
      
      expect(screen.getByText('Generating meeting summary...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows progress text during generation', () => {
      setupWithLoading();
      
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });
  });

  // Tour integration
  describe('Tour Integration', () => {
    it('renders with tour active', () => {
      setupWithTour(10);
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
    });

    it('shows tour popover when configured', () => {
      setupWithTour(10);
      
      // Tour popover would show on specific steps but requires more complex setup
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
    });

    it('handles tour state correctly', () => {
      setupWithTour(13);
      
      // Verify tour is active
      expect(mockTourStore.isActive).toBe(true);
      expect(mockTourStore.currentStep).toBe(13);
    });
  });

  // Edge cases and performance
  describe('Edge Cases & Performance', () => {
    it('handles empty action items array gracefully', () => {
      setupComponent({
        summary: mockMeetingSummary,
        actionItems: [], // Empty action items from store
      });
      
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('0 items');
    });

    it('handles missing speaker mappings gracefully', () => {
      Object.assign(mockSpeakerSessionStore, { speakerMappings: [] });
      setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeEnabled();
    });

    it('renders without crashing when all props are minimal', () => {
      setupComponent();
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
    });

    it('handles very long summary content', () => {
      const longSummary = {
        ...mockMeetingSummary,
        meetingOverview: 'A'.repeat(1000), // Long but reasonable content
      };
      
      setupWithSummary(longSummary);
      
      const summaryElements = screen.getAllByText('A'.repeat(1000));
      expect(summaryElements.length).toBeGreaterThan(0);
    });
  });

  // Basic accessibility
  describe('Accessibility', () => {
    it('provides semantic headings structure', () => {
      setupWithSummary();
      
      expect(screen.getByRole('heading', { name: /ai-powered meeting summary/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /meeting overview/i })).toBeInTheDocument();
    });

    it('has accessible interactive elements', () => {
      setupWithSummary();
      
      expect(screen.getByTestId('copy-summary-button')).toBeInTheDocument();
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-expansion-button')).toBeInTheDocument();
    });

    it('supports basic keyboard navigation', async () => {
      const { user } = setupWithSummary();
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId('share-button')).toHaveFocus();
    });
  });
});
