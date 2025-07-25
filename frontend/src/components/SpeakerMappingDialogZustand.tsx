import React, { useEffect } from "react";
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
  Chip,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useSpeakerMappingStore } from "../stores/speakerMappingStore";
import { apiService } from "../services/apiService";
import type { SpeakerMapping } from "../types";
import { ErrorBoundary } from "./ErrorBoundary";

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

interface SpeakerMappingDialogProps {
  open: boolean;
  onClose: () => void;
  transcriptionId: string;
  detectedSpeakers: string[];
  existingMappings?: SpeakerMapping[];
  onMappingsSaved?: (mappings: SpeakerMapping[]) => void;
}

export const SpeakerMappingDialog: React.FC<SpeakerMappingDialogProps> = ({
  open,
  onClose,
  transcriptionId,
  detectedSpeakers,
  existingMappings = [],
  onMappingsSaved,
}) => {
  const {
    // State
    mappings,
    loading,
    error,
    success,
    editingMappings,
    validationErrors,
    deleteConfirmation,
    hasChanges,
    hasValidationErrors,
    hasActiveEdits,

    // Actions
    initializeMappings,
    updateMapping,
    addSpeaker,
    removeSpeaker,
    confirmRemoveSpeaker,
    cancelRemoveSpeaker,
    startEditMode,
    saveEdit,
    cancelEdit,
    setLoading,
    setError,
    setSuccess,
    validateAllMappings,
    reset,
  } = useSpeakerMappingStore();

  // Initialize mappings when dialog opens
  useEffect(() => {
    if (open) {
      initializeMappings(detectedSpeakers, existingMappings, transcriptionId);
    }
  }, [
    open,
    detectedSpeakers,
    existingMappings,
    transcriptionId,
    initializeMappings,
  ]);

  // Handle save mappings
  const handleSave = async () => {
    if (!validateAllMappings()) {
      setError("Please fix validation errors before saving");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have any mappings with names
      const namedMappings = mappings.filter((m) => m.name.trim() !== "");

      if (namedMappings.length === 0) {
        // Pure deletion case - use delete endpoint
        const response = await apiService.deleteSpeakerMappings(
          transcriptionId
        );

        if (response.success) {
          setSuccess(true);
          // When deleting all mappings, pass empty array to parent
          onMappingsSaved?.([]);
          // Don't close automatically - let user click Close button
        } else {
          setError(response.message || "Failed to delete speaker mappings");
        }
      } else {
        // Save named mappings case
        const response = await apiService.saveSpeakerMappings({
          transcriptionId,
          mappings: namedMappings.map((m) => ({
            speakerId: m.speakerId,
            name: m.name,
            role: m.role,
            source: m.source,
          })),
        });

        if (response.success) {
          setSuccess(true);
          // Pass the saved mappings to parent
          onMappingsSaved?.(
            namedMappings.map((m) => ({
              speakerId: m.speakerId,
              name: m.name,
              role: m.role,
              source: m.source,
            }))
          );
          // Don't close automatically - let user click Close button
        } else {
          setError(response.message || "Failed to save speaker mappings");
        }
      }
    } catch (err) {
      console.error("Error saving speaker mappings:", err);
      setError("An unexpected error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  const handleInputChange = (
    speakerId: string,
    field: "name" | "role",
    value: string
  ) => {
    updateMapping(speakerId, field, value);
  };

  const handleSaveEdit = (speakerId: string) => {
    if (validateAllMappings()) {
      saveEdit(speakerId);
    }
  };

  const getFieldError = (
    speakerId: string,
    field: "name" | "role"
  ): string | undefined => {
    if (!validationErrors || !speakerId) return undefined;
    const errors = validationErrors.get(speakerId);
    return errors?.find((err) => err.field === field)?.message;
  };

  return (
    <ErrorBoundary
      onReset={() => {
        console.log("🔄 Error boundary reset - resetting store state");
        reset();
      }}
    >
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
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Map Speakers to Names</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign real names and roles to the detected speakers in this meeting
            transcription. You can add or remove speakers as needed.
          </Typography>

          {!success && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Auto-detected Speakers:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {mappings &&
                    mappings.length > 0 &&
                    mappings
                      .filter(
                        (mapping) =>
                          mapping && mapping.source === "AutoDetected"
                      )
                      .map(
                        (mapping) =>
                          mapping && (
                            <Chip
                              key={mapping.speakerId}
                              label={mapping.speakerId}
                              variant="outlined"
                              size="small"
                              icon={<PersonAddIcon />}
                            />
                          )
                      )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Speaker Mappings
                </Typography>
                <Button
                  startIcon={<PersonAddIcon />}
                  onClick={addSpeaker}
                  variant="outlined"
                  size="small"
                >
                  Add Speaker
                </Button>
              </Box>
            </>
          )}

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

          {!success && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {mappings &&
                mappings.length > 0 &&
                mappings.map((mapping, index) => {
                  if (!mapping || !mapping.speakerId) return null;

                  const isEditing = editingMappings
                    ? editingMappings.has(mapping.speakerId)
                    : false;
                  const nameError = getFieldError(mapping.speakerId, "name");
                  const roleError = getFieldError(mapping.speakerId, "role");

                  return (
                    <Box
                      key={mapping.speakerId}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        backgroundColor: isEditing
                          ? "action.hover"
                          : "transparent",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minWidth: 120,
                        }}
                      >
                        <Typography
                          variant="body1"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        >
                          {mapping.speakerId}
                        </Typography>
                        <Chip
                          label={
                            mapping.source === "AutoDetected"
                              ? "Auto-detected"
                              : "Manually Added"
                          }
                          size="small"
                          variant="outlined"
                          color={
                            mapping.source === "AutoDetected"
                              ? "primary"
                              : "secondary"
                          }
                        />
                      </Box>

                      <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
                        <TextField
                          label="Full Name"
                          value={mapping.name}
                          onChange={(e) =>
                            handleInputChange(
                              mapping.speakerId,
                              "name",
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          size="small"
                          sx={{ flex: 1 }}
                          error={!!nameError}
                          helperText={
                            nameError || "Click edit button to modify"
                          }
                        />
                        <TextField
                          label="Role (Optional)"
                          value={mapping.role}
                          onChange={(e) =>
                            handleInputChange(
                              mapping.speakerId,
                              "role",
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          size="small"
                          sx={{ flex: 1 }}
                          error={!!roleError}
                          helperText={
                            roleError || "Click edit button to modify"
                          }
                        />
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        {isEditing ? (
                          <>
                            <IconButton
                              onClick={() => handleSaveEdit(mapping.speakerId)}
                              color="primary"
                              size="small"
                              title="Save changes"
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => cancelEdit(mapping.speakerId)}
                              color="secondary"
                              size="small"
                              title="Cancel changes"
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              onClick={() => startEditMode(mapping.speakerId)}
                              color="primary"
                              size="small"
                              title="Edit speaker"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => removeSpeaker(index)}
                              color="error"
                              size="small"
                              title="Remove speaker"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {success ? (
            <Button onClick={handleClose} variant="contained" color="success">
              Close
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={
                loading || !hasChanges || hasValidationErrors || hasActiveEdits
              }
            >
              {loading ? "Saving..." : "Save Mappings"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteConfirmation.open}
        speakerName={deleteConfirmation.speakerName}
        onConfirm={confirmRemoveSpeaker}
        onCancel={cancelRemoveSpeaker}
      />
    </ErrorBoundary>
  );
};

export default SpeakerMappingDialog;
