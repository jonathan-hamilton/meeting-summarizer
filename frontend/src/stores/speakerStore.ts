import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SpeakerMapping, SpeakerSource } from '../types';

interface SpeakerState {
  // State
  speakerMappings: SpeakerMapping[];
  detectedSpeakers: string[];
  transcriptionId: string | null;

  // Actions
  initializeSpeakers: (transcriptionId: string, detectedSpeakers: string[], existingMappings?: SpeakerMapping[]) => void;
  addSpeaker: (speakerId: string, name: string, role?: string) => void;
  updateSpeaker: (speakerId: string, updates: Partial<Pick<SpeakerMapping, 'name' | 'role'>>) => void;
  deleteSpeaker: (speakerId: string) => void;
  clearSpeakers: () => void;

  // Selectors (computed values)
  getMappedCount: () => number;
  getUnmappedSpeakers: () => string[];
  getSpeakerMapping: (speakerId: string) => SpeakerMapping | undefined;
  getAllMappings: () => SpeakerMapping[];
}

export const useSpeakerStore = create<SpeakerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      speakerMappings: [],
      detectedSpeakers: [],
      transcriptionId: null,

      // Initialize speakers for a new transcription
      initializeSpeakers: (transcriptionId, detectedSpeakers, existingMappings = []) => {
        set({
          transcriptionId,
          detectedSpeakers,
          speakerMappings: existingMappings,
        });
      },

      // Add a new speaker mapping
      addSpeaker: (speakerId, name, role) => {
        const state = get();

        // Check if speaker already exists
        const existingMapping = state.speakerMappings.find(m => m.speakerId === speakerId);
        if (existingMapping) {
          console.warn(`Speaker ${speakerId} already exists`);
          return;
        }

        const newMapping: SpeakerMapping = {
          speakerId,
          name,
          role: role || '',
          source: 'ManuallyAdded' as SpeakerSource,
          transcriptionId: state.transcriptionId!,
        };

        set({
          speakerMappings: [...state.speakerMappings, newMapping],
        });
      },

      // Update an existing speaker mapping
      updateSpeaker: (speakerId, updates) => {
        const state = get();

        const updatedMappings = state.speakerMappings.map(mapping =>
          mapping.speakerId === speakerId
            ? { ...mapping, ...updates }
            : mapping
        );

        set({
          speakerMappings: updatedMappings,
        });
      },

      // Delete a speaker mapping
      deleteSpeaker: (speakerId) => {
        const state = get();

        const filteredMappings = state.speakerMappings.filter(
          mapping => mapping.speakerId !== speakerId
        );

        set({
          speakerMappings: filteredMappings,
        });
      },

      // Clear all speakers (useful for new transcription or reset)
      clearSpeakers: () => {
        set({
          speakerMappings: [],
          detectedSpeakers: [],
          transcriptionId: null,
        });
      },

      // Computed selectors
      getMappedCount: () => {
        // Only count speakers that have actual names (are truly mapped)
        return get().speakerMappings.filter(m => m.name && m.name.trim() !== '').length;
      },

      getUnmappedSpeakers: () => {
        const state = get();
        const mappedSpeakerIds = state.speakerMappings.map(m => m.speakerId);
        return state.detectedSpeakers.filter(speaker => !mappedSpeakerIds.includes(speaker));
      },

      getSpeakerMapping: (speakerId) => {
        return get().speakerMappings.find(m => m.speakerId === speakerId);
      },

      getAllMappings: () => {
        return get().speakerMappings;
      },
    }),
    {
      name: 'speaker-store', // Name for devtools
    }
  )
);

// Pure validation functions (used by useSpeakerValidation hook)
export const validateSpeakerMapping = (
  mapping: { speakerId: string; name: string; role: string },
  speakerId: string,
  allMappings: { speakerId: string; name: string; role: string }[]
): { field: 'name' | 'role'; message: string; speakerId: string }[] => {
  const errors: { field: 'name' | 'role'; message: string; speakerId: string }[] = [];

  // Check for empty name
  if (!mapping.name || mapping.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Speaker name is required',
      speakerId,
    });
  }

  // Check for duplicate names
  const duplicateName = allMappings.find(
    (m) => 
      m.speakerId !== speakerId && 
      m.name && 
      m.name.trim().toLowerCase() === mapping.name.trim().toLowerCase()
  );

  if (duplicateName) {
    errors.push({
      field: 'name',
      message: `Name "${mapping.name}" is already used by another speaker`,
      speakerId,
    });
  }

  return errors;
};

export const validateAllMappings = (
  allMappings: { speakerId: string; name: string; role: string }[]
): { 
  isValid: boolean; 
  errorsBySpeaker: Map<string, { field: 'name' | 'role'; message: string; speakerId: string }[]> 
} => {
  const errorsBySpeaker = new Map<string, { field: 'name' | 'role'; message: string; speakerId: string }[]>();

  allMappings.forEach((mapping) => {
    const errors = validateSpeakerMapping(mapping, mapping.speakerId, allMappings);
    if (errors.length > 0) {
      errorsBySpeaker.set(mapping.speakerId, errors);
    }
  });

  return {
    isValid: errorsBySpeaker.size === 0,
    errorsBySpeaker,
  };
};
