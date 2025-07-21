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
  Delete as DeleteIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { apiService } from "../services/apiService";
import type {
  SpeakerMapping,
  SpeakerMappingRequest,
  SpeakerSource,
} from "../types";

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
  source: SpeakerSource; // S2.5: Track speaker origin
}

// S2.5: Confirmation dialog component
interface ConfirmDeleteDialogProps {
  open: boolean;
  speakerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  speakerName,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
    <DialogTitle>Confirm Speaker Removal</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to remove "{speakerName || "this speaker"}"? This
        action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Remove Speaker
      </Button>
    </DialogActions>
  </Dialog>
);

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

  // S2.5: State for confirmation dialog and speaker management
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    speakerIndex: number;
    speakerName: string;
  }>({ open: false, speakerIndex: -1, speakerName: "" });
  const [nextSpeakerId, setNextSpeakerId] = useState(1);

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
            source: existing?.source || "AutoDetected", // S2.5: Default to auto-detected
          };
        }
      );

      // S2.5: Add any manually-added speakers from existing mappings
      const manualSpeakers = existingMappings
        .filter(
          (existing) =>
            existing.source === "ManuallyAdded" &&
            !detectedSpeakers.includes(existing.speakerId)
        )
        .map((existing) => ({
          speakerId: existing.speakerId,
          name: existing.name,
          role: existing.role,
          source: "ManuallyAdded" as SpeakerSource,
        }));

      const allMappings = [...initialMappings, ...manualSpeakers];
      setMappings(allMappings);

      // S2.5: Calculate next speaker ID for manual additions
      const existingSpeakerNumbers = allMappings
        .map((m) => m.speakerId.match(/Speaker (\d+)/))
        .filter((match) => match)
        .map((match) => parseInt(match![1], 10));

      const maxNumber =
        existingSpeakerNumbers.length > 0
          ? Math.max(...existingSpeakerNumbers)
          : detectedSpeakers.length;
      setNextSpeakerId(maxNumber + 1);
    };

    if (open) {
      initializeMappings();
      setError(null);
      setSuccess(false);
    }
  }, [open, detectedSpeakers, existingMappings]);

  // S2.5: Add new speaker functionality
  const handleAddSpeaker = () => {
    const newSpeakerId = `Speaker ${nextSpeakerId}`;
    const newMapping: MappingFormData = {
      speakerId: newSpeakerId,
      name: "",
      role: "",
      source: "ManuallyAdded",
    };

    setMappings((prev) => [...prev, newMapping]);
    setNextSpeakerId((prev) => prev + 1);
    setError(null);
  };

  // S2.5: Remove speaker functionality
  const handleRemoveSpeaker = (index: number) => {
    const speakerToRemove = mappings[index];

    // Prevent removing the last speaker
    if (mappings.length <= 1) {
      setError(
        "Cannot remove the last remaining speaker. At least one speaker is required."
      );
      return;
    }

    setDeleteConfirmation({
      open: true,
      speakerIndex: index,
      speakerName: speakerToRemove.name || speakerToRemove.speakerId,
    });
  };

  // S2.5: Confirm speaker removal
  const confirmRemoveSpeaker = () => {
    const { speakerIndex } = deleteConfirmation;
    setMappings((prev) => prev.filter((_, i) => i !== speakerIndex));
    setDeleteConfirmation({ open: false, speakerIndex: -1, speakerName: "" });
    setError(null);
  };

  // S2.5: Cancel speaker removal
  const cancelRemoveSpeaker = () => {
    setDeleteConfirmation({ open: false, speakerIndex: -1, speakerName: "" });
  };

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

      // S2.5: Convert to API format with source tracking
      const speakerMappings: SpeakerMapping[] = validMappings.map(
        (mapping) => ({
          speakerId: mapping.speakerId,
          name: mapping.name.trim(),
          role: mapping.role.trim() || "Participant", // Default role if empty
          transcriptionId,
          source: mapping.source, // S2.5: Include source information
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
    <>
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
            transcription. You can add or remove speakers as needed.
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
              Auto-detected Speakers:
            </Typography>
            {detectedSpeakers.map((speaker) => (
              <Chip
                key={speaker}
                label={speaker}
                size="small"
                variant="outlined"
                icon={<MicIcon />}
              />
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* S2.5: Add Speaker Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={handleAddSpeaker}
              startIcon={<PersonAddIcon />}
              variant="outlined"
              size="small"
              disabled={loading}
            >
              Add Speaker
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {mappings.map((mapping, index) => (
              <Box
                key={`${mapping.speakerId}-${index}`}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: "background.paper",
                  position: "relative",
                }}
              >
                {/* S2.5: Speaker header with source indicator and remove button */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "primary.main" }}
                    >
                      {mapping.speakerId}
                    </Typography>
                    {/* S2.5: Visual indicator for speaker source */}
                    <Chip
                      size="small"
                      label={
                        mapping.source === "AutoDetected"
                          ? "Auto-detected"
                          : "Manually Added"
                      }
                      icon={
                        mapping.source === "AutoDetected" ? (
                          <MicIcon />
                        ) : (
                          <PersonAddIcon />
                        )
                      }
                      color={
                        mapping.source === "AutoDetected"
                          ? "default"
                          : "secondary"
                      }
                      variant="outlined"
                      sx={{ fontSize: "0.75rem", height: "20px" }}
                    />
                  </Box>

                  {/* S2.5: Remove speaker button */}
                  <Box>
                    <IconButton
                      onClick={() => handleRemoveSpeaker(index)}
                      size="small"
                      disabled={loading || mappings.length <= 1}
                      color="error"
                      title="Remove Speaker"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

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
                No speakers available. Click "Add Speaker" to add one.
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

      {/* S2.5: Confirmation dialog for speaker removal */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.open}
        speakerName={deleteConfirmation.speakerName}
        onConfirm={confirmRemoveSpeaker}
        onCancel={cancelRemoveSpeaker}
      />
    </>
  );
};

export default SpeakerMappingDialog;
