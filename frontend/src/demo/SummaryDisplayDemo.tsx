import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Psychology } from "@mui/icons-material";
import SummaryDisplay from "../components/SummaryDisplay";
import type { SpeakerMapping, SummaryResult } from "../types";

const SummaryDisplayDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>("meeting1");
  const [showSummary, setShowSummary] = useState(false);

  // Mock transcription data for demo
  const demoData = {
    meeting1: {
      transcriptionId: "demo-transcription-001",
      title: "Project Planning Meeting",
      description: "Sprint planning session with development team",
      speakerMappings: [
        {
          speakerId: "Speaker 1",
          name: "Alice Johnson",
          role: "Product Manager",
          transcriptionId: "demo-transcription-001",
        },
        {
          speakerId: "Speaker 2",
          name: "Bob Smith",
          role: "Lead Developer",
          transcriptionId: "demo-transcription-001",
        },
        {
          speakerId: "Speaker 3",
          name: "Carol Davis",
          role: "QA Engineer",
          transcriptionId: "demo-transcription-001",
        },
      ] as SpeakerMapping[],
    },
    meeting2: {
      transcriptionId: "demo-transcription-002",
      title: "Executive Strategy Review",
      description: "Quarterly business review with C-suite",
      speakerMappings: [
        {
          speakerId: "Speaker 1",
          name: "David Chen",
          role: "CEO",
          transcriptionId: "demo-transcription-002",
        },
        {
          speakerId: "Speaker 2",
          name: "Emily Rodriguez",
          role: "CFO",
          transcriptionId: "demo-transcription-002",
        },
        {
          speakerId: "Speaker 3",
          name: "Frank Wilson",
          role: "CTO",
          transcriptionId: "demo-transcription-002",
        },
      ] as SpeakerMapping[],
    },
    meeting3: {
      transcriptionId: "demo-transcription-003",
      title: "Client Requirements Gathering",
      description: "Discovery session with external stakeholders",
      speakerMappings: [
        {
          speakerId: "Speaker 1",
          name: "Grace Kim",
          role: "Business Analyst",
          transcriptionId: "demo-transcription-003",
        },
        {
          speakerId: "Speaker 2",
          name: "Henry Taylor",
          role: "Client Representative",
          transcriptionId: "demo-transcription-003",
        },
        {
          speakerId: "Speaker 3",
          name: "Iris Miller",
          role: "UX Designer",
          transcriptionId: "demo-transcription-003",
        },
      ] as SpeakerMapping[],
    },
  };

  const currentDemo = demoData[selectedDemo as keyof typeof demoData];

  const handleStartDemo = () => {
    setShowSummary(true);
  };

  const handleSummaryGenerated = (summary: SummaryResult) => {
    console.log("Summary generated:", summary);
    // In a real app, you might save this to state or send to a backend
  };

  if (showSummary) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setShowSummary(false)}
            sx={{ mb: 2 }}
          >
            ← Back to Demo Selection
          </Button>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentDemo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentDemo.description}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {currentDemo.speakerMappings.map((mapping) => (
                  <Chip
                    key={mapping.speakerId}
                    label={`${mapping.name} (${mapping.role})`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <SummaryDisplay
          transcriptionId={currentDemo.transcriptionId}
          speakerMappings={currentDemo.speakerMappings}
          onSummaryGenerated={handleSummaryGenerated}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        AI Summary Display Demo
      </Typography>

      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Experience the power of AI-generated meeting summaries with role-aware
        insights. Select a demo scenario to explore different summary types and
        export options.
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Demo Features:</strong> This demo showcases the S2.4 Summary
          Display and Export Interface. It integrates with the AI summarization
          backend to generate role-specific insights, action items, key
          decisions, and exportable summaries in multiple formats.
        </Typography>
      </Alert>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Demo Scenario
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Demo Meeting</InputLabel>
            <Select
              value={selectedDemo}
              label="Demo Meeting"
              onChange={(e) => setSelectedDemo(e.target.value)}
            >
              <MenuItem value="meeting1">
                <Box>
                  <Typography variant="body1">
                    Project Planning Meeting
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sprint planning with Product Manager, Lead Developer, and QA
                    Engineer
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="meeting2">
                <Box>
                  <Typography variant="body1">
                    Executive Strategy Review
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Quarterly review with CEO, CFO, and CTO
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="meeting3">
                <Box>
                  <Typography variant="body1">
                    Client Requirements Gathering
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Discovery session with Business Analyst, Client Rep, and UX
                    Designer
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {currentDemo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentDemo.description}
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Participants:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {currentDemo.speakerMappings.map((mapping) => (
                  <Chip
                    key={mapping.speakerId}
                    label={`${mapping.name} (${mapping.role})`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            size="large"
            startIcon={<Psychology />}
            onClick={handleStartDemo}
            fullWidth
          >
            Start AI Summary Demo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What You'll Experience
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                🎯 Role-Aware Summaries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate personalized summaries tailored to specific roles and
                responsibilities.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                📊 Multiple Summary Types
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Brief overviews, detailed analysis, action items, key decisions,
                and executive summaries.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                📤 Export Options
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Copy to clipboard, download as TXT/Markdown/HTML, and
                print-friendly formatting.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ⚡ Real-time Generation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Watch AI summaries generate in real-time with loading states and
                progress indicators.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="warning" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This demo requires the backend AI summarization
          service to be running. If the service is unavailable, mock summaries
          will be displayed for demonstration purposes.
        </Typography>
      </Alert>

      <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          How to Test:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li>Select a demo scenario from the dropdown menu</li>
          <li>Click "Start AI Summary Demo" to begin</li>
          <li>
            Test summary generation by clicking "Generate Summary" for each tab
          </li>
          <li>
            Verify role-aware summaries show relevant insights for each
            participant role
          </li>
          <li>
            Test export functionality: copy to clipboard, download TXT/MD/HTML
            formats
          </li>
          <li>
            Check configuration panel: adjust summary length and focus areas
          </li>
          <li>
            Validate different summary types: Brief, Detailed, Action Items, Key
            Decisions, Executive
          </li>
          <li>Ensure loading states and error handling work correctly</li>
          <li>
            Verify speaker-specific insights appear when role mappings are
            present
          </li>
        </Typography>
      </Box>
    </Box>
  );
};

export default SummaryDisplayDemo;
