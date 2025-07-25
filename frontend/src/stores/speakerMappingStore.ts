import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SpeakerMapping, SpeakerSource } from '../types';

export interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
  source: SpeakerSource;
}

export interface ValidationError {
  field: 'name' | 'role';
  message: string;
}

interface SpeakerMappingState {
  // Core state
  mappings: MappingFormData[];
  originalMappings: MappingFormData[];
  detectedSpeakers: string[];
  existingMappings: SpeakerMapping[];
  transcriptionId: string | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  success: boolean;
  
  // Edit mode state
  editingMappings: Set<string>;
  originalValues: Map<string, { name: string; role: string }>;
  validationErrors: Map<string, ValidationError[]>;
  
  // Delete confirmation state
  deleteConfirmation: {
    open: boolean;
    speakerIndex: number;
    speakerName: string;
  };
  
  // Computed state
  hasChanges: boolean;
  hasValidationErrors: boolean;
  hasActiveEdits: boolean;
  nextSpeakerId: number;
}

interface SpeakerMappingActions {
  // Initialization
  initializeMappings: (
    detectedSpeakers: string[],
    existingMappings: SpeakerMapping[],
    transcriptionId: string
  ) => void;
  
  // Mapping operations
  updateMapping: (speakerId: string, field: 'name' | 'role', value: string) => void;
  addSpeaker: () => void;
  removeSpeaker: (index: number) => void;
  confirmRemoveSpeaker: () => void;
  cancelRemoveSpeaker: () => void;
  
  // Edit mode operations
  startEditMode: (speakerId: string) => void;
  saveEdit: (speakerId: string) => void;
  cancelEdit: (speakerId: string) => void;
  
  // UI state operations
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  
  // Validation
  validateMapping: (speakerId: string) => ValidationError[];
  validateAllMappings: () => boolean;
  
  // Helper methods
  calculateHasChanges: (currentMappings: MappingFormData[]) => boolean;
  
  // Reset
  reset: () => void;
}

type SpeakerMappingStore = SpeakerMappingState & SpeakerMappingActions;

const initialState: SpeakerMappingState = {
  mappings: [],
  originalMappings: [],
  detectedSpeakers: [],
  existingMappings: [],
  transcriptionId: null,
  loading: false,
  error: null,
  success: false,
  editingMappings: new Set(),
  originalValues: new Map(),
  validationErrors: new Map(),
  deleteConfirmation: {
    open: false,
    speakerIndex: -1,
    speakerName: '',
  },
  hasChanges: false,
  hasValidationErrors: false,
  hasActiveEdits: false,
  nextSpeakerId: 1,
};

