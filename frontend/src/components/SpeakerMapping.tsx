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
    console.log("🔗 SpeakerMappingComponent: handleMappingsSaved called", {
      newMappingsCount: newMappings.length,
      hasOnMappingsChanged: !!onMappingsChanged,
      newMappings,
    });

    setMappings(newMappings);

    if (onMappingsChanged) {
      console.log("🔗 SpeakerMappingComponent: Calling onMappingsChanged");
      onMappingsChanged(newMappings);
      console.log("🔗 SpeakerMappingComponent: onMappingsChanged completed");
    } else {
      console.log("❌ SpeakerMappingComponent: No onMappingsChanged callback");
    }
  };

  // S2.6: Enhanced speaker list calculation to include both auto-detected and manually-added speakers
  const allSpeakers = [
    ...detectedSpeakers,
    ...mappings.map((m) => m.speakerId),
  ];
  const uniqueSpeakers = Array.from(new Set(allSpeakers));

  // Speakers are unmapped if they have no mapping or no name assigned
  const unmappedSpeakers = uniqueSpeakers.filter((speakerId) => {
    const mapping = mappings.find((m) => m.speakerId === speakerId);
    return !mapping || !mapping.name; // Unmapped if no mapping or no name
  });

  // Mapped speakers are those with both name assigned (role is optional)
  const mappedSpeakers = mappings.filter((mapping) => mapping.name);

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
              ({mappedSpeakers.length}/{uniqueSpeakers.length} mapped)
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => setDialogOpen(true)}
        >
          {mappings.length > 0 ? "Edit Mappings" : "Map Speakers"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mappedSpeakers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {mappedSpeakers.map((mapping) => {
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
