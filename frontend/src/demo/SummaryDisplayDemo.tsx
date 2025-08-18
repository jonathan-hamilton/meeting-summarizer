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
import type { SpeakerMapping, MeetingSummary } from "../types";

const SummaryDisplayDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>("meeting1");
  const [showSummary, setShowSummary] = useState(false);

  // Mock transcription data for demo
  const demoData = {
    meeting1: {
      transcriptionId: "demo-transcription-001",
      title: "Project Planning Meeting",
      description: "Sprint planning session with development team",
      transcriptText: "Alice Johnson: Good morning everyone. Let's start our sprint planning meeting. We have several user stories to discuss for the upcoming sprint. Bob, can you give us an overview of the technical requirements? Bob Smith: Absolutely, Alice. We've reviewed the backlog and identified three main features that need to be implemented. The authentication system will require about 8 story points, and I'll take the lead on that. Carol Davis: From a QA perspective, we'll need to create comprehensive test cases for the authentication flow. I can work on that parallel to development. Alice Johnson: Great. Carol, please coordinate with Bob on the testing requirements. Let's also discuss the timeline for the mobile responsive design updates.",
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
      transcriptText: "David Chen: Thank you all for joining today's quarterly review. Our revenue growth has exceeded expectations by 15% this quarter. Emily, can you walk us through the financial details? Emily Rodriguez: Certainly, David. Our operating margin improved to 23%, and we're ahead of our annual budget by $2.1 million. I recommend increasing our R&D investment for next quarter. Frank Wilson: From a technology standpoint, our new infrastructure investments are paying off. I propose we accelerate our cloud migration timeline and hire 3 additional engineers. David Chen: Excellent points. Frank, please prepare a detailed hiring plan. Emily, let's schedule a follow-up meeting to discuss the R&D budget allocation.",
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
      transcriptText: "Grace Kim: Welcome everyone to our requirements gathering session. We're here to understand the client's needs for the new customer portal. Henry, could you start by outlining your primary objectives? Henry Taylor: Thank you, Grace. We need a self-service portal where customers can track orders, update their profiles, and submit support tickets. The current system is outdated and causing customer frustration. Iris Miller: From a user experience perspective, I suggest we prioritize mobile-first design since 70% of your customers access services via mobile devices. Grace Kim: Excellent point, Iris. Henry, what's your timeline for this project? Henry Taylor: We're hoping to launch the beta version within 4 months. Grace, can you prepare a detailed project timeline? Iris, I'd like you to create wireframes for the mobile interface by next week.",
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

  const handleSummaryGenerated = (summary: MeetingSummary) => {
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
          transcriptText={currentDemo.transcriptText}
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