export const useSpeakerMappingStore = create<SpeakerMappingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      initializeMappings: (detectedSpeakers, existingMappings, transcriptionId) => {
        console.log('🔄 Store: initializeMappings called', { detectedSpeakers, existingMappings, transcriptionId });
        
        const initialMappings: MappingFormData[] = detectedSpeakers.map((speakerId) => {
          const existing = existingMappings.find((m) => m.speakerId === speakerId);
          return {
            speakerId,
            name: existing?.name || '',
            role: existing?.role || '',
            source: existing?.source || 'AutoDetected',
          };
        });

        // Add manually-added speakers from existing mappings
        const manualSpeakers = existingMappings
          .filter(
            (existing) =>
              existing.source === 'ManuallyAdded' &&
              !detectedSpeakers.includes(existing.speakerId)
          )
          .map((existing) => ({
            speakerId: existing.speakerId,
            name: existing.name,
            role: existing.role,
            source: 'ManuallyAdded' as SpeakerSource,
          }));

        const allMappings = [...initialMappings, ...manualSpeakers];
        
        console.log('🔄 Store: calculated allMappings', allMappings);
        
        // Calculate next speaker ID
        const maxSpeakerNum = Math.max(
          ...allMappings
            .map((m) => m.speakerId)
            .filter((id) => id.startsWith('Speaker '))
            .map((id) => parseInt(id.replace('Speaker ', ''), 10))
            .filter((num) => !isNaN(num)),
          0
        );

        const newState = {
          mappings: allMappings,
          originalMappings: structuredClone(allMappings),
          detectedSpeakers,
          existingMappings,
          transcriptionId,
          nextSpeakerId: maxSpeakerNum + 1,
          hasChanges: false,
          error: null,
          success: false,
        };
        
        console.log('🔄 Store: setting new state', newState);
        set(newState);
      },

      updateMapping: (speakerId, field, value) => {
        set((state) => {
          const newMappings = state.mappings.map((mapping) =>
            mapping.speakerId === speakerId
              ? { ...mapping, [field]: value }
              : mapping
          );
          
          return {
            mappings: newMappings,
            hasChanges: get().calculateHasChanges(newMappings),
            error: null,
          };
        });
      },

      addSpeaker: () => {
        set((state) => {
          const newSpeakerId = `Speaker ${state.nextSpeakerId}`;
          const newMapping: MappingFormData = {
            speakerId: newSpeakerId,
            name: '',
            role: '',
            source: 'ManuallyAdded',
          };
          
          const newMappings = [...state.mappings, newMapping];
          
          return {
            mappings: newMappings,
            nextSpeakerId: state.nextSpeakerId + 1,
            hasChanges: get().calculateHasChanges(newMappings),
            error: null,
          };
        });
      },

      removeSpeaker: (index) => {
        const { mappings } = get();
        const speakerToRemove = mappings[index];

        if (mappings.length <= 1) {
          set({
            error: 'Cannot remove the last remaining speaker. At least one speaker is required.',
          });
          return;
        }

        set({
          deleteConfirmation: {
            open: true,
            speakerIndex: index,
            speakerName: speakerToRemove.name || speakerToRemove.speakerId,
          },
        });
      },

      confirmRemoveSpeaker: () => {
        set((state) => {
          const { speakerIndex } = state.deleteConfirmation;
          const newMappings = state.mappings.filter((_, i) => i !== speakerIndex);
          
          return {
            mappings: newMappings,
            deleteConfirmation: { open: false, speakerIndex: -1, speakerName: '' },
            hasChanges: get().calculateHasChanges(newMappings),
            error: null,
          };
        });
      },

      cancelRemoveSpeaker: () => {
        set({
          deleteConfirmation: { open: false, speakerIndex: -1, speakerName: '' },
        });
      },

      startEditMode: (speakerId) => {
        set((state) => {
          const mapping = state.mappings.find((m) => m.speakerId === speakerId);
          if (!mapping) return state;

          const newEditingMappings = new Set(state.editingMappings).add(speakerId);
          const newOriginalValues = new Map(state.originalValues).set(speakerId, {
            name: mapping.name,
            role: mapping.role,
          });

          return {
            editingMappings: newEditingMappings,
            originalValues: newOriginalValues,
            hasActiveEdits: newEditingMappings.size > 0,
          };
        });
      },

      saveEdit: (speakerId) => {
        set((state) => {
          const newEditingMappings = new Set(state.editingMappings);
          newEditingMappings.delete(speakerId);
          
          const newOriginalValues = new Map(state.originalValues);
          newOriginalValues.delete(speakerId);
          
          const newValidationErrors = new Map(state.validationErrors);
          newValidationErrors.delete(speakerId);

          return {
            editingMappings: newEditingMappings,
            originalValues: newOriginalValues,
            validationErrors: newValidationErrors,
            hasActiveEdits: newEditingMappings.size > 0,
            hasValidationErrors: newValidationErrors.size > 0,
          };
        });
      },

      cancelEdit: (speakerId) => {
        set((state) => {
          const originalValue = state.originalValues.get(speakerId);
          if (!originalValue) return state;

          const newMappings = state.mappings.map((mapping) =>
            mapping.speakerId === speakerId
              ? { ...mapping, name: originalValue.name, role: originalValue.role }
              : mapping
          );

          const newEditingMappings = new Set(state.editingMappings);
          newEditingMappings.delete(speakerId);
          
          const newOriginalValues = new Map(state.originalValues);
          newOriginalValues.delete(speakerId);
          
          const newValidationErrors = new Map(state.validationErrors);
          newValidationErrors.delete(speakerId);

          return {
            mappings: newMappings,
            editingMappings: newEditingMappings,
            originalValues: newOriginalValues,
            validationErrors: newValidationErrors,
            hasActiveEdits: newEditingMappings.size > 0,
            hasValidationErrors: newValidationErrors.size > 0,
            hasChanges: get().calculateHasChanges(newMappings),
          };
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),

      validateMapping: (speakerId) => {
        const { mappings } = get();
        const mapping = mappings.find((m) => m.speakerId === speakerId);
        if (!mapping) return [];

        const errors: ValidationError[] = [];
        
        if (mapping.name.trim() && mapping.name.trim().length < 2) {
          errors.push({
            field: 'name',
            message: 'Name must be at least 2 characters long',
          });
        }
        
        if (mapping.role.trim() && mapping.role.trim().length < 2) {
          errors.push({
            field: 'role',
            message: 'Role must be at least 2 characters long',
          });
        }

        return errors;
      },

      validateAllMappings: () => {
        const { mappings } = get();
        const newValidationErrors = new Map<string, ValidationError[]>();
        
        for (const mapping of mappings) {
          const errors = get().validateMapping(mapping.speakerId);
          if (errors.length > 0) {
            newValidationErrors.set(mapping.speakerId, errors);
          }
        }
        
        set({
          validationErrors: newValidationErrors,
          hasValidationErrors: newValidationErrors.size > 0,
        });
        
        return newValidationErrors.size === 0;
      },

      reset: () => set(initialState),

      // Helper method to calculate hasChanges
      calculateHasChanges: (currentMappings: MappingFormData[]) => {
        const state = get();
        
        // Check if there are any mappings with names (additions/edits)
        const hasMappingsWithNames = currentMappings.some((m) => m.name.trim() !== '');
        
        // Check if speakers have been deleted
        const allOriginalSpeakers = [
          ...state.detectedSpeakers,
          ...state.existingMappings
            .filter(
              (existing) =>
                existing.source === 'ManuallyAdded' &&
                !state.detectedSpeakers.includes(existing.speakerId)
            )
            .map((existing) => existing.speakerId),
        ];
        const currentSpeakerIds = new Set(currentMappings.map((m) => m.speakerId));
        const hasDeletions = allOriginalSpeakers.some(
          (speakerId) => !currentSpeakerIds.has(speakerId)
        );
        
        // Check if any existing mappings have been modified
        const hasModifications = currentMappings.some((mapping) => {
          const existing = state.existingMappings.find(
            (existing) => existing.speakerId === mapping.speakerId
          );
          return (
            existing &&
            (existing.name !== mapping.name || existing.role !== mapping.role)
          );
        });

        return hasMappingsWithNames || hasDeletions || hasModifications;
      },
    }),
    {
      name: 'speaker-mapping-store',
    }
  )
);
