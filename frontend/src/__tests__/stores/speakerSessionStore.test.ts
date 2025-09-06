/**
 * Comprehensive test suite for SpeakerSessionStore (S3.6)
 * Covers centralized speaker and segment state management with caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SpeakerSegment, SpeakerMapping } from '../../types';
import { useSpeakerSessionStore } from '../../stores/speakerSessionStore';

// Sample test data
const mockSegments: SpeakerSegment[] = [
  {
    speaker: 'SPEAKER_01',
    text: 'Hello everyone, welcome to our meeting.',
    start: 0.0,
    end: 3.5,
  },
  {
    speaker: 'SPEAKER_02',
    text: 'Thank you for having me here today.',
    start: 4.0,
    end: 6.8,
  },
  {
    speaker: 'SPEAKER_01',
    text: 'Let\'s discuss the project roadmap.',
    start: 7.0,
    end: 10.2,
  },
  {
    speaker: 'SPEAKER_03',
    text: 'I have some concerns about the timeline.',
    start: 11.0,
    end: 14.5,
  },
];

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

describe('SpeakerSessionStore - Centralized Speaker and Segment Management (S3.6)', () => {
  beforeEach(() => {
    // Reset the store state
    useSpeakerSessionStore.getState().clearSession();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  describe('Initial State Management', () => {
    it('initializes with correct default state', () => {
      const store = useSpeakerSessionStore.getState();
      
      expect(store.transcriptionId).toBeNull();
      expect(store.originalSegments).toEqual([]);
      expect(store.currentSegments).toEqual([]);
      expect(store.speakerMappings).toEqual([]);
      expect(store._computedCache).toBeNull();
    });

    it('provides all required store actions', () => {
      const store = useSpeakerSessionStore.getState();
      
      expect(typeof store.initializeSession).toBe('function');
      expect(typeof store.reassignSegment).toBe('function');
      expect(typeof store.updateSpeakerMapping).toBe('function');
      expect(typeof store.addSpeakerMapping).toBe('function');
      expect(typeof store.deleteSpeakerMapping).toBe('function');
      expect(typeof store.resetToOriginal).toBe('function');
      expect(typeof store.clearSession).toBe('function');
      expect(typeof store.getActiveSpeakers).toBe('function');
      expect(typeof store.getSpeakerStats).toBe('function');
      expect(typeof store.getFilteredMappings).toBe('function');
      expect(typeof store.getStructurallyInvalidated).toBe('function');
      expect(typeof store.hasUnsavedChanges).toBe('function');
    });
  });

  describe('Session Initialization - S3.6 Core Feature', () => {
    it('initializes session with segments successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.initializeSession('test-transcript-123', mockSegments);
      
      const state = useSpeakerSessionStore.getState();
      expect(state.transcriptionId).toBe('test-transcript-123');
      expect(state.originalSegments).toEqual(mockSegments);
      expect(state.currentSegments).toEqual(mockSegments);
      expect(state.speakerMappings).toEqual([]);
      expect(state._computedCache).toBeNull();
    });

    it('initializes session with segments and mappings successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.initializeSession('test-transcript-123', mockSegments, mockSpeakerMappings);
      
      const state = useSpeakerSessionStore.getState();
      expect(state.transcriptionId).toBe('test-transcript-123');
      expect(state.originalSegments).toEqual(mockSegments);
      expect(state.currentSegments).toEqual(mockSegments);
      expect(state.speakerMappings).toEqual(mockSpeakerMappings);
    });

  });

  describe('Segment Reassignment - S3.6 Core Feature', () => {
    beforeEach(() => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', mockSegments);
    });

    it('reassigns segment to different speaker successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.reassignSegment(0, 'SPEAKER_02');
      
      const state = useSpeakerSessionStore.getState();
      expect(state.currentSegments[0].speaker).toBe('SPEAKER_02');
      expect(state._computedCache).toBeNull(); // Cache invalidated
    });

    it('handles invalid segment index gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const store = useSpeakerSessionStore.getState();
      const originalSegments = [...store.currentSegments];
      
      store.reassignSegment(-1, 'SPEAKER_02');
      store.reassignSegment(999, 'SPEAKER_02');
      
      const state = useSpeakerSessionStore.getState();
      expect(state.currentSegments).toEqual(originalSegments);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid segment index:', -1);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid segment index:', 999);
      consoleSpy.mockRestore();
    });

    it('preserves other segment properties during reassignment', () => {
      const store = useSpeakerSessionStore.getState();
      const originalSegment = store.currentSegments[0];
      
      store.reassignSegment(0, 'SPEAKER_NEW');
      
      const updatedSegment = useSpeakerSessionStore.getState().currentSegments[0];
      expect(updatedSegment.speaker).toBe('SPEAKER_NEW');
      expect(updatedSegment.text).toBe(originalSegment.text);
      expect(updatedSegment.start).toBe(originalSegment.start);
      expect(updatedSegment.end).toBe(originalSegment.end);
    });
  });

  describe('Speaker Mapping Management - S3.6 Speaker Management', () => {
    beforeEach(() => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', mockSegments, mockSpeakerMappings);
    });

    it('updates existing speaker mapping successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.updateSpeakerMapping('SPEAKER_01', { 
        name: 'John Updated', 
        role: 'Senior PM' 
      });
      
      const state = useSpeakerSessionStore.getState();
      const updatedMapping = state.speakerMappings.find(m => m.speakerId === 'SPEAKER_01');
      expect(updatedMapping?.name).toBe('John Updated');
      expect(updatedMapping?.role).toBe('Senior PM');
      expect(updatedMapping?.email).toBe('john@company.com'); // Preserved
      expect(state._computedCache).toBeNull(); // Cache invalidated
    });

    it('adds new speaker mapping successfully', () => {
      const store = useSpeakerSessionStore.getState();
      const newMapping: SpeakerMapping = {
        speakerId: 'SPEAKER_03',
        name: 'Mike Wilson',
        role: 'Designer',
        email: 'mike@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      };
      
      store.addSpeakerMapping(newMapping);
      
      const state = useSpeakerSessionStore.getState();
      expect(state.speakerMappings).toHaveLength(3);
      expect(state.speakerMappings).toContainEqual(newMapping);
      expect(state._computedCache).toBeNull(); // Cache invalidated
    });

    it('updates existing mapping when adding duplicate speaker ID', () => {
      const store = useSpeakerSessionStore.getState();
      const updatedMapping: SpeakerMapping = {
        speakerId: 'SPEAKER_01',
        name: 'John Updated Again',
        role: 'VP Product',
        email: 'john.updated@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      };
      
      store.addSpeakerMapping(updatedMapping);
      
      const state = useSpeakerSessionStore.getState();
      expect(state.speakerMappings).toHaveLength(2); // No new mapping added
      const mapping = state.speakerMappings.find(m => m.speakerId === 'SPEAKER_01');
      expect(mapping?.name).toBe('John Updated Again');
      expect(mapping?.role).toBe('VP Product');
      expect(mapping?.email).toBe('john.updated@company.com');
    });

    it('deletes speaker mapping and reassigns segments successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.deleteSpeakerMapping('SPEAKER_01');
      
      const state = useSpeakerSessionStore.getState();
      expect(state.speakerMappings).toHaveLength(1);
      expect(state.speakerMappings.find(m => m.speakerId === 'SPEAKER_01')).toBeUndefined();
      
      // Check that segments previously assigned to SPEAKER_01 are now Unassigned
      const speaker01Segments = state.currentSegments.filter(s => s.speaker === 'SPEAKER_01');
      expect(speaker01Segments).toHaveLength(0);
      
      const unassignedSegments = state.currentSegments.filter(s => s.speaker === 'Unassigned');
      expect(unassignedSegments).toHaveLength(2); // Two segments were SPEAKER_01
    });
  });

  describe('Session Management Operations', () => {
    beforeEach(() => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', mockSegments, mockSpeakerMappings);
      // Make some changes
      store.reassignSegment(0, 'SPEAKER_NEW');
      store.updateSpeakerMapping('SPEAKER_01', { name: 'John Updated' });
    });

    it('resets to original state successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.resetToOriginal();
      
      const state = useSpeakerSessionStore.getState();
      expect(state.currentSegments).toEqual(mockSegments); // Reset to original
      expect(state.speakerMappings).toEqual([]); // Cleared
      expect(state._computedCache).toBeNull(); // Cache invalidated
    });

    it('clears entire session successfully', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.clearSession();
      
      const state = useSpeakerSessionStore.getState();
      expect(state.transcriptionId).toBeNull();
      expect(state.originalSegments).toEqual([]);
      expect(state.currentSegments).toEqual([]);
      expect(state.speakerMappings).toEqual([]);
      expect(state._computedCache).toBeNull();
    });
  });

  describe('Computed Values and Caching - S3.6 Performance Optimization', () => {
    beforeEach(() => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', mockSegments, mockSpeakerMappings);
    });

    it('computes active speakers correctly', () => {
      const store = useSpeakerSessionStore.getState();
      
      const activeSpeakers = store.getActiveSpeakers();
      
      expect(activeSpeakers).toEqual(['SPEAKER_01', 'SPEAKER_02', 'SPEAKER_03']);
      expect(useSpeakerSessionStore.getState()._computedCache).not.toBeNull(); // Cache created
    });

    it('excludes Unassigned speakers from active count', () => {
      const store = useSpeakerSessionStore.getState();
      store.reassignSegment(0, 'Unassigned'); // First SPEAKER_01 segment
      store.reassignSegment(2, 'Unassigned'); // Second SPEAKER_01 segment
      
      const activeSpeakers = store.getActiveSpeakers();
      
      expect(activeSpeakers).toEqual(['SPEAKER_02', 'SPEAKER_03']); // Only these have segments
    });

    it('computes speaker stats correctly with mapped speakers', () => {
      const store = useSpeakerSessionStore.getState();
      
      const stats = store.getSpeakerStats();
      
      expect(stats.totalCount).toBe(3);
      expect(stats.mappedCount).toBe(2); // SPEAKER_01 and SPEAKER_02 have names
      expect(stats.isFullyMapped).toBe(false); // SPEAKER_03 has no mapping
    });

    it('computes speaker stats correctly when fully mapped', () => {
      const store = useSpeakerSessionStore.getState();
      store.addSpeakerMapping({
        speakerId: 'SPEAKER_03',
        name: 'Mike Wilson',
        role: 'Designer',
        email: 'mike@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      });
      
      const stats = store.getSpeakerStats();
      
      expect(stats.totalCount).toBe(3);
      expect(stats.mappedCount).toBe(3);
      expect(stats.isFullyMapped).toBe(true);
    });

    it('ignores empty or same-as-ID names in mapping count', () => {
      const store = useSpeakerSessionStore.getState();
      store.addSpeakerMapping({
        speakerId: 'SPEAKER_03',
        name: '', // Empty name
        role: 'Designer',
        email: 'mike@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      });
      
      const stats = store.getSpeakerStats();
      
      expect(stats.mappedCount).toBe(2); // Still only 2 properly mapped
      expect(stats.isFullyMapped).toBe(false);
    });

    it('computes filtered mappings correctly', () => {
      const store = useSpeakerSessionStore.getState();
      // Add a mapping for non-existent speaker
      store.addSpeakerMapping({
        speakerId: 'SPEAKER_99',
        name: 'Ghost Speaker',
        role: 'Ghost',
        email: 'ghost@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      });
      
      const filteredMappings = store.getFilteredMappings();
      
      expect(filteredMappings).toHaveLength(2);
      expect(filteredMappings.find(m => m.speakerId === 'SPEAKER_99')).toBeUndefined();
      expect(filteredMappings.every(m => ['SPEAKER_01', 'SPEAKER_02'].includes(m.speakerId))).toBe(true);
    });

    it('detects structural invalidation correctly', () => {
      const store = useSpeakerSessionStore.getState();
      
      expect(store.getStructurallyInvalidated()).toBe(false);
      
      store.reassignSegment(0, 'SPEAKER_NEW');
      
      expect(store.getStructurallyInvalidated()).toBe(true);
    });

    it('detects unsaved changes from segment reassignments', () => {
      const store = useSpeakerSessionStore.getState();
      
      expect(store.hasUnsavedChanges()).toBe(true); // Has mappings
      
      store.clearSession();
      store.initializeSession('test-transcript-123', mockSegments); // No mappings
      
      expect(store.hasUnsavedChanges()).toBe(false);
      
      store.reassignSegment(0, 'SPEAKER_NEW');
      
      expect(store.hasUnsavedChanges()).toBe(true);
    });

    it('detects unsaved changes from speaker mappings', () => {
      const store = useSpeakerSessionStore.getState();
      store.clearSession();
      store.initializeSession('test-transcript-123', mockSegments); // No mappings
      
      expect(store.hasUnsavedChanges()).toBe(false);
      
      store.addSpeakerMapping({
        speakerId: 'SPEAKER_01',
        name: 'John Smith',
        role: 'PM',
        email: 'john@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      });
      
      expect(store.hasUnsavedChanges()).toBe(true);
    });

    it('uses cached values on subsequent calls', () => {
      const store = useSpeakerSessionStore.getState();
      
      // First calls - should compute and cache
      const activeSpeakers1 = store.getActiveSpeakers();
      const cache1 = useSpeakerSessionStore.getState()._computedCache;
      
      // Second calls - should use cache
      const activeSpeakers2 = store.getActiveSpeakers();
      const stats2 = store.getSpeakerStats();
      const cache2 = useSpeakerSessionStore.getState()._computedCache;
      
      expect(activeSpeakers1).toEqual(activeSpeakers2);
      expect(cache1).toBe(cache2); // Same object reference
      expect(stats2).toBe(cache2?.speakerStats); // Using cached value
    });

    it('invalidates cache on state changes', () => {
      const store = useSpeakerSessionStore.getState();
      
      store.getActiveSpeakers(); // Create cache
      const cache1 = useSpeakerSessionStore.getState()._computedCache;
      expect(cache1).not.toBeNull();
      
      store.reassignSegment(0, 'SPEAKER_NEW'); // Should invalidate cache
      const cache2 = useSpeakerSessionStore.getState()._computedCache;
      expect(cache2).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty segments gracefully', () => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', []);
      
      const activeSpeakers = store.getActiveSpeakers();
      const stats = store.getSpeakerStats();
      
      expect(activeSpeakers).toEqual([]);
      expect(stats.totalCount).toBe(0);
      expect(stats.mappedCount).toBe(0);
      expect(stats.isFullyMapped).toBe(false);
    });

    it('handles segments with only Unassigned speakers', () => {
      const unassignedSegments: SpeakerSegment[] = [
        {
          speaker: 'Unassigned',
          text: 'Some text',
          start: 0.0,
          end: 3.0,
        },
      ];
      
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', unassignedSegments);
      
      const activeSpeakers = store.getActiveSpeakers();
      const stats = store.getSpeakerStats();
      
      expect(activeSpeakers).toEqual([]);
      expect(stats.totalCount).toBe(0);
      expect(stats.isFullyMapped).toBe(false);
    });

    it('handles mappings for non-existent speakers', () => {
      const store = useSpeakerSessionStore.getState();
      store.initializeSession('test-transcript-123', mockSegments);
      
      store.addSpeakerMapping({
        speakerId: 'NONEXISTENT',
        name: 'Ghost Speaker',
        role: 'Ghost',
        email: 'ghost@company.com',
        source: 'ManuallyAdded',
        transcriptionId: 'test-transcript-123',
      });
      
      const filteredMappings = store.getFilteredMappings();
      
      expect(filteredMappings.find(m => m.speakerId === 'NONEXISTENT')).toBeUndefined();
    });
  });
});
