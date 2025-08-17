import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import type { SpeakerMapping, SpeakerSource } from "../types";
import {
  sessionManager,
  type SessionOverrideAction,
} from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";
import { getSpeakerColor } from "../theme/speakerColors";

interface SpeakerMappingProps {
  transcriptionId: string;
  detectedSpeakers: string[];
  onMappingsChanged?: (mappings: SpeakerMapping[]) => void;
}

export const SpeakerMappingComponent: React.FC<SpeakerMappingProps> = ({
  transcriptionId,
  detectedSpeakers,
  onMappingsChanged,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use Zustand store for speaker management - use individual selectors to avoid re-render issues
  const storeMappings = useSpeakerStore((state) => state.speakerMappings);
  const storeDetectedSpeakers = useSpeakerStore((state) => state.detectedSpeakers);  
  const initializeSpeakers = useSpeakerStore((state) => state.initializeSpeakers);

  // Memoize session overrides - use empty object as fallback to avoid infinite loops
  const sessionOverrides = useMemo(() => {
    try {
      return sessionManager.getOverrides() || {};
    } catch (error) {
      console.warn('Error getting session overrides:', error);
      return {};
    }
  }, []);

  // Initialize speakers in store when component mounts or transcriptionId changes
  useEffect(() => {
    if (transcriptionId) {
      // Only initialize if the store doesn't have data for this transcription
      const currentTranscriptionId = useSpeakerStore.getState().transcriptionId;
      const currentMappings = useSpeakerStore.getState().speakerMappings;
      
      if (currentTranscriptionId !== transcriptionId || currentMappings.length === 0) {
        console.log('🔄 Initial store initialization for transcription:', transcriptionId);
        initializeSpeakers(transcriptionId, detectedSpeakers, []);
      }
    }
  }, [transcriptionId, initializeSpeakers]); // Removed detectedSpeakers dependency

  // Memoize callback handlers
  const handleMappingsSaved = useCallback(
    (newMappings: SpeakerMapping[]) => {
      console.log('🔄 handleMappingsSaved called with:', newMappings);
      
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
      console.log('🔄 Speaker mappings already saved to store, skipping re-initialization');
      
      // Notify parent component of changes
      onMappingsChanged?.(newMappings);
    },
    [onMappingsChanged]
  );

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Memoize effective data - simplified to avoid infinite loops
  const effectiveData = useMemo(
    () => {
      const data = {
        mappings: storeMappings || [],
        speakers: storeDetectedSpeakers.length > 0 ? storeDetectedSpeakers : detectedSpeakers,
      };
      
      console.log('🔄 effectiveData updated:', {
        storeMappingsCount: storeMappings?.length || 0,
        storeDetectedSpeakersCount: storeDetectedSpeakers?.length || 0,
        detectedSpeakersCount: detectedSpeakers?.length || 0,
        mappings: data.mappings.map(m => ({ id: m.speakerId, name: m.name, role: m.role })),
        speakers: data.speakers
      });
      
      return data;
    },
    [storeMappings, storeDetectedSpeakers, detectedSpeakers]
  );

  // Memoize computed speaker data (Replace expensive calculations)
  const computedSpeakerData = useMemo(() => {
    // Include all speakers from both detected speakers and current mappings
    const allSpeakers = [
      ...effectiveData.speakers,
      ...effectiveData.mappings.map((m: any) => m.speakerId),
    ];
    const uniqueSpeakers = Array.from(new Set(allSpeakers));

    // Get unmapped speakers - simplified logic
    const unmappedSpeakers = uniqueSpeakers.filter((speakerId) => {
      const mapping = effectiveData.mappings.find((m: any) => m.speakerId === speakerId);
      return !mapping || !mapping.name || mapping.name.trim() === "";
    });

    return {
      allSpeakers,
      uniqueSpeakers,
      totalSpeakerCount: uniqueSpeakers.length,
      mappedDetectedCount: effectiveData.speakers.length - unmappedSpeakers.filter(id => effectiveData.speakers.includes(id)).length,
      unmappedSpeakers,
    };
  }, [effectiveData]);

  // Memoize rendered speaker lists (Replace inline filtering/mapping)
  const mappedTraditionalSpeakers = useMemo(() => {
    const mapped = effectiveData.mappings.filter((mapping: any) => {
      const hasName = mapping.name && mapping.name.trim() !== "";
      console.log(`🔍 Checking mapping: ${mapping.speakerId} -> name: "${mapping.name}" -> hasName: ${hasName}`);
      return hasName;
    });
    console.log('🔄 mappedTraditionalSpeakers:', mapped);
    return mapped;
  }, [effectiveData.mappings]);

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
  const headerSection = useMemo(
    () => (
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
        >
          Manage Names
        </Button>
      </Box>
    ),
    [computedSpeakerData, handleOpenDialog]
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
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {headerSection}
      {mappedSpeakersSection}
      {unmappedSpeakersSection}
      {emptyState}

      <SpeakerMappingDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        transcriptionId={transcriptionId}
        detectedSpeakers={effectiveData.speakers}
        existingMappings={effectiveData.mappings}
        onMappingsSaved={handleMappingsSaved}
      />
    </Box>
  );
};

export default SpeakerMappingComponent;
