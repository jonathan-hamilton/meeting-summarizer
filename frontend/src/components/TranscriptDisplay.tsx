import React, { useState } from "react";
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
import SummaryDisplay from "./SummaryDisplay";
import { EnhancedSpeakerSegment } from "./EnhancedSpeakerSegment";
import { sessionManager } from "../services/sessionManager";

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
  const [currentSpeakerMappings, setCurrentSpeakerMappings] = useState<
    SpeakerMapping[]
  >([]);
  const [speakerSegments, setSpeakerSegments] = useState(
    transcription.speakerSegments || []
  );
  const [forceUpdate, setForceUpdate] = useState(0);

  // Use provided speaker mappings or those included in the transcription
  const effectiveSpeakerMappings =
    speakerMappings || transcription.speakerMappings || currentSpeakerMappings;

  // Extract unique speakers from transcript segments
  const allDetectedSpeakers = speakerSegments
    ? Array.from(new Set(speakerSegments.map((s) => s.speaker)))
    : [];

  // REQ-SPK-DEL-5: Filter out deleted speakers (only show speakers that have mappings)
  const detectedSpeakers = allDetectedSpeakers.filter((speaker) =>
    effectiveSpeakerMappings.some((mapping) => mapping.speakerId === speaker)
  );

  // Handle speaker mappings updates
  const handleSpeakerMappingsChanged = (mappings: SpeakerMapping[]) => {
    setCurrentSpeakerMappings(mappings);
    // UI will update because state changes
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

    // REQ-SPK-DEL-3: Display "Unassigned" for speakers without mappings (deleted speakers)
    return "Unassigned";
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
                label={`${transcription.speakerCount} speakers`}
                size="small"
                variant="outlined"
              />
            )}
            {transcription.confidenceScore && (
              <Chip
                label={`${Math.round(
                  transcription.confidenceScore * 100
                )}% confidence`}
                size="small"
                variant="outlined"
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
                  <EnhancedSpeakerSegment
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
    </Card>
  );
};

export default TranscriptDisplay;
