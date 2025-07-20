import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Person as PersonIcon, Edit as EditIcon } from "@mui/icons-material";
import { apiService } from "../services/apiService";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import type { SpeakerMapping } from "../types";

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

  const unmappedSpeakers = detectedSpeakers.filter(
    (speaker) => !mappings.some((m) => m.speakerId === speaker)
  );

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

      {mappings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {mappings.map((mapping) => (
              <Chip
                key={mapping.speakerId}
                label={`${mapping.speakerId} → ${mapping.name}${
                  mapping.role ? ` (${mapping.role})` : ""
                }`}
                variant="filled"
                color="primary"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {unmappedSpeakers.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Unmapped Speakers:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {unmappedSpeakers.map((speaker) => (
              <Chip
                key={speaker}
                label={speaker}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {detectedSpeakers.length === 0 && (
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
