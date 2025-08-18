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
} from "@mui/material";
import {
  ContentCopy,
  Person,
  Schedule,
  VolumeUp,
  CheckCircle,
  Error,
  Undo,
  Download,
  Delete,
} from "@mui/icons-material";
import type { TranscriptionResponse, SpeakerMapping } from "../types";
import { SpeakerMappingComponent } from "./SpeakerMapping";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import SummaryDisplay from "./SummaryDisplay";
import { TranscriptSpeakerSegment } from "./TranscriptSpeakerSegment";
import { SessionStatus } from "./SessionStatus";
import { sessionManager } from "../services/sessionManager";
import { useSpeakerStore } from "../stores/speakerStore";

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
  const [speakerSegments, setSpeakerSegments] = useState(
    transcription.speakerSegments || []
  );
  const [forceUpdate, setForceUpdate] = useState(0);
  const [speakerMappingDialogOpen, setSpeakerMappingDialogOpen] =
    useState(false);

  // Zustand store state and actions
  const {
    speakerMappings: storeSpeakerMappings,
    detectedSpeakers: storeDetectedSpeakers,
    initializeSpeakers,
    getAllMappings,
    clearSpeakers,
  } = useSpeakerStore();

  // Memoize extracted unique speakers from original transcript segments (not modified ones)
  const allDetectedSpeakers = useMemo(() => {
    return transcription.speakerSegments
      ? Array.from(new Set(transcription.speakerSegments.map((s) => s.speaker)))
      : [];
  }, [transcription.speakerSegments]);

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
      // Use current store mappings if available, otherwise fall back to props/transcription mappings
      const currentStoreMappings = getAllMappings();
      const existingMappings = currentStoreMappings.length > 0 
        ? currentStoreMappings 
        : speakerMappings || transcription.speakerMappings || [];
      
      // Only initialize if we don't already have the correct transcription and speakers
      const currentTranscriptionId = useSpeakerStore.getState().transcriptionId;
      const currentDetectedSpeakers = useSpeakerStore.getState().detectedSpeakers;
      
      if (currentTranscriptionId !== transcription.transcriptionId || 
          currentDetectedSpeakers.length === 0) {
        console.log('🔄 TranscriptDisplay: Initializing speakers for transcription:', transcription.transcriptionId);
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
  const hasModifiedSpeakers = useMemo(() => {
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
  const hasSpeakerReassignments = useMemo(() => {
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
    // Use the reactive storeSpeakerMappings instead of getAllMappings()
    const currentMappings = storeSpeakerMappings;
    
    // Get session overrides to understand which speakers actually have segments
    const sessionOverrides = sessionManager.getOverrides();
    
    // Get all speakers that actually appear in segments (considering overrides)
    const speakersInSegments = new Set<string>();
    
    // Use current active speakers (excludes deleted speakers)
    currentActiveSpeakers.forEach((id: string) => speakersInSegments.add(id));
    
    // Add manually added speakers from mappings
    currentMappings.forEach(m => speakersInSegments.add(m.speakerId));
    
    // Process session overrides to understand effective speaker assignments
    Object.entries(sessionOverrides).forEach(([, override]) => {
      if (override.action === 'Override' && override.newValue) {
        // Remove the original speaker if all their segments are reassigned
        // Note: This is a simplified approach - in reality we'd need to check if ALL segments are reassigned
        speakersInSegments.add(override.newValue);
      }
    });
    
    const allSpeakerIds = Array.from(speakersInSegments);

    // Count speakers that have names assigned
    const mappedSpeakers = allSpeakerIds.filter((speakerId) => {
      const mapping = currentMappings.find(
        (m) => m.speakerId === speakerId
      );
      return mapping && mapping.name && mapping.name.trim() !== "";
    });

    return {
      mappedCount: mappedSpeakers.length,
      totalCount: allSpeakerIds.length,
      isFullyMapped: mappedSpeakers.length === allSpeakerIds.length,
    };
  }, [currentActiveSpeakers, storeSpeakerMappings]);

  // Memoize event handlers
  const handleSpeakerMappingsChanged = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  const handleSpeakerMappingsSaved = useCallback(() => {
    setSpeakerMappingDialogOpen(false);
    setForceUpdate((prev) => prev + 1);
  }, []);

  const handleSpeakerSegmentChange = useCallback(
    (segmentIndex: number, newSpeaker: string) => {
      setSpeakerSegments((prevSegments) =>
        prevSegments.map((segment, index) =>
          index === segmentIndex ? { ...segment, speaker: newSpeaker } : segment
        )
      );
      setForceUpdate((prev) => prev + 1);
    },
    []
  );

  // Handle reverting all speakers to original auto-detected values
  const handleRevertAllSpeakers = useCallback(async () => {
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
      
      // Reset speaker segments to original speakers
      setSpeakerSegments(transcription.speakerSegments || []);
      console.log('🔄 RESET: Reset speaker segments');
      
      // Force update to reflect changes
      setForceUpdate((prev) => prev + 1);
      
      console.log('🔄 RESET: Reset complete');
      
    } catch (error) {
      console.error('Failed to revert all speakers:', error);
    }
  }, [clearSpeakers, initializeSpeakers, transcription.transcriptionId, transcription.speakerSegments, allDetectedSpeakers]);

  // Handle exporting transcription as JSON
  const handleExportTranscription = useCallback(() => {
    const dataToExport = {
      ...transcription,
      exportedAt: new Date().toISOString(),
      exportNote: "Real Whisper transcription for testing - saved from TranscriptDisplay component"
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcription-${transcription.transcriptionId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transcription]);

  // Handle deleting transcription (this would need to be passed up to parent)
  const handleDeleteTranscription = useCallback(() => {
    // For now, just show an alert - in a real app you'd pass this up to the parent
    alert('Delete functionality would be implemented here');
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
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
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <VolumeUp color="primary" />
            <Typography variant="h5" component="h3" sx={{ flexGrow: 1 }}>
              {transcription.fileName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<CheckCircle />}
                label={transcription.status}
                color="success"
                variant="outlined"
                size="small"
              />
              
              {/* Export and Delete buttons */}
              <Tooltip title="Download transcription as JSON for reuse">
                <IconButton
                  size="small"
                  onClick={handleExportTranscription}
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Remove transcription">
                <IconButton
                  size="small"
                  onClick={handleDeleteTranscription}
                  color="error"
                  sx={{ ml: 0.5 }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
              
              {/* Reset button - show when there are any modifications */}
              {(hasModifiedSpeakers || hasSpeakerReassignments) && (
                <Tooltip title="Reset all changes and revert to original transcript">
                  <Chip
                    icon={<Undo />}
                    label="RESET TRANSCRIPT"
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleRevertAllSpeakers}
                    clickable
                    sx={{ fontWeight: 'bold' }}
                  />
                </Tooltip>
              )}
            </Box>
          </Stack>

          {/* Metadata chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              icon={<Schedule />}
              label={`${transcription.processingTimeMs}ms`}
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
                label={formatTime(transcription.duration)}
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
            
            {/* Session Status Display */}
            <SessionStatus />
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Speaker Mapping Section */}
        {detectedSpeakers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SpeakerMappingComponent
              transcriptionId={transcription.transcriptionId}
              detectedSpeakers={detectedSpeakers}
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
    </Card>
  );
};

export default TranscriptDisplay;
