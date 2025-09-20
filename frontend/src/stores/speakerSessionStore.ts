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

// Cached computed values to prevent infinite loops
interface ComputedCache {
  activeSpeakers: string[];
  speakerStats: SpeakerStats;
  filteredMappings: SpeakerMapping[];
  structurallyInvalidated: boolean;
  hasUnsavedChanges: boolean;
}

// Main store state interface
interface SpeakerSessionState {
  // Base State (Single Source of Truth)
  transcriptionId: string | null;
  originalSegments: SpeakerSegment[];
  currentSegments: SpeakerSegment[];
  speakerMappings: SpeakerMapping[];
  
  // Cached computed values (internal)
  _computedCache: ComputedCache | null;
  
  // Actions
  initializeSession: (transcriptionId: string, segments: SpeakerSegment[], mappings?: SpeakerMapping[]) => void;
  reassignSegment: (segmentIndex: number, newSpeaker: string) => void;
  updateSpeakerMapping: (speakerId: string, mapping: Partial<SpeakerMapping>) => void;
  addSpeakerMapping: (mapping: SpeakerMapping) => void;
  deleteSpeakerMapping: (speakerId: string) => void;
  resetToOriginal: () => void;
  clearSession: () => void;
  
  // Persistence actions
  loadSpeakerMappingsFromApi: (transcriptionId: string) => Promise<boolean>;
  saveSpeakerMappingsToApi: (mappings: SpeakerMapping[]) => Promise<boolean>;
  
  // Selectors (Computed Values) - now cached
  getActiveSpeakers: () => string[];
  getSpeakerStats: () => SpeakerStats;
  getFilteredMappings: () => SpeakerMapping[];
  getStructurallyInvalidated: () => boolean;
  hasUnsavedChanges: () => boolean;
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

// Function to recompute cache when state changes
const recomputeCache = (state: SpeakerSessionState): ComputedCache => {
  const activeSpeakers = computeActiveSpeakers(state.currentSegments);
  const speakerStats = computeSpeakerStats(activeSpeakers, state.speakerMappings);
  const filteredMappings = computeFilteredMappings(activeSpeakers, state.speakerMappings);
  const structurallyInvalidated = computeStructurallyInvalidated(state.originalSegments, state.currentSegments);
  const hasUnsavedChanges = hasUnsavedChangesComputation(
    state.originalSegments,
    state.currentSegments,
    state.speakerMappings
  );

  return {
    activeSpeakers,
    speakerStats,
    filteredMappings,
    structurallyInvalidated,
    hasUnsavedChanges,
  };
};

/**
 * Centralized Speaker Session Store
 * Manages all speaker and segment state in one place with caching to prevent infinite loops
 */
export const useSpeakerSessionStore = create<SpeakerSessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      transcriptionId: null,
      originalSegments: [],
      currentSegments: [],
      speakerMappings: [],
      _computedCache: null,

