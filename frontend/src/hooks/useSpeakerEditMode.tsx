import { useCallback, useState } from "react";
import type { SpeakerSource } from "../types";

interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
  source: SpeakerSource;
}

export const useSpeakerEditMode = (
  setMappings: React.Dispatch<React.SetStateAction<MappingFormData[]>>,
  clearValidationErrors: (speakerId: string) => void,
  validateSpeakerMapping: (
    mapping: MappingFormData,
    speakerId: string
  ) => boolean
) => {
  // Edit mode state management
  const [editingMappings, setEditingMappings] = useState<Set<string>>(
    new Set()
  );
  const [originalValues, setOriginalValues] = useState<
    Map<string, { name: string; role: string }>
  >(new Map());

  // Start edit mode for a speaker
  const startEditMode = useCallback(
    (speakerId: string) => {
      setMappings((prevMappings) => {
        const mapping = prevMappings.find((m) => m.speakerId === speakerId);
        if (mapping) {
          // Store original values for potential revert
          setOriginalValues(
            (prev) =>
              new Map(
                prev.set(speakerId, {
                  name: mapping.name,
                  role: mapping.role,
                })
              )
          );

          // Add to editing set
          setEditingMappings((prev) => new Set(prev.add(speakerId)));

          // Clear any existing validation errors for this speaker
          clearValidationErrors(speakerId);
        }
        return prevMappings;
      });
    },
    [setMappings, clearValidationErrors]
  );

  // Cancel edit mode and revert changes
  const cancelEditMode = useCallback(
    (speakerId: string) => {
      const original = originalValues.get(speakerId);
      if (original) {
        // Revert to original values
        setMappings((prev) =>
          prev.map((mapping) =>
            mapping.speakerId === speakerId
              ? { ...mapping, name: original.name, role: original.role }
              : mapping
          )
        );

        // Remove from editing set
        setEditingMappings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(speakerId);
          return newSet;
        });

        // Clear original values and validation errors
        setOriginalValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(speakerId);
          return newMap;
        });

        clearValidationErrors(speakerId);
      }
    },
    [originalValues, setMappings, clearValidationErrors]
  );

  // Confirm edit mode after validation
  const confirmEditMode = useCallback(
    (speakerId: string) => {
      // Validate before confirming
      setMappings((prevMappings) => {
        const mapping = prevMappings.find((m) => m.speakerId === speakerId);
        if (mapping && validateSpeakerMapping(mapping, speakerId)) {
          // Remove from editing set
          setEditingMappings((prev) => {
            const newSet = new Set(prev);
            newSet.delete(speakerId);
            return newSet;
          });

          // Clear original values and validation errors
          setOriginalValues((prev) => {
            const newMap = new Map(prev);
            newMap.delete(speakerId);
            return newMap;
          });

          clearValidationErrors(speakerId);
        }
        return prevMappings;
      });
    },
    [setMappings, validateSpeakerMapping, clearValidationErrors]
  );

  // Clear all edit state
  const clearEditState = useCallback(() => {
    setEditingMappings(new Set());
    setOriginalValues(new Map());
  }, []);

  // Check if there are any speakers currently being edited
  const hasActiveEdits = editingMappings.size > 0;

  return {
    editingMappings,
    originalValues,
    startEditMode,
    cancelEditMode,
    confirmEditMode,
    clearEditState,
    hasActiveEdits,
  };
};
