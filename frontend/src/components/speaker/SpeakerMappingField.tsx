import React from "react";
import { Box, TextField, Typography, IconButton, Chip } from "@mui/material";
import {
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type {
  SpeakerMapping,
  SpeakerSource,
  ValidationError,
} from "../../types";
import { useTourStore } from "../../stores/tourStore";
import { TourPopover } from "../TourPopover";
import { useAppMode } from "../../contexts/AppModeContext";

interface SpeakerMappingFieldProps {
  mapping: {
    speakerId: string;
    name: string;
    role: string;
    source: SpeakerSource;
    email?: string; // S3.4: Optional email field
  };
  index: number;
  isEditing: boolean;
  isLoading: boolean;
  validationErrors: ValidationError[];
  canRemove: boolean;
  existingMapping?: SpeakerMapping;
  onMappingChange: (
    index: number,
    field: "name" | "role" | "email", // S3.4: Add email to field types
    value: string
  ) => void;
  onStartEdit: (speakerId: string) => void;
  onConfirmEdit: (speakerId: string) => void;
  onCancelEdit: (speakerId: string) => void;
  onRemove: (index: number) => void;
}

export const SpeakerMappingField: React.FC<SpeakerMappingFieldProps> = ({
  mapping,
  index,
  isEditing,
  isLoading,
  validationErrors,
  canRemove,
  existingMapping,
  onMappingChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onRemove,
}) => {
  const { triggerStepAction, isCurrentStep, isActive: isTourActive, closeStep } = useTourStore();
  const { isDemo } = useAppMode();
  
  const nameError = validationErrors?.find((err) => err.field === "name");
  const roleError = validationErrors?.find((err) => err.field === "role");
  const emailError = validationErrors?.find((err) => err.field === "email"); // S3.4: Email validation
  const hasValidationErrors = validationErrors?.length > 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
        backgroundColor: "background.paper",
        position: "relative",
      }}
    >
      {/* Speaker header with source indicator and action buttons */}
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

          {/* Source indicator */}
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
            color={mapping.source === "AutoDetected" ? "default" : "secondary"}
            variant="outlined"
            sx={{ fontSize: "0.75rem", height: "20px" }}
          />

          {/* Override indicator */}
          {existingMapping?.isOverridden && (
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
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Edit/Save/Cancel buttons */}
          {isEditing ? (
            <>
              <IconButton
                onClick={() => {
                  triggerStepAction('save-row');
                  onConfirmEdit(mapping.speakerId);
                }}
                size="small"
                color="primary"
                title="Save Changes"
                disabled={isLoading || hasValidationErrors}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => onCancelEdit(mapping.speakerId)}
                size="small"
                color="default"
                title="Cancel Edit"
                disabled={isLoading}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => {
                triggerStepAction('edit-speaker');
                onStartEdit(mapping.speakerId);
              }}
              size="small"
              color="primary"
              title="Edit Speaker"
              disabled={isLoading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}

          {/* Remove speaker button */}
          <IconButton
            onClick={() => onRemove(index)}
            size="small"
            disabled={isLoading || !canRemove}
            color="error"
            title="Remove Speaker"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Form fields */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Full Name"
          placeholder="e.g., John Smith"
          value={mapping.name}
          onChange={(e) => onMappingChange(index, "name", e.target.value)}
          sx={{ flex: "1 1 250px", minWidth: "200px" }}
          disabled={isLoading || !isEditing}
          error={!!nameError}
          helperText={
            nameError?.message ||
            (isEditing
              ? "Click save to confirm changes"
              : "Click edit button to modify")
          }
          variant={isEditing ? "outlined" : "filled"}
        />

        <TextField
          label="Role (Optional)"
          placeholder="e.g., Product Manager"
          value={mapping.role}
          onChange={(e) => onMappingChange(index, "role", e.target.value)}
          sx={{ flex: "1 1 200px", minWidth: "150px" }}
          disabled={isLoading || !isEditing}
          error={!!roleError}
          helperText={
            roleError?.message ||
            (isEditing
              ? "Click save to confirm changes"
              : "Click edit button to modify")
          }
          variant={isEditing ? "outlined" : "filled"}
        />

        <TextField
          label="Email (Optional)"
          placeholder="e.g., john.smith@company.com"
          value={mapping.email || ""}
          onChange={(e) => onMappingChange(index, "email", e.target.value)}
          sx={{ flex: "1 1 250px", minWidth: "200px" }}
          disabled={isLoading || !isEditing}
          error={!!emailError}
          helperText={
            emailError?.message ||
            (isEditing
              ? "For easy email sharing - Click save to confirm"
              : "Click edit button to modify")
          }
          variant={isEditing ? "outlined" : "filled"}
          type="email"
        />
      </Box>
      
      {/* Step 7 Tour Popover - Save Row */}
      <TourPopover
        open={isDemo && isTourActive && isCurrentStep(7) && isEditing}
        step={7}
        title="Save Row"
        description="After editing speaker details, click the checkmark to save changes for this speaker."
        onClose={() => closeStep(7)}
        position={{ bottom: '-260px', right: '10px' }}
        maxWidth="300px"
      />
    </Box>
  );
};
