/**
 * SummaryStore Test Suite - S5.4 Test Framework Modernization
 * Comprehensive testing for AI-powered meeting summary generation and management
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MeetingSummary, SpeakerMapping, ActionItem } from '../../types';

// Mock crypto.randomUUID for consistent test results
const mockUUID = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockUUID
  }
});

// Mock the API service factory using simple mocking to avoid issues
const mockGenerateSummary = vi.fn();

vi.mock('../../services/apiServiceFactory', () => ({
  createApiService: () => ({
    generateMeetingSummary: mockGenerateSummary
  })
}));

// Import after mocking to ensure the mock is applied
const { useSummaryStore } = await import('../../stores/summaryStore');

// Sample test data
const sampleSpeakerMappings: SpeakerMapping[] = [
  {
    speakerId: 'SPEAKER_01',
    name: 'John Smith',
    role: 'Product Manager',
    email: 'john@company.com',
    source: 'AutoDetected',
    transcriptionId: 'test-transcript-123'
  },
  {
    speakerId: 'SPEAKER_02', 
    name: 'Sarah Johnson',
    role: 'Developer',
    email: 'sarah@company.com',
    source: 'AutoDetected',
    transcriptionId: 'test-transcript-123'
  }
];

const sampleMeetingSummary: MeetingSummary = {
  summaryId: 'summary-123',
  transcriptionId: 'test-123',
  meetingOverview: 'This was a productive meeting about project planning.',
  actionItemsByRole: [
    {
      speakerId: 'SPEAKER_01',
      speakerName: 'John Smith',
      speakerRole: 'Product Manager',
      actionItems: [
        {
          description: 'Update project timeline',
          confidence: 0.95,
          isExplicitAssignment: true
        },
        {
          description: 'Schedule follow-up meeting',
          confidence: 0.87,
          isExplicitAssignment: false
        }
      ]
    }
  ],
  unassignedActionItems: [
    {
      description: 'Review budget allocation',
      confidence: 0.72,
      reason: 'No explicit assignment detected'
    }
  ],
  metadata: {
    participants: ['John Smith', 'Sarah Johnson'],
    duration: '30 minutes',
    speakerCount: 2
  },
  generation: {
    generatedAt: new Date().toISOString(),
    processingTimeMs: 1500,
    tokenCount: 850,
    isEditable: true
  }
};

const sampleTranscriptText = "This is a sample meeting transcript with important discussions and action items.";

describe('SummaryStore - AI-Powered Meeting Summary Generation', () => {
  beforeEach(async () => {
    // Reset mocks first
    vi.clearAllMocks();
    mockUUID.mockReturnValue('test-uuid-123');
    
    // Clear Zustand store persistence to ensure clean state
    localStorage.clear();
    
    // Reset all stores to initial state using a fresh instance
    try {
      const store = useSummaryStore.getState();
      store.clearSummary();
      store.clearError();
      store.clearActionItems();
    } catch (error) {
      // If store is corrupted, we'll rely on fresh render hooks
      console.warn('Store reset failed, relying on fresh render hooks');
    }
  });

  describe('Initial State Management', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useSummaryStore());
      
      expect(result.current.summary).toBeNull();
      expect(result.current.actionItems).toEqual([]);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastGeneratedAt).toBeNull();
    });

    it('provides all required store actions', () => {
      const { result } = renderHook(() => useSummaryStore());
      
      expect(typeof result.current.generateSummary).toBe('function');
      expect(typeof result.current.clearSummary).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.addActionItem).toBe('function');
      expect(typeof result.current.updateActionItem).toBe('function');
      expect(typeof result.current.deleteActionItem).toBe('function');
      expect(typeof result.current.reorderActionItems).toBe('function');
      expect(typeof result.current.clearActionItems).toBe('function');
      expect(typeof result.current.setActionItems).toBe('function');
    });
  });

  describe('AI Summary Generation - S3.4 Core Feature', () => {
    it('generates summary successfully with demo mode', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.summary).toEqual(sampleMeetingSummary);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastGeneratedAt).toBeTruthy();
    });

    it('generates summary successfully with live mode', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'production');
      });

      expect(result.current.summary).toEqual(sampleMeetingSummary);
      expect(result.current.isGenerating).toBe(false);
      expect(mockGenerateSummary).toHaveBeenCalledWith({
        Transcript: sampleTranscriptText,
        SpeakerMappings: sampleSpeakerMappings
      });
    });

    it('sets loading state during summary generation', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockGenerateSummary.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useSummaryStore());

      // Start generation (don't await)
      act(() => {
        result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve the promise
      act(() => {
        resolvePromise!({ success: true, data: sampleMeetingSummary });
      });

      await act(async () => {
        await pendingPromise;
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('handles API error gracefully', async () => {
      const errorMessage = 'API service unavailable';
      mockGenerateSummary.mockResolvedValue({
        success: false,
        message: errorMessage
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('handles network exception gracefully', async () => {
      const networkError = new Error('Network connection failed');
      mockGenerateSummary.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Network connection failed');
    });

    it('defaults to demo mode when mode is not provided', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings);
      });

      expect(result.current.summary).toEqual(sampleMeetingSummary);
      expect(mockGenerateSummary).toHaveBeenCalled();
    });
  });

  describe('Action Items Management - S3.4 Unified System', () => {
    it('converts AI-generated action items to unified format', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.actionItems).toHaveLength(3); // 2 assigned + 1 unassigned
      
      // Check assigned action items
      const assignedItems = result.current.actionItems.filter(item => item.assignedTo !== 'Unassigned');
      expect(assignedItems).toHaveLength(2);
      expect(assignedItems[0]).toMatchObject({
        id: 'test-uuid-123',
        description: 'Update project timeline',
        assignedTo: 'John Smith',
        confidence: 0.95,
        isExplicitAssignment: true
      });

      // Check unassigned action items
      const unassignedItems = result.current.actionItems.filter(item => item.assignedTo === 'Unassigned');
      expect(unassignedItems).toHaveLength(1);
      expect(unassignedItems[0]).toMatchObject({
        description: 'Review budget allocation',
        assignedTo: 'Unassigned',
        confidence: 0.72,
        isExplicitAssignment: false
      });
    });

    it('adds new action item successfully', () => {
      const { result } = renderHook(() => useSummaryStore());

      const newActionItem = {
        description: 'Review presentation slides',
        assignedTo: 'Sarah Johnson',
        confidence: 1.0,
        isExplicitAssignment: true,
        createdAt: new Date().toISOString()
      };

      act(() => {
        result.current.addActionItem(newActionItem);
      });

      expect(result.current.actionItems).toHaveLength(1);
      expect(result.current.actionItems[0]).toMatchObject({
        ...newActionItem,
        id: 'test-uuid-123'
      });
    });

    it('updates existing action item successfully', () => {
      const { result } = renderHook(() => useSummaryStore());

      // First add an item
      act(() => {
        result.current.addActionItem({
          description: 'Original task',
          assignedTo: 'John Smith',
          confidence: 0.8,
          isExplicitAssignment: true,
          createdAt: new Date().toISOString()
        });
      });

      // Then update it
      act(() => {
        result.current.updateActionItem('test-uuid-123', {
          description: 'Updated task description',
          assignedTo: 'Sarah Johnson'
        });
      });

      expect(result.current.actionItems[0]).toMatchObject({
        id: 'test-uuid-123',
        description: 'Updated task description',
        assignedTo: 'Sarah Johnson',
        confidence: 0.8
      });
    });

    it('deletes action item successfully', () => {
      const { result } = renderHook(() => useSummaryStore());

      // Add two items
      mockUUID.mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');
      
      act(() => {
        result.current.addActionItem({
          description: 'Task 1',
          assignedTo: 'John',
          confidence: 0.9,
          isExplicitAssignment: true,
          createdAt: new Date().toISOString()
        });
        result.current.addActionItem({
          description: 'Task 2', 
          assignedTo: 'Sarah',
          confidence: 0.8,
          isExplicitAssignment: false,
          createdAt: new Date().toISOString()
        });
      });

      expect(result.current.actionItems).toHaveLength(2);

      // Delete first item
      act(() => {
        result.current.deleteActionItem('uuid-1');
      });

      expect(result.current.actionItems).toHaveLength(1);
      expect(result.current.actionItems[0].id).toBe('uuid-2');
    });

    it('reorders action items successfully', () => {
      const { result } = renderHook(() => useSummaryStore());

      const item1: ActionItem = {
        id: 'item-1',
        description: 'First task',
        assignedTo: 'John',
        confidence: 0.9,
        isExplicitAssignment: true,
        createdAt: new Date().toISOString()
      };

      const item2: ActionItem = {
        id: 'item-2', 
        description: 'Second task',
        assignedTo: 'Sarah',
        confidence: 0.8,
        isExplicitAssignment: false,
        createdAt: new Date().toISOString()
      };

      // Set initial order
      act(() => {
        result.current.setActionItems([item1, item2]);
      });

      expect(result.current.actionItems[0].id).toBe('item-1');

      // Reorder items
      act(() => {
        result.current.reorderActionItems([item2, item1]);
      });

      expect(result.current.actionItems[0].id).toBe('item-2');
      expect(result.current.actionItems[1].id).toBe('item-1');
    });

    it('clears all action items successfully', () => {
      const { result } = renderHook(() => useSummaryStore());

      // Add some items first
      act(() => {
        result.current.addActionItem({
          description: 'Task to clear',
          assignedTo: 'John',
          confidence: 0.9,
          isExplicitAssignment: true,
          createdAt: new Date().toISOString()
        });
      });

      expect(result.current.actionItems).toHaveLength(1);

      // Clear all items
      act(() => {
        result.current.clearActionItems();
      });

      expect(result.current.actionItems).toHaveLength(0);
    });
  });

  describe('State Management Operations', () => {
    it('clears summary data successfully', async () => {
      const { result } = renderHook(() => useSummaryStore());

      // First generate some data
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      // Verify data exists
      expect(result.current.summary).not.toBeNull();

      // Clear summary
      act(() => {
        result.current.clearSummary();
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.lastGeneratedAt).toBeNull();
    });

    it('clears error state successfully', async () => {
      const { result } = renderHook(() => useSummaryStore());

      // Set error state
      mockGenerateSummary.mockResolvedValue({
        success: false,
        message: 'Test error'
      });

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Persistence - Session Management', () => {
    it('persists summary data and action items', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      // Create a new store instance to simulate persistence
      const { result: newResult } = renderHook(() => useSummaryStore());

      expect(newResult.current.summary).toEqual(sampleMeetingSummary);
      expect(newResult.current.actionItems).toHaveLength(3);
      expect(newResult.current.lastGeneratedAt).toBeTruthy();
      
      // Loading states should not be persisted
      expect(newResult.current.isGenerating).toBe(false);
      expect(newResult.current.error).toBeNull();
    });
  });

  describe('Speaker Mapping Integration', () => {
    it('cleans speaker mappings before API call', async () => {
      const speakerMappingsWithEmptyEmail: SpeakerMapping[] = [
        {
          speakerId: 'SPEAKER_01',
          name: 'John Smith',
          role: 'Product Manager',
          email: '', // Empty email should be cleaned
          source: undefined, // Missing source should be set
          transcriptionId: 'test-transcript-123'
        }
      ];

      mockGenerateSummary.mockResolvedValue({
        success: true,
        data: sampleMeetingSummary
      });

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, speakerMappingsWithEmptyEmail, 'demo');
      });

      expect(mockGenerateSummary).toHaveBeenCalledWith({
        Transcript: sampleTranscriptText,
        SpeakerMappings: [{
          speakerId: 'SPEAKER_01',
          name: 'John Smith', 
          role: 'Product Manager',
          email: undefined, // Cleaned empty email
          source: 'AutoDetected', // Default source added
          transcriptionId: 'test-transcript-123' // Includes transcription ID
        }]
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('handles undefined error gracefully', async () => {
      mockGenerateSummary.mockRejectedValue(undefined);

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.error).toBe('An unexpected error occurred while generating the summary');
    });

    it('handles non-Error objects gracefully', async () => {
      mockGenerateSummary.mockRejectedValue('String error');

      const { result } = renderHook(() => useSummaryStore());

      await act(async () => {
        await result.current.generateSummary(sampleTranscriptText, sampleSpeakerMappings, 'demo');
      });

      expect(result.current.error).toBe('An unexpected error occurred while generating the summary');
    });
  });
});
