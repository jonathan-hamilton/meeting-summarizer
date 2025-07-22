/**
 * Demo Component for Testing Speaker Reassignment (S3.1)
 * Shows how to integrate the Enhanced Speaker Segment component
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { EnhancedSpeakerSegment } from "./EnhancedSpeakerSegment";
import { SessionStatus } from "./SessionStatus";
import { SpeakerSource } from "../types";
import type { SpeakerSegment, SpeakerMapping } from "../types";

/**
 * Demo component for testing speaker reassignment functionality
 */
export const SpeakerReassignmentDemo: React.FC = () => {
  // Sample transcription data for testing
  const [speakerSegments] = useState<SpeakerSegment[]>([
    {
      start: 0,
      end: 15.5,
      text: "Welcome everyone to today's meeting. I'd like to start by reviewing our quarterly goals.",
      speaker: "Speaker 1",
      confidence: 0.95,
    },
    {
      start: 16,
      end: 28.3,
      text: "Thank you, John. I have the budget report ready. Our expenses are tracking well this quarter.",
      speaker: "Speaker 2",
      confidence: 0.88,
    },
    {
      start: 29,
      end: 45.7,
      text: "That's excellent news. I also wanted to discuss the new client requirements we received yesterday.",
      speaker: "Speaker 1",
      confidence: 0.92,
    },
    {
      start: 46,
      end: 62.1,
      text: "Yes, I reviewed those requirements. They're quite comprehensive and will need our full team's attention.",
      speaker: "Speaker 3",
      confidence: 0.89,
    },
  ]);

  // Sample speaker mappings
  const [speakerMappings, setSpeakerMappings] = useState<SpeakerMapping[]>([
    {
      speakerId: "Speaker 1",
      name: "John Smith",
      role: "Project Manager",
      transcriptionId: "demo_transcript_001",
      source: SpeakerSource.AutoDetected,
      isOverridden: false,
    },
    {
      speakerId: "Speaker 2",
      name: "Sarah Johnson",
      role: "Financial Analyst",
      transcriptionId: "demo_transcript_001",
      source: SpeakerSource.AutoDetected,
      isOverridden: false,
    },
  ]);

  /**
   * Handle speaker reassignment from child components
   */
  const handleSpeakerChange = (segmentIndex: number, newSpeakerId: string) => {
    console.log(
      `Segment ${segmentIndex} reassigned to speaker ${newSpeakerId}`
    );
    // In a real app, you would update the transcript data and potentially sync with backend
  };

  /**
   * Add a new speaker mapping for testing
   */
  const handleAddSpeaker = () => {
    const newSpeaker: SpeakerMapping = {
      speakerId: `Speaker ${speakerMappings.length + 1}`,
      name: `New Speaker ${speakerMappings.length + 1}`,
      role: "Participant",
      transcriptionId: "demo_transcript_001",
      source: SpeakerSource.ManuallyAdded,
      isOverridden: false,
    };

    setSpeakerMappings((prev) => [...prev, newSpeaker]);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Speaker Reassignment Demo (S3.1)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This demo shows how to reassign transcript segments to different
        speakers using session-based overrides. Try clicking the edit button
        (✏️) next to any speaker to reassign that segment.
      </Alert>

      <Stack spacing={3}>
        {/* Session Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Session Status
            </Typography>
            <SessionStatus compact={false} showControls={true} />
          </CardContent>
        </Card>

        {/* Current Speaker Mappings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Speaker Mappings
            </Typography>
            <Stack spacing={1}>
              {speakerMappings.map((mapping, index) => (
                <Box
                  key={index}
                  sx={{ p: 1, bgcolor: "grey.50", borderRadius: 1 }}
                >
                  <Typography variant="body2">
                    <strong>{mapping.speakerId}</strong> → {mapping.name} (
                    {mapping.role})
                    {mapping.isOverridden && (
                      <span style={{ color: "orange" }}> • Overridden</span>
                    )}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddSpeaker}
              sx={{ mt: 2 }}
            >
              Add Test Speaker
            </Button>
          </CardContent>
        </Card>

        {/* Transcript Segments */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transcript Segments with Reassignment Controls
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click the edit button (✏️) to reassign any segment to a different
              speaker. Use the undo button (↶) to revert session-based changes.
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {speakerSegments.map((segment, index) => (
                <EnhancedSpeakerSegment
                  key={index}
                  segment={segment}
                  index={index}
                  speakerMappings={speakerMappings}
                  onSpeakerChange={handleSpeakerChange}
                  showReassignControls={true}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to Test Speaker Reassignment
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                1. <strong>View segments:</strong> Each transcript segment shows
                the current speaker assignment
              </Typography>
              <Typography variant="body2">
                2. <strong>Reassign speaker:</strong> Click the edit button (✏️)
                to open the speaker menu
              </Typography>
              <Typography variant="body2">
                3. <strong>Choose existing speaker:</strong> Select from the
                list of current speakers
              </Typography>
              <Typography variant="body2">
                4. <strong>Create new speaker:</strong> Use "Create new
                speaker..." to add a new person
              </Typography>
              <Typography variant="body2">
                5. <strong>Revert changes:</strong> Click the undo button (↶) to
                revert session overrides
              </Typography>
              <Typography variant="body2">
                6. <strong>Session privacy:</strong> All changes are
                session-based and will be cleared when you close the browser
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default SpeakerReassignmentDemo;
