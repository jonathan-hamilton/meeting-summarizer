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
  Stack,
} from "@mui/material";
import {
  Person,
  Undo,
  Check,
  Warning,
  Schedule,
  SwapHoriz,
} from "@mui/icons-material";
import type { SpeakerSegment, SpeakerMapping } from "../types";
import { useSessionManagement } from "../hooks/useSessionManagement";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";
import { getSpeakerColor } from "../theme/speakerColors";

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
  const {
    speakerMappings: storeMappings,
    detectedSpeakers: storeDetectedSpeakers,
  } = useSpeakerStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

    // Get detected speakers from store first, fallback to extracting from mappings
    const effectiveDetectedSpeakers =
      storeDetectedSpeakers.length > 0 ? storeDetectedSpeakers : [];

    const allSpeakerIds = new Set<string>();

    // Add detected speakers from store
    effectiveDetectedSpeakers.forEach((speakerId: string) =>
      allSpeakerIds.add(speakerId)
    );

    // Add speakers from mappings (in case there are manually added ones)
    effectiveMappings.forEach((mapping) =>
      allSpeakerIds.add(mapping.speakerId)
    );

    // Add current segment speaker
    allSpeakerIds.add(segment.speaker);

    // Create options for all speakers
    Array.from(allSpeakerIds).forEach((speakerId) => {
      const mapping = effectiveMappings.find((m) => m.speakerId === speakerId);

      let displayName: string;
      if (mapping && mapping.name && mapping.name.trim() !== "") {
        // Mapped speaker: show "Name (Role)" or just "Name"
        displayName = mapping.role
          ? `${mapping.name} (${mapping.role})`
          : mapping.name;
      } else {
        // Unmapped speaker: show speaker ID
        displayName = speakerId;
      }

      options.push({
        id: speakerId,
        name: displayName,
        isOriginal: speakerId === segment.speaker,
        isOverridden: mapping?.isOverridden || false,
      });
    });

    // Sort options: current speaker first, then mapped speakers, then unmapped
    return options.sort((a, b) => {
      if (a.isOriginal) return -1;
      if (b.isOriginal) return 1;

      // Prioritize mapped speakers (those with names different from IDs)
      const aIsMapped = a.name !== a.id;
      const bIsMapped = b.name !== b.id;

      if (aIsMapped && !bIsMapped) return -1;
      if (!aIsMapped && bIsMapped) return 1;

      return a.name.localeCompare(b.name);
    });
  };

  /**
   * Get the display name for the current speaker
   * Always returns the original speaker ID (e.g., "Speaker 1") regardless of mappings
   */
  const getCurrentSpeakerName = (): string => {
    // Always return the original speaker ID for transcript segments
    return segment.speaker;
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
  const handleReassignSpeaker = async (newSpeakerId: string) => {
    try {
      setAnchorEl(null);

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
        } else {
          setFeedback({
            open: true,
            message: `Failed to reassign speaker to ${targetSpeaker.name}`,
            severity: "error",
          });
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

  const speakerOptions = getSpeakerOptions();
  const currentSpeakerName = getCurrentSpeakerName();

  // Check for overrides from both speaker mappings and session manager
  const mappingOverridden = speakerOptions.find(
    (opt) => opt.id === segment.speaker
  )?.isOverridden;

  // Check for session-based overrides for this specific speaker
  const sessionOverrides = sessionManager.getOverrides();
  const sessionOverridden =
    sessionOverrides[segment.speaker]?.action === "Override";

  // This segment is specifically overridden (for reassignment message)
  const isSegmentOverridden = mappingOverridden || sessionOverridden;

  // Check if ANY speakers have been modified (affects all confidence scores)
  const hasAnyModifiedSpeakers = () => {
    // Check for any session overrides
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    // Check for any manually added or overridden speakers in mappings
    const effectiveMappings =
      storeMappings.length > 0 ? storeMappings : speakerMappings;
    const hasEditedSpeakers = effectiveMappings.some(
      (mapping) => mapping.source === "ManuallyAdded" || mapping.isOverridden
    );

    return hasSessionOverrides || hasEditedSpeakers;
  };

  // Use segment-specific override for reassignment message, broader check for confidence strikethrough
  const isOverridden = isSegmentOverridden;
  const shouldStrikethroughConfidence =
    isSegmentOverridden || hasAnyModifiedSpeakers();

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
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: shouldStrikethroughConfidence
                  ? "line-through"
                  : "none",
              }}
            >
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
                  <SwapHoriz />
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
      </Menu>

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
