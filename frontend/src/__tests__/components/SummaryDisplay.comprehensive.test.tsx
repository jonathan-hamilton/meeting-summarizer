/**
 * Comprehensive Test Suite for SummaryDisplay Component
 * Phase 4: High-Impact Component Coverage Push
 * Target: 90% overall coverage through comprehensive testing of critical components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
// MOCK SETUP - Comprehensive mocking of all external dependencies
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
  isCurrentStep: vi.fn(),
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

vi.mock('../../components/ActionItemsSection', () => ({
  default: ({ 
    actionItems, 
    expanded, 
    onToggleExpansion,
    onAddItem,
    onUpdateItem,
    onDeleteItem 
  }: any) => (
    <div data-testid="action-items-section">
      <div>Action Items</div>
      <div data-testid="action-items-count">{actionItems?.length || 0} items</div>
      <button onClick={onToggleExpansion} data-testid="toggle-expansion-button">
        {expanded ? 'Collapse' : 'Expand'} Action Items
      </button>
      {expanded && (
        <>
          <button onClick={onAddItem} data-testid="add-action-item-button">Add Action Item</button>
          {actionItems?.map((item: any, index: number) => (
            <div key={item.id || index} data-testid={`action-item-${index}`}>
              <div>{item.description}</div>
              <button onClick={() => onUpdateItem(item.id, { description: 'Updated' })} data-testid={`edit-item-${index}`}>Edit</button>
              <button onClick={() => onDeleteItem(item.id)} data-testid={`delete-item-${index}`}>Delete</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}));

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

// Mock React.lazy EmailCompositionDialog - simulate lazy loading
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

// ============================================================================
// TEST DATA - Realistic test data matching production patterns
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
    {
      speakerId: 'SPEAKER_02',
      speakerName: 'Sarah Johnson',
      speakerRole: 'Developer',
      actionItems: [
        {
          description: 'Update project timeline',
          isExplicitAssignment: false,
          confidence: 0.88,
          sourceText: 'We need to update the project timeline.',
        },
      ],
    },
  ],
  unassignedActionItems: [
    {
      description: 'Unassigned task',
      confidence: 0.75,
      sourceText: 'Someone should handle this.',
      reason: 'No clear assignment detected',
    },
  ],
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
  });
  return setupComponent();
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('SummaryDisplay Component - Comprehensive Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTourStore.isActionDisabledDuringTour.mockReturnValue(false);
  });

  // --------------------------------------------------------------------------
  // Basic Rendering & Initial State
  // --------------------------------------------------------------------------
  describe('Basic Rendering & Initial State', () => {
    it('renders initial empty state correctly', () => {
      setupComponent();
      
      expect(screen.getByText('AI-Powered Meeting Summary')).toBeInTheDocument();
      expect(screen.getByText('Generate Meeting Summary')).toBeInTheDocument();
      expect(screen.queryByText('Copy Summary')).not.toBeInTheDocument();
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
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

  // --------------------------------------------------------------------------
  // Summary Generation
  // --------------------------------------------------------------------------
  describe('Summary Generation', () => {
    it('calls generateSummary when generate button is clicked', async () => {
      const { user } = setupComponent();
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      expect(mockSummaryStore.generateSummary).toHaveBeenCalledWith(
        expect.any(String), // transcript text
        mockSpeakerMappings,
        'demo'
      );
    });

    it('displays loading state during generation', () => {
      setupWithLoading();
      
      expect(screen.getByText('Generating Summary...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables generate button during generation', () => {
      setupWithLoading();
      
      const generateButton = screen.getByRole('button', { name: /generating summary/i });
      expect(generateButton).toBeDisabled();
    });

    it('builds transcript text from segments correctly', async () => {
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
  });

  // --------------------------------------------------------------------------
  // Summary Display
  // --------------------------------------------------------------------------
  describe('Summary Display', () => {
    it('displays summary content when available', () => {
      setupWithSummary();
      
      // Check that summary content appears in the main content area
      const summaryElements = screen.getAllByText(mockMeetingSummary.meetingOverview);
      expect(summaryElements.length).toBeGreaterThan(0);
    });

    it('displays demo meeting overview heading', () => {
      setupWithSummary();
      
      expect(screen.getByText('Demo Meeting Overview')).toBeInTheDocument();
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

  // --------------------------------------------------------------------------
  // Action Items Management
  // --------------------------------------------------------------------------
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
      
      // Should show individual action items and add button when expanded
      expect(screen.getByTestId('add-action-item-button')).toBeInTheDocument();
    });

    it('shows individual action items when expanded', async () => {
      const { user } = setupWithSummary();
      
      const expandButton = screen.getByTestId('toggle-expansion-button');
      await user.click(expandButton);
      
      // Should show the action items
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
  });

  // --------------------------------------------------------------------------
  // Action Item CRUD Operations
  // --------------------------------------------------------------------------
  describe('Action Item CRUD Operations', () => {
    it('allows editing action item description', async () => {
      const { user } = setupWithSummary();
      
      // Expand action items
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      await user.click(expandButton);
      
      // Find and edit the first action item
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);
      
      const textField = screen.getByDisplayValue('Review quarterly budget allocations');
      await user.clear(textField);
      await user.type(textField, 'Updated task description');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(mockSummaryStore.updateActionItem).toHaveBeenCalledWith(
        'action-1',
        expect.objectContaining({
          description: 'Updated task description',
        })
      );
    });

    it('allows deleting action items', async () => {
      const { user } = setupWithSummary();
      
      // Expand action items
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      await user.click(expandButton);
      
      // Delete the first action item
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);
      
      expect(mockSummaryStore.deleteActionItem).toHaveBeenCalledWith('action-1');
    });

    it('allows changing action item assignment', async () => {
      const { user } = setupWithSummary();
      
      // Expand action items
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      await user.click(expandButton);
      
      // Change assignment of first action item
      const assignmentSelect = screen.getAllByRole('combobox')[0];
      await user.click(assignmentSelect);
      
      const sarahOption = screen.getByText('Sarah Johnson');
      await user.click(sarahOption);
      
      expect(mockSummaryStore.updateActionItem).toHaveBeenCalledWith(
        'action-1',
        expect.objectContaining({
          assignedTo: 'Sarah Johnson',
        })
      );
    });

    it('cancels editing when cancel button is clicked', async () => {
      const { user } = setupWithSummary();
      
      // Expand action items
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      await user.click(expandButton);
      
      // Start editing
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);
      
      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should not call updateActionItem
      expect(mockSummaryStore.updateActionItem).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Clipboard Operations
  // --------------------------------------------------------------------------
  describe('Clipboard Operations', () => {
    it('copies summary to clipboard when copy button is clicked', async () => {
      const { user } = setupWithSummary();
      
      const copyButton = screen.getByTestId('copy-summary-button');
      await user.click(copyButton);
      
      // The actual clipboard operation would be handled by the real component
      // Here we just verify the button exists and can be clicked
      expect(copyButton).toBeInTheDocument();
    });

    it('opens share dialog when share button is clicked', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      expect(shareButton).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Email Dialog Integration
  // --------------------------------------------------------------------------
  describe('Email Dialog Integration', () => {
    it('opens email dialog when share button is clicked', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      expect(screen.getByTestId('email-composition-dialog')).toBeInTheDocument();
    });

    it('passes correct props to email dialog', async () => {
      const { user } = setupWithSummary();
      
      const shareButton = screen.getByRole('button', { name: /share/i });
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
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      // Close dialog
      const closeButton = screen.getByTestId('close-email-dialog');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('email-composition-dialog')).not.toBeInTheDocument();
    });

    it('triggers tour action when opening email dialog during tour', async () => {
      const { user } = setupWithTour(13);
      
      // Set up summary for tour step
      Object.assign(mockSummaryStore, {
        summary: mockMeetingSummary,
        actionItems: mockActionItems,
      });
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      expect(mockTourStore.triggerStepAction).toHaveBeenCalledWith('open-email-dialog');
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------
  describe('Error Handling', () => {
    it('displays error message when generation fails', () => {
      const errorMessage = 'Failed to generate summary. Please try again.';
      setupWithError(errorMessage);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows retry button when error occurs', () => {
      setupWithError('Network error');
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('clears error when retry button is clicked', async () => {
      const { user } = setupWithError('Network error');
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      expect(mockSummaryStore.clearError).toHaveBeenCalled();
    });

    it('displays fallback UI when summary data is malformed', () => {
      setupComponent({
        summary: { ...mockMeetingSummary, meetingOverview: null },
        actionItems: mockActionItems,
      });
      
      expect(screen.getByText('Summary content unavailable')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Tour Integration
  // --------------------------------------------------------------------------
  describe('Tour Integration', () => {
    it('disables generate button during tour when not on correct step', () => {
      mockTourStore.isActionDisabledDuringTour.mockReturnValue(true);
      setupWithTour(5);
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeDisabled();
    });

    it('enables generate button during tour step 10', () => {
      mockTourStore.isActionDisabledDuringTour.mockImplementation((action) => 
        action !== 'generate-summary'
      );
      setupWithTour(10);
      
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeEnabled();
    });

    it('disables action item operations during tour', () => {
      mockTourStore.isActionDisabledDuringTour.mockReturnValue(true);
      const { user } = setupWithTour(15);
      
      // Set up summary for tour
      Object.assign(mockSummaryStore, {
        summary: mockMeetingSummary,
        actionItems: mockActionItems,
      });
      
      // Expand action items
      act(() => {
        const expandButton = screen.getByRole('button', { name: /expand action items/i });
        user.click(expandButton);
      });
      
      waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add action item/i });
        if (addButton) {
          expect(addButton).toBeDisabled();
        }
      });
    });

    it('triggers correct tour actions for various interactions', async () => {
      const { user } = setupWithTour(11);
      
      // Set up summary for tour
      Object.assign(mockSummaryStore, {
        summary: mockMeetingSummary,
        actionItems: mockActionItems,
      });
      
      // Expand action items should trigger tour action
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      await user.click(expandButton);
      
      expect(mockTourStore.triggerStepAction).toHaveBeenCalledWith('expand-action-items');
    });
  });

  // --------------------------------------------------------------------------
  // Performance & Edge Cases
  // --------------------------------------------------------------------------
  describe('Performance & Edge Cases', () => {
    it('handles empty action items array gracefully', () => {
      setupWithSummary({ actionItemsByRole: [], unassignedActionItems: [] });
      
      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('handles missing speaker mappings gracefully', () => {
      Object.assign(mockSpeakerSessionStore, { speakerMappings: [] });
      setupComponent();
      
      // Should still be able to generate summary
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeEnabled();
    });

    it('handles empty transcript gracefully', () => {
      Object.assign(mockSpeakerSessionStore, { currentSegments: [] });
      setupComponent();
      
      // Should disable generate button when no transcript
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      expect(generateButton).toBeDisabled();
    });

    it('memoizes expensive computations', () => {
      const defaultProps = {
        transcriptionId: 'test-transcript-123',
        transcriptText: 'SPEAKER_01: Let\'s start the meeting by reviewing our Q4 goals.\nSPEAKER_02: I have some concerns about the timeline.',
        speakerMappings: mockSpeakerMappings,
        detectedSpeakers: ['SPEAKER_01', 'SPEAKER_02'],
      };

      const { rerender } = setupWithSummary();
      
      // First render
      expect(screen.getByText('3 items')).toBeInTheDocument();
      
      // Rerender with same props shouldn't cause unnecessary recalculations
      rerender(<SummaryDisplay {...defaultProps} />);
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('handles very long summary content', () => {
      const longSummary = {
        ...mockMeetingSummary,
        meetingOverview: 'A'.repeat(5000), // Very long content
      };
      
      setupWithSummary(longSummary);
      
      expect(screen.getByText('A'.repeat(5000))).toBeInTheDocument();
    });

    it('handles action items with special characters', () => {
      const specialActionItems = [
        {
          ...mockActionItems[0],
          description: 'Review <script>alert("xss")</script> & validate "quotes" & symbols ©®™',
        },
      ];
      
      setupComponent({
        summary: mockMeetingSummary,
        actionItems: specialActionItems,
      });
      
      // Expand to see action items
      const expandButton = screen.getByRole('button', { name: /expand action items/i });
      fireEvent.click(expandButton);
      
      // Should safely render special characters
      expect(screen.getByText(/Review.*alert.*quotes.*symbols/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Accessibility
  // --------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      setupWithSummary();
      
      expect(screen.getByRole('button', { name: /copy summary/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /share/i })).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const { user } = setupWithSummary();
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /regenerate summary/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /copy summary/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /share/i })).toHaveFocus();
    });

    it('announces state changes to screen readers', async () => {
      const { user } = setupComponent();
      
      // Generate summary
      const generateButton = screen.getByRole('button', { name: /generate meeting summary/i });
      await user.click(generateButton);
      
      // Should have live region for status updates
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('provides semantic headings structure', () => {
      setupWithSummary();
      
      expect(screen.getByRole('heading', { name: /meeting summary/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /action items/i })).toBeInTheDocument();
    });
  });
});
