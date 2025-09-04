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
import { useSpeakerSessionStore } from "../stores/speakerSessionStore";
import { getSpeakerColor } from "../theme/speakerColors";
import { ConfirmDeleteDialog } from "./dialogs/ConfirmDeleteDialog";
import { SpeakerMappingField } from "./speaker/SpeakerMappingField";
import { useSpeakerValidation } from "../hooks/useSpeakerValidation";
import { useAppMode } from "../contexts/AppModeContext";
import { useTourStore } from "../stores/tourStore";
import { TourPopover } from "./TourPopover";

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
  email?: string; // S3.4: Optional email field
}

export const SpeakerMappingDialog: React.FC<SpeakerMappingDialogProps> = ({
  open,
  onClose,
  transcriptionId,
  detectedSpeakers,
  existingMappings = [],
  onMappingsSaved,
}) => {
  const { isDemo } = useAppMode();
  const { isActive: isTourActive, isCurrentStep, closeStep, triggerStepAction } = useTourStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Track the baseline mappings for change detection
  const [baselineMappings, setBaselineMappings] = useState<SpeakerMapping[]>([]);

  // Use centralized store for real-time speaker management
  const speakerMappings = useSpeakerSessionStore(state => state.speakerMappings);
  const addSpeakerMapping = useSpeakerSessionStore(state => state.addSpeakerMapping);
  const updateSpeakerMapping = useSpeakerSessionStore(state => state.updateSpeakerMapping);
  const deleteSpeakerMapping = useSpeakerSessionStore(state => state.deleteSpeakerMapping);
  
  // Compatibility functions
  const initializeSpeakers = (transcriptionId: string, detectedSpeakers: string[], existingMappings: SpeakerMapping[] = []) => {
    // Only add mappings that don't already exist to avoid clearing and re-adding
    existingMappings.forEach(mapping => {
      const existingMapping = speakerMappings.find(m => m.speakerId === mapping.speakerId && m.transcriptionId === transcriptionId);
      if (!existingMapping) {
        addSpeakerMapping(mapping);
      }
    });
  };
  
  const addSpeakerToStore = (speakerId: string, name: string, role?: string) => {
    addSpeakerMapping({
      speakerId,
      name,
      role: role || '',
      transcriptionId,
      source: 'ManuallyAdded',
      email: ''
    });
  };
  
  const updateSpeakerInStore = (speakerId: string, updates: Partial<SpeakerMapping>) => {
    updateSpeakerMapping(speakerId, updates);
  };
  
  const deleteSpeakerFromStore = (speakerId: string) => {
    deleteSpeakerMapping(speakerId);
  };
  
  const getAllMappings = () => {
    return speakerMappings;
  };

  // Convert Zustand store data to local format for UI compatibility
  const mappings: MappingFormData[] = useMemo(() => {
    return speakerMappings.map(mapping => ({
      speakerId: mapping.speakerId,
      name: mapping.name,
      role: mapping.role,
      source: mapping.source || 'AutoDetected' as SpeakerSource,
      email: mapping.email // S3.4: Include email field
    }));
  }, [speakerMappings]);

  // Simple state management for dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    speakerIndex: -1,
    speakerName: "",
    speakerId: "",
  });

  // Use validation hook for validation logic
  const {
    validationErrors,
    hasValidationErrors,
    validateSingleMapping,
    validateAllSpeakerMappings,
    clearValidationErrors,
  } = useSpeakerValidation();

  // Use edit mode hook for edit state management - simplified for Zustand
  const [editingMappings, setEditingMappings] = useState<Set<string>>(new Set());
  const [originalValues, setOriginalValues] = useState<Map<string, { name: string; role: string }>>(new Map());

  // Simplified edit mode functions that work with Zustand
  const startEditMode = useCallback((speakerId: string) => {
    const mapping = mappings.find(m => m.speakerId === speakerId);
    if (mapping) {
      setOriginalValues(prev => new Map(prev.set(speakerId, {
        name: mapping.name,
        role: mapping.role,
      })));
      setEditingMappings(prev => new Set(prev.add(speakerId)));
      clearValidationErrors(speakerId);
    }
  }, [mappings, clearValidationErrors]);

  const cancelEditMode = useCallback((speakerId: string) => {
    const original = originalValues.get(speakerId);
    if (original) {
      updateSpeakerInStore(speakerId, {
        name: original.name,
        role: original.role,
      });
    }
    setEditingMappings(prev => {
      const newSet = new Set(prev);
      newSet.delete(speakerId);
      return newSet;
    });
    setOriginalValues(prev => {
      const newMap = new Map(prev);
      newMap.delete(speakerId);
      return newMap;
    });
    clearValidationErrors(speakerId);
  }, [originalValues, updateSpeakerInStore, clearValidationErrors]);

  const confirmEditMode = useCallback((speakerId: string) => {
    setEditingMappings(prev => {
      const newSet = new Set(prev);
      newSet.delete(speakerId);
      return newSet;
    });
    setOriginalValues(prev => {
      const newMap = new Map(prev);
      newMap.delete(speakerId);
      return newMap;
    });
  }, []);

  const clearEditState = useCallback(() => {
    setEditingMappings(new Set());
    setOriginalValues(new Map());
  }, []);

  const hasActiveEdits = editingMappings.size > 0;

  // Initialize mappings when dialog opens or existing mappings change
  useEffect(() => {
    if (!open || !transcriptionId || detectedSpeakers.length === 0) return;

    const initializeMappings = () => {
      // Get session overrides only when initializing
      const sessionOverrides = sessionManager.getOverrides();

      // Get current mappings from the store (they may have been updated by previous saves)
      const currentStoreMappings = getAllMappings();
      
      console.log('🔄 Dialog initialization - currentStoreMappings:', currentStoreMappings);
      console.log('🔄 Dialog initialization - existingMappings:', existingMappings);
      console.log('🔄 Dialog initialization - detectedSpeakers:', detectedSpeakers);

      // Check if we already have mappings for all detected speakers in this session
      const hasAllMappings = detectedSpeakers.every(speakerId => 
        currentStoreMappings.find(m => m.speakerId === speakerId && m.transcriptionId === transcriptionId)
      );

      if (hasAllMappings) {
        console.log('🔄 Dialog initialization - speakers already mapped, skipping initialization');
        // Still set baseline mappings for change detection
        const existingForDialog = currentStoreMappings.filter(m => m.transcriptionId === transcriptionId);
        setBaselineMappings([...existingForDialog]);
        return;
      }

      // Create mappings for detected speakers
      const initialMappings: SpeakerMapping[] = detectedSpeakers.map(
        (speakerId) => {
          // First check current store mappings, then fallback to existingMappings
          const storeMapping = currentStoreMappings.find(m => m.speakerId === speakerId);
          const existing = storeMapping || existingMappings.find(
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
            name: name || speakerId, // S3.4: Default to speakerId if no name mapped
            role: existing?.role || "Role", // S3.4: Default to "Role" to match transcript consistency
            source: existing?.source || "AutoDetected" as SpeakerSource,
            transcriptionId: existing?.transcriptionId || transcriptionId,
            email: existing?.email, // S3.4: Include email field from existing mappings
          };
        }
      );

      // Add manually-added speakers from store mappings first, then from existing mappings
      const storeManualSpeakers = currentStoreMappings.filter(
        (mapping) =>
          mapping.source === "ManuallyAdded" &&
          !detectedSpeakers.includes(mapping.speakerId)
      );
      
      const existingManualSpeakers = existingMappings
        .filter(
          (existing) =>
            existing.source === "ManuallyAdded" &&
            !detectedSpeakers.includes(existing.speakerId) &&
            !storeManualSpeakers.find(s => s.speakerId === existing.speakerId)
        );

      const allMappings = [...initialMappings, ...storeManualSpeakers, ...existingManualSpeakers];
      
      console.log('🔄 Dialog initialization - final allMappings:', allMappings);
      
      // Initialize Zustand store with all mappings - use original detectedSpeakers
      initializeSpeakers(
        transcriptionId,
        detectedSpeakers,
        allMappings
      );
      
      // Capture baseline after initialization for change detection
      setBaselineMappings([...allMappings]);
    };

    initializeMappings();
    setError(null);
    setSuccess(false);
  }, [open, transcriptionId, detectedSpeakers.join(',')]); // Use join to create stable dependency

  // Simple functions for speaker management
  const handleAddSpeaker = useCallback(() => {
    // Calculate next speaker ID
    const existingSpeakerNumbers = mappings.map((mapping) => {
      const match = mapping.speakerId.match(/speaker_(\d+)/i) || mapping.speakerId.match(/Speaker (\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = Math.max(0, ...existingSpeakerNumbers);
    const newSpeakerId = `Speaker ${maxNumber + 1}`;
    
    return {
      speakerId: newSpeakerId,
      name: "",
      role: "",
      source: "ManuallyAdded" as SpeakerSource,
    };
  }, [mappings]);

  const handleRemoveSpeaker = useCallback((index: number, speakerToRemove: MappingFormData) => {
    if (mappings.length <= 1) {
      setError("Cannot remove the last remaining speaker. At least one speaker is required.");
      return false;
    }

    setDeleteConfirmation({
      open: true,
      speakerIndex: index,
      speakerName: speakerToRemove.name || speakerToRemove.speakerId,
      speakerId: speakerToRemove.speakerId,
    });
    return true;
  }, [mappings.length]);

  const cancelRemoveSpeaker = useCallback(() => {
    setDeleteConfirmation({
      open: false,
      speakerIndex: -1,
      speakerName: "",
      speakerId: "",
    });
  }, []);

  // Direct event handlers using Zustand store operations
  const handleAddSpeakerLocal = useCallback(() => {
    const newMapping = handleAddSpeaker();
    // Add to Zustand store instead of local state
    addSpeakerToStore(
      newMapping.speakerId,
      newMapping.name,
      newMapping.role
    );
    setError(null);
    
    // Trigger tour step advancement if in demo mode
    if (isDemo && isTourActive) {
      triggerStepAction('add-speaker');
    }
  }, [handleAddSpeaker, addSpeakerToStore, isDemo, isTourActive, triggerStepAction]);

  const handleRemoveSpeakerLocal = useCallback(
    (index: number) => {
      const speakerToRemove = mappings[index];
      if (speakerToRemove) {
        handleRemoveSpeaker(index, speakerToRemove);
      }
    },
    [mappings, handleRemoveSpeaker]
  );

  const confirmRemoveSpeaker = useCallback(() => {
    // Get the speaker to remove from deleteConfirmation
    if (deleteConfirmation && deleteConfirmation.speakerId) {
      deleteSpeakerFromStore(deleteConfirmation.speakerId);
      cancelRemoveSpeaker(); // Clear the confirmation state
      setError(null);
    }
  }, [deleteConfirmation, deleteSpeakerFromStore, cancelRemoveSpeaker]);

  const handleMappingChange = useCallback(
    (index: number, field: "name" | "role" | "email", value: string) => { // S3.4: Add email field
      const mapping = mappings[index];
      if (!mapping) return;

      // Update in Zustand store immediately for real-time updates
      updateSpeakerInStore(mapping.speakerId, { [field]: value });
      setError(null);

      // Real-time validation during edit mode
      if (editingMappings.has(mapping.speakerId)) {
        // Validate the updated mapping
        const updatedMapping = { ...mapping, [field]: value };
        validateSingleMapping(
          updatedMapping,
          mapping.speakerId,
          mappings
        );
      }
    },
    [mappings, editingMappings, updateSpeakerInStore, validateSingleMapping]
  );

  const handleSave = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing validation errors
      clearValidationErrors();

      // Validate all mappings before saving
      console.log("🔍 Validating mappings...", { mappings });
      const validationResult = validateAllSpeakerMappings(mappings);
      console.log("🔍 Validation result:", validationResult);

      if (!validationResult) {
        console.log("❌ Validation failed");
        setError("Please fix the highlighted validation errors before saving.");
        setLoading(false);
        return;
      }

      // Note: We allow empty names for unedited speakers - validation only checks for duplicates

      // Get current mappings from Zustand store (they're already updated in real-time)
      const currentMappings = getAllMappings();

      // Store session overrides for any modified speakers
      currentMappings.forEach((mapping) => {
        const existing = existingMappings.find(m => m.speakerId === mapping.speakerId);
        
        // Check if the name has been overridden
        if (existing && existing.name !== mapping.name && mapping.name.trim() !== '') {
          const overrideAction = {
            action: 'Override' as const,
            originalValue: existing.name || existing.speakerId,
            newValue: mapping.name,
            timestamp: new Date(),
            fieldModified: 'name'
          };
          
          // Store the override in session storage
          sessionManager.storeOverride(mapping.speakerId, overrideAction);
        }
      });

      // Convert to SpeakerMapping format for parent callback
      const speakerMappingsForCallback: SpeakerMapping[] = currentMappings.map((mapping) => {
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
          role: mapping.role.trim() || "Participant",
          transcriptionId: mapping.transcriptionId || transcriptionId,
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

      // Notify parent component
      if (onMappingsSaved) {
        console.log(
          "✅ SpeakerMappingDialog: Calling onMappingsSaved callback"
        );
        onMappingsSaved(speakerMappingsForCallback);
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
    getAllMappings,
    existingMappings,
    transcriptionId,
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
    // Use baselineMappings for comparison if available, otherwise fall back to existingMappings
    const referenceMapping = baselineMappings.length > 0 ? baselineMappings : existingMappings;
    
    // If no reference mappings, we're initializing for the first time
    // Only consider it a change if speakers have been named or manually added/removed
    if (referenceMapping.length === 0) {
      return (
        mappings.some((m) => m.name.trim() !== "") ||
        mappings.length > detectedSpeakers.length
      );
    }

    // Normal change detection when we have reference mappings to compare against
    return (
      mappings.some((m) => m.name.trim() !== "") ||
      mappings.length > detectedSpeakers.length ||
      mappings.length !== referenceMapping.length ||
      mappings.some((m, i) => {
        const existing = referenceMapping[i];
        return (
          !existing ||
          existing.speakerId !== m.speakerId ||
          existing.name !== m.name ||
          existing.role !== m.role
        );
      })
    );
  }, [mappings, detectedSpeakers.length, baselineMappings, existingMappings]);

  // Check if the form is valid and ready to save
  const canSave = useMemo(() => {
    // In demo mode, enable save button when tour is active and no active edits
    if (isDemo && isTourActive && !hasActiveEdits) {
      return !hasValidationErrors && !loading;
    }
    
    return hasChanges && !hasValidationErrors && !loading;
  }, [isDemo, isTourActive, hasActiveEdits, hasChanges, hasValidationErrors, loading]);

  // Memoize UI components
  const speakerChips = useMemo(() => {
    return mappings.map((mapping) => {
      // Show name and role if available, otherwise fall back to speakerId
      let chipLabel = mapping.speakerId;
      if (mapping.name && mapping.name.trim()) {
        chipLabel = mapping.name.trim();
        if (mapping.role && mapping.role.trim()) {
          chipLabel += ` (${mapping.role.trim()})`;
        }
      }

      return (
        <Chip
          key={mapping.speakerId}
          label={chipLabel}
          size="small"
          variant="filled"
          icon={
            mapping.source === "AutoDetected" ? <MicIcon /> : <PersonAddIcon />
          }
          sx={{
            backgroundColor: getSpeakerColor(mapping.speakerId),
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      );
    });
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
        id="speaker-mapping-dialog"
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "400px" },
        }}
        sx={{
          zIndex: 10000, // Higher than tour popover z-index (9999)
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, position: 'relative' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Auto-detected Speakers:
            </Typography>
            {speakerChips}
            
            {/* Step 4 Tour Popover - Add Speaker */}
            <TourPopover
              open={isDemo && isTourActive && isCurrentStep(4)}
              step={4}
              onClose={() => closeStep(4)}
              position={{ top: '100px', left: '50px' }}
              maxWidth="300px"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* S2.5: Add Speaker Button */}
          <Box sx={{ mb: 3, position: 'relative' }}>
            <Button
              onClick={handleAddSpeakerLocal}
              startIcon={<PersonAddIcon />}
              variant="outlined"
              size="small"
              disabled={loading}
            >
              Add Speaker
            </Button>
            
            {/* Step 5 Tour Popover - Speaker Added Successfully */}
            <TourPopover
              open={isDemo && isTourActive && isCurrentStep(5)}
              step={5}
              onClose={() => closeStep(5)}
              position={{ top: '-10px', left: '275px' }}
              maxWidth="300px"
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: 'relative' }}>
            {mappingFields}
            
            {/* Step 6 Tour Popover - Edit/Delete Speaker */}
            <TourPopover
              open={isDemo && isTourActive && isCurrentStep(6)}
              step={6}
              onClose={() => closeStep(6)}
              position={{ top: '50px', right: '0px' }}
              maxWidth="300px"
            />
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
            onClick={() => {
              triggerStepAction('final-save');
              handleSave();
            }}
            variant="contained"
            disabled={!canSave || hasActiveEdits}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            title={
              hasValidationErrors
                ? "Please fix validation errors before saving"
                : hasActiveEdits
                ? "Please save or cancel active edits before saving all changes"
                : !hasChanges
                ? "No changes to save"
                : loading
                ? "Saving changes..."
                : "Save all speaker mappings"
            }
          >
            {loading ? "Saving..." : "Save Mappings"}
          </Button>

          {/* Step 8 Tour Popover - SAVE MAPPINGS */}
          <TourPopover
            open={isDemo && isTourActive && isCurrentStep(8)}
            step={8}
            onClose={() => closeStep(8)}
            position={{ top: '600px', right: '10px' }}
            maxWidth="300px"
          />
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
