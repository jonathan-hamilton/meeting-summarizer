import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore,
  ContentCopy,
  Person,
  Schedule,
  VolumeUp,
  CheckCircle,
  Error,
} from "@mui/icons-material";
import type { TranscriptionResponse, SpeakerMapping } from "../types";
import { SpeakerMappingComponent } from "./SpeakerMapping";

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

  // Use provided speaker mappings or those included in the transcription
  const effectiveSpeakerMappings =
    speakerMappings || transcription.speakerMappings || currentSpeakerMappings;

  // Extract unique speakers from transcript segments
  const detectedSpeakers = transcription.speakerSegments
    ? Array.from(new Set(transcription.speakerSegments.map((s) => s.speaker)))
    : [];

  // Handle speaker mappings updates
  const handleSpeakerMappingsChanged = (mappings: SpeakerMapping[]) => {
    setCurrentSpeakerMappings(mappings);
  };

  // Helper function to resolve speaker display name
  const resolveSpeakerName = (speakerId: string): string => {
    const mapping = effectiveSpeakerMappings.find(
      (m) => m.speakerId === speakerId
    );
    if (mapping) {
      return mapping.role ? `${mapping.name} (${mapping.role})` : mapping.name;
    }
    return speakerId; // Fallback to original speaker ID
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

  // Get speaker color based on speaker name
  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      "#1976d2", // blue
      "#388e3c", // green
      "#f57c00", // orange
      "#7b1fa2", // purple
      "#c2185b", // pink
      "#5d4037", // brown
      "#455a64", // blue grey
      "#e91e63", // deep pink
    ];

    // Extract speaker number or use hash for consistent coloring
    const match = speaker.match(/\d+/);
    const index = match
      ? (parseInt(match[0]) - 1) % colors.length
      : speaker.split("").reduce((a, b) => a + b.charCodeAt(0), 0) %
        colors.length;

    return colors[index];
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
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
      <Card sx={{ mb: 2 }}>
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
    <Card sx={{ mb: 2 }}>
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
        {transcription.speakerSegments &&
        transcription.speakerSegments.length > 0 ? (
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
                      transcription
                        .speakerSegments!.map(
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
              {transcription.speakerSegments.map((segment, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ width: "100%" }}
                      >
                        <Chip
                          label={resolveSpeakerName(segment.speaker)}
                          size="small"
                          sx={{
                            backgroundColor: getSpeakerColor(segment.speaker),
                            color: "white",
                            fontWeight: "bold",
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(segment.start)} -{" "}
                          {formatTime(segment.end)}
                        </Typography>
                        {segment.confidence && (
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(segment.confidence * 100)}%
                          </Typography>
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title="Copy segment">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(segment.text, `segment-${index}`);
                            }}
                            color={
                              copiedSegment === `segment-${index}`
                                ? "success"
                                : "default"
                            }
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.6,
                          userSelect: "text",
                          cursor: "text",
                        }}
                      >
                        {segment.text}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
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
