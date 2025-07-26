import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";
import { apiService } from "../services/apiService";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import type { SpeakerMapping, SpeakerSource } from "../types";
import { sessionManager } from "../services/sessionManager";

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
  const [mappings, setMappings] = useState<SpeakerMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load existing mappings when component mounts
  useEffect(() => {
    const loadExistingMappings = async () => {
      if (!transcriptionId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getSpeakerMappings(transcriptionId);
        if (response.data) {
          setMappings(response.data.mappings);
        }
      } catch (err) {
        // It's okay if no mappings exist yet
        console.log("No existing mappings found:", err);
        setMappings([]);
      } finally {
        setLoading(false);
      }
    };

    loadExistingMappings();
  }, [transcriptionId]);

  const handleMappingsSaved = (newMappings: SpeakerMapping[]) => {
    setMappings(newMappings);

    if (onMappingsChanged) {
      onMappingsChanged(newMappings);
    }
  };

  // S2.6: Enhanced speaker list calculation to include both auto-detected and manually-added speakers
  const allSpeakers = [
    ...detectedSpeakers,
    ...mappings.map((m) => m.speakerId),
  ];
  const uniqueSpeakers = Array.from(new Set(allSpeakers));

  // Get session-based overrides
  const sessionOverrides = sessionManager.getOverrides();

  // Function to check if a speaker is mapped (either through mappings or session overrides)
  const isSpeakerMapped = (speakerId: string): boolean => {
    // Check traditional mappings first
    const mapping = mappings.find((m) => m.speakerId === speakerId);
    if (mapping && mapping.name) {
      return true;
    }

    // Check session-based overrides
    const override = sessionOverrides[speakerId];
    return !!(override && override.action === "Override" && override.newValue);
  };

  // Speakers are unmapped if they have no mapping or override assigned
  const unmappedSpeakers = uniqueSpeakers.filter(
    (speakerId) => !isSpeakerMapped(speakerId)
  );

  // Count mapped speakers (includes both traditional mappings and session overrides)
  const mappedCount = uniqueSpeakers.filter(isSpeakerMapped).length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">Loading speaker mappings...</Typography>
      </Box>
    );
  }

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
          {uniqueSpeakers.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({mappedCount}/{uniqueSpeakers.length} mapped)
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => setDialogOpen(true)}
        >
          {mappings.length > 0
            ? "Edit/Delete Mappings"
            : "Edit/Delete Mappings"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mappedCount > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {/* Show traditional mappings */}
            {mappings
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
                const hasMapping = mappings.find(
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
              const isDetectedSpeaker = detectedSpeakers.includes(speakerId);
              const mapping = mappings.find((m) => m.speakerId === speakerId);
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

      {detectedSpeakers.length === 0 && mappings.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No speakers detected in this transcription.
        </Typography>
      )}

      <SpeakerMappingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transcriptionId={transcriptionId}
        detectedSpeakers={detectedSpeakers}
        existingMappings={mappings}
        onMappingsSaved={handleMappingsSaved}
      />
    </Box>
  );
};

export default SpeakerMappingComponent;
