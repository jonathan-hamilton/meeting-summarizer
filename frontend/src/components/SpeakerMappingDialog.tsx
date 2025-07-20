import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { apiService } from "../services/apiService";
import type { SpeakerMapping, SpeakerMappingRequest } from "../types";

interface SpeakerMappingDialogProps {
  open: boolean;
  onClose: () => void;
  transcriptionId: string;
  detectedSpeakers: string[]; // e.g., ['Speaker 1', 'Speaker 2', 'Speaker 3']
  existingMappings?: SpeakerMapping[];
  onMappingsSaved?: (mappings: SpeakerMapping[]) => void;
}

interface MappingFormData {
  speakerId: string;
  name: string;
  role: string;
}

export const SpeakerMappingDialog: React.FC<SpeakerMappingDialogProps> = ({
  open,
  onClose,
  transcriptionId,
  detectedSpeakers,
  existingMappings = [],
  onMappingsSaved,
}) => {
  const [mappings, setMappings] = useState<MappingFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize mappings when dialog opens or existing mappings change
  useEffect(() => {
    const initializeMappings = () => {
      const initialMappings: MappingFormData[] = detectedSpeakers.map(
        (speakerId) => {
          const existing = existingMappings.find(
            (m) => m.speakerId === speakerId
          );
          return {
            speakerId,
            name: existing?.name || "",
            role: existing?.role || "",
          };
        }
      );
      setMappings(initialMappings);
    };

    if (open) {
      initializeMappings();
      setError(null);
      setSuccess(false);
    }
  }, [open, detectedSpeakers, existingMappings]);

  const handleMappingChange = (
    index: number,
    field: "name" | "role",
    value: string
  ) => {
    setMappings((prev) =>
      prev.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping
      )
    );
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter out mappings with empty names (optional mappings)
      const validMappings = mappings.filter((m) => m.name.trim() !== "");

      if (validMappings.length === 0) {
        setError("Please provide at least one speaker name mapping.");
        return;
      }

      // Convert to API format
      const speakerMappings: SpeakerMapping[] = validMappings.map(
        (mapping) => ({
          speakerId: mapping.speakerId,
          name: mapping.name.trim(),
          role: mapping.role.trim() || "Participant", // Default role if empty
          transcriptionId,
        })
      );

      const request: SpeakerMappingRequest = {
        transcriptionId,
        mappings: speakerMappings,
      };

      // Save via API
      const response = await apiService.saveSpeakerMappings(request);

      setSuccess(true);

      // Notify parent component
      if (onMappingsSaved && response.data) {
        onMappingsSaved(response.data.mappings);
      }

      // Close dialog after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save speaker mappings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save speaker mappings"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const hasChanges = mappings.some((m) => m.name.trim() !== "");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "400px" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Map Speakers to Names</Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Assign real names and roles to the detected speakers in this meeting
          transcription. This will make the transcript easier to read and
          understand.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Speaker mappings saved successfully!
          </Alert>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Detected Speakers:
          </Typography>
          {detectedSpeakers.map((speaker) => (
            <Chip
              key={speaker}
              label={speaker}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {mappings.map((mapping, index) => (
            <Box
              key={mapping.speakerId}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "primary.main" }}
              >
                {mapping.speakerId}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Full Name"
                  placeholder="e.g., John Smith"
                  value={mapping.name}
                  onChange={(e) =>
                    handleMappingChange(index, "name", e.target.value)
                  }
                  sx={{ flex: "1 1 250px", minWidth: "200px" }}
                  disabled={loading}
                />

                <TextField
                  label="Role (Optional)"
                  placeholder="e.g., Product Manager"
                  value={mapping.role}
                  onChange={(e) =>
                    handleMappingChange(index, "role", e.target.value)
                  }
                  sx={{ flex: "1 1 200px", minWidth: "150px" }}
                  disabled={loading}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {mappings.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No speakers detected in this transcription.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !hasChanges}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? "Saving..." : "Save Mappings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SpeakerMappingDialog;
