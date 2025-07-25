import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import type { TranscriptionResponse, SpeakerMapping } from "../types";
import { SpeakerMappingComponent } from "./SpeakerMapping";
import { SpeakerMappingDialog } from "./SpeakerMappingDialog";
import SummaryDisplay from "./SummaryDisplay";
import { TranscriptSpeakerSegment } from "./TranscriptSpeakerSegment";
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
  } = useSpeakerStore();

  // Extract unique speakers from transcript segments
  const allDetectedSpeakers = speakerSegments
    ? Array.from(new Set(speakerSegments.map((s) => s.speaker)))
    : [];

  // Initialize store when component mounts or transcription changes
  useEffect(() => {
    try {
      const existingMappings =
        speakerMappings || transcription.speakerMappings || [];
      // Use the allDetectedSpeakers calculated from current speaker segments
      const speakersFromSegments = speakerSegments
        ? Array.from(new Set(speakerSegments.map((s) => s.speaker)))
        : [];
      initializeSpeakers(
        transcription.transcriptionId,
        speakersFromSegments,
        existingMappings
      );
    } catch (error) {
      console.error("Error initializing speakers:", error);
    }
  }, [
    transcription.transcriptionId,
    speakerMappings,
    transcription.speakerMappings,
    initializeSpeakers,
    speakerSegments,
  ]);

  // Use store state for speaker mappings and detected speakers
  const effectiveSpeakerMappings = storeSpeakerMappings;
  // Fallback to allDetectedSpeakers if store doesn't have detected speakers yet
  const detectedSpeakers =
    storeDetectedSpeakers.length > 0
      ? storeDetectedSpeakers
      : allDetectedSpeakers;

  // Check if speakers have been modified from original transcription
  const hasModifiedSpeakers = () => {
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
    const sessionOverrides = sessionManager.getOverrides();
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    return hasEditedSpeakers || hasSessionOverrides;
  };

  // Handle speaker mappings updates (legacy - now handled by store)
  const handleSpeakerMappingsChanged = () => {
    // The store will be updated directly by the SpeakerMappingComponent
    // This handler is kept for backward compatibility but may be removed
    setForceUpdate((prev) => prev + 1);
  };

  // Handle speaker mapping dialog save (simplified - store handles the state)
  const handleSpeakerMappingsSaved = () => {
    setSpeakerMappingDialogOpen(false);
    // Force update to reflect changes
    setForceUpdate((prev) => prev + 1);
  };

  // Handle individual speaker segment reassignment
  const handleSpeakerSegmentChange = (
    segmentIndex: number,
    newSpeaker: string
  ) => {
    setSpeakerSegments((prevSegments) =>
      prevSegments.map((segment, index) =>
        index === segmentIndex ? { ...segment, speaker: newSpeaker } : segment
      )
    );

    // Force a re-render by updating a timestamp or counter
    // This ensures that session-based overrides are reflected in the UI
    setForceUpdate((prev) => prev + 1);
  };
  // Helper function to resolve speaker display name
  const resolveSpeakerName = (speakerId: string): string => {
    // First check for session-based overrides
    const overrides = sessionManager.getOverrides();
    const override = overrides[speakerId];
    if (override && override.action === "Override" && override.newValue) {
      return override.newValue;
    }

    // Then check speaker mappings
    const mapping = effectiveSpeakerMappings.find(
      (m) => m.speakerId === speakerId
    );
    if (mapping) {
      return mapping.role ? `${mapping.name} (${mapping.role})` : mapping.name;
    }

    // Return the original speaker ID if no mapping exists yet
    return speakerId;
  };

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, segmentId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSegment(segmentId || "full");
      setTimeout(() => setCopiedSegment(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

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
            <Chip
              icon={<CheckCircle />}
              label={transcription.status}
              color="success"
              variant="outlined"
              size="small"
            />
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
                label={`${
                  // Count only detected speakers that have been mapped with names
                  detectedSpeakers.filter((speakerId) => {
                    const mapping = effectiveSpeakerMappings.find(
                      (m) => m.speakerId === speakerId
                    );
                    return (
                      mapping && mapping.name && mapping.name.trim() !== ""
                    );
                  }).length
                }/${
                  // Total count includes detected + manually added speakers
                  Array.from(
                    new Set([
                      ...detectedSpeakers,
                      ...effectiveSpeakerMappings.map((m) => m.speakerId),
                    ])
                  ).length
                } speakers mapped`}
                size="small"
                variant="outlined"
                color={
                  detectedSpeakers.filter((speakerId) => {
                    const mapping = effectiveSpeakerMappings.find(
                      (m) => m.speakerId === speakerId
                    );
                    return (
                      mapping && mapping.name && mapping.name.trim() !== ""
                    );
                  }).length ===
                  Array.from(
                    new Set([
                      ...detectedSpeakers,
                      ...effectiveSpeakerMappings.map((m) => m.speakerId),
                    ])
                  ).length
                    ? "success"
                    : "default"
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
                  textDecoration: hasModifiedSpeakers()
                    ? "line-through"
                    : "none",
                  opacity: hasModifiedSpeakers() ? 0.7 : 1,
                }}
                title={
                  hasModifiedSpeakers()
                    ? "Original confidence - modified by speaker changes"
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
                Speaker Transcript
              </Typography>
              <Tooltip title="Copy full transcript">
                <IconButton
                  size="small"
                  onClick={() =>
                    copyToClipboard(
                      speakerSegments
                        .map(
                          (s) => `${resolveSpeakerName(s.speaker)}: ${s.text}`
                        )
                        .join("\n\n")
                    )
                  }
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
                  onClick={() =>
                    copyToClipboard(transcription.transcribedText!)
                  }
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
            <Typography variant="h5" component="h3" gutterBottom>
              AI-Powered Meeting Summary
            </Typography>
            <SummaryDisplay
              transcriptionId={transcription.transcriptionId}
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
