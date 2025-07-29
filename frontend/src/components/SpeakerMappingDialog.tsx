import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import type { SpeakerMapping, SpeakerSource } from "../types";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";
import { ConfirmDeleteDialog } from "./dialogs/ConfirmDeleteDialog";
import { SpeakerMappingField } from "./speaker/SpeakerMappingField";
import { useSpeakerValidation } from "../hooks/useSpeakerValidation";
import { useSpeakerEditMode } from "../hooks/useSpeakerEditMode";
import { useSpeakerManagement } from "../hooks/useSpeakerManagement";

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
  source: SpeakerSource;
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

  // Use Zustand store for speaker management
  const { initializeSpeakers, detectedSpeakers: storeDetectedSpeakers } =
    useSpeakerStore();

  // Use speaker management hook
  const {
    deleteConfirmation,
    handleAddSpeaker,
    handleRemoveSpeaker,
    confirmRemoveSpeaker,
    cancelRemoveSpeaker,
  } = useSpeakerManagement();

  // Use validation hook for validation logic
  const {
    validationErrors,
    hasValidationErrors,
    validateSingleMapping,
    validateAllSpeakerMappings,
    clearValidationErrors,
  } = useSpeakerValidation();

  // Create wrapper function for validation that matches hook signature
  const validateForEditMode = useCallback(
    (mapping: MappingFormData, speakerId: string): boolean => {
      return validateSingleMapping(mapping, speakerId, mappings);
    },
    [validateSingleMapping, mappings]
  );

  // Use edit mode hook for edit state management
  const {
    editingMappings,
    startEditMode,
    cancelEditMode,
    confirmEditMode,
    clearEditState,
    hasActiveEdits,
  } = useSpeakerEditMode(
    setMappings,
    clearValidationErrors,
    validateForEditMode
  );

  // Initialize mappings when dialog opens or existing mappings change
  useEffect(() => {
    const initializeMappings = () => {
      // Get session overrides only when initializing
      const sessionOverrides = sessionManager.getOverrides();

      const initialMappings: MappingFormData[] = detectedSpeakers.map(
        (speakerId) => {
          const existing = existingMappings.find(
            (m) => m.speakerId === speakerId
          );

          // Check for session override first
          const override = sessionOverrides[speakerId];
          let name = existing?.name || "";

          // If there's a session override, use that name
          if (override && override.action === "Override" && override.newValue) {
            name = override.newValue;
          }

          return {
            speakerId,
            name: name,
            role: existing?.role || "",
            source: existing?.source || "AutoDetected",
          };
        }
      );

      // Add manually-added speakers from existing mappings
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
    };

    if (open) {
      initializeMappings();
      setError(null);
      setSuccess(false);
    }
  }, [open, detectedSpeakers, existingMappings]);

  // Direct event handlers (simplified from wrapper functions)
  const handleAddSpeakerLocal = useCallback(() => {
    const newMapping = handleAddSpeaker();
    setMappings((prev) => [...prev, newMapping]);
    setError(null);
  }, [handleAddSpeaker]);

  const handleRemoveSpeakerLocal = useCallback(
    (index: number) => {
      const speakerToRemove = mappings[index];
      handleRemoveSpeaker(index, speakerToRemove, mappings.length, setError);
    },
    [mappings, handleRemoveSpeaker]
  );

  const confirmRemoveSpeakerLocal = useCallback(() => {
    confirmRemoveSpeaker(setMappings, setError);
  }, [confirmRemoveSpeaker]);

  const handleMappingChange = useCallback(
    (index: number, field: "name" | "role", value: string) => {
      setMappings((prev) =>
        prev.map((mapping, i) =>
          i === index ? { ...mapping, [field]: value } : mapping
        )
      );
      setError(null);

      // Real-time validation during edit mode
      setMappings((prevMappings) => {
        const mapping = prevMappings[index];
        if (mapping && editingMappings.has(mapping.speakerId)) {
          // Validate the updated mapping
          const updatedMapping = { ...mapping, [field]: value };
          validateSingleMapping(
            updatedMapping,
            mapping.speakerId,
            prevMappings
          );
        }
        return prevMappings;
      });
    },
    [editingMappings, validateSingleMapping]
  );

  const handleSave = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Validate all mappings before saving
      console.log("🔍 Validating mappings...", { mappings });
      const validationResult = validateAllSpeakerMappings(mappings);
      console.log("🔍 Validation result:", validationResult);

      if (!validationResult) {
        console.log("❌ Validation failed");
        setError("Please fix validation errors before saving.");
        return;
      }

      // Convert to SpeakerMapping format for the store and parent callback
      const speakerMappings: SpeakerMapping[] = mappings.map((mapping) => {
        const existingMapping = existingMappings.find(
          (m) => m.speakerId === mapping.speakerId
        );
        const originalName =
          existingMapping?.originalName || existingMapping?.name;
        const originalRole =
          existingMapping?.originalRole || existingMapping?.role;

        // Check if this mapping has been overridden
        const hasNameChange =
          existingMapping &&
          originalName &&
          originalName !== mapping.name.trim();
        const hasRoleChange =
          existingMapping &&
          originalRole &&
          originalRole !== mapping.role.trim();
        const isOverridden =
          hasNameChange || hasRoleChange || existingMapping?.isOverridden;

        return {
          speakerId: mapping.speakerId,
          name: mapping.name.trim(),
          role: mapping.role.trim() || "Participant", // Default role if empty
          transcriptionId,
          source: mapping.source,
          // Override tracking
          originalName: isOverridden
            ? originalName || existingMapping?.name
            : undefined,
          originalRole: isOverridden
            ? originalRole || existingMapping?.role
            : undefined,
          isOverridden: isOverridden || false,
          overriddenAt: isOverridden ? new Date().toISOString() : undefined,
        };
      });

      // Update Zustand store with the mappings (session-only persistence)
      if (initializeSpeakers) {
        const currentDetectedSpeakers =
          storeDetectedSpeakers.length > 0
            ? storeDetectedSpeakers
            : detectedSpeakers;
        initializeSpeakers(
          transcriptionId,
          currentDetectedSpeakers,
          speakerMappings
        );
      }

      // Notify parent component
      if (onMappingsSaved) {
        console.log(
          "✅ SpeakerMappingDialog: Calling onMappingsSaved callback"
        );
        onMappingsSaved(speakerMappings);
        console.log("✅ SpeakerMappingDialog: Callback completed");
      }

      setSuccess(true);

      // Clear edit state after successful save
      clearEditState();
      clearValidationErrors();

      // Close dialog after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to save speaker mappings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save speaker mappings"
      );
    } finally {
      setLoading(false);
    }
  }, [
    validateAllSpeakerMappings,
    mappings,
    existingMappings,
    transcriptionId,
    initializeSpeakers,
    storeDetectedSpeakers,
    detectedSpeakers,
    onMappingsSaved,
    onClose,
    clearValidationErrors,
    clearEditState,
  ]);

  const handleClose = useCallback(() => {
    if (!loading) {
      // Reset edit state when closing dialog
      clearEditState();
      clearValidationErrors();
      setError(null);
      setSuccess(false);

      onClose();
    }
  }, [loading, onClose, clearValidationErrors, clearEditState]);

  // Memoize computed values
  // Check if there are changes (names filled, new speakers added, or any modification from original)
  const hasChanges = useMemo(() => {
    return (
      mappings.some((m) => m.name.trim() !== "") ||
      mappings.length > detectedSpeakers.length ||
      mappings.length !== existingMappings.length ||
      mappings.some((m, i) => {
        const existing = existingMappings[i];
        return (
          !existing ||
          existing.speakerId !== m.speakerId ||
          existing.name !== m.name ||
          existing.role !== m.role
        );
      })
    );
  }, [mappings, detectedSpeakers.length, existingMappings]);

  // Memoize UI components
  const speakerChips = useMemo(() => {
    return mappings.map((mapping) => (
      <Chip
        key={mapping.speakerId}
        label={mapping.speakerId}
        size="small"
        variant="outlined"
        icon={
          mapping.source === "AutoDetected" ? <MicIcon /> : <PersonAddIcon />
        }
        color={mapping.source === "AutoDetected" ? "default" : "secondary"}
      />
    ));
  }, [mappings]);

  const mappingFields = useMemo(() => {
    return mappings.map((mapping, index) => (
      <SpeakerMappingField
        key={`${mapping.speakerId}-${index}`}
        mapping={mapping}
        index={index}
        isEditing={editingMappings.has(mapping.speakerId)}
        isLoading={loading}
        validationErrors={validationErrors.get(mapping.speakerId) || []}
        canRemove={mappings.length > 1}
        existingMapping={existingMappings.find(
          (m) => m.speakerId === mapping.speakerId
        )}
        onMappingChange={handleMappingChange}
        onStartEdit={startEditMode}
        onConfirmEdit={confirmEditMode}
        onCancelEdit={cancelEditMode}
        onRemove={handleRemoveSpeakerLocal}
      />
    ));
  }, [
    mappings,
    existingMappings,
    editingMappings,
    validationErrors,
    loading,
    confirmEditMode,
    cancelEditMode,
    startEditMode,
    handleRemoveSpeakerLocal,
    handleMappingChange,
  ]);

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
            {speakerChips}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* S2.5: Add Speaker Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={handleAddSpeakerLocal}
              startIcon={<PersonAddIcon />}
              variant="outlined"
              size="small"
              disabled={loading}
            >
              Add Speaker
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {mappingFields}
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
          {/* S2.7: Validation status display */}
          {hasValidationErrors && (
            <Box sx={{ flex: 1, mr: 2 }}>
              <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
                Please fix validation errors before saving
              </Alert>
            </Box>
          )}

          {hasActiveEdits && !hasValidationErrors && (
            <Box sx={{ flex: 1, mr: 2 }}>
              <Alert severity="info" variant="outlined" sx={{ py: 0 }}>
                Complete active edits before saving all changes
              </Alert>
            </Box>
          )}

          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              loading || !hasChanges || hasValidationErrors || hasActiveEdits
            }
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            title={
              hasValidationErrors
                ? "Please fix validation errors before saving"
                : hasActiveEdits
                ? "Please save or cancel active edits before saving all changes"
                : loading
                ? "Saving..."
                : "Save Mappings"
            }
          >
            {loading ? "Saving..." : "Save Mappings"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* S2.5: Confirmation dialog for speaker removal */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.open}
        speakerName={deleteConfirmation.speakerName}
        onConfirm={confirmRemoveSpeakerLocal}
        onCancel={cancelRemoveSpeaker}
      />
    </>
  );
};

export default SpeakerMappingDialog;
