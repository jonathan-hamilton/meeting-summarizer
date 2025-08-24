/**
 * Centralized Speaker Session Store (S3.6)
 * Single source of truth for speaker and segment state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SpeakerSegment, SpeakerMapping } from '../types';

// Speaker statistics computed from current state
export interface SpeakerStats {
  totalCount: number;      // Total active speakers (with segments)
  mappedCount: number;     // Speakers with custom names
  isFullyMapped: boolean;  // All speakers have names
}

// Main store state interface
interface SpeakerSessionState {
  // Base State (Single Source of Truth)
  transcriptionId: string | null;
  originalSegments: SpeakerSegment[];
  currentSegments: SpeakerSegment[];
  speakerMappings: SpeakerMapping[];
  
  // Actions
  initializeSession: (transcriptionId: string, segments: SpeakerSegment[], mappings?: SpeakerMapping[]) => void;
  reassignSegment: (segmentIndex: number, newSpeaker: string) => void;
  updateSpeakerMapping: (speakerId: string, mapping: Partial<SpeakerMapping>) => void;
  addSpeakerMapping: (mapping: SpeakerMapping) => void;
  deleteSpeakerMapping: (speakerId: string) => void;
  resetToOriginal: () => void;
  clearSession: () => void;
}

// Compute functions that create new data only when needed
const computeActiveSpeakers = (segments: SpeakerSegment[]): string[] => {
  return Array.from(new Set(
    segments
      .map(segment => segment.speaker)
      .filter(speaker => speaker !== "Unassigned") // Exclude unassigned speakers from active count
  ));
};

const computeSpeakerStats = (
  activeSpeakers: string[], 
  mappings: SpeakerMapping[]
): SpeakerStats => {
  const mappedCount = activeSpeakers.filter(speakerId => {
    const mapping = mappings.find(m => m.speakerId === speakerId);
    return mapping?.name && mapping.name.trim() !== "" && mapping.name !== speakerId;
  }).length;

  return {
    totalCount: activeSpeakers.length,
    mappedCount,
    isFullyMapped: mappedCount === activeSpeakers.length && activeSpeakers.length > 0,
  };
};

const computeFilteredMappings = (
  activeSpeakers: string[], 
  mappings: SpeakerMapping[]
): SpeakerMapping[] => {
  return mappings.filter(mapping => activeSpeakers.includes(mapping.speakerId));
};

const computeStructurallyInvalidated = (
  originalSegments: SpeakerSegment[],
  currentSegments: SpeakerSegment[]
): boolean => {
  if (originalSegments.length !== currentSegments.length) {
    return true;
  }

  return originalSegments.some((originalSegment, index) => {
    const currentSegment = currentSegments[index];
    return currentSegment && originalSegment.speaker !== currentSegment.speaker;
  });
};

const hasUnsavedChangesComputation = (
  originalSegments: SpeakerSegment[],
  currentSegments: SpeakerSegment[],
  mappings: SpeakerMapping[]
): boolean => {
  // Check for segment reassignments
  const hasSegmentChanges = computeStructurallyInvalidated(originalSegments, currentSegments);
  
  // Check for speaker mappings (name/role assignments)
  const hasMappings = mappings.some(mapping => 
    mapping.name && mapping.name.trim() !== ''
  );

  return hasSegmentChanges || hasMappings;
};

/**
 * Centralized Speaker Session Store
 * Manages all speaker and segment state in one place
 */
