import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  ButtonGroup,
  Divider,
  Paper,
} from "@mui/material";
import {
  Psychology,
  ContentCopy,
  Download,
  Print,
  ExpandMore,
  Person,
  Assignment,
  Schedule,
  CheckCircle,
} from "@mui/icons-material";
import type { SpeakerMapping, MeetingSummary } from "../types";
import { useSpeakerStore } from "../stores/speakerStore";
import apiService from "../services/apiService";

interface SummaryDisplayProps {
  transcriptionId: string;
  transcriptText: string;
  speakerMappings?: SpeakerMapping[];
  onSummaryGenerated?: (summary: MeetingSummary) => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  transcriptionId,
  transcriptText,
  speakerMappings,
  onSummaryGenerated,
}) => {
  // Get current speaker mappings from Zustand store
  const { getAllMappings } = useSpeakerStore();
  
  // Use store mappings if available, otherwise fall back to props
  const effectiveSpeakerMappings = useMemo(() => {
    const storeMappings = getAllMappings();
    return storeMappings.length > 0 ? storeMappings : (speakerMappings || []);
  }, [getAllMappings, speakerMappings]);

  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const handleGenerateSummary = async () => {
    if (!transcriptionId || !transcriptText) {
      setError("No transcription ID or transcript text provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateMeetingSummary({
        transcript: transcriptText,
        speakerMappings: effectiveSpeakerMappings,
        maxTokens: 800,
      });

      if (!response.success || !response.data) {
        const errorMessage = response.message || "Failed to generate summary";
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
        });
        return;
      }

      setSummary(response.data);
      setError(null);
      onSummaryGenerated?.(response.data);
      
      setSnackbar({
        open: true,
        message: "Meeting summary generated successfully!",
        severity: "success",
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to generate summary";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: `${type} copied to clipboard!`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to copy to clipboard",
        severity: "error",
      });
    }
  };

  const handleExport = (format: "text" | "markdown" | "html") => {
    if (!summary) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case "text":
        content = formatAsText(summary);
        filename = `meeting-summary-${summary.summaryId}.txt`;
        mimeType = "text/plain";
        break;
      case "markdown":
        content = formatAsMarkdown(summary);
        filename = `meeting-summary-${summary.summaryId}.md`;
        mimeType = "text/markdown";
        break;
      case "html":
        content = formatAsHtml(summary);
        filename = `meeting-summary-${summary.summaryId}.html`;
        mimeType = "text/html";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: `Summary exported as ${format.toUpperCase()}`,
      severity: "success",
    });
  };

  const formatAsText = (summary: MeetingSummary): string => {
    let content = `MEETING SUMMARY\n`;
    content += `Generated: ${new Date(summary.generation.generatedAt).toLocaleString()}\n`;
    content += `Processing Time: ${summary.generation.processingTimeMs}ms\n`;
    content += `Token Count: ${summary.generation.tokenCount}\n\n`;

    content += `MEETING OVERVIEW\n`;
    content += `${summary.meetingOverview}\n\n`;

    if (summary.actionItemsByRole.length > 0) {
      content += `ACTION ITEMS BY ROLE\n`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        content += `\n${roleGroup.speakerName} (${roleGroup.speakerRole}):\n`;
        roleGroup.actionItems.forEach((item, index) => {
          content += `  ${index + 1}. ${item.description}\n`;
        });
      });
    }

    if (summary.unassignedActionItems.length > 0) {
      content += `\nUNASSIGNED ACTION ITEMS\n`;
      summary.unassignedActionItems.forEach((item, index) => {
        content += `  ${index + 1}. ${item.description}\n`;
      });
    }

    return content;
  };

  const formatAsMarkdown = (summary: MeetingSummary): string => {
    let content = `# Meeting Summary\n\n`;
    content += `**Generated:** ${new Date(summary.generation.generatedAt).toLocaleString()}  \n`;
    content += `**Processing Time:** ${summary.generation.processingTimeMs}ms  \n`;
    content += `**Token Count:** ${summary.generation.tokenCount}  \n\n`;

    content += `## Meeting Overview\n\n${summary.meetingOverview}\n\n`;

    if (summary.actionItemsByRole.length > 0) {
      content += `## Action Items by Role\n\n`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        content += `### ${roleGroup.speakerName} (${roleGroup.speakerRole})\n\n`;
        roleGroup.actionItems.forEach((item, index) => {
          content += `${index + 1}. ${item.description}\n`;
        });
        content += `\n`;
      });
    }

    if (summary.unassignedActionItems.length > 0) {
      content += `## Unassigned Action Items\n\n`;
      summary.unassignedActionItems.forEach((item, index) => {
        content += `${index + 1}. ${item.description}\n`;
      });
    }

    return content;
  };

  const formatAsHtml = (summary: MeetingSummary): string => {
    let content = `<!DOCTYPE html>
<html>
<head>
    <title>Meeting Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .overview { margin-bottom: 30px; line-height: 1.6; }
        .action-items { margin-bottom: 20px; }
        ol { padding-left: 20px; }
    </style>
</head>
<body>
    <h1>Meeting Summary</h1>
    <div class="metadata">
        <strong>Generated:</strong> ${new Date(summary.generation.generatedAt).toLocaleString()}<br>
        <strong>Processing Time:</strong> ${summary.generation.processingTimeMs}ms<br>
        <strong>Token Count:</strong> ${summary.generation.tokenCount}
    </div>
    
    <h2>Meeting Overview</h2>
    <div class="overview">${summary.meetingOverview}</div>`;

    if (summary.actionItemsByRole.length > 0) {
      content += `<h2>Action Items by Role</h2>`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        content += `<h3>${roleGroup.speakerName} (${roleGroup.speakerRole})</h3>`;
        content += `<ol>`;
        roleGroup.actionItems.forEach((item) => {
          content += `<li>${item.description}</li>`;
        });
        content += `</ol>`;
      });
    }

    if (summary.unassignedActionItems.length > 0) {
      content += `<h2>Unassigned Action Items</h2><ol>`;
      summary.unassignedActionItems.forEach((item) => {
        content += `<li>${item.description}</li>`;
      });
      content += `</ol>`;
    }

    content += `</body></html>`;
    return content;
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getTotalActionItems = (): number => {
    if (!summary) return 0;
    return summary.actionItemsByRole.reduce((total, role) => total + role.actionItems.length, 0) + 
           summary.unassignedActionItems.length;
  };

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
          <Psychology color="primary" />
          <Typography variant="h5" component="h3">
            AI-Powered Meeting Summary
          </Typography>
        </Stack>

        {/* Generate Button */}
        {!summary && !loading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Psychology />}
              onClick={handleGenerateSummary}
              disabled={!transcriptionId || !transcriptText}
              sx={{ mb: 2 }}
            >
              Generate Meeting Summary
            </Button>
            <Typography variant="body2" color="text.secondary">
              Creates a comprehensive summary with role-aware action items
            </Typography>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Generating meeting summary...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a few moments
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Summary Content */}
        {summary && !loading && (
          <Box>
            {/* Summary Header with Metadata */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">Summary Generated</Typography>
                <Box sx={{ flexGrow: 1 }} />
                
                {/* Action Buttons */}
                <Tooltip title="Copy full summary">
                  <IconButton
                    onClick={() => handleCopyToClipboard(formatAsText(summary), "Summary")}
                    size="small"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>

                <ButtonGroup size="small" variant="outlined">
                  <Button
                    startIcon={<Download />}
                    onClick={() => handleExport("text")}
                  >
                    TXT
                  </Button>
                  <Button onClick={() => handleExport("markdown")}>
                    MD
                  </Button>
                  <Button onClick={() => handleExport("html")}>HTML</Button>
                </ButtonGroup>

                <Tooltip title="Print summary">
                  <IconButton size="small" onClick={() => window.print()}>
                    <Print />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Metadata Chips */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  icon={<Schedule />}
                  label={`${summary.generation.processingTimeMs}ms`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`${summary.generation.tokenCount} tokens`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<Assignment />}
                  label={`${getTotalActionItems()} action items`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<Person />}
                  label={`${summary.actionItemsByRole.length} speakers`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Generated: {new Date(summary.generation.generatedAt).toLocaleString()}
              </Typography>
            </Paper>

            {/* Meeting Overview */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Meeting Overview
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {summary.meetingOverview}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Action Items by Role */}
            {summary.actionItemsByRole.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Action Items by Role
                </Typography>
                {summary.actionItemsByRole.map((roleGroup, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Person color="primary" />
                        <Box>
                          <Typography variant="subtitle1">
                            {roleGroup.speakerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {roleGroup.speakerRole} • {roleGroup.actionItems.length} action items
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="ol" sx={{ pl: 2, m: 0 }}>
                        {roleGroup.actionItems.map((item, itemIndex) => (
                          <Typography
                            component="li"
                            key={itemIndex}
                            variant="body2"
                            sx={{ mb: 1 }}
                          >
                            {item.description}
                            {item.confidence < 0.8 && (
                              <Chip
                                label="Low Confidence"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ ml: 1, fontSize: "0.7rem" }}
                              />
                            )}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* Unassigned Action Items */}
            {summary.unassignedActionItems.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Unassigned Action Items
                </Typography>
                <Paper sx={{ p: 2, bgcolor: "warning.light", color: "warning.contrastText" }}>
                  <Box component="ol" sx={{ pl: 2, m: 0 }}>
                    {summary.unassignedActionItems.map((item, index) => (
                      <Typography
                        component="li"
                        key={index}
                        variant="body2"
                        sx={{ mb: 1 }}
                      >
                        {item.description}
                        {item.confidence < 0.8 && (
                          <Chip
                            label="Low Confidence"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ ml: 1, fontSize: "0.7rem" }}
                          />
                        )}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default SummaryDisplay;
