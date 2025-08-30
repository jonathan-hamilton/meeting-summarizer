/**
 * Speaker validation utilities
 * Extracted from legacy store to be independent of store implementation
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

  // Check for duplicate names (excluding current mapping)
  // Only validate duplicates if the name is not empty
  if (mapping.name && mapping.name.trim() !== '') {
    const nameExists = allMappings.some(
      m => m.speakerId !== mapping.speakerId && 
           m.name === mapping.name &&
           m.name.trim() !== '' // Only consider non-empty names as duplicates
    );
    if (nameExists) {
      errors.push({
        field: 'name',
        message: 'Speaker name must be unique',
        speakerId: mapping.speakerId
      });
    }
  }

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

  // Check for duplicate roles (excluding current mapping)
  // Only validate role uniqueness if the role is not empty and not the default "Role" value
  if (mapping.role && mapping.role.trim() !== '' && mapping.role !== 'Role') {
    const roleExists = allMappings.some(
      m => m.speakerId !== mapping.speakerId && 
           m.role === mapping.role &&
           m.role !== 'Role' // Don't consider default "Role" values as duplicates
    );
    if (roleExists) {
      errors.push({
        field: 'role',
        message: 'Speaker role must be unique',
        speakerId: mapping.speakerId
      });
    }
  }

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
