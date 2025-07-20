import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { SpeakerMappingComponent } from "./SpeakerMapping";
import type { SpeakerMapping } from "../types";

export const SpeakerMappingDemo: React.FC = () => {
  // Mock data for demonstration
  const mockTranscriptionId = "demo-transcription-123";
  const mockDetectedSpeakers = ["Speaker 1", "Speaker 2", "Speaker 3"];

  const handleMappingsChanged = (mappings: SpeakerMapping[]) => {
    console.log("Speaker mappings updated:", mappings);
  };

  return (
    <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Speaker Mapping Demo
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        This demo shows the Speaker Mapping functionality. Click "Map Speakers"
        to assign real names and roles to the detected speakers.
      </Typography>

      <Paper elevation={1} sx={{ p: 2 }}>
        <SpeakerMappingComponent
          transcriptionId={mockTranscriptionId}
          detectedSpeakers={mockDetectedSpeakers}
          onMappingsChanged={handleMappingsChanged}
        />
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          How to Test:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li>Click the "Map Speakers" button to open the mapping dialog</li>
          <li>Enter names like "Alice Johnson", "Bob Smith", "Carol Davis"</li>
          <li>Add roles like "Product Manager", "Engineer", "Designer"</li>
          <li>Click "Save Mappings" to persist the data</li>
          <li>The component will show the mapped and unmapped speakers</li>
          <li>Click "Edit Mappings" to modify existing mappings</li>
        </Typography>
      </Box>
    </Box>
  );
};

export default SpeakerMappingDemo;
