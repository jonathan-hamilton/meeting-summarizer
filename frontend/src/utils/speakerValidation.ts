/**
 * Speaker validation utilities
 * Extracted from legacy store  // Role validation - roles do not need to be unique, multiple speakers can have the same role
  // Removed uniqueness validation as requestedent of store implementation
 */

import type { ValidationError } from '../types';

interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
  email?: string;
}

/**
 * Validates a single speaker mapping for name, role, and email uniqueness
 */
export const validateSpeakerMapping = (
  mapping: MappingFormData,
  _speakerId: string,
  allMappings: MappingFormData[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Names do not need to be unique - removed validation

  // Email validation (optional but must be valid format if provided)
  if (mapping.email && mapping.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mapping.email.trim())) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        speakerId: mapping.speakerId
      });
    }

    // Check for duplicate emails (excluding current mapping)
    const emailExists = allMappings.some(
      m => m.speakerId !== mapping.speakerId && 
           m.email === mapping.email &&
           m.email && m.email.trim() !== '' // Only consider non-empty emails as duplicates
    );
    if (emailExists) {
      errors.push({
        field: 'email',
        message: 'Email address must be unique',
        speakerId: mapping.speakerId
      });
    }
  }

  // Roles do not need to be unique - removed validation

  return errors;
};

/**
 * Validation result interface for all mappings validation
 */
export interface AllMappingsValidationResult {
  isValid: boolean;
  errorsBySpeaker: Map<string, ValidationError[]>;
}

/**
 * Validates all speaker mappings and returns consolidated results
 */
export const validateAllMappings = (
  allMappings: MappingFormData[]
): AllMappingsValidationResult => {
  const errorsBySpeaker = new Map<string, ValidationError[]>();
  let isValid = true;

  allMappings.forEach(mapping => {
    const errors = validateSpeakerMapping(mapping, mapping.speakerId, allMappings);
    if (errors.length > 0) {
      errorsBySpeaker.set(mapping.speakerId, errors);
      isValid = false;
    }
  });

  return {
    isValid,
    errorsBySpeaker
  };
};
