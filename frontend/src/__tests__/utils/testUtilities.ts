/**
 * Test Utilities for S3.0 Foundation Test Coverage
 * Provides utilities for Zustand store testing and session management testing
 */

import { act } from '@testing-library/react';
import { vi } from 'vitest';
import type { SpeakerMapping, SpeakerSource } from '../../types';

/**
 * Zustand Store Testing Utilities
 */
export const zustandTestUtils = {
  /**
   * Creates a clean store state for testing
   */
  createCleanStoreState: () => ({
    speakerMappings: [],
    detectedSpeakers: [],
    transcriptionId: null,
  }),

  /**
   * Creates mock speaker mappings for testing
   */
  createMockSpeakerMappings: (count: number = 3): SpeakerMapping[] => {
    return Array.from({ length: count }, (_, index) => ({
      speakerId: `Speaker_${index + 1}`,
      name: `Test Speaker ${index + 1}`,
      role: index === 0 ? 'Host' : index === 1 ? 'Guest' : 'Participant',
      transcriptionId: 'test-transcription-123',
      source: 'user' as SpeakerSource,
    }));
  },

  /**
   * Validates store state shape and types
   */
  validateStoreState: (state: any): boolean => {
    return (
      Array.isArray(state.speakerMappings) &&
      Array.isArray(state.detectedSpeakers) &&
      (state.transcriptionId === null || typeof state.transcriptionId === 'string')
    );
  },
};

/**
 * Test Data Generators
 */
export const testDataGenerators = {
  /**
   * Generates realistic speaker mapping test data
   */
  generateSpeakerMappingData: (options: {
    mapped?: number;
    unmapped?: number;
  } = {}) => {
    const { mapped = 2, unmapped = 3 } = options;
    const totalSpeakers = mapped + unmapped;
    
    const detectedSpeakers = Array.from(
      { length: totalSpeakers }, 
      (_, i) => `Speaker_${i + 1}`
    );
    
    const speakerMappings = detectedSpeakers.slice(0, mapped).map((speakerId, index) => ({
      speakerId,
      name: `Test Speaker ${index + 1}`,
      role: index === 0 ? 'Host' : 'Guest',
      transcriptionId: 'test-transcription-123',
      source: 'user' as SpeakerSource,
    }));

    return { detectedSpeakers, speakerMappings };
  },
};

/**
 * Assertion Helpers for Complex Objects
 */
export const assertionHelpers: {
  assertSpeakerMappingStructure: (mapping: any) => asserts mapping is SpeakerMapping;
  assertUniqueSpeakerIds: (speakers: SpeakerMapping[]) => void;
} = {
  /**
   * Asserts that a speaker mapping has the expected structure
   */
  assertSpeakerMappingStructure: (mapping: any): asserts mapping is SpeakerMapping => {
    expect(mapping).toBeDefined();
    expect(typeof mapping.speakerId).toBe('string');
    expect(typeof mapping.name).toBe('string');
    expect(typeof mapping.role).toBe('string');
    expect(typeof mapping.transcriptionId).toBe('string');
    expect(mapping.source).toMatch(/^(api|user)$/);
  },

  /**
   * Asserts that an array contains unique speaker IDs
   */
  assertUniqueSpeakerIds: (speakers: SpeakerMapping[]): void => {
    const speakerIds = speakers.map(s => s.speakerId);
    const uniqueIds = new Set(speakerIds);
    expect(speakerIds.length).toBe(uniqueIds.size);
  },
};
