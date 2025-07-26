/**
 * Transcript Speaker Segment Component with Reassignment Capability (S3.1)
 * Allows users to reassign transcript segments to different speakers
 */

import React, { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Divider,
} from "@mui/material";
import {
  Person,
  Edit,
  Undo,
  Add,
  Check,
  Warning,
  Schedule,
} from "@mui/icons-material";
import type { SpeakerSegment, SpeakerMapping } from "../types";
import { useSessionManagement } from "../hooks/useSessionManagement";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";

interface TranscriptSpeakerSegmentProps {
  segment: SpeakerSegment;
  index: number;
  speakerMappings?: SpeakerMapping[];
  onSpeakerChange?: (segmentIndex: number, newSpeaker: string) => void;
  showReassignControls?: boolean;
}

interface SpeakerOption {
  id: string;
  name: string;
  isOriginal: boolean;
  isOverridden: boolean;
}

/**
 * Enhanced speaker segment component with reassignment functionality
 */
export const TranscriptSpeakerSegment: React.FC<
  TranscriptSpeakerSegmentProps
> = ({
  segment,
  index,
  speakerMappings = [],
  onSpeakerChange,
  showReassignControls = true,
}) => {
  const { applyOverride, revertOverride, isLoading } = useSessionManagement();

  // Use Zustand store for speaker management
  const { speakerMappings: storeMappings } = useSpeakerStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createSpeakerOpen, setCreateSpeakerOpen] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const menuOpen = Boolean(anchorEl);

  /**
   * Get all available speaker options
   */
  const getSpeakerOptions = (): SpeakerOption[] => {
    const options: SpeakerOption[] = [];

    // Use store mappings, fallback to props
    const effectiveMappings =
      storeMappings.length > 0 ? storeMappings : speakerMappings;

    // Add existing speakers from mappings
    effectiveMappings.forEach((mapping) => {
      options.push({
        id: mapping.speakerId,
        name: mapping.name,
        isOriginal: mapping.speakerId === segment.speaker,
        isOverridden: mapping.isOverridden || false,
      });
    });

    // Add current segment speaker if not in mappings
    if (!options.find((opt) => opt.id === segment.speaker)) {
      options.push({
        id: segment.speaker,
        name: segment.speaker,
        isOriginal: true,
        isOverridden: false,
      });
    }

    return options;
  };

  /**
   * Get the display name for the current speaker
   */
  const getCurrentSpeakerName = (): string => {
    // First check for session-based overrides
    const overrides = sessionManager.getOverrides();
    const override = overrides[segment.speaker];
    if (override && override.action === "Override" && override.newValue) {
      return override.newValue;
    }

    // Use store mappings, fallback to props
    const effectiveMappings =
      storeMappings.length > 0 ? storeMappings : speakerMappings;

    // Then check speaker mappings
    const mapping = effectiveMappings.find(
      (m) => m.speakerId === segment.speaker
    );
    return mapping ? mapping.name : segment.speaker;
  };

  /**
   * Get speaker color for visual consistency
   */
  const getSpeakerColor = (speakerId: string): string => {
    const colors = [
      "#1976d2",
      "#388e3c",
      "#f57c00",
      "#7b1fa2",
      "#c2185b",
      "#5d4037",
      "#455a64",
      "#e91e63",
    ];

    const match = speakerId.match(/\d+/);
    const index = match
      ? (parseInt(match[0]) - 1) % colors.length
      : speakerId.split("").reduce((a, b) => a + b.charCodeAt(0), 0) %
        colors.length;

    return colors[index];
  };

  /**
   * Format time for display
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Handle speaker reassignment
   */
  const handleReassignSpeaker = async (
    newSpeakerId: string,
    newSpeakerName?: string
  ) => {
    try {
      setAnchorEl(null);

      if (newSpeakerName) {
        // Creating a new speaker mapping - keep the original speaker ID
        const success = await applyOverride(segment.speaker, newSpeakerName);

        if (success) {
          setFeedback({
            open: true,
            message: `Segment reassigned to ${newSpeakerName}`,
            severity: "success",
          });
          // Trigger a parent re-render by calling onSpeakerChange with the same speaker ID
          // This will force the parent to refresh and show the new override
          onSpeakerChange?.(index, segment.speaker);
        } else {
          setFeedback({
            open: true,
            message: `Failed to reassign speaker to ${newSpeakerName}`,
            severity: "error",
          });
        }
      } else {
        // Reassigning to existing speaker
        const effectiveMappings =
          storeMappings.length > 0 ? storeMappings : speakerMappings;
        const targetSpeaker = effectiveMappings.find(
          (m) => m.speakerId === newSpeakerId
        );
        if (targetSpeaker) {
          const success = await applyOverride(
            segment.speaker,
            targetSpeaker.name
          );
          if (success) {
            setFeedback({
              open: true,
              message: `Segment reassigned to ${targetSpeaker.name}`,
              severity: "success",
            });
            onSpeakerChange?.(index, newSpeakerId);
          }
        }
      }
    } catch {
      setFeedback({
        open: true,
        message: "Failed to reassign speaker",
        severity: "error",
      });
    }
  };

  /**
   * Handle revert speaker assignment
   */
  const handleRevertSpeaker = async () => {
    try {
      setAnchorEl(null);
      const success = await revertOverride(segment.speaker);
      if (success) {
        setFeedback({
          open: true,
          message: "Speaker assignment reverted",
          severity: "success",
        });
        onSpeakerChange?.(index, segment.speaker);
      }
    } catch {
      setFeedback({
        open: true,
        message: "Failed to revert speaker assignment",
        severity: "error",
      });
    }
  };

  /**
   * Handle create new speaker
   */
  const handleCreateSpeaker = async () => {
    if (!newSpeakerName.trim()) return;

    await handleReassignSpeaker(`custom_${Date.now()}`, newSpeakerName.trim());
    setCreateSpeakerOpen(false);
    setNewSpeakerName("");
  };

  const speakerOptions = getSpeakerOptions();
  const currentSpeakerName = getCurrentSpeakerName();
  const isOverridden = speakerOptions.find(
    (opt) => opt.id === segment.speaker
  )?.isOverridden;

  return (
    <>
      <Box
        sx={{
          mb: 2,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {/* Speaker Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Chip
            icon={<Person />}
            label={currentSpeakerName}
            size="small"
            sx={{
              backgroundColor: getSpeakerColor(segment.speaker),
              color: "white",
              fontWeight: "bold",
            }}
            variant={isOverridden ? "outlined" : "filled"}
          />

          <Typography variant="body2" color="text.secondary">
            <Schedule
              fontSize="small"
              sx={{ mr: 0.5, verticalAlign: "middle" }}
            />
            {formatTime(segment.start)} - {formatTime(segment.end)}
          </Typography>

          {segment.confidence && (
            <Typography variant="body2" color="text.secondary">
              {Math.round(segment.confidence * 100)}% confidence
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Reassignment Controls */}
          {showReassignControls && (
            <Stack direction="row" spacing={1}>
              {isOverridden && (
                <Tooltip title="Revert to original speaker">
                  <IconButton
                    size="small"
                    onClick={handleRevertSpeaker}
                    disabled={isLoading}
                    color="warning"
                  >
                    <Undo />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Reassign speaker">
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  disabled={isLoading}
                  color="primary"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        {/* Session Override Indicator */}
        {isOverridden && (
          <Alert severity="info" sx={{ mb: 1 }} icon={<Warning />}>
            This segment has been reassigned in your current session
          </Alert>
        )}

        {/* Segment Text */}
        <Typography variant="body1" sx={{ mt: 1, pl: 2 }}>
          {segment.text}
        </Typography>
      </Box>

      {/* Speaker Reassignment Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Reassign to:
          </Typography>
        </MenuItem>

        <Divider />

        {speakerOptions.map((option) => (
          <MenuItem
            key={option.id}
            onClick={() => handleReassignSpeaker(option.id)}
            disabled={option.isOriginal}
          >
            <ListItemIcon>
              {option.isOriginal ? <Check color="success" /> : <Person />}
            </ListItemIcon>
            <ListItemText
              primary={option.name}
              secondary={option.isOriginal ? "Current speaker" : undefined}
            />
          </MenuItem>
        ))}

        <Divider />

        {/* Edit current speaker name option */}
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setNewSpeakerName(currentSpeakerName);
            setCreateSpeakerOpen(true);
          }}
        >
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText primary="Edit current speaker name..." />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setNewSpeakerName("");
            setCreateSpeakerOpen(true);
          }}
        >
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText primary="Create new speaker..." />
        </MenuItem>
      </Menu>

      {/* Create New Speaker Dialog */}
      <Dialog
        open={createSpeakerOpen}
        onClose={() => setCreateSpeakerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {newSpeakerName && newSpeakerName === currentSpeakerName
            ? "Edit Speaker Name"
            : "Create New Speaker"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Speaker Name"
            fullWidth
            variant="outlined"
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            placeholder="Enter speaker name..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSpeakerOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSpeaker}
            variant="contained"
            disabled={!newSpeakerName.trim()}
          >
            {newSpeakerName && newSpeakerName === currentSpeakerName
              ? "Update Speaker"
              : "Create & Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TranscriptSpeakerSegment;
