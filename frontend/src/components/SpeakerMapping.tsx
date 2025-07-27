import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import type { SpeakerMapping, SpeakerSource } from "../types";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";
import { getSpeakerColor } from "../theme/speakerColors";

interface SpeakerMappingProps {
  transcriptionId: string;
  detectedSpeakers: string[];
  onMappingsChanged?: (mappings: SpeakerMapping[]) => void;
}

export const SpeakerMappingComponent: React.FC<SpeakerMappingProps> = ({
  transcriptionId,
  detectedSpeakers,
  onMappingsChanged,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use Zustand store for speaker management
  const {
    speakerMappings: storeMappings,
    detectedSpeakers: storeDetectedSpeakers,
    initializeSpeakers,
  } = useSpeakerStore();

  // Initialize speakers in store when component mounts
  useEffect(() => {
    if (transcriptionId) {
      // Initialize Zustand store with detected speakers (session-only, no API calls)
      initializeSpeakers(transcriptionId, detectedSpeakers, []);
    }
  }, [transcriptionId, detectedSpeakers, initializeSpeakers]);

  const handleMappingsSaved = useCallback(
    (newMappings: SpeakerMapping[]) => {
      // The store will be updated by the dialog component
      // Just trigger the callback for any parent components
      if (onMappingsChanged) {
        onMappingsChanged(newMappings);
      }
    },
    [onMappingsChanged]
  );

  // Step 2: Memoize Effective Data (Replace multiple fallback calculations)
  const effectiveData = useMemo(
    () => ({
      mappings: storeMappings.length > 0 ? storeMappings : [],
      speakers:
        storeDetectedSpeakers.length > 0
          ? storeDetectedSpeakers
          : detectedSpeakers,
    }),
    [storeMappings, storeDetectedSpeakers, detectedSpeakers]
  );

  // Step 3: Memoize Session Overrides (Replace expensive call on every render)
  const sessionOverrides = useMemo(() => sessionManager.getOverrides(), []);

  // Function to check if a detected speaker is mapped (has a name)
  const isSpeakerMapped = useCallback(
    (speakerId: string): boolean => {
      // Only check if it's a detected speaker that has been mapped with a name
      if (!effectiveData.speakers.includes(speakerId)) {
        return false;
      }

      // Check traditional mappings first
      const mapping = effectiveData.mappings.find(
        (m) => m.speakerId === speakerId
      );
      if (mapping && mapping.name && mapping.name.trim() !== "") {
        return true;
      }

      // Check session-based overrides
      const override = sessionOverrides[speakerId];
      return !!(
        override &&
        override.action === "Override" &&
        override.newValue
      );
    },
    [effectiveData.mappings, effectiveData.speakers, sessionOverrides]
  );

  // Step 4: Memoize computed speaker data (Replace expensive calculations)
  const computedSpeakerData = useMemo(() => {
    // Get all speakers (detected + manually added)
    const allSpeakers = [
      ...effectiveData.speakers,
      ...effectiveData.mappings.map((m) => m.speakerId),
    ];
    const uniqueSpeakers = Array.from(new Set(allSpeakers));
    const totalSpeakerCount = uniqueSpeakers.length;

    // Count only detected speakers that have been mapped with names
    const mappedDetectedCount = effectiveData.speakers.filter((speakerId) =>
      isSpeakerMapped(speakerId)
    ).length;

    // Get unmapped speakers (both detected and manually added without names)
    const unmappedSpeakers = uniqueSpeakers.filter((speakerId) => {
      if (effectiveData.speakers.includes(speakerId)) {
        // For detected speakers, check if they're mapped
        return !isSpeakerMapped(speakerId);
      } else {
        // For manually added speakers, check if they have a name
        const mapping = effectiveData.mappings.find(
          (m) => m.speakerId === speakerId
        );
        return !mapping || !mapping.name || mapping.name.trim() === "";
      }
    });

    return {
      allSpeakers,
      uniqueSpeakers,
      totalSpeakerCount,
      mappedDetectedCount,
      unmappedSpeakers,
    };
  }, [effectiveData, isSpeakerMapped]);

  // Count only detected speakers that have been mapped with names
  const mappedDetectedCount = computedSpeakerData.mappedDetectedCount;

  // Get unmapped speakers (both detected and manually added without names)
  const unmappedSpeakers = computedSpeakerData.unmappedSpeakers;

  // Step 5: Memoize rendered speaker lists (Replace inline filtering/mapping)
  const mappedTraditionalSpeakers = useMemo(() => {
    return effectiveData.mappings.filter((mapping) => mapping.name);
  }, [effectiveData.mappings]);

  const sessionOverrideSpeakers = useMemo(() => {
    return Object.entries(sessionOverrides)
      .map(([speakerId, override]) => {
        // Only show overrides that aren't already covered by traditional mappings
        const hasMapping = effectiveData.mappings.find(
          (m) => m.speakerId === speakerId && m.name
        );
        if (
          !hasMapping &&
          override.action === "Override" &&
          override.newValue
        ) {
          return { speakerId, override };
        }
        return null;
      })
      .filter(Boolean);
  }, [sessionOverrides, effectiveData.mappings]);

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Speaker Mappings</Typography>
          {computedSpeakerData.totalSpeakerCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({mappedDetectedCount}/{computedSpeakerData.totalSpeakerCount}{" "}
              mapped)
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Manage Mappings
        </Button>
      </Box>

      {mappedTraditionalSpeakers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {/* Show traditional mappings */}
            {mappedTraditionalSpeakers.map((mapping) => {
              // S2.6: Source-aware display with appropriate icons
              const isAutoDetected =
                !mapping.source ||
                mapping.source === ("AutoDetected" as SpeakerSource);

              // S2.7: Override indicator
              const isOverridden = mapping.isOverridden;

              let Icon = isAutoDetected ? MicIcon : PersonAddIcon;
              let sourceLabel = isAutoDetected
                ? "auto-detected"
                : "manually-added";

              // S2.7: Show override icon for overridden speakers
              if (isOverridden) {
                Icon = EditNoteIcon;
                sourceLabel = "manually overridden";
              }

              return (
                <Chip
                  key={mapping.speakerId}
                  icon={<Icon />}
                  label={`${mapping.speakerId} → ${mapping.name}${
                    mapping.role ? ` (${mapping.role})` : ""
                  }`}
                  variant="filled"
                  size="small"
                  sx={{
                    backgroundColor: getSpeakerColor(mapping.speakerId),
                    color: "white",
                    "& .MuiChip-icon": {
                      color: "white",
                    },
                  }}
                  title={`${sourceLabel} speaker${
                    isOverridden
                      ? ` - overridden at ${new Date(
                          mapping.overriddenAt || ""
                        ).toLocaleString()}`
                      : ""
                  }`}
                />
              );
            })}

            {/* Show session-based overrides */}
            {sessionOverrideSpeakers.map((item) => {
              if (!item) return null;
              const { speakerId, override } = item;

              return (
                <Chip
                  key={`override-${speakerId}`}
                  icon={<EditNoteIcon />}
                  label={`${speakerId} → ${override.newValue}`}
                  variant="filled"
                  size="small"
                  sx={{
                    backgroundColor: getSpeakerColor(speakerId),
                    color: "white",
                    "& .MuiChip-icon": {
                      color: "white",
                    },
                  }}
                  title={`session override - ${override.newValue}`}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {unmappedSpeakers.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Unmapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {unmappedSpeakers.map((speakerId) => {
              // S2.6: Determine speaker source for unmapped speakers
              const isDetectedSpeaker =
                effectiveData.speakers.includes(speakerId);
              const mapping = effectiveData.mappings.find(
                (m) => m.speakerId === speakerId
              );
              const isAutoDetected =
                isDetectedSpeaker &&
                (!mapping ||
                  !mapping.source ||
                  mapping.source === ("AutoDetected" as SpeakerSource));
              const Icon = isAutoDetected ? MicIcon : PersonAddIcon;
              const sourceLabel = isAutoDetected
                ? "auto-detected"
                : "manually-added";

              return (
                <Chip
                  key={speakerId}
                  icon={<Icon />}
                  label={speakerId}
                  variant="filled"
                  size="small"
                  sx={{
                    backgroundColor: getSpeakerColor(speakerId),
                    color: "white",
                    "& .MuiChip-icon": {
                      color: "white",
                    },
                  }}
                  title={`${sourceLabel} speaker`}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {effectiveData.speakers.length === 0 &&
        effectiveData.mappings.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No speakers detected in this transcription.
          </Typography>
        )}

      <SpeakerMappingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transcriptionId={transcriptionId}
        detectedSpeakers={effectiveData.speakers}
        existingMappings={effectiveData.mappings}
        onMappingsSaved={handleMappingsSaved}
      />
    </Box>
  );
};

export default SpeakerMappingComponent;
