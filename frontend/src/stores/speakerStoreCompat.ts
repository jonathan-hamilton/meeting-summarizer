/**
 * Legacy Speaker Store Compatibility Layer
 * 
 * This provides the same interface as the legacy useSpeakerStore but uses the centralized
 * useSpeakerSessionStore underneath. This allows us to migrate components gradually
 * without breaking existing functionality.
 */

import { useSpeakerSessionStore } from './speakerSessionStore';
import type { SpeakerMapping, SpeakerSegment, SpeakerSource } from '../types';

// Compatibility functions that match the legacy store interface
export const useSpeakerStoreCompat = () => {
  const {
    speakerMappings,
    addSpeakerMapping,
    updateSpeakerMapping,
    deleteSpeakerMapping,
    initializeSession,
  } = useSpeakerSessionStore();

  // Convert centralized store functions to match legacy store interface
  const compatLayer = {
    // State (matches legacy store)
    speakerMappings,
    detectedSpeakers: speakerMappings.map(m => m.speakerId), // Extract speaker IDs from mappings
    transcriptionId: useSpeakerSessionStore.getState().transcriptionId,

    // Functions (matches legacy store signatures)
    initializeSpeakers: (transcriptionId: string, detectedSpeakers: string[], existingMappings: SpeakerMapping[] = []) => {
      // Convert detected speakers to segments format for centralized store
      const segments: SpeakerSegment[] = detectedSpeakers.map(speakerId => ({
        speaker: speakerId,
        text: '',
        start: 0,
        end: 0,
        confidence: 1.0
      }));
      
      // Ensure all detected speakers have mappings (create placeholder mappings for missing ones)
      const allMappings: SpeakerMapping[] = detectedSpeakers.map(speakerId => {
        // Check if there's an existing mapping for this speaker
        const existingMapping = existingMappings.find(m => m.speakerId === speakerId);
        if (existingMapping) {
          return existingMapping;
        }
        
        // Create a placeholder mapping for speakers without existing mappings
        return {
          speakerId,
          name: '', // Empty name means unmapped
          role: '',
          transcriptionId,
          source: 'AutoDetected' as SpeakerSource,
        };
      });
      
      initializeSession(transcriptionId, segments, allMappings);
    },

    addSpeaker: (speakerId: string, name: string, role: string = '') => {
      const mapping: SpeakerMapping = {
        speakerId,
        name,
        role,
        transcriptionId: useSpeakerSessionStore.getState().transcriptionId || '',
        source: 'ManuallyAdded' as SpeakerSource,
      };
      addSpeakerMapping(mapping);
    },

    updateSpeaker: (speakerId: string, updates: Partial<Pick<SpeakerMapping, 'name' | 'role' | 'email'>>) => {
      updateSpeakerMapping(speakerId, updates);
    },

    deleteSpeaker: (speakerId: string) => {
      deleteSpeakerMapping(speakerId);
    },

    getAllMappings: () => {
      return useSpeakerSessionStore.getState().speakerMappings;
    },

    clearSpeakers: () => {
      // Clear by resetting to empty state
      const { clearSession } = useSpeakerSessionStore.getState();
      clearSession();
    }
  };

  return compatLayer;
};

// Export individual functions for easier migration
export const useCompatSpeakerMappings = () => useSpeakerSessionStore(state => state.speakerMappings);
export const useCompatAddSpeaker = () => {
  const { addSpeakerMapping } = useSpeakerSessionStore();
  return (speakerId: string, name: string, role: string = '') => {
    const mapping: SpeakerMapping = {
      speakerId,
      name,
      role,
      transcriptionId: useSpeakerSessionStore.getState().transcriptionId || '',
      source: 'ManuallyAdded' as SpeakerSource,
    };
    addSpeakerMapping(mapping);
  };
};

export const useCompatUpdateSpeaker = () => {
  const { updateSpeakerMapping } = useSpeakerSessionStore();
  return updateSpeakerMapping;
};

export const useCompatDeleteSpeaker = () => {
  const { deleteSpeakerMapping } = useSpeakerSessionStore();
  return deleteSpeakerMapping;
};
