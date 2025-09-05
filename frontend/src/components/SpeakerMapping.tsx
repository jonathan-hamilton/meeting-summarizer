import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Box, Button, Typography, Chip, Skeleton } from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";

// Lazy load SpeakerMappingDialog to reduce bundle size
const SpeakerMappingDialog = React.lazy(() => import("./SpeakerMappingDialog").then(m => ({ default: m.SpeakerMappingDialog })));

import { TourPopover } from "./TourPopover";
import type { SpeakerMapping, SpeakerSource } from "../types";
import {
  sessionManager,
  type SessionOverrideAction,
} from "../services/sessionManager";
import { useActiveSpeakers, useSpeakerSessionStore } from "../stores/speakerSessionStore";
import { getSpeakerColor } from "../theme/speakerColors";
import { useAppMode } from "../contexts/AppModeContext";
import { useTourStore } from "../stores/tourStore";

interface SpeakerMappingProps {
  transcriptionId: string;
  detectedSpeakers: string[];
  onMappingsChanged?: (mappings: SpeakerMapping[]) => void;
}

export const SpeakerMappingComponent: React.FC<SpeakerMappingProps> = ({
  transcriptionId,
  detectedSpeakers: _detectedSpeakers, // Keep interface compatibility but don't use
  onMappingsChanged,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Tour state management
  const { isDemo } = useAppMode();
  const { isActive: isTourActive, closeStep, triggerStepAction, isCurrentStep, isActionDisabledDuringTour } = useTourStore();
  
  // Use centralized store for simplified state management
  const activeSpeakers = useActiveSpeakers();
  // Get ALL mappings (not filtered) to include manually added speakers without segments
  const allMappings = useSpeakerSessionStore(state => state.speakerMappings);

  // Memoize session overrides - use empty object as fallback to avoid infinite loops
  const sessionOverrides = useMemo(() => {
    try {
      return sessionManager.getOverrides() || {};
    } catch (error) {
      console.warn('Error getting session overrides:', error);
      return {};
    }
  }, []);

  // Use proper store selector instead of direct getState() access
  const currentTranscriptionId = useSpeakerSessionStore(state => state.transcriptionId);

  // Initialize speakers in store when component mounts or transcriptionId changes
  useEffect(() => {
    if (transcriptionId && currentTranscriptionId !== transcriptionId) {
      // Let TranscriptDisplay handle the initialization to avoid conflicts
      // This component will use the data once it's available
    }
  }, [transcriptionId, currentTranscriptionId]);

  // Memoize callback handlers
  const handleMappingsSaved = useCallback(
    (newMappings: SpeakerMapping[]) => {
      
      // Clear any session overrides that might conflict with the new mappings
      const sessionOverrides = sessionManager.getOverrides();
      const mappedSpeakerIds = new Set(newMappings.filter(m => m.name && m.name.trim() !== "").map(m => m.speakerId));
      
      // Check if any session overrides point to speakers that now have proper mappings
      let needsClearOverrides = false;
      Object.keys(sessionOverrides).forEach(speakerId => {
        const override = sessionOverrides[speakerId];
        if (override.action === "Override" && override.newValue && mappedSpeakerIds.has(override.newValue)) {
          needsClearOverrides = true;
        }
      });
      
      // Clear conflicting session overrides
      if (needsClearOverrides) {
        sessionManager.clearSpeakerOverrides();
      }
      
      // The store should already be updated by the dialog component
      // Don't re-initialize here as it can cause the mappings to be lost
      
      // Notify parent component of changes
      onMappingsChanged?.(newMappings);
    },
    [onMappingsChanged]
  );

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
    // Trigger tour step advancement if in demo mode
    if (isDemo) {
      triggerStepAction('manage-names');
    }
  }, [isDemo, triggerStepAction]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Simplified effective data using centralized store (fixed cache issue)
  const effectiveData = useMemo(
    () => {
      // Get all speakers: active speakers + manually added speakers (even without segments)
      const manuallyAddedSpeakers = allMappings
        .filter((mapping: SpeakerMapping) => mapping.source === 'ManuallyAdded')
        .map((mapping: SpeakerMapping) => mapping.speakerId);
      
      // Combine active speakers with manually added speakers (remove duplicates)
      const allRelevantSpeakers = Array.from(new Set([
        ...activeSpeakers,  // Speakers with current segments
        ...manuallyAddedSpeakers  // Manually added speakers (even without segments)
      ]));
      
      const data = {
        mappings: allMappings,
        speakers: allRelevantSpeakers,
      };
      
      return data;
    },
    [allMappings, activeSpeakers]
  );

  // Memoize computed speaker data (Replace expensive calculations)
  const computedSpeakerData = useMemo(() => {
    // Use effectiveData.speakers directly - it already contains the filtered list of speakers with segments
    const uniqueSpeakers = effectiveData.speakers;

    // Get unmapped speakers - speakers without custom names (either no mapping or name equals speaker ID)
    const unmappedSpeakers = uniqueSpeakers.filter((speakerId) => {
      const mapping = effectiveData.mappings.find((m: SpeakerMapping) => m.speakerId === speakerId);
      // Consider unmapped if: no mapping, no name, empty name, or name equals speaker ID (default)
      return !mapping || !mapping.name || mapping.name.trim() === "" || mapping.name === speakerId;
    });

    return {
      allSpeakers: uniqueSpeakers,
      uniqueSpeakers,
      totalSpeakerCount: uniqueSpeakers.length,
      mappedDetectedCount: effectiveData.speakers.length - unmappedSpeakers.filter(id => effectiveData.speakers.includes(id)).length,
      unmappedSpeakers,
    };
  }, [effectiveData]);

  // Memoize rendered speaker lists (Replace inline filtering/mapping)
  const mappedTraditionalSpeakers = useMemo(() => {
    const mapped = effectiveData.mappings.filter((mapping: SpeakerMapping) => {
      const hasName = mapping.name && mapping.name.trim() !== "";
      const isCustomName = hasName && mapping.name !== mapping.speakerId; // Only count as named if name is different from speaker ID
      const isActiveSpeaker = effectiveData.speakers.includes(mapping.speakerId);
      return isCustomName && isActiveSpeaker; // Only include mappings for speakers that have custom names and are in allRelevantSpeakers
    });
    return mapped;
  }, [effectiveData.mappings, effectiveData.speakers]);

  const sessionOverrideSpeakers = useMemo(() => {
    return Object.entries(sessionOverrides)
      .map(([speakerId, override]) => {
        // Type assertion for override
        const typedOverride = override as SessionOverrideAction;
        
        // Don't show session overrides if the speaker already has a proper mapping with a name
        const hasMapping = effectiveData.mappings.find(
          (m) => m.speakerId === speakerId && m.name && m.name.trim() !== ""
        );
        
        // Also don't show overrides where the newValue (target speaker) has a proper mapping
        const targetHasMapping = typedOverride.newValue && effectiveData.mappings.find(
          (m) => m.speakerId === typedOverride.newValue && m.name && m.name.trim() !== ""
        );
        
        if (
          !hasMapping &&
          !targetHasMapping &&
          typedOverride.action === "Override" &&
          typedOverride.newValue
        ) {
          return { speakerId, override: typedOverride };
        }
        return null;
      })
      .filter(Boolean);
  }, [sessionOverrides, effectiveData.mappings]);

  // Memoize mapped speakers chips
  const mappedSpeakersChips = useMemo(() => {
    const traditionalChips = mappedTraditionalSpeakers.map((mapping) => {
      // Source-aware display with appropriate icons
      const isAutoDetected =
        !mapping.source || mapping.source === ("AutoDetected" as SpeakerSource);

      // Override indicator
      const isOverridden = mapping.isOverridden;

      let Icon = isAutoDetected ? MicIcon : PersonAddIcon;
      let sourceLabel = isAutoDetected ? "auto-detected" : "manually-added";

      // Show override icon for overridden speakers
      if (isOverridden) {
        Icon = EditNoteIcon;
        sourceLabel = "manually overridden";
      }

      return (
        <Chip
          key={mapping.speakerId}
          icon={<Icon />}
          label={`${mapping.name}${
            mapping.role ? ` (${mapping.role})` : ""
          }`}
          variant="filled"
          size="small"
          sx={{
            backgroundColor: getSpeakerColor(mapping.speakerId),
            color: "white",
            "& .MuiChip-icon": {
              color: "white",
            },
          }}
          title={`${sourceLabel} speaker${
            isOverridden
              ? ` - overridden at ${new Date(
                  mapping.overriddenAt || ""
                ).toLocaleString()}`
              : ""
          }`}
        />
      );
    });

    const sessionOverrideChips = sessionOverrideSpeakers.map((item) => {
      if (!item) return null;
      const { speakerId, override } = item;

      return (
        <Chip
          key={`override-${speakerId}`}
          icon={<EditNoteIcon />}
          label={`${speakerId} → ${override.newValue}`}
          variant="filled"
          size="small"
          sx={{
            backgroundColor: getSpeakerColor(speakerId),
            color: "white",
            "& .MuiChip-icon": {
              color: "white",
            },
          }}
          title={`session override - ${override.newValue}`}
        />
      );
    });

    return [...traditionalChips, ...sessionOverrideChips.filter(Boolean)];
  }, [mappedTraditionalSpeakers, sessionOverrideSpeakers]);

  // Memoize unmapped speakers chips
  const unmappedSpeakersChips = useMemo(() => {
    return computedSpeakerData.unmappedSpeakers.map((speakerId) => {
      // Determine speaker source for unmapped speakers
      const isDetectedSpeaker = effectiveData.speakers.includes(speakerId);
      const mapping = effectiveData.mappings.find(
        (m) => m.speakerId === speakerId
      );
      const isAutoDetected =
        isDetectedSpeaker &&
        (!mapping ||
          !mapping.source ||
          mapping.source === ("AutoDetected" as SpeakerSource));
      const Icon = isAutoDetected ? MicIcon : PersonAddIcon;
      const sourceLabel = isAutoDetected ? "auto-detected" : "manually-added";

      return (
        <Chip
          key={speakerId}
          icon={<Icon />}
          label={speakerId}
          variant="filled"
          size="small"
          sx={{
            backgroundColor: getSpeakerColor(speakerId),
            color: "white",
            "& .MuiChip-icon": {
              color: "white",
            },
          }}
          title={`${sourceLabel} speaker`}
        />
      );
    });
  }, [computedSpeakerData.unmappedSpeakers, effectiveData]);

  // Memoize header section
  // Render header section directly (not memoized to ensure tour state updates)
  const headerSection = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PersonIcon color="primary" />
        <Typography variant="h6">Speakers</Typography>
      </Box>

      <Button
        variant="outlined"
        size="small"
        startIcon={<EditIcon />}
        onClick={handleOpenDialog}
        disabled={isActionDisabledDuringTour('manage-speakers')}
        aria-label="Open speaker management dialog"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isActionDisabledDuringTour('manage-speakers')) {
              handleOpenDialog();
            }
          }
        }}
      >
        MANAGE SPEAKERS
      </Button>
    </Box>
  );

  // Memoize mapped speakers section
  const mappedSpeakersSection = useMemo(() => {
    if (mappedSpeakersChips.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Named Speakers:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {mappedSpeakersChips}
        </Box>
      </Box>
    );
  }, [mappedSpeakersChips]);

  // Memoize unmapped speakers section
  const unmappedSpeakersSection = useMemo(() => {
    if (computedSpeakerData.unmappedSpeakers.length === 0) return null;

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Unnamed Speakers:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {unmappedSpeakersChips}
        </Box>
      </Box>
    );
  }, [computedSpeakerData.unmappedSpeakers, unmappedSpeakersChips]);

  // Memoize empty state
  const emptyState = useMemo(() => {
    if (
      effectiveData.speakers.length > 0 ||
      effectiveData.mappings.length > 0
    ) {
      return null;
    }

    return (
      <Typography variant="body2" color="text.secondary">
        No speakers detected in this transcription.
      </Typography>
    );
  }, [effectiveData.speakers.length, effectiveData.mappings.length]);

  return (
    <Box
      sx={{
        p: 2,
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {headerSection}

      {/* Step 3 Tour Popover - Speaker Management */}
      <TourPopover
        open={isDemo && isTourActive && isCurrentStep(3)}
        step={3}
        onClose={() => closeStep(3)}
        position={{ top: '-40px', right: '190px' }}
      />

      {mappedSpeakersSection}
      {unmappedSpeakersSection}
      {emptyState}

      <Suspense fallback={<Skeleton variant="rectangular" height={400} />}>
        <SpeakerMappingDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          transcriptionId={transcriptionId}
          detectedSpeakers={effectiveData.speakers}
          existingMappings={effectiveData.mappings}
          onMappingsSaved={handleMappingsSaved}
        />
      </Suspense>
    </Box>
  );
};

export default SpeakerMappingComponent;
