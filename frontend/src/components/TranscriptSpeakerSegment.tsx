/**
 * Transcript Simport {
  Person,
  Check,
  Schedule,
  SwapHoriz,
} from "@mui/icons-material";egment Component with Reassignment Capability (S3.1)
 * Allows users to reassign transcript segments to different speakers
 */

import React, { useState, useMemo, useCallback } from "react";
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
  Check,
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
  const { isLoading } = useSessionManagement();

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

  // Memoize effective mappings and detected speakers
  const effectiveMappings = useMemo(() => {
    return storeMappings.length > 0 ? storeMappings : speakerMappings;
  }, [storeMappings, speakerMappings]);

  const effectiveDetectedSpeakers = useMemo(() => {
    return storeDetectedSpeakers.length > 0 ? storeDetectedSpeakers : [];
  }, [storeDetectedSpeakers]);

  // Memoize session overrides
  const sessionOverrides = useMemo(() => {
    return sessionManager.getOverrides();
  }, []);

  /**
   * Get all available speaker options
   */
  const getSpeakerOptions = useMemo((): SpeakerOption[] => {
    const options: SpeakerOption[] = [];

    // Use effective mappings
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
  }, [effectiveMappings, effectiveDetectedSpeakers, segment.speaker]);

  // Get speaker mappings from the store
  const getAllMappings = useSpeakerStore((state) => state.getAllMappings);

  // Memoize current speaker name and effective speaker ID
  const currentSpeakerInfo = useMemo(() => {
    // For individual segments, use the actual segment.speaker (which gets updated by parent component)
    // Session overrides are only used for global speaker-to-speaker reassignments, not individual segments
    const effectiveSpeakerId = segment.speaker;
    
    // Look up the assigned name and role from speaker mappings using the effective speaker ID
    const mapping = getAllMappings().find((m: SpeakerMapping) => m.speakerId === effectiveSpeakerId);
    
    let displayName = effectiveSpeakerId; // fallback to speaker ID
    if (mapping && mapping.name && mapping.name.trim()) {
      displayName = mapping.name.trim();
      if (mapping.role && mapping.role.trim()) {
        displayName += ` (${mapping.role.trim()})`;
      }
    }
    
    return {
      effectiveSpeakerId,
      displayName
    };
  }, [segment.speaker, getAllMappings]);

  // Memoize time formatting function
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Handle speaker reassignment
   */
  const handleReassignSpeaker = useCallback(
    async (newSpeakerId: string) => {
      try {
        setAnchorEl(null);

        // Notify parent component to update this specific segment
        onSpeakerChange?.(index, newSpeakerId);

        setFeedback({
          open: true,
          message: `Segment reassigned to ${newSpeakerId}`,
          severity: "success",
        });

      } catch (error) {
        setFeedback({
          open: true,
          message: "Failed to reassign speaker",
          severity: "error",
        });
      }
    },
    [onSpeakerChange, index]
  );

  // Handle menu open
  const handleMenuOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Handle feedback close
  const handleFeedbackClose = useCallback(() => {
    setFeedback((prev) => ({ ...prev, open: false }));
  }, []);

  // Memoize speaker options - moved for proper dependency order
  const speakerOptions = getSpeakerOptions;

  // Memoize override status calculations
  const overrideStatus = useMemo(() => {
    // For individual segment reassignment, we update segment.speaker directly
    // So we only check for speaker mapping overrides, not session overrides
    const mappingOverridden = speakerOptions.find(
      (opt) => opt.id === segment.speaker
    )?.isOverridden;

    // Individual segments are not considered "overridden" - they're just updated
    const isSegmentOverridden = mappingOverridden || false;

    return {
      isSegmentOverridden,
      mappingOverridden,
      sessionOverridden: false, // No longer used for individual segments
    };
  }, [speakerOptions, segment.speaker]);

  // Memoize check for any modified speakers
  const hasAnyModifiedSpeakers = useMemo(() => {
    // Check for any session overrides
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    // Check for any manually added or overridden speakers in mappings
    const hasEditedSpeakers = effectiveMappings.some(
      (mapping) => mapping.source === "ManuallyAdded" || mapping.isOverridden
    );

    return hasSessionOverrides || hasEditedSpeakers;
  }, [sessionOverrides, effectiveMappings]);

  // Memoize strikethrough decision
  const shouldStrikethroughConfidence = useMemo(() => {
    return overrideStatus.isSegmentOverridden || hasAnyModifiedSpeakers;
  }, [overrideStatus.isSegmentOverridden, hasAnyModifiedSpeakers]);

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
            label={currentSpeakerInfo.displayName}
            size="small"
            sx={{
              backgroundColor: getSpeakerColor(currentSpeakerInfo.effectiveSpeakerId),
              color: "white",
              fontWeight: "bold",
            }}
            variant={overrideStatus.isSegmentOverridden ? "outlined" : "filled"}
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
            <Tooltip title="Reassign speaker">
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                disabled={isLoading}
                color="primary"
              >
                <SwapHoriz />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Segment Text */}
        <Typography variant="body1" sx={{ mt: 1, pl: 2 }}>
          {segment.text}
        </Typography>
      </Box>

      {/* Speaker Reassignment Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
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
        onClose={handleFeedbackClose}
      >
        <Alert severity={feedback.severity} onClose={handleFeedbackClose}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TranscriptSpeakerSegment;
