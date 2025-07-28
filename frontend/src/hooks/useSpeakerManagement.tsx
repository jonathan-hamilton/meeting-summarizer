import { useCallback, useState } from "react";
import { useSpeakerStore } from "../stores/speakerStore";
import type { SpeakerMapping, SpeakerSource } from "../types";

interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
  source: SpeakerSource;
}

interface DeleteConfirmation {
  open: boolean;
  speakerIndex: number;
  speakerName: string;
  speakerId: string;
}

export const useSpeakerManagement = () => {
  const { deleteSpeaker, detectedSpeakers, getAllMappings } = useSpeakerStore();

  // Local state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>({
      open: false,
      speakerIndex: -1,
      speakerName: "",
      speakerId: "",
    });

  // Calculate next speaker ID
  const calculateNextSpeakerId = useCallback(
    (existingMappings: SpeakerMapping[]): string => {
      const existingSpeakerNumbers = [
        ...detectedSpeakers.map((id) => {
          const match = id.match(/speaker_(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        }),
        ...existingMappings.map((mapping) => {
          const match = mapping.speakerId.match(/speaker_(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        }),
      ];

      const maxNumber = Math.max(0, ...existingSpeakerNumbers);
      return `speaker_${maxNumber + 1}`;
    },
    [detectedSpeakers]
  );

  // Add new speaker functionality
  const handleAddSpeaker = useCallback((): MappingFormData => {
    const existingMappings = getAllMappings();
    const newSpeakerId = calculateNextSpeakerId(existingMappings);

    return {
      speakerId: newSpeakerId,
      name: "",
      role: "",
      source: "ManuallyAdded",
    };
  }, [getAllMappings, calculateNextSpeakerId]);

  // Check if speaker can be removed (at least one must remain)
  const canRemoveSpeaker = useCallback((totalSpeakers: number): boolean => {
    return totalSpeakers > 1;
  }, []);

  // Initialize speaker removal confirmation
  const handleRemoveSpeaker = useCallback(
    (
      index: number,
      speakerToRemove: MappingFormData,
      totalSpeakers: number,
      setError: (error: string | null) => void
    ) => {
      // Prevent removing the last speaker
      if (!canRemoveSpeaker(totalSpeakers)) {
        setError(
          "Cannot remove the last remaining speaker. At least one speaker is required."
        );
        return false;
      }

      setDeleteConfirmation({
        open: true,
        speakerIndex: index,
        speakerName: speakerToRemove.name || speakerToRemove.speakerId,
        speakerId: speakerToRemove.speakerId,
      });

      return true;
    },
    [canRemoveSpeaker]
  );

  // Confirm speaker removal
  const confirmRemoveSpeaker = useCallback(
    (
      setMappings: React.Dispatch<React.SetStateAction<MappingFormData[]>>,
      setError: (error: string | null) => void
    ) => {
      const { speakerIndex, speakerId } = deleteConfirmation;

      // Remove from local form state
      setMappings((prev) => prev.filter((_, i) => i !== speakerIndex));

      // Remove from Zustand store
      deleteSpeaker(speakerId);

      setError(null);
    },
    [deleteConfirmation, deleteSpeaker]
  );

  // Cancel speaker removal
  const cancelRemoveSpeaker = useCallback(() => {
    setDeleteConfirmation({
      open: false,
      speakerIndex: -1,
      speakerName: "",
      speakerId: "",
    });
  }, []);

  return {
    // State
    deleteConfirmation,

    // Actions
    handleAddSpeaker,
    handleRemoveSpeaker,
    confirmRemoveSpeaker,
    cancelRemoveSpeaker,
    calculateNextSpeakerId,
    canRemoveSpeaker,
  };
};
