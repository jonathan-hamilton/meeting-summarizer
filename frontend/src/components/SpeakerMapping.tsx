import React, { useState, useEffect } from "react";
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

  const handleMappingsSaved = (newMappings: SpeakerMapping[]) => {
    // The store will be updated by the dialog component
    // Just trigger the callback for any parent components
    if (onMappingsChanged) {
      onMappingsChanged(newMappings);
    }
  };

  // Use store data, fallback to props
  const effectiveMappings = storeMappings.length > 0 ? storeMappings : [];
  const effectiveDetectedSpeakers =
    storeDetectedSpeakers.length > 0 ? storeDetectedSpeakers : detectedSpeakers;

  // Get all speakers (detected + manually added)
  const allSpeakers = [
    ...effectiveDetectedSpeakers,
    ...effectiveMappings.map((m) => m.speakerId),
  ];
  const uniqueSpeakers = Array.from(new Set(allSpeakers));
  const totalSpeakerCount = uniqueSpeakers.length;

  // Get session-based overrides
  const sessionOverrides = sessionManager.getOverrides();

  // Function to check if a detected speaker is mapped (has a name)
  const isSpeakerMapped = (speakerId: string): boolean => {
    // Only check if it's a detected speaker that has been mapped with a name
    if (!effectiveDetectedSpeakers.includes(speakerId)) {
      return false;
    }

    // Check traditional mappings first
    const mapping = effectiveMappings.find((m) => m.speakerId === speakerId);
    if (mapping && mapping.name && mapping.name.trim() !== "") {
      return true;
    }

    // Check session-based overrides
    const override = sessionOverrides[speakerId];
    return !!(override && override.action === "Override" && override.newValue);
  };

  // Count only detected speakers that have been mapped with names
  const mappedDetectedCount = effectiveDetectedSpeakers.filter((speakerId) =>
    isSpeakerMapped(speakerId)
  ).length;

  // Get unmapped speakers (both detected and manually added without names)
  const unmappedSpeakers = uniqueSpeakers.filter((speakerId) => {
    if (effectiveDetectedSpeakers.includes(speakerId)) {
      // For detected speakers, check if they're mapped
      return !isSpeakerMapped(speakerId);
    } else {
      // For manually added speakers, check if they have a name
      const mapping = effectiveMappings.find((m) => m.speakerId === speakerId);
      return !mapping || !mapping.name || mapping.name.trim() === "";
    }
  });

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
          {totalSpeakerCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({mappedDetectedCount}/{totalSpeakerCount} mapped)
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => setDialogOpen(true)}
        >
          {effectiveMappings.length > 0
            ? "Edit/Delete Mappings"
            : "Edit/Delete Mappings"}
        </Button>
      </Box>

      {effectiveMappings.filter((m) => m.name && m.name.trim() !== "").length >
        0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {/* Show traditional mappings */}
            {effectiveMappings
              .filter((mapping) => mapping.name)
              .map((mapping) => {
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
                    color={isOverridden ? "secondary" : "primary"}
                    size="small"
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
            {Object.entries(sessionOverrides)
              .map(([speakerId, override]) => {
                // Only show overrides that aren't already covered by traditional mappings
                const hasMapping = effectiveMappings.find(
                  (m) => m.speakerId === speakerId && m.name
                );
                if (
                  !hasMapping &&
                  override.action === "Override" &&
                  override.newValue
                ) {
                  return (
                    <Chip
                      key={`override-${speakerId}`}
                      icon={<EditNoteIcon />}
                      label={`${speakerId} → ${override.newValue}`}
                      variant="filled"
                      color="info"
                      size="small"
                      title={`session override - ${override.newValue}`}
                    />
                  );
                }
                return null;
              })
              .filter(Boolean)}
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
                effectiveDetectedSpeakers.includes(speakerId);
              const mapping = effectiveMappings.find(
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
                  variant="outlined"
                  size="small"
                  title={`${sourceLabel} speaker`}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {effectiveDetectedSpeakers.length === 0 &&
        effectiveMappings.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No speakers detected in this transcription.
          </Typography>
        )}

      <SpeakerMappingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transcriptionId={transcriptionId}
        detectedSpeakers={effectiveDetectedSpeakers}
        existingMappings={effectiveMappings}
        onMappingsSaved={handleMappingsSaved}
      />
    </Box>
  );
};

export default SpeakerMappingComponent;
