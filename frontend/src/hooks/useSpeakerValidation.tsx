import { useState, useCallback } from "react";
import {
  validateSpeakerMapping,
  validateAllMappings,
} from "../stores/speakerStore";
import type { ValidationError } from "../types";

interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
}

export const useSpeakerValidation = () => {
  // UI validation state
  const [validationErrors, setValidationErrors] = useState<
    Map<string, ValidationError[]>
  >(new Map());

  // Validate a single speaker mapping using store functions
  const validateSingleMapping = useCallback(
    (
      mapping: MappingFormData,
      speakerId: string,
      allMappings: MappingFormData[]
    ): boolean => {
      // Use store's pure validation function
      const errors = validateSpeakerMapping(mapping, speakerId, allMappings);

      // Update UI state
      if (errors.length > 0) {
        setValidationErrors((prev) => new Map(prev.set(speakerId, errors)));
        return false;
      } else {
        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(speakerId);
          return newErrors;
        });
        return true;
      }
    },
    []
  );

  // Validate all mappings using store functions
  const validateAllSpeakerMappings = useCallback(
    (allMappings: MappingFormData[]): boolean => {
      // Use store's pure validation function
      const validationResult = validateAllMappings(allMappings);

      // Update UI state with all errors
      setValidationErrors(validationResult.errorsBySpeaker);

      return validationResult.isValid;
    },
    []
  );

  // Clear validation errors for specific speaker or all
  const clearValidationErrors = useCallback((speakerId?: string) => {
    if (speakerId) {
      setValidationErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(speakerId);
        return newErrors;
      });
    } else {
      setValidationErrors(new Map());
    }
  }, []);

  // Get validation errors for a specific speaker
  const getValidationErrors = useCallback(
    (speakerId: string): ValidationError[] => {
      return validationErrors.get(speakerId) || [];
    },
    [validationErrors]
  );

  // Check if there are any validation errors
  const hasValidationErrors = validationErrors.size > 0;

  return {
    // State
    validationErrors,
    hasValidationErrors,

    // Actions
    validateSingleMapping,
    validateAllSpeakerMappings,
    clearValidationErrors,
    getValidationErrors,
  };
};