      // Initialize a new session
      initializeSession: (transcriptionId, segments, mappings = []) => {
        const newState = {
          transcriptionId,
          originalSegments: [...segments],
          currentSegments: [...segments],
          speakerMappings: [...mappings],
          _computedCache: null, // Will be computed on first access
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

        set({
          currentSegments: updatedSegments,
          _computedCache: null, // Invalidate cache
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

        set({
          speakerMappings: updatedMappings,
          _computedCache: null, // Invalidate cache
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
            _computedCache: null, // Invalidate cache
          });
        } else {
          // Add new mapping
          set({
            speakerMappings: [...state.speakerMappings, mapping],
            _computedCache: null, // Invalidate cache
          });
        }
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

        set({
          speakerMappings: filteredMappings,
          currentSegments: updatedSegments,
          _computedCache: null, // Invalidate cache
        });
      },

      // Reset segments to original state
      resetToOriginal: () => {
        const state = get();
        
        set({
          currentSegments: [...state.originalSegments],
          speakerMappings: [], // Also clear mappings on reset
          _computedCache: null, // Invalidate cache
        });
      },

      // Clear entire session
      clearSession: () => {
        set({
          transcriptionId: null,
          originalSegments: [],
          currentSegments: [],
          speakerMappings: [],
          _computedCache: null,
        });
      },

      // Cached computed selectors
      getActiveSpeakers: () => {
        const state = get();
        
        // Return cached value if available
        if (state._computedCache) {
          return state._computedCache.activeSpeakers;
        }
        
        // Compute and cache
        const cache = recomputeCache(state);
        set({ _computedCache: cache });
        return cache.activeSpeakers;
      },

      getSpeakerStats: () => {
        const state = get();
        
        // Return cached value if available
        if (state._computedCache) {
          return state._computedCache.speakerStats;
        }
        
        // Compute and cache
        const cache = recomputeCache(state);
        set({ _computedCache: cache });
        return cache.speakerStats;
      },

      getFilteredMappings: () => {
        const state = get();
        
        // Return cached value if available
        if (state._computedCache) {
          return state._computedCache.filteredMappings;
        }
        
        // Compute and cache
        const cache = recomputeCache(state);
        set({ _computedCache: cache });
        return cache.filteredMappings;
      },

      getStructurallyInvalidated: () => {
        const state = get();
        
        // Return cached value if available
        if (state._computedCache) {
          return state._computedCache.structurallyInvalidated;
        }
        
        // Compute and cache
        const cache = recomputeCache(state);
        set({ _computedCache: cache });
        return cache.structurallyInvalidated;
      },

      hasUnsavedChanges: () => {
        const state = get();
        
        // Return cached value if available
        if (state._computedCache) {
          return state._computedCache.hasUnsavedChanges;
        }
        
        // Compute and cache
        const cache = recomputeCache(state);
        set({ _computedCache: cache });
        return cache.hasUnsavedChanges;
      },

      // Persistence methods
      loadSpeakerMappingsFromApi: async (transcriptionId: string) => {
        try {
          // Import apiService dynamically to avoid circular dependencies
          const { apiService } = await import('../services/apiService');
          const response = await apiService.getSpeakerMappings(transcriptionId);
          
          if (response.success && response.data?.mappings) {
            // Merge loaded mappings with existing mappings from other transcripts
            const currentMappings = get().speakerMappings;
            const otherTranscriptMappings = currentMappings.filter(
              m => m.transcriptionId !== transcriptionId
            );
            const mergedMappings = [...otherTranscriptMappings, ...response.data.mappings];
            
            // Update store with merged mappings
            set({
              speakerMappings: mergedMappings,
              _computedCache: null, // Invalidate cache
            });
            
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error('Store - Failed to load speaker mappings:', error);
          return false;
        }
      },

      saveSpeakerMappingsToApi: async (mappings: SpeakerMapping[]) => {
        try {
          const state = get();
          if (!state.transcriptionId) {
            console.error('[ERROR] Store - No transcriptionId available for saving');
            return false;
          }
          
          // Import apiService dynamically to avoid circular dependencies
          const { apiService } = await import('../services/apiService');
          const response = await apiService.saveSpeakerMappings({
            transcriptionId: state.transcriptionId,
            mappings: mappings
          });
          
          // Merge saved mappings with existing mappings from other transcripts
          const currentMappings = get().speakerMappings;
          const otherTranscriptMappings = currentMappings.filter(
            m => m.transcriptionId !== state.transcriptionId
          );
          const mergedMappings = [...otherTranscriptMappings, ...mappings];
          
          // Update store with merged mappings
          set({
            speakerMappings: mergedMappings,
            _computedCache: null, // Invalidate cache
          });
          
          return response.success || false;
        } catch (error) {
          console.error('[ERROR] Store - Failed to save speaker mappings:', error);
          return false;
        }
      },
    }),
    {
      name: 'speaker-session-store', // DevTools name
    }
  )
);

// Updated convenience hooks - now use cached store methods
export const useActiveSpeakers = () => 
  useSpeakerSessionStore(state => state.getActiveSpeakers());

export const useSpeakerStats = () => 
  useSpeakerSessionStore(state => state.getSpeakerStats());

export const useFilteredMappings = () => 
  useSpeakerSessionStore(state => state.getFilteredMappings());

export const useStructurallyInvalidated = () => 
  useSpeakerSessionStore(state => state.getStructurallyInvalidated());

export const useHasUnsavedChanges = () => 
  useSpeakerSessionStore(state => state.hasUnsavedChanges());

// Direct state access hooks (use sparingly to avoid unnecessary re-renders)
export const useCurrentSegments = () => 
  useSpeakerSessionStore(state => state.currentSegments);

export const useSpeakerMappings = () => 
  useSpeakerSessionStore(state => state.speakerMappings);

export const useTranscriptionId = () => 
  useSpeakerSessionStore(state => state.transcriptionId);
