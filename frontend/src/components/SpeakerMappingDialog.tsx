import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import type { SpeakerMapping, SpeakerSource, ValidationError } from "../types";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";

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

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = React.memo(
  ({ open, speakerName, onConfirm, onCancel }) => (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Speaker Removal</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to remove "{speakerName || "this speaker"}"?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Remove Speaker
        </Button>
      </DialogActions>
    </Dialog>
  )
);

ConfirmDeleteDialog.displayName = "ConfirmDeleteDialog";

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
  const {
    deleteSpeaker,
    initializeSpeakers,
    detectedSpeakers: storeDetectedSpeakers,
  } = useSpeakerStore();

  // S2.5: State for confirmation dialog and speaker management
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    speakerIndex: number;
    speakerName: string;
  }>({ open: false, speakerIndex: -1, speakerName: "" });
  const [nextSpeakerId, setNextSpeakerId] = useState(1);

  // S2.7: Edit mode state management
  const [editingMappings, setEditingMappings] = useState<Set<string>>(
    new Set()
  );
  const [originalValues, setOriginalValues] = useState<
    Map<string, { name: string; role: string }>
  >(new Map());
  const [validationErrors, setValidationErrors] = useState<
    Map<string, ValidationError[]>
  >(new Map());

  // Memoize session overrides
  const sessionOverrides = useMemo(() => {
    return sessionManager.getOverrides();
  }, [open]); // Recalculate when dialog opens

  // Memoize max number calculation - but only update when dialog opens or speakers change
  const maxNumber = useMemo(() => {
    const numbers = [
      // From detected speakers
      ...detectedSpeakers
        .map((id) => id.match(/Speaker (\d+)/))
        .filter((match) => match)
        .map((match) => parseInt(match![1], 10)),
      // From existing mappings
      ...existingMappings
        .map((m) => m.speakerId.match(/Speaker (\d+)/))
        .filter((match) => match)
        .map((match) => parseInt(match![1], 10)),
    ];

    return numbers.length > 0 ? Math.max(...numbers) : detectedSpeakers.length;
  }, [detectedSpeakers, existingMappings]); // Remove mappings dependency

  // Initialize mappings when dialog opens or existing mappings change
  useEffect(() => {
    const initializeMappings = () => {
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
      setNextSpeakerId(maxNumber + 1);
    };

    if (open) {
      initializeMappings();
      setError(null);
      setSuccess(false);
    }
  }, [open, detectedSpeakers, existingMappings, sessionOverrides, maxNumber]); // Keep maxNumber but it's now stable

  // Memoize event handlers
  // S2.5: Add new speaker functionality
  const handleAddSpeaker = useCallback(() => {
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
  }, [nextSpeakerId]);

  // S2.5: Remove speaker functionality
  const handleRemoveSpeaker = useCallback((index: number) => {
    setMappings((prevMappings) => {
      const speakerToRemove = prevMappings[index];

      // Prevent removing the last speaker
      if (prevMappings.length <= 1) {
        setError(
          "Cannot remove the last remaining speaker. At least one speaker is required."
        );
        return prevMappings;
      }

      setDeleteConfirmation({
        open: true,
        speakerIndex: index,
        speakerName: speakerToRemove.name || speakerToRemove.speakerId,
      });

      return prevMappings;
    });
  }, []);

  // S2.5: Confirm speaker removal
  const confirmRemoveSpeaker = useCallback(() => {
    const { speakerIndex } = deleteConfirmation;
    const speakerToRemove = mappings[speakerIndex];

    // Remove from local form state
    setMappings((prev) => prev.filter((_, i) => i !== speakerIndex));

    // Remove from Zustand store if it exists there
    if (speakerToRemove && deleteSpeaker) {
      deleteSpeaker(speakerToRemove.speakerId);
    }

    setDeleteConfirmation({ open: false, speakerIndex: -1, speakerName: "" });
    setError(null);
  }, [deleteConfirmation, mappings, deleteSpeaker]);

  // S2.5: Cancel speaker removal
  const cancelRemoveSpeaker = useCallback(() => {
    setDeleteConfirmation({ open: false, speakerIndex: -1, speakerName: "" });
  }, []);

  // S2.7: Edit mode helper functions
  const startEditMode = useCallback((speakerId: string) => {
    setMappings((prevMappings) => {
      const mapping = prevMappings.find((m) => m.speakerId === speakerId);
      if (mapping) {
        // Store original values for potential revert
        setOriginalValues(
          (prev) =>
            new Map(
              prev.set(speakerId, {
                name: mapping.name,
                role: mapping.role,
              })
            )
        );

        // Add to editing set
        setEditingMappings((prev) => new Set(prev.add(speakerId)));

        // Clear any existing validation errors for this speaker
        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(speakerId);
          return newErrors;
        });
      }
      return prevMappings;
    });
  }, []);

  const cancelEditMode = useCallback(
    (speakerId: string) => {
      const original = originalValues.get(speakerId);
      if (original) {
        // Revert to original values
        setMappings((prev) =>
          prev.map((mapping) =>
            mapping.speakerId === speakerId
              ? { ...mapping, name: original.name, role: original.role }
              : mapping
          )
        );

        // Remove from editing set
        setEditingMappings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(speakerId);
          return newSet;
        });

        // Clear original values and validation errors
        setOriginalValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(speakerId);
          return newMap;
        });

        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(speakerId);
          return newErrors;
        });
      }
    },
    [originalValues]
  );

  // S2.7: Validate individual speaker mapping
  const validateSpeakerMapping = useCallback(
    (mapping: MappingFormData, speakerId: string): boolean => {
      const errors: ValidationError[] = [];

      // Name validation
      if (mapping.name.trim()) {
        // Check for duplicate names (excluding current speaker)
        const duplicateName = mappings.find(
          (m) =>
            m.speakerId !== speakerId &&
            m.name.trim().toLowerCase() === mapping.name.trim().toLowerCase() &&
            m.name.trim() !== ""
        );

        if (duplicateName) {
          errors.push({
            field: "name",
            message: `Name "${mapping.name.trim()}" is already used by ${
              duplicateName.speakerId
            }`,
            speakerId,
          });
        }

        // Check for too short names
        if (mapping.name.trim().length < 2) {
          errors.push({
            field: "name",
            message: "Name must be at least 2 characters long",
            speakerId,
          });
        }

        // Check for invalid characters (basic validation)
        if (!/^[a-zA-Z\s\-'.]+$/.test(mapping.name.trim())) {
          errors.push({
            field: "name",
            message: "Name contains invalid characters",
            speakerId,
          });
        }
      }

      // Role validation (optional but if provided, should be valid)
      if (mapping.role.trim()) {
        if (mapping.role.trim().length < 2) {
          errors.push({
            field: "role",
            message: "Role must be at least 2 characters long",
            speakerId,
          });
        }

        if (!/^[a-zA-Z\s\-'.]+$/.test(mapping.role.trim())) {
          errors.push({
            field: "role",
            message: "Role contains invalid characters",
            speakerId,
          });
        }
      }

      // Update validation errors
      if (errors.length > 0) {
        setValidationErrors((prev) => new Map(prev.set(speakerId, errors)));
        return false;
      } else {
        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(speakerId);
          return newErrors;
        });
        return true;
      }
    },
    [mappings]
  );

  const confirmEditMode = useCallback(
    (speakerId: string) => {
      // Validate before confirming
      setMappings((prevMappings) => {
        const mapping = prevMappings.find((m) => m.speakerId === speakerId);
        if (mapping && validateSpeakerMapping(mapping, speakerId)) {
          // Remove from editing set
          setEditingMappings((prev) => {
            const newSet = new Set(prev);
            newSet.delete(speakerId);
            return newSet;
          });

          // Clear original values and validation errors
          setOriginalValues((prev) => {
            const newMap = new Map(prev);
            newMap.delete(speakerId);
            return newMap;
          });

          setValidationErrors((prev) => {
            const newErrors = new Map(prev);
            newErrors.delete(speakerId);
            return newErrors;
          });
        }
        return prevMappings;
      });
    },
    [validateSpeakerMapping]
  );

  // S2.7: Validate all mappings (used before save)
  const validateAllMappings = useCallback((): boolean => {
    let hasErrors = false;

    mappings.forEach((mapping) => {
      if (mapping.name.trim()) {
        // Only validate if name is provided
        const isValid = validateSpeakerMapping(mapping, mapping.speakerId);
        if (!isValid) hasErrors = true;
      }
    });

    return !hasErrors;
  }, [mappings, validateSpeakerMapping]);

  const handleMappingChange = useCallback(
    (index: number, field: "name" | "role", value: string) => {
      setMappings((prev) =>
        prev.map((mapping, i) =>
          i === index ? { ...mapping, [field]: value } : mapping
        )
      );
      setError(null);

      // S2.7: Real-time validation during edit mode
      setMappings((prevMappings) => {
        const mapping = prevMappings[index];
        if (mapping && editingMappings.has(mapping.speakerId)) {
          // Validate the updated mapping
          const updatedMapping = { ...mapping, [field]: value };
          validateSpeakerMapping(updatedMapping, mapping.speakerId);
        }
        return prevMappings;
      });
    },
    [editingMappings, validateSpeakerMapping]
  );

  const handleSave = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // S2.7: Validate all mappings before saving
      console.log("🔍 Validating mappings...", { mappings });
      const validationResult = validateAllMappings();
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
          // S2.7: Override tracking
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

      // S2.7: Clear edit state after successful save
      setEditingMappings(new Set());
      setOriginalValues(new Map());
      setValidationErrors(new Map());

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
    validateAllMappings,
    mappings,
    existingMappings,
    transcriptionId,
    initializeSpeakers,
    storeDetectedSpeakers,
    detectedSpeakers,
    onMappingsSaved,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    if (!loading) {
      // S2.7: Reset edit state when closing dialog
      setEditingMappings(new Set());
      setOriginalValues(new Map());
      setValidationErrors(new Map());
      setError(null);
      setSuccess(false);

      onClose();
    }
  }, [loading, onClose]);

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

  // S2.7: Check if there are any validation errors
  const hasValidationErrors = useMemo(() => {
    return validationErrors.size > 0;
  }, [validationErrors.size]);

  // S2.7: Check if there are any speakers currently being edited
  const hasActiveEdits = useMemo(() => {
    return editingMappings.size > 0;
  }, [editingMappings.size]);

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
            <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
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
                mapping.source === "AutoDetected" ? "default" : "secondary"
              }
              variant="outlined"
              sx={{ fontSize: "0.75rem", height: "20px" }}
            />

            {/* S2.7: Override indicator */}
            {(() => {
              const existingMapping = existingMappings.find(
                (m) => m.speakerId === mapping.speakerId
              );
              const isOverridden = existingMapping?.isOverridden;

              if (isOverridden) {
                return (
                  <Chip
                    size="small"
                    label="Overridden"
                    color="warning"
                    variant="filled"
                    sx={{
                      fontSize: "0.65rem",
                      height: "18px",
                      fontWeight: "bold",
                    }}
                  />
                );
              }
              return null;
            })()}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* S2.7: Edit/Save/Cancel buttons */}
            {editingMappings.has(mapping.speakerId) ? (
              <>
                <IconButton
                  onClick={() => confirmEditMode(mapping.speakerId)}
                  size="small"
                  color="primary"
                  title="Save Changes"
                  disabled={loading || validationErrors.has(mapping.speakerId)}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => cancelEditMode(mapping.speakerId)}
                  size="small"
                  color="default"
                  title="Cancel Edit"
                  disabled={loading}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={() => startEditMode(mapping.speakerId)}
                size="small"
                color="primary"
                title="Edit Speaker"
                disabled={loading}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}

            {/* S2.5: Remove speaker button */}
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
            onChange={(e) => handleMappingChange(index, "name", e.target.value)}
            sx={{ flex: "1 1 250px", minWidth: "200px" }}
            disabled={loading || !editingMappings.has(mapping.speakerId)}
            error={
              validationErrors.has(mapping.speakerId) &&
              validationErrors
                .get(mapping.speakerId)
                ?.some((err) => err.field === "name")
            }
            helperText={
              validationErrors.has(mapping.speakerId)
                ? validationErrors
                    .get(mapping.speakerId)
                    ?.find((err) => err.field === "name")?.message
                : editingMappings.has(mapping.speakerId)
                ? "Click save to confirm changes"
                : "Click edit button to modify"
            }
            variant={
              editingMappings.has(mapping.speakerId) ? "outlined" : "filled"
            }
          />

          <TextField
            label="Role (Optional)"
            placeholder="e.g., Product Manager"
            value={mapping.role}
            onChange={(e) => handleMappingChange(index, "role", e.target.value)}
            sx={{ flex: "1 1 200px", minWidth: "150px" }}
            disabled={loading || !editingMappings.has(mapping.speakerId)}
            error={
              validationErrors.has(mapping.speakerId) &&
              validationErrors
                .get(mapping.speakerId)
                ?.some((err) => err.field === "role")
            }
            helperText={
              validationErrors.has(mapping.speakerId)
                ? validationErrors
                    .get(mapping.speakerId)
                    ?.find((err) => err.field === "role")?.message
                : editingMappings.has(mapping.speakerId)
                ? "Click save to confirm changes"
                : "Click edit button to modify"
            }
            variant={
              editingMappings.has(mapping.speakerId) ? "outlined" : "filled"
            }
          />
        </Box>
      </Box>
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
    handleRemoveSpeaker,
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
        onConfirm={confirmRemoveSpeaker}
        onCancel={cancelRemoveSpeaker}
      />
    </>
  );
};

export default SpeakerMappingDialog;