export const useSpeakerSessionStore = create<SpeakerSessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      transcriptionId: null,
      originalSegments: [],
      currentSegments: [],
      speakerMappings: [],

      // Initialize a new session
      initializeSession: (transcriptionId, segments, mappings = []) => {
        console.log('🔄 SpeakerSessionStore: Initializing session:', transcriptionId);
        console.log('🔄 SpeakerSessionStore: Segments count:', segments.length);
        console.log('🔄 SpeakerSessionStore: Mappings count:', mappings.length);
        
        // Clear any persisted legacy speaker store data to ensure fresh state
        try {
          sessionStorage.removeItem('speaker-store-session');
          console.log('🧹 SpeakerSessionStore: Cleared legacy speaker store persistence');
        } catch (error) {
          console.warn('Failed to clear legacy speaker store:', error);
        }
        
        const newState = {
          transcriptionId,
          originalSegments: [...segments],
          currentSegments: [...segments],
          speakerMappings: [...mappings],
        };
        
        set(newState);
      },

      // Reassign a specific segment to a different speaker
      reassignSegment: (segmentIndex, newSpeaker) => {
        const state = get();
        
        if (segmentIndex < 0 || segmentIndex >= state.currentSegments.length) {
          console.warn('Invalid segment index:', segmentIndex);
          return;
        }

        const updatedSegments = state.currentSegments.map((segment, index) =>
          index === segmentIndex ? { ...segment, speaker: newSpeaker } : segment
        );

        console.log(`🔄 SpeakerSessionStore: Reassigned segment ${segmentIndex} from ${state.currentSegments[segmentIndex].speaker} to ${newSpeaker}`);
        
        set({
          currentSegments: updatedSegments,
        });
      },

      // Update speaker mapping (name, role, email)
      updateSpeakerMapping: (speakerId, updates) => {
        const state = get();
        
        const updatedMappings = state.speakerMappings.map(mapping =>
          mapping.speakerId === speakerId
            ? { ...mapping, ...updates }
            : mapping
        );

        console.log(`🔄 SpeakerSessionStore: Updated mapping for ${speakerId}:`, updates);
        
        set({
          speakerMappings: updatedMappings,
        });
      },

      // Add new speaker mapping
      addSpeakerMapping: (mapping) => {
        const state = get();
        
        // Check if mapping already exists
        const existingIndex = state.speakerMappings.findIndex(m => m.speakerId === mapping.speakerId);
        
        if (existingIndex >= 0) {
          // Update existing mapping
          const updatedMappings = state.speakerMappings.map((m, index) =>
            index === existingIndex ? { ...m, ...mapping } : m
          );
          
          set({
            speakerMappings: updatedMappings,
          });
        } else {
          // Add new mapping
          set({
            speakerMappings: [...state.speakerMappings, mapping],
          });
        }

        console.log(`🔄 SpeakerSessionStore: Added/updated mapping for ${mapping.speakerId}`);
      },

      // Delete speaker mapping
      deleteSpeakerMapping: (speakerId) => {
        const state = get();
        
        const filteredMappings = state.speakerMappings.filter(
          mapping => mapping.speakerId !== speakerId
        );

        // Also reassign any segments that were assigned to this deleted speaker to "Unassigned"
        const updatedSegments = state.currentSegments.map(segment => 
          segment.speaker === speakerId 
            ? { ...segment, speaker: "Unassigned" }
            : segment
        );

        console.log(`🔄 SpeakerSessionStore: Deleted mapping for ${speakerId} and reassigned ${updatedSegments.filter(s => s.speaker === "Unassigned").length} segments to "Unassigned"`);
        
        set({
          speakerMappings: filteredMappings,
          currentSegments: updatedSegments,
        });
      },

      // Reset segments to original state
      resetToOriginal: () => {
        const state = get();
        
        console.log('🔄 SpeakerSessionStore: Resetting to original segments');
        
        set({
          currentSegments: [...state.originalSegments],
          speakerMappings: [], // Also clear mappings on reset
        });
      },

      // Clear entire session
      clearSession: () => {
        console.log('🔄 SpeakerSessionStore: Clearing session');
        
        // Clear any persisted legacy speaker store data
        try {
          sessionStorage.removeItem('speaker-store-session');
          console.log('🧹 SpeakerSessionStore: Cleared legacy speaker store persistence');
        } catch (error) {
          console.warn('Failed to clear legacy speaker store:', error);
        }
        
        set({
          transcriptionId: null,
          originalSegments: [],
          currentSegments: [],
          speakerMappings: [],
        });
      },
    }),
    {
      name: 'speaker-session-store', // DevTools name
    }
  )
);

// Updated convenience hooks - use direct state selectors to avoid infinite loops
export const useActiveSpeakers = () => 
  useSpeakerSessionStore(
    state => computeActiveSpeakers(state.currentSegments),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );

export const useSpeakerStats = () => 
  useSpeakerSessionStore(
    state => {
      const activeSpeakers = computeActiveSpeakers(state.currentSegments);
      return computeSpeakerStats(activeSpeakers, state.speakerMappings);
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );

export const useFilteredMappings = () => 
  useSpeakerSessionStore(
    state => {
      const activeSpeakers = computeActiveSpeakers(state.currentSegments);
      return computeFilteredMappings(activeSpeakers, state.speakerMappings);
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );

export const useStructurallyInvalidated = () => 
  useSpeakerSessionStore(
    state => computeStructurallyInvalidated(state.originalSegments, state.currentSegments),
    (a, b) => a === b
  );

export const useHasUnsavedChanges = () => 
  useSpeakerSessionStore(
    state => hasUnsavedChangesComputation(
      state.originalSegments,
      state.currentSegments,
      state.speakerMappings
    ),
    (a, b) => a === b
  );

// Direct state access hooks (use sparingly to avoid unnecessary re-renders)
export const useCurrentSegments = () => 
  useSpeakerSessionStore(state => state.currentSegments);

export const useSpeakerMappings = () => 
  useSpeakerSessionStore(state => state.speakerMappings);

export const useTranscriptionId = () => 
  useSpeakerSessionStore(state => state.transcriptionId);
