import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSpeakerMappingStore } from '../../stores/speakerMappingStore';
import type { SpeakerMapping } from '../../types';

// Mock console.log to test debug output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('speakerMappingStore - Foundation Test Coverage (S3.0)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSpeakerMappingStore.getState().reset();
    mockConsoleLog.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSpeakerMappingStore.getState();
      
      expect(state.mappings).toEqual([]);
      expect(state.originalMappings).toEqual([]);
      expect(state.detectedSpeakers).toEqual([]);
      expect(state.existingMappings).toEqual([]);
      expect(state.transcriptionId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.success).toBe(false);
      expect(state.editingMappings.size).toBe(0);
      expect(state.originalValues.size).toBe(0);
      expect(state.validationErrors.size).toBe(0);
      expect(state.deleteConfirmation.open).toBe(false);
      expect(state.hasChanges).toBe(false);
      expect(state.hasValidationErrors).toBe(false);
      expect(state.hasActiveEdits).toBe(false);
      expect(state.nextSpeakerId).toBe(1);
    });
  });

  describe('initializeMappings', () => {
    it('should initialize with detected speakers only', () => {
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      const existingMappings: SpeakerMapping[] = [];
      const transcriptionId = 'test-123';
      
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.detectedSpeakers).toEqual(detectedSpeakers);
      expect(state.transcriptionId).toBe(transcriptionId);
      expect(state.mappings).toHaveLength(2);
      expect(state.mappings[0]).toEqual({
        speakerId: 'Speaker 1',
        name: '',
        role: '',
        source: 'AutoDetected'
      });
      expect(state.nextSpeakerId).toBe(3); // Max Speaker num (2) + 1
    });

    it('should initialize with existing mappings', () => {
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 1',
          name: 'John Doe',
          role: 'Manager',
          transcriptionId: 'test-123',
          source: 'AutoDetected'
        }
      ];
      const transcriptionId = 'test-123';
      
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings[0]).toEqual({
        speakerId: 'Speaker 1',
        name: 'John Doe',
        role: 'Manager',
        source: 'AutoDetected'
      });
      expect(state.mappings[1]).toEqual({
        speakerId: 'Speaker 2',
        name: '',
        role: '',
        source: 'AutoDetected'
      });
    });

    it('should include manually added speakers from existing mappings', () => {
      const detectedSpeakers = ['Speaker 1'];
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 1',
          name: 'John Doe',
          role: 'Manager',
          transcriptionId: 'test-123',
          source: 'AutoDetected'
        },
        {
          speakerId: 'Speaker 3',
          name: 'Manual Speaker',
          role: 'Consultant',
          transcriptionId: 'test-123',
          source: 'ManuallyAdded'
        }
      ];
      const transcriptionId = 'test-123';
      
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toHaveLength(2);
      expect(state.mappings.find(m => m.speakerId === 'Speaker 3')).toEqual({
        speakerId: 'Speaker 3',
        name: 'Manual Speaker',
        role: 'Consultant',
        source: 'ManuallyAdded'
      });
      expect(state.nextSpeakerId).toBe(4); // Max Speaker num (3) + 1
    });

    it('should calculate correct nextSpeakerId', () => {
      const detectedSpeakers = ['Speaker 5', 'Speaker 10', 'Custom Name'];
      const existingMappings: SpeakerMapping[] = [];
      const transcriptionId = 'test-123';
      
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.nextSpeakerId).toBe(11); // Max of 5, 10 is 10, so next is 11
    });

    it('should set originalMappings as deep copy', () => {
      const detectedSpeakers = ['Speaker 1'];
      const existingMappings: SpeakerMapping[] = [];
      const transcriptionId = 'test-123';
      
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.originalMappings).toEqual(state.mappings);
      expect(state.originalMappings).not.toBe(state.mappings); // Should be different objects
    });
  });

  describe('updateMapping', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1', 'Speaker 2'],
        [],
        'test-123'
      );
    });

    it('should update speaker name', () => {
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      
      const state = useSpeakerMappingStore.getState();
      const updatedMapping = state.mappings.find(m => m.speakerId === 'Speaker 1');
      expect(updatedMapping?.name).toBe('John Doe');
      expect(state.hasChanges).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should update speaker role', () => {
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'Manager');
      
      const state = useSpeakerMappingStore.getState();
      const updatedMapping = state.mappings.find(m => m.speakerId === 'Speaker 1');
      expect(updatedMapping?.role).toBe('Manager');
      // hasChanges is false because role-only changes without names don't count as changes
      // (the business logic requires names to be filled for changes to be meaningful)
      expect(state.hasChanges).toBe(false);
    });

    it('should not affect other speakers', () => {
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      
      const state = useSpeakerMappingStore.getState();
      const otherMapping = state.mappings.find(m => m.speakerId === 'Speaker 2');
      expect(otherMapping?.name).toBe('');
      expect(otherMapping?.role).toBe('');
    });

    it('should clear error when updating', () => {
      useSpeakerMappingStore.getState().setError('Previous error');
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      
      const state = useSpeakerMappingStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('addSpeaker', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        [],
        'test-123'
      );
    });

    it('should add new manual speaker', () => {
      useSpeakerMappingStore.getState().addSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toHaveLength(2);
      
      const newSpeaker = state.mappings[1];
      expect(newSpeaker.speakerId).toBe('Speaker 2');
      expect(newSpeaker.name).toBe('');
      expect(newSpeaker.role).toBe('');
      expect(newSpeaker.source).toBe('ManuallyAdded');
      expect(state.nextSpeakerId).toBe(3);
      // hasChanges is false because the new speaker has no name yet (empty name doesn't count as a change)
      expect(state.hasChanges).toBe(false);
    });

    it('should increment nextSpeakerId correctly', () => {
      useSpeakerMappingStore.getState().addSpeaker();
      useSpeakerMappingStore.getState().addSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toHaveLength(3);
      expect(state.mappings[1].speakerId).toBe('Speaker 2');
      expect(state.mappings[2].speakerId).toBe('Speaker 3');
      expect(state.nextSpeakerId).toBe(4);
    });

    it('should clear error when adding speaker', () => {
      useSpeakerMappingStore.getState().setError('Previous error');
      useSpeakerMappingStore.getState().addSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('removeSpeaker', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1', 'Speaker 2'],
        [],
        'test-123'
      );
      // Add names to make them "real" speakers
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      useSpeakerMappingStore.getState().updateMapping('Speaker 2', 'name', 'Jane Smith');
    });

    it('should open delete confirmation dialog', () => {
      useSpeakerMappingStore.getState().removeSpeaker(0);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.deleteConfirmation.open).toBe(true);
      expect(state.deleteConfirmation.speakerIndex).toBe(0);
      expect(state.deleteConfirmation.speakerName).toBe('John Doe');
    });

    it('should use speakerId when name is empty', () => {
      // Reset first speaker to empty name
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', '');
      useSpeakerMappingStore.getState().removeSpeaker(0);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.deleteConfirmation.speakerName).toBe('Speaker 1');
    });

    it('should show error when trying to remove last speaker', () => {
      // Remove Speaker 2 first
      useSpeakerMappingStore.getState().removeSpeaker(1);
      useSpeakerMappingStore.getState().confirmRemoveSpeaker();
      
      // Now try to remove last remaining speaker
      useSpeakerMappingStore.getState().removeSpeaker(0);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.error).toBe('Cannot remove the last remaining speaker. At least one speaker is required.');
      expect(state.deleteConfirmation.open).toBe(false);
    });
  });

  describe('confirmRemoveSpeaker', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1', 'Speaker 2'],
        [],
        'test-123'
      );
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      useSpeakerMappingStore.getState().updateMapping('Speaker 2', 'name', 'Jane Smith');
      useSpeakerMappingStore.getState().removeSpeaker(0); // Open dialog first
    });

    it('should remove speaker and close dialog', () => {
      useSpeakerMappingStore.getState().confirmRemoveSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toHaveLength(1);
      expect(state.mappings[0].name).toBe('Jane Smith');
      expect(state.deleteConfirmation.open).toBe(false);
      expect(state.hasChanges).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('cancelRemoveSpeaker', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1', 'Speaker 2'],
        [],
        'test-123'
      );
      useSpeakerMappingStore.getState().removeSpeaker(0); // Open dialog first
    });

    it('should close dialog without removing speaker', () => {
      useSpeakerMappingStore.getState().cancelRemoveSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toHaveLength(2);
      expect(state.deleteConfirmation.open).toBe(false);
    });
  });

  describe('Edit Mode Operations', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        [],
        'test-123'
      );
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'Manager');
    });

    describe('startEditMode', () => {
      it('should start edit mode for speaker', () => {
        useSpeakerMappingStore.getState().startEditMode('Speaker 1');
        
        const state = useSpeakerMappingStore.getState();
        expect(state.editingMappings.has('Speaker 1')).toBe(true);
        expect(state.hasActiveEdits).toBe(true);
        
        const originalValue = state.originalValues.get('Speaker 1');
        expect(originalValue).toEqual({
          name: 'John Doe',
          role: 'Manager'
        });
      });

      it('should handle non-existent speaker gracefully', () => {
        const initialState = useSpeakerMappingStore.getState();
        useSpeakerMappingStore.getState().startEditMode('Non-existent');
        
        const state = useSpeakerMappingStore.getState();
        expect(state).toEqual(initialState); // State should be unchanged
      });
    });

    describe('saveEdit', () => {
      beforeEach(() => {
        useSpeakerMappingStore.getState().startEditMode('Speaker 1');
        // Simulate some validation errors and then save
        const validationErrors = new Map([
          ['Speaker 1', [{ field: 'name' as const, message: 'Test error' }]]
        ]);
        useSpeakerMappingStore.setState({ validationErrors, hasValidationErrors: true });
      });

      it('should exit edit mode and clear related state', () => {
        useSpeakerMappingStore.getState().saveEdit('Speaker 1');
        
        const state = useSpeakerMappingStore.getState();
        expect(state.editingMappings.has('Speaker 1')).toBe(false);
        expect(state.hasActiveEdits).toBe(false);
        expect(state.originalValues.has('Speaker 1')).toBe(false);
        expect(state.validationErrors.has('Speaker 1')).toBe(false);
        expect(state.hasValidationErrors).toBe(false);
      });
    });

    describe('cancelEdit', () => {
      beforeEach(() => {
        useSpeakerMappingStore.getState().startEditMode('Speaker 1');
        // Make some changes while in edit mode
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'Changed Name');
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'Changed Role');
        // Add validation errors
        const validationErrors = new Map([
          ['Speaker 1', [{ field: 'name' as const, message: 'Test error' }]]
        ]);
        useSpeakerMappingStore.setState({ validationErrors, hasValidationErrors: true });
      });

      it('should revert changes and exit edit mode', () => {
        useSpeakerMappingStore.getState().cancelEdit('Speaker 1');
        
        const state = useSpeakerMappingStore.getState();
        const speaker = state.mappings.find(m => m.speakerId === 'Speaker 1');
        expect(speaker?.name).toBe('John Doe'); // Reverted to original
        expect(speaker?.role).toBe('Manager'); // Reverted to original
        expect(state.editingMappings.has('Speaker 1')).toBe(false);
        expect(state.hasActiveEdits).toBe(false);
        expect(state.originalValues.has('Speaker 1')).toBe(false);
        expect(state.validationErrors.has('Speaker 1')).toBe(false);
        expect(state.hasValidationErrors).toBe(false);
      });

      it('should handle non-existent original value gracefully', () => {
        // Clear original values manually
        useSpeakerMappingStore.setState({ originalValues: new Map() });
        
        const initialState = useSpeakerMappingStore.getState();
        useSpeakerMappingStore.getState().cancelEdit('Speaker 1');
        
        // Should not change mappings if no original value exists
        const state = useSpeakerMappingStore.getState();
        expect(state.mappings).toEqual(initialState.mappings);
      });
    });
  });

  describe('UI State Operations', () => {
    it('should set loading state', () => {
      useSpeakerMappingStore.getState().setLoading(true);
      expect(useSpeakerMappingStore.getState().loading).toBe(true);
      
      useSpeakerMappingStore.getState().setLoading(false);
      expect(useSpeakerMappingStore.getState().loading).toBe(false);
    });

    it('should set error state', () => {
      useSpeakerMappingStore.getState().setError('Test error');
      expect(useSpeakerMappingStore.getState().error).toBe('Test error');
      
      useSpeakerMappingStore.getState().setError(null);
      expect(useSpeakerMappingStore.getState().error).toBeNull();
    });

    it('should set success state', () => {
      useSpeakerMappingStore.getState().setSuccess(true);
      expect(useSpeakerMappingStore.getState().success).toBe(true);
      
      useSpeakerMappingStore.getState().setSuccess(false);
      expect(useSpeakerMappingStore.getState().success).toBe(false);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        [],
        'test-123'
      );
    });

    describe('validateMapping', () => {
      it('should return no errors for valid mapping', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'Manager');
        
        const errors = useSpeakerMappingStore.getState().validateMapping('Speaker 1');
        expect(errors).toEqual([]);
      });

      it('should return no errors for empty fields', () => {
        // Empty fields are allowed in this store
        const errors = useSpeakerMappingStore.getState().validateMapping('Speaker 1');
        expect(errors).toEqual([]);
      });

      it('should return error for name that is too short', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'A');
        
        const errors = useSpeakerMappingStore.getState().validateMapping('Speaker 1');
        expect(errors).toHaveLength(1);
        expect(errors[0]).toEqual({
          field: 'name',
          message: 'Name must be at least 2 characters long'
        });
      });

      it('should return error for role that is too short', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'M');
        
        const errors = useSpeakerMappingStore.getState().validateMapping('Speaker 1');
        expect(errors).toHaveLength(1);
        expect(errors[0]).toEqual({
          field: 'role',
          message: 'Role must be at least 2 characters long'
        });
      });

      it('should return multiple errors for multiple invalid fields', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'A');
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'B');
        
        const errors = useSpeakerMappingStore.getState().validateMapping('Speaker 1');
        expect(errors).toHaveLength(2);
      });

      it('should return empty array for non-existent speaker', () => {
        const errors = useSpeakerMappingStore.getState().validateMapping('Non-existent');
        expect(errors).toEqual([]);
      });
    });

    describe('validateAllMappings', () => {
      beforeEach(() => {
        useSpeakerMappingStore.getState().addSpeaker(); // Add Speaker 2
      });

      it('should return true for all valid mappings', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
        useSpeakerMappingStore.getState().updateMapping('Speaker 2', 'name', 'Jane Smith');
        
        const isValid = useSpeakerMappingStore.getState().validateAllMappings();
        const state = useSpeakerMappingStore.getState();
        
        expect(isValid).toBe(true);
        expect(state.hasValidationErrors).toBe(false);
        expect(state.validationErrors.size).toBe(0);
      });

      it('should return false and set errors for invalid mappings', () => {
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'A'); // Too short
        useSpeakerMappingStore.getState().updateMapping('Speaker 2', 'role', 'B'); // Too short
        
        const isValid = useSpeakerMappingStore.getState().validateAllMappings();
        const state = useSpeakerMappingStore.getState();
        
        expect(isValid).toBe(false);
        expect(state.hasValidationErrors).toBe(true);
        expect(state.validationErrors.size).toBe(2);
        expect(state.validationErrors.has('Speaker 1')).toBe(true);
        expect(state.validationErrors.has('Speaker 2')).toBe(true);
      });

      it('should clear previous validation errors', () => {
        // Set up initial invalid state
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'A');
        useSpeakerMappingStore.getState().validateAllMappings();
        
        // Fix the mapping
        useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
        const isValid = useSpeakerMappingStore.getState().validateAllMappings();
        const state = useSpeakerMappingStore.getState();
        
        expect(isValid).toBe(true);
        expect(state.hasValidationErrors).toBe(false);
        expect(state.validationErrors.size).toBe(0);
      });
    });
  });

  describe('calculateHasChanges', () => {
    beforeEach(() => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 1',
          name: 'Original Name',
          role: 'Original Role',
          transcriptionId: 'test-123',
          source: 'AutoDetected'
        }
      ];
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        existingMappings,
        'test-123'
      );
    });

    it('should return false for no changes', () => {
      // The setup already has existing mappings, so we need to test with a clean slate
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        [],
        'test-123'
      );
      
      const state = useSpeakerMappingStore.getState();
      const hasChanges = state.calculateHasChanges(state.mappings);
      expect(hasChanges).toBe(false);
      expect(state.hasChanges).toBe(false);
    });

    it('should return true when mappings have names (new mappings)', () => {
      useSpeakerMappingStore.getState().addSpeaker();
      useSpeakerMappingStore.getState().updateMapping('Speaker 2', 'name', 'New Speaker');
      
      const state = useSpeakerMappingStore.getState();
      expect(state.hasChanges).toBe(true);
    });

    it('should return true when existing mapping is modified', () => {
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'Modified Name');
      
      const state = useSpeakerMappingStore.getState();
      expect(state.hasChanges).toBe(true);
    });

    it('should return true when speakers are deleted', () => {
      useSpeakerMappingStore.getState().addSpeaker(); // Add Speaker 2
      useSpeakerMappingStore.getState().removeSpeaker(1); // Remove Speaker 2
      useSpeakerMappingStore.getState().confirmRemoveSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.hasChanges).toBe(true);
    });

    it('should handle manually added speakers in existing mappings', () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 3',
          name: 'Manual Speaker',
          role: 'Consultant',
          transcriptionId: 'test-123',
          source: 'ManuallyAdded'
        }
      ];
      
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        existingMappings,
        'test-123'
      );
      
      // Remove the manually added speaker
      const manualSpeakerIndex = useSpeakerMappingStore.getState().mappings.findIndex(m => m.speakerId === 'Speaker 3');
      useSpeakerMappingStore.getState().removeSpeaker(manualSpeakerIndex);
      useSpeakerMappingStore.getState().confirmRemoveSpeaker();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.hasChanges).toBe(true);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      // Set up a complex state
      useSpeakerMappingStore.getState().initializeMappings(
        ['Speaker 1'],
        [],
        'test-123'
      );
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'name', 'John Doe');
      useSpeakerMappingStore.getState().startEditMode('Speaker 1');
      useSpeakerMappingStore.getState().setLoading(true);
      useSpeakerMappingStore.getState().setError('Test error');
    });

    it('should reset all state to initial values', () => {
      useSpeakerMappingStore.getState().reset();
      
      const state = useSpeakerMappingStore.getState();
      expect(state.mappings).toEqual([]);
      expect(state.originalMappings).toEqual([]);
      expect(state.detectedSpeakers).toEqual([]);
      expect(state.existingMappings).toEqual([]);
      expect(state.transcriptionId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.success).toBe(false);
      expect(state.editingMappings.size).toBe(0);
      expect(state.originalValues.size).toBe(0);
      expect(state.validationErrors.size).toBe(0);
      expect(state.deleteConfirmation.open).toBe(false);
      expect(state.hasChanges).toBe(false);
      expect(state.hasValidationErrors).toBe(false);
      expect(state.hasActiveEdits).toBe(false);
      expect(state.nextSpeakerId).toBe(1);
    });
  });

  describe('Store Integration', () => {
    it('should maintain state consistency across complex operations', () => {
      const detectedSpeakers = ['Speaker 1', 'Speaker 2'];
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: 'Speaker 1',
          name: 'Existing Speaker',
          role: 'Manager',
          transcriptionId: 'test-123',
          source: 'AutoDetected'
        }
      ];
      
      // Initialize
      useSpeakerMappingStore.getState().initializeMappings(detectedSpeakers, existingMappings, 'test-123');
      
      // Add a manual speaker
      useSpeakerMappingStore.getState().addSpeaker();
      useSpeakerMappingStore.getState().updateMapping('Speaker 3', 'name', 'Manual Speaker');
      
      // Start edit mode on existing speaker
      useSpeakerMappingStore.getState().startEditMode('Speaker 1');
      useSpeakerMappingStore.getState().updateMapping('Speaker 1', 'role', 'Senior Manager');
      
      // Validate state consistency
      const state = useSpeakerMappingStore.getState();
      
      expect(state.mappings).toHaveLength(3);
      expect(state.hasChanges).toBe(true);
      expect(state.hasActiveEdits).toBe(true);
      expect(state.editingMappings.has('Speaker 1')).toBe(true);
      
      // Save edit
      useSpeakerMappingStore.getState().saveEdit('Speaker 1');
      
      const finalState = useSpeakerMappingStore.getState();
      expect(finalState.hasActiveEdits).toBe(false);
      expect(finalState.editingMappings.has('Speaker 1')).toBe(false);
      expect(finalState.hasChanges).toBe(true); // Still has changes due to modifications
      
      const existingSpeaker = finalState.mappings.find(m => m.speakerId === 'Speaker 1');
      expect(existingSpeaker?.role).toBe('Senior Manager');
      
      const manualSpeaker = finalState.mappings.find(m => m.speakerId === 'Speaker 3');
      expect(manualSpeaker?.source).toBe('ManuallyAdded');
    });

    it('should handle edge cases gracefully', () => {
      // Initialize with empty arrays
      useSpeakerMappingStore.getState().initializeMappings([], [], 'test-123');
      
      // Add speaker to empty list
      useSpeakerMappingStore.getState().addSpeaker();
      
      // Try to remove the only speaker
      useSpeakerMappingStore.getState().removeSpeaker(0);
      
      const state = useSpeakerMappingStore.getState();
      expect(state.error).toBe('Cannot remove the last remaining speaker. At least one speaker is required.');
      expect(state.deleteConfirmation.open).toBe(false);
      expect(state.mappings).toHaveLength(1); // Speaker should still be there
    });
  });
});
