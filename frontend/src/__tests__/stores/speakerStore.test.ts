import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSpeakerStore, validateSpeakerMapping, validateAllMappings } from '../../stores/speakerStore';
import type { SpeakerMapping } from '../../types';

// Mock console.warn to test warning behavior
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('speakerStore - Foundation Test Coverage (S3.0)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSpeakerStore.getState().clearSpeakers();
    mockConsoleWarn.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSpeakerStore.getState();
      
      expect(state.speakerMappings).toEqual([]);
      expect(state.detectedSpeakers).toEqual([]);
      expect(state.transcriptionId).toBeNull();
    });
  });

  describe('initializeSpeakers', () => {
    it('should initialize speakers with detected speakers only', () => {
      const transcriptionId = 'test-123';
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      
      useSpeakerStore.getState().initializeSpeakers(transcriptionId, detectedSpeakers);
      
      const state = useSpeakerStore.getState();
      expect(state.transcriptionId).toBe(transcriptionId);
      expect(state.detectedSpeakers).toEqual(detectedSpeakers);
      expect(state.speakerMappings).toEqual([]);
    });

    it('should initialize speakers with existing mappings', () => {
      const transcriptionId = 'test-123';
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 1',
          name: 'John Doe',
          role: 'Manager',
          transcriptionId,
          source: 'AutoDetected'
        }
      ];
      
      useSpeakerStore.getState().initializeSpeakers(transcriptionId, detectedSpeakers, existingMappings);
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toEqual(existingMappings);
    });
  });

  describe('addSpeaker', () => {
    beforeEach(() => {
      useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1']);
    });

    it('should add a new speaker mapping', () => {
      useSpeakerStore.getState().addSpeaker('Speaker 2', 'Jane Smith', 'Developer');
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toHaveLength(1);
      expect(state.speakerMappings[0]).toEqual({
        speakerId: 'Speaker 2',
        name: 'Jane Smith',
        role: 'Developer',
        source: 'ManuallyAdded',
        transcriptionId: 'test-123'
      });
    });

    it('should add speaker with default empty role when not provided', () => {
      useSpeakerStore.getState().addSpeaker('Speaker 2', 'Jane Smith');
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings[0].role).toBe('');
    });

    it('should warn and not add duplicate speaker', () => {
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe');
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'Duplicate');
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toHaveLength(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith('Speaker Speaker 1 already exists');
    });
  });

  describe('updateSpeaker', () => {
    beforeEach(() => {
      useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1']);
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe', 'Manager');
    });

    it('should update speaker name', () => {
      useSpeakerStore.getState().updateSpeaker('Speaker 1', { name: 'John Smith' });
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings[0].name).toBe('John Smith');
      expect(state.speakerMappings[0].role).toBe('Manager'); // should remain unchanged
    });

    it('should update speaker role', () => {
      useSpeakerStore.getState().updateSpeaker('Speaker 1', { role: 'Senior Manager' });
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings[0].role).toBe('Senior Manager');
      expect(state.speakerMappings[0].name).toBe('John Doe'); // should remain unchanged
    });

    it('should update both name and role', () => {
      useSpeakerStore.getState().updateSpeaker('Speaker 1', { name: 'John Smith', role: 'Director' });
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings[0].name).toBe('John Smith');
      expect(state.speakerMappings[0].role).toBe('Director');
    });

    it('should not affect other speakers when updating one', () => {
      useSpeakerStore.getState().addSpeaker('Speaker 2', 'Jane Doe', 'Developer');
      useSpeakerStore.getState().updateSpeaker('Speaker 1', { name: 'John Updated' });
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toHaveLength(2);
      expect(state.speakerMappings.find(m => m.speakerId === 'Speaker 1')?.name).toBe('John Updated');
      expect(state.speakerMappings.find(m => m.speakerId === 'Speaker 2')?.name).toBe('Jane Doe');
    });
  });

  describe('deleteSpeaker', () => {
    beforeEach(() => {
      useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1', 'Speaker 2']);
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe', 'Manager');
      useSpeakerStore.getState().addSpeaker('Speaker 2', 'Jane Smith', 'Developer');
    });

    it('should delete specified speaker', () => {
      useSpeakerStore.getState().deleteSpeaker('Speaker 1');
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toHaveLength(1);
      expect(state.speakerMappings[0].speakerId).toBe('Speaker 2');
    });

    it('should not affect other speakers when deleting one', () => {
      useSpeakerStore.getState().deleteSpeaker('Speaker 1');
      
      const state = useSpeakerStore.getState();
      const remainingSpeaker = state.speakerMappings[0];
      expect(remainingSpeaker.name).toBe('Jane Smith');
      expect(remainingSpeaker.role).toBe('Developer');
    });

    it('should handle deleting non-existent speaker gracefully', () => {
      const initialCount = useSpeakerStore.getState().speakerMappings.length;
      useSpeakerStore.getState().deleteSpeaker('Non-existent Speaker');
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toHaveLength(initialCount);
    });
  });

  describe('clearSpeakers', () => {
    beforeEach(() => {
      useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1']);
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe', 'Manager');
    });

    it('should clear all state', () => {
      useSpeakerStore.getState().clearSpeakers();
      
      const state = useSpeakerStore.getState();
      expect(state.speakerMappings).toEqual([]);
      expect(state.detectedSpeakers).toEqual([]);
      expect(state.transcriptionId).toBeNull();
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1', 'Speaker 2', 'Speaker 3']);
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe', 'Manager');
      useSpeakerStore.getState().addSpeaker('Speaker 2', '', ''); // Empty name - should not count as mapped
      useSpeakerStore.getState().addSpeaker('Speaker 4', 'Alice Brown', 'Designer'); // Manual speaker
    });

    describe('getMappedCount', () => {
      it('should count only speakers with non-empty names', () => {
        const count = useSpeakerStore.getState().getMappedCount();
        expect(count).toBe(2); // John Doe and Alice Brown
      });

      it('should return 0 when no speakers have names', () => {
        useSpeakerStore.getState().clearSpeakers();
        useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1']);
        useSpeakerStore.getState().addSpeaker('Speaker 1', '', '');
        
        const count = useSpeakerStore.getState().getMappedCount();
        expect(count).toBe(0);
      });

      it('should not count speakers with only whitespace names', () => {
        useSpeakerStore.getState().addSpeaker('Speaker 5', '   ', 'Role');
        
        const count = useSpeakerStore.getState().getMappedCount();
        expect(count).toBe(2); // Still only John Doe and Alice Brown
      });
    });

    describe('getUnmappedSpeakers', () => {
      it('should return speakers not in mappings', () => {
        const unmapped = useSpeakerStore.getState().getUnmappedSpeakers();
        expect(unmapped).toEqual(['Speaker 3']); // Speaker 1 and 2 are mapped, 3 is not
      });

      it('should return all detected speakers when no mappings exist', () => {
        useSpeakerStore.getState().clearSpeakers();
        useSpeakerStore.getState().initializeSpeakers('test-123', ['Speaker 1', 'Speaker 2']);
        
        const unmapped = useSpeakerStore.getState().getUnmappedSpeakers();
        expect(unmapped).toEqual(['Speaker 1', 'Speaker 2']);
      });

      it('should return empty array when all speakers are mapped', () => {
        useSpeakerStore.getState().addSpeaker('Speaker 3', 'Bob Wilson', 'Analyst');
        
        const unmapped = useSpeakerStore.getState().getUnmappedSpeakers();
        expect(unmapped).toEqual([]);
      });
    });

    describe('getSpeakerMapping', () => {
      it('should return correct mapping for existing speaker', () => {
        const mapping = useSpeakerStore.getState().getSpeakerMapping('Speaker 1');
        
        expect(mapping).toBeDefined();
        expect(mapping?.name).toBe('John Doe');
        expect(mapping?.role).toBe('Manager');
      });

      it('should return undefined for non-existent speaker', () => {
        const mapping = useSpeakerStore.getState().getSpeakerMapping('Non-existent');
        expect(mapping).toBeUndefined();
      });
    });

    describe('getAllMappings', () => {
      it('should return all current mappings', () => {
        const mappings = useSpeakerStore.getState().getAllMappings();
        
        expect(mappings).toHaveLength(3);
        expect(mappings.map(m => m.speakerId)).toEqual(['Speaker 1', 'Speaker 2', 'Speaker 4']);
      });

      it('should return empty array when no mappings exist', () => {
        useSpeakerStore.getState().clearSpeakers();
        
        const mappings = useSpeakerStore.getState().getAllMappings();
        expect(mappings).toEqual([]);
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateSpeakerMapping', () => {
      it('should return no errors for valid mapping', () => {
        const mapping = { speakerId: 'Speaker 1', name: 'John Doe', role: 'Manager' };
        const allMappings = [mapping];
        
        const errors = validateSpeakerMapping(mapping, 'Speaker 1', allMappings);
        expect(errors).toEqual([]);
      });

      it('should return error for empty name', () => {
        const mapping = { speakerId: 'Speaker 1', name: '', role: 'Manager' };
        const allMappings = [mapping];
        
        const errors = validateSpeakerMapping(mapping, 'Speaker 1', allMappings);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toEqual({
          field: 'name',
          message: 'Speaker name is required',
          speakerId: 'Speaker 1'
        });
      });

      it('should return error for whitespace-only name', () => {
        const mapping = { speakerId: 'Speaker 1', name: '   ', role: 'Manager' };
        const allMappings = [mapping];
        
        const errors = validateSpeakerMapping(mapping, 'Speaker 1', allMappings);
        expect(errors).toHaveLength(1);
        expect(errors[0].field).toBe('name');
      });

      it('should return error for duplicate name (case insensitive)', () => {
        const mapping1 = { speakerId: 'Speaker 1', name: 'John Doe', role: 'Manager' };
        const mapping2 = { speakerId: 'Speaker 2', name: 'john doe', role: 'Developer' };
        const allMappings = [mapping1, mapping2];
        
        const errors = validateSpeakerMapping(mapping2, 'Speaker 2', allMappings);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toEqual({
          field: 'name',
          message: 'Name "john doe" is already used by another speaker',
          speakerId: 'Speaker 2'
        });
      });

      it('should not return error when validating same speaker against itself', () => {
        const mapping = { speakerId: 'Speaker 1', name: 'John Doe', role: 'Manager' };
        const allMappings = [mapping];
        
        const errors = validateSpeakerMapping(mapping, 'Speaker 1', allMappings);
        expect(errors).toEqual([]);
      });
    });

    describe('validateAllMappings', () => {
      it('should return valid result for all valid mappings', () => {
        const allMappings = [
          { speakerId: 'Speaker 1', name: 'John Doe', role: 'Manager' },
          { speakerId: 'Speaker 2', name: 'Jane Smith', role: 'Developer' }
        ];
        
        const result = validateAllMappings(allMappings);
        expect(result.isValid).toBe(true);
        expect(result.errorsBySpeaker.size).toBe(0);
      });

      it('should return invalid result with error details for invalid mappings', () => {
        const allMappings = [
          { speakerId: 'Speaker 1', name: '', role: 'Manager' },
          { speakerId: 'Speaker 2', name: 'John Doe', role: 'Developer' },
          { speakerId: 'Speaker 3', name: 'John Doe', role: 'Analyst' } // duplicate name
        ];
        
        const result = validateAllMappings(allMappings);
        expect(result.isValid).toBe(false);
        expect(result.errorsBySpeaker.size).toBe(3); // Speaker 1 (empty name), Speaker 2 & 3 (duplicate names)
        
        const speaker1Errors = result.errorsBySpeaker.get('Speaker 1');
        expect(speaker1Errors).toHaveLength(1);
        expect(speaker1Errors?.[0].field).toBe('name');
        expect(speaker1Errors?.[0].message).toBe('Speaker name is required');
      });

      it('should handle empty mappings array', () => {
        const result = validateAllMappings([]);
        expect(result.isValid).toBe(true);
        expect(result.errorsBySpeaker.size).toBe(0);
      });
    });
  });

  describe('Store Integration', () => {
    it('should maintain state consistency across multiple operations', () => {
      const transcriptionId = 'integration-test';
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      
      // Initialize
      useSpeakerStore.getState().initializeSpeakers(transcriptionId, detectedSpeakers);
      
      // Add speakers
      useSpeakerStore.getState().addSpeaker('Speaker 1', 'John Doe', 'Manager');
      useSpeakerStore.getState().addSpeaker('Speaker 2', 'Jane Smith', 'Developer');
      useSpeakerStore.getState().addSpeaker('Speaker 3', 'Manual Speaker', 'Analyst');
      
      // Update a speaker
      useSpeakerStore.getState().updateSpeaker('Speaker 1', { role: 'Senior Manager' });
      
      // Delete a speaker
      useSpeakerStore.getState().deleteSpeaker('Speaker 2');
      
      // Verify final state
      const state = useSpeakerStore.getState();
      expect(state.transcriptionId).toBe(transcriptionId);
      expect(state.detectedSpeakers).toEqual(detectedSpeakers);
      expect(state.speakerMappings).toHaveLength(2);
      
      const johnMapping = state.getSpeakerMapping('Speaker 1');
      expect(johnMapping?.role).toBe('Senior Manager');
      
      const manualMapping = state.getSpeakerMapping('Speaker 3');
      expect(manualMapping?.source).toBe('ManuallyAdded');
      
      expect(state.getMappedCount()).toBe(2);
      expect(state.getUnmappedSpeakers()).toEqual(['Speaker 2']); // Only Speaker 2 is unmapped now
    });
  });
});
