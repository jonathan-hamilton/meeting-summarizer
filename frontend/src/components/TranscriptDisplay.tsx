import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  ContentCopy,
  Person,
  Schedule,
  Error,
  PlayCircle,
} from "@mui/icons-material";
import type { TranscriptionResponse, SpeakerMapping } from "../types";
import { SpeakerMappingComponent } from "./SpeakerMapping";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import SummaryDisplay from "./SummaryDisplay";
import { TranscriptSpeakerSegment } from "./TranscriptSpeakerSegment";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerSessionStore, useActiveSpeakers } from "../stores/speakerSessionStore";
import { useSessionManagement } from "../hooks/useSessionManagement";
import { ConfirmTranscriptionDeleteDialog } from "./dialogs/ConfirmTranscriptionDeleteDialog";
import { useAppMode } from "../contexts/AppModeContext";

interface TranscriptDisplayProps {
  transcription: TranscriptionResponse;
  loading?: boolean;
  speakerMappings?: SpeakerMapping[]; // Optional external speaker mappings
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcription,
  loading = false,
  speakerMappings,
}) => {
  const [copiedSegment, setCopiedSegment] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [speakerMappingDialogOpen, setSpeakerMappingDialogOpen] =
    useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Tour functionality
  const { isDemo } = useAppMode();

  // Centralized store state and actions
  const storeSpeakerMappings = useSpeakerSessionStore(state => state.speakerMappings);
  const storeCurrentSegments = useSpeakerSessionStore(state => state.currentSegments);
  const storeDetectedSpeakers = storeSpeakerMappings.map(mapping => mapping.speakerId);
  const initializeSession = useSpeakerSessionStore(state => state.initializeSession);
  const reassignSegment = useSpeakerSessionStore(state => state.reassignSegment);
  const resetToOriginal = useSpeakerSessionStore(state => state.resetToOriginal);
  const addSpeakerMapping = useSpeakerSessionStore(state => state.addSpeakerMapping);
  const updateSpeakerMapping = useSpeakerSessionStore(state => state.updateSpeakerMapping);
  const deleteSpeakerMapping = useSpeakerSessionStore(state => state.deleteSpeakerMapping);
  const getAllMappings = useSpeakerSessionStore(state => state.getFilteredMappings);
  
  // Use current segments from store (reflects reassignments), fallback to original transcription
  const speakerSegments = storeCurrentSegments.length > 0 ? storeCurrentSegments : (transcription.speakerSegments || []);
  const clearSession = useSpeakerSessionStore(state => state.clearSession);
  
  // Compatibility functions to match legacy interface
  const initializeSpeakers = (transcriptionId: string, _detectedSpeakers: string[], existingMappings: SpeakerMapping[] = []) => {
    initializeSession(transcriptionId, transcription.speakerSegments || [], existingMappings);
  };
  
  const clearSpeakers = () => {
    clearSession();
  };

  // Centralized store hooks
  const activeSpeakers = useActiveSpeakers();

  // Session management for privacy controls
  const { privacyControls: _privacyControls } = useSessionManagement();

  // Memoize extracted unique speakers from original transcript segments (not modified ones)
  const allDetectedSpeakers = useMemo(() => {
    const speakers = transcription.speakerSegments
      ? Array.from(new Set(transcription.speakerSegments.map((s) => s.speaker)))
      : [];
    
    console.log('🔍 TranscriptDisplay detected speakers:', {
      transcriptionId: transcription.transcriptionId,
      speakerSegments: transcription.speakerSegments?.map(s => ({ speaker: s.speaker, text: s.text?.substring(0, 50) + '...' })),
      detectedSpeakers: speakers,
      rawSpeakerList: speakers
    });
    
    return speakers;
  }, [transcription.speakerSegments, transcription.transcriptionId]);

  // Memoize effective speaker mappings
  const effectiveSpeakerMappings = useMemo(() => {
    return storeSpeakerMappings;
  }, [storeSpeakerMappings]);

  // Memoize detected speakers with fallback
  const detectedSpeakers = useMemo(() => {
    return storeDetectedSpeakers.length > 0
      ? storeDetectedSpeakers
      : allDetectedSpeakers;
  }, [storeDetectedSpeakers, allDetectedSpeakers]);

  // Calculate currently active speakers from current segments (after reassignments)
  // Use the store's getActiveSpeakers method which correctly excludes "Unassigned" speakers
  const currentlyActiveSpeakers = useMemo(() => {
    const storeActiveSpeakers = activeSpeakers; // Use store's method that excludes "Unassigned"
    return storeActiveSpeakers;
  }, [activeSpeakers, speakerSegments]);

  // Memoize detected speakers filtered by currently active speakers (speakers with segments)
  const filteredDetectedSpeakers = useMemo(() => {
    const result = storeDetectedSpeakers.length > 0
      ? storeDetectedSpeakers.filter(speakerId => currentlyActiveSpeakers.includes(speakerId))
      : currentlyActiveSpeakers;
    return result;
  }, [storeDetectedSpeakers, currentlyActiveSpeakers]);

  // Memoize current active speakers (excluding deleted ones)
  const currentActiveSpeakers = useMemo(() => {
    const baseSpeakers = detectedSpeakers;
    
    // Only filter out speakers if:
    // 1. We have mappings AND 
    // 2. There are fewer mappings than detected speakers (indicating deletions)
    if (storeSpeakerMappings.length > 0 && storeSpeakerMappings.length < detectedSpeakers.length) {
      // Filter to only include speakers that have mappings (excludes deleted speakers)
      return baseSpeakers.filter(speakerId => {
        return storeSpeakerMappings.some(mapping => mapping.speakerId === speakerId);
      });
    }
    
    return baseSpeakers;
  }, [detectedSpeakers, storeSpeakerMappings]);

  // Memoize session overrides
  const sessionOverrides = useMemo(() => {
    return sessionManager.getOverrides();
  }, [forceUpdate]);

  // Initialize store when component mounts or transcription changes
  useEffect(() => {
    try {
      const currentTranscriptionId = useSpeakerSessionStore.getState().transcriptionId;
      const currentDetectedSpeakers = activeSpeakers; // Use activeSpeakers from centralized store
      const currentStoreMappings = getAllMappings();
      
      // Check if this is a new transcription (different ID)
      const isNewTranscription = currentTranscriptionId !== transcription.transcriptionId;
      
      if (isNewTranscription || currentDetectedSpeakers.length === 0) {
        // Clear session overrides for new transcriptions
        if (isNewTranscription) {
          sessionManager.clearSpeakerOverrides();
        }
        
        // For new transcriptions, start fresh with empty mappings unless explicitly provided
        const existingMappings = isNewTranscription 
          ? (speakerMappings || transcription.speakerMappings || [])  // Don't use store mappings for new transcription
          : (currentStoreMappings.length > 0 ? currentStoreMappings : speakerMappings || transcription.speakerMappings || []);
        
        initializeSpeakers(
          transcription.transcriptionId,
          allDetectedSpeakers,
          existingMappings
        );
      }
    } catch (error) {
      console.error("Error initializing speakers:", error);
    }
  }, [
    transcription.transcriptionId,
    speakerMappings,
    transcription.speakerMappings,
    initializeSpeakers,
    getAllMappings,
  ]); // Removed allDetectedSpeakers from dependencies to prevent re-initialization loops

  // Memoize hasModifiedSpeakers calculation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _hasModifiedSpeakers = useMemo(() => {
    // Check for manually added speakers (more speakers than originally detected)
    const originalSpeakerCount =
      transcription.speakerCount || allDetectedSpeakers.length;
    const currentSpeakerCount =
      effectiveSpeakerMappings.length + detectedSpeakers.length;

    if (currentSpeakerCount > originalSpeakerCount) {
      return true;
    }

    // Check for edited/renamed speakers
    const hasEditedSpeakers = effectiveSpeakerMappings.some(
      (mapping) => mapping.source === "ManuallyAdded" || mapping.isOverridden
    );

    // Check for session overrides
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    return hasEditedSpeakers || hasSessionOverrides;
  }, [
    transcription.speakerCount,
    allDetectedSpeakers.length,
    effectiveSpeakerMappings,
    detectedSpeakers.length,
    sessionOverrides,
  ]);

  // Memoize speaker reassignment detection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _hasSpeakerReassignments = useMemo(() => {
    // Check if any speaker segments have been changed from original
    const originalSegments = transcription.speakerSegments || [];
    const currentSegments = speakerSegments;
    
    // Compare current segments with original segments
    const hasSegmentChanges = currentSegments.some((segment, index) => {
      const originalSegment = originalSegments[index];
      return originalSegment && segment.speaker !== originalSegment.speaker;
    });

    // Check for speaker mappings (name/role assignments)
    const hasMappings = effectiveSpeakerMappings.some(
      mapping => mapping.name && mapping.name.trim() !== ''
    );

    // Check for session overrides (dropdown reassignments)
    const hasOverrides = Object.keys(sessionOverrides).length > 0;

    return hasSegmentChanges || hasMappings || hasOverrides;
  }, [
    transcription.speakerSegments,
    speakerSegments,
    effectiveSpeakerMappings,
    sessionOverrides,
  ]);

  // Memoize transcript structure invalidation (for confidence score strikethrough)
  const isTranscriptStructureInvalidated = useMemo(() => {
    // Check if any speaker segments have been reassigned (structural change)
    const originalSegments = transcription.speakerSegments || [];
    const currentSegments = speakerSegments;
    
    const hasSegmentReassignments = currentSegments.some((segment, index) => {
      const originalSegment = originalSegments[index];
      return originalSegment && segment.speaker !== originalSegment.speaker;
    });

    // Check for session overrides (dropdown reassignments)
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    // Check if speakers have been deleted (fewer active speakers than original)
    const originalSpeakerCount = allDetectedSpeakers.length;
    const currentActiveSpeakerCount = currentActiveSpeakers.length;
    const hasSpeakerDeletions = currentActiveSpeakerCount < originalSpeakerCount;

    // Confidence is invalidated by structural changes, NOT by name/role assignments
    return hasSegmentReassignments || hasSessionOverrides || hasSpeakerDeletions;
  }, [
    transcription.speakerSegments,
    speakerSegments,
    sessionOverrides,
    allDetectedSpeakers.length,
    currentActiveSpeakers.length,
  ]);

  // Memoize speaker mapping statistics
  const speakerMappingStats = useMemo(() => {
    // Use currentlyActiveSpeakers (speakers with actual segments after reassignments) as the base
    const totalActiveSpeakers = currentlyActiveSpeakers.length;
    
    // Count speakers with custom names (name different from speaker ID)
    const mappedCount = currentlyActiveSpeakers.filter((speakerId: string) => {
      const mapping = storeSpeakerMappings.find(m => m.speakerId === speakerId);
      // Consider mapped only if has a custom name (different from speaker ID)
      return mapping && mapping.name && mapping.name.trim() !== "" && mapping.name !== speakerId;
    }).length;

    return {
      mappedCount: mappedCount,
      totalCount: totalActiveSpeakers,
      isFullyMapped: mappedCount === totalActiveSpeakers && totalActiveSpeakers > 0,
    };
  }, [currentlyActiveSpeakers, storeSpeakerMappings]);

  // Memoize event handlers
  const handleSpeakerMappingsChanged = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  const handleSpeakerMappingsSaved = useCallback((savedMappings: SpeakerMapping[]) => {
    console.log('🔄 TranscriptDisplay: Speaker mappings saved', savedMappings);
    
    // Update the speaker mappings in the store using addSpeakerMapping which handles both add/update
    savedMappings.forEach(mapping => {
      addSpeakerMapping(mapping);
    });
    
    setSpeakerMappingDialogOpen(false);
    setForceUpdate((prev) => prev + 1);
  }, [addSpeakerMapping]);

  const handleSpeakerSegmentChange = useCallback(
    (segmentIndex: number, newSpeaker: string) => {
      // Use store action for reassignment instead of local state
      reassignSegment(segmentIndex, newSpeaker);
      setForceUpdate((prev) => prev + 1);
    },
    [reassignSegment]
  );

  // Handle reverting all speakers to original auto-detected values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleRevertAllSpeakers = useCallback(async () => {
    try {
      console.log('🔄 RESET: Starting reset process...');
      console.log('🔄 RESET: allDetectedSpeakers:', allDetectedSpeakers);
      console.log('🔄 RESET: original speakerSegments:', transcription.speakerSegments?.map(s => s.speaker));
      
      // Clear only speaker overrides (not entire session data)
      sessionManager.clearSpeakerOverrides();
      
      // Clear all speaker mappings to revert to original auto-detected speakers
      clearSpeakers();
      console.log('🔄 RESET: Cleared speakers');
      
      // Re-initialize with original detected speakers (no mappings)
      initializeSpeakers(transcription.transcriptionId, allDetectedSpeakers, []);
      console.log('🔄 RESET: Re-initialized with speakers:', allDetectedSpeakers);
      
      // Reset segments to original using store action
      resetToOriginal();
      console.log('🔄 RESET: Reset speaker segments');
      
      // Force update to reflect changes
      setForceUpdate((prev) => prev + 1);
      
      console.log('🔄 RESET: Reset complete');
      
    } catch (error) {
      console.error('Failed to revert all speakers:', error);
    }
  }, [clearSpeakers, initializeSpeakers, resetToOriginal, transcription.transcriptionId, allDetectedSpeakers]);

  // Handle deleting transcription - open confirmation dialog
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleDeleteTranscription = useCallback(() => {
    setDeleteConfirmationOpen(true);
  }, []);

  // Handle confirmed deletion - reset page to original state
  const handleConfirmDelete = useCallback(() => {
    setDeleteConfirmationOpen(false);
    // Reset the page to its original state by refreshing
    window.location.reload();
  }, []);

  // Handle cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmationOpen(false);
  }, []);

  // Memoize helper function to resolve speaker display name
  const resolveSpeakerName = useCallback(
    (speakerId: string): string => {
      // First check for session-based overrides
      const override = sessionOverrides[speakerId];
      if (override && override.action === "Override" && override.newValue) {
        return override.newValue;
      }

      // Then check speaker mappings
      const mapping = effectiveSpeakerMappings.find(
        (m) => m.speakerId === speakerId
      );
      if (mapping) {
        return mapping.role
          ? `${mapping.name} (${mapping.role})`
          : mapping.name;
      }

      // Return the original speaker ID if no mapping exists yet
      return speakerId;
    },
    [sessionOverrides, effectiveSpeakerMappings]
  );

  // Memoize utility functions
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes < 1) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1000));
    let value = bytes / Math.pow(1000, i);
    // Always show two decimals for MB
    if (sizes[i] === "MB") {
      return value.toFixed(2) + " MB";
    }
    return Math.round(value * 100) / 100 + " " + sizes[i];
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, segmentId?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedSegment(segmentId || "full");
        setTimeout(() => setCopiedSegment(null), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    },
    []
  );

  // Memoize full transcript text for copy functionality
  const fullTranscriptText = useMemo(() => {
    if (!speakerSegments || speakerSegments.length === 0) {
      return transcription.transcribedText || "";
    }
    return speakerSegments
      .map((s) => `${resolveSpeakerName(s.speaker)}: ${s.text}`)
      .join("\n\n");
  }, [speakerSegments, resolveSpeakerName, transcription.transcribedText]);

  // Memoize copy handlers
  const handleCopyFullTranscript = useCallback(() => {
    copyToClipboard(fullTranscriptText);
  }, [copyToClipboard, fullTranscriptText]);

  const handleCopySimpleTranscript = useCallback(() => {
    copyToClipboard(transcription.transcribedText!);
  }, [copyToClipboard, transcription.transcribedText]);

  if (loading) {
    return (
      <Card sx={{ mb: 2, width: "100%" }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Processing transcription...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (transcription.status === "Failed" || transcription.errorMessage) {
    return (
      <Card sx={{ mb: 2, width: "100%" }}>
        <CardContent>
          <Alert severity="error" icon={<Error />}>
            <Typography variant="h6" gutterBottom>
              Transcription Failed
            </Typography>
            <Typography variant="body2">
              {transcription.errorMessage ||
                "An unknown error occurred during transcription."}
            </Typography>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>File:</strong> {transcription.fileName} (
              {formatFileSize(transcription.fileSize)})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Processing Time:</strong> {transcription.processingTimeMs}
              ms
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, width: "100%" }}>
      <CardContent>
        {/* Header with file info and metadata */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Typography variant="h5" component="h3">
              {transcription.fileName}
            </Typography>
          </Box>

          {/* Metadata chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              icon={<Schedule />}
              label={`${formatTime(Math.round(transcription.processingTimeMs / 1000))} processing`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={formatFileSize(transcription.fileSize)}
              size="small"
              variant="outlined"
            />
            {transcription.duration && (
              <Chip
                icon={<PlayCircle />}
                label={`${formatTime(transcription.duration)} audio`}
                size="small"
                variant="outlined"
              />
            )}
            {transcription.speakerCount && (
              <Chip
                icon={<Person />}
                label={`${speakerMappingStats.mappedCount}/${speakerMappingStats.totalCount} speakers named`}
                size="small"
                variant="outlined"
                color={
                  speakerMappingStats.isFullyMapped ? "success" : "default"
                }
              />
            )}
            {transcription.confidenceScore && (
              <Chip
                label={`${Math.round(
                  transcription.confidenceScore * 100
                )}% confidence`}
                size="small"
                variant="outlined"
                sx={{
                  textDecoration: isTranscriptStructureInvalidated ? "line-through" : "none",
                  opacity: isTranscriptStructureInvalidated ? 0.7 : 1,
                }}
                title={
                  isTranscriptStructureInvalidated
                    ? "Original confidence - invalidated by transcript modifications"
                    : "Original transcription confidence"
                }
              />
            )}
            {transcription.detectedLanguage && (
              <Chip
                label={transcription.detectedLanguage.toUpperCase()}
                size="small"
                variant="outlined"
              />
            )}
            
          </Stack>

          {/* Step 2 Tour Popover - Transcription Statistics Overview */}
          {isDemo && (
            <Paper
              sx={{
                position: 'absolute',
                top: '715px',
                left: '400px',
                p: 2,
                backgroundColor: 'grey.700',
                color: 'white',
                borderRadius: 2,
                maxWidth: '300px',
                zIndex: 9999,
                boxShadow: 3,
                pointerEvents: 'none', // Prevent blocking interactions
              }}
            >
              {/* Step indicator */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  Step 2
                </Typography>
              </Box>

              {/* Title */}
              <Typography variant="h6" component="h3" sx={{ mb: 1, pr: 4 }}>
                Transcription Statistics
              </Typography>

              {/* Description */}
              <Typography variant="body2" color="white" sx={{ mb: 2 }}>
                Great! Your audio has been processed. Here you can see the transcription statistics: processing time, file size, audio duration, speaker mapping progress, AI confidence score, and detected language.
              </Typography>

              {/* Controls - Development mode: no navigation needed */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'grey.300',
                    cursor: 'pointer',
                    '&:hover': { color: 'white' }
                  }}
                >
                  CLOSE
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Speaker Mapping Section */}
        {filteredDetectedSpeakers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SpeakerMappingComponent
              transcriptionId={transcription.transcriptionId}
              detectedSpeakers={filteredDetectedSpeakers}
              onMappingsChanged={handleSpeakerMappingsChanged}
            />
          </Box>
        )}

        {/* Speaker segments display */}
        {speakerSegments && speakerSegments.length > 0 ? (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" component="h4">
                Transcript
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Copy full transcript">
                <IconButton
                  size="small"
                  onClick={handleCopyFullTranscript}
                  color={copiedSegment === "full" ? "success" : "default"}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Speaker segments */}
            <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
              {speakerSegments.map((segment, index) => (
                <Box key={`${index}-${forceUpdate}`} sx={{ mb: 2 }}>
                  <TranscriptSpeakerSegment
                    segment={segment}
                    index={index}
                    speakerMappings={effectiveSpeakerMappings}
                    showReassignControls={true}
                    onSpeakerChange={handleSpeakerSegmentChange}
                    isTranscriptStructureInvalidated={isTranscriptStructureInvalidated}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ) : transcription.transcribedText ? (
          /* Fallback to simple text display */
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" component="h4">
                Transcript
              </Typography>
              <Tooltip title="Copy transcript">
                <IconButton
                  size="small"
                  onClick={handleCopySimpleTranscript}
                  color={copiedSegment === "full" ? "success" : "default"}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.6,
                userSelect: "text",
                cursor: "text",
                maxHeight: "400px",
                overflowY: "auto",
                p: 2,
                backgroundColor: "action.hover",
                borderRadius: 1,
              }}
            >
              {transcription.transcribedText}
            </Typography>
          </Box>
        ) : (
          <Alert severity="info">
            <Typography variant="body2">
              No transcript content available.
            </Typography>
          </Alert>
        )}

        {/* AI-Powered Meeting Summary Section */}
        {transcription.transcribedText && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <SummaryDisplay
              transcriptionId={transcription.transcriptionId}
              transcriptText={transcription.transcribedText || ""}
              speakerMappings={effectiveSpeakerMappings}
              detectedSpeakers={allDetectedSpeakers}
            />
          </Box>
        )}

        {/* Footer with timestamp */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Created: {new Date(transcription.createdAt).toLocaleString()}
            {transcription.completedAt && (
              <>
                {" "}
                | Completed:{" "}
                {new Date(transcription.completedAt).toLocaleString()}
              </>
            )}
          </Typography>
        </Box>
      </CardContent>

      {/* Speaker Mapping Dialog */}
      <SpeakerMappingDialog
        open={speakerMappingDialogOpen}
        onClose={() => setSpeakerMappingDialogOpen(false)}
        transcriptionId={transcription.transcriptionId}
        existingMappings={getAllMappings?.() || []}
        detectedSpeakers={detectedSpeakers}
        onMappingsSaved={handleSpeakerMappingsSaved}
      />

      {/* Transcription Delete Confirmation Dialog */}
      <ConfirmTranscriptionDeleteDialog
        open={deleteConfirmationOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Card>
  );
};

export default TranscriptDisplay;
