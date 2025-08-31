import React, { useState, useMemo, useEffect } from "react";
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
  Divider,
  Paper,
} from "@mui/material";
import {
  Psychology,
  ContentCopy,
  ExpandMore,
  Person,
  Assignment,
  Schedule,
  CheckCircle,
  Email,
} from "@mui/icons-material";
import type { SpeakerMapping, MeetingSummary } from "../types";
import { useSpeakerSessionStore } from "../stores/speakerSessionStore";
import { useSummaryStore } from "../stores/summaryStore";
import { useAppMode } from "../contexts/AppModeContext";
import EmailCompositionDialog from "./EmailCompositionDialog";

interface SummaryDisplayProps {
  transcriptionId: string;
  transcriptText: string;
  speakerMappings?: SpeakerMapping[];
  detectedSpeakers?: string[];
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
  detectedSpeakers = [],
  onSummaryGenerated,
}) => {
  // Get current speaker mappings from centralized store
  const speakerMappings_store = useSpeakerSessionStore(state => state.speakerMappings);
  
  // Use summary store for state management
  const { 
    summary, 
    isGenerating, 
    error, 
    generateSummary, 
    clearError,
    clearSummary 
  } = useSummaryStore();
  
  // Get the current app mode to pass to the summary generation
  const { mode } = useAppMode();
  
  // Clear summary when transcriptionId changes (new file uploaded)
  useEffect(() => {
    clearSummary();
  }, [transcriptionId, clearSummary]);
  
  // Use store mappings if available, otherwise fall back to props
  const effectiveSpeakerMappings = useMemo(() => {
    return speakerMappings_store.length > 0 ? speakerMappings_store : (speakerMappings || []);
  }, [speakerMappings_store, speakerMappings]);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleGenerateSummary = async () => {
    if (!transcriptText) {
      setSnackbar({
        open: true,
        message: "No transcript text available for summary generation",
        severity: "error",
      });
      return;
    }

    try {
      // Get current speakers from the store, with fallback to detected speakers prop
      const currentSpeakers = useSpeakerSessionStore.getState().getActiveSpeakers();
      
      // Use detected speakers from props (original transcription) as fallback
      // This ensures we use the actual speaker IDs like "Guest-1", "Guest-2" 
      // instead of transformed ones like "Speaker 1", "Speaker 2"
      const availableSpeakers = detectedSpeakers.length > 0 ? detectedSpeakers : currentSpeakers;
      
      console.log('🔍 Summary Generation Debug:');
      console.log('- Store speakers:', currentSpeakers);
      console.log('- Prop speakers (original):', detectedSpeakers);
      console.log('- Available speakers (final):', availableSpeakers);
      console.log('- Existing mappings:', effectiveSpeakerMappings);
      
      // If no speaker mappings exist, auto-generate default ones
      let mappingsToUse = effectiveSpeakerMappings;
      if (mappingsToUse.length === 0) {
        if (availableSpeakers.length > 0) {
          mappingsToUse = availableSpeakers.map((speakerId, index) => ({
            speakerId,
            name: `Speaker ${index + 1}`,
            role: "Participant", // Default role to satisfy backend validation
            transcriptionId,
            source: "AutoDetected" as const,
            email: ""
          }));
          
          console.log('✅ Auto-generated mappings:', mappingsToUse);
          console.log('- Raw speaker IDs used:', availableSpeakers);
          console.log('- Generated mapping details:', mappingsToUse.map(m => ({ 
            speakerId: m.speakerId, 
            name: m.name, 
            transcriptionId: m.transcriptionId 
          })));
        } else {
          console.error('❌ No speakers available for summary generation');
          setSnackbar({
            open: true,
            message: "No speakers detected in the transcript. Cannot generate summary.",
            severity: "error",
          });
          return;
        }
      } else {
        console.log('✅ Using existing mappings:', mappingsToUse);
      }

      console.log('🚀 Calling generateSummary with', mappingsToUse.length, 'speakers');
      console.log('🎯 Mode being passed to generateSummary:', mode);
      await generateSummary(transcriptText, mappingsToUse, mode);
      
      // Call the callback if provided
      if (onSummaryGenerated && summary) {
        onSummaryGenerated(summary);
      }
      
      setSnackbar({
        open: true,
        message: "Meeting summary generated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error('Summary generation error:', err);
      setSnackbar({
        open: true,
        message: `Failed to generate meeting summary: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: "error",
      });
    }
  };

  // Handle email sending
  const handleSendEmail = (emailData: any) => {
    // For now, just simulate sending and show success message
    // In a real implementation, this would call an email service
    console.log('Sending email:', emailData);
    
    setSnackbar({
      open: true,
      message: `Email sent successfully to ${emailData.recipients.length} recipient(s)!`,
      severity: "success",
    });
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

    content += `${mode === 'demo' ? 'DEMO MEETING OVERVIEW' : mode === 'development' ? 'DEVELOPMENT MEETING OVERVIEW' : 'MEETING OVERVIEW'}\n`;
    content += `${summary.meetingOverview}\n\n`;

    if (summary.actionItemsByRole.length > 0) {
      content += `ACTION ITEMS BY ROLE\n`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        const roleDisplay = roleGroup.speakerRole ? ` (${roleGroup.speakerRole})` : '';
        content += `\n${roleGroup.speakerName}${roleDisplay}:\n`;
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

    content += `## ${mode === 'demo' ? 'Demo Meeting Overview' : mode === 'development' ? 'Development Meeting Overview' : 'Meeting Overview'}\n\n${summary.meetingOverview}\n\n`;

    if (summary.actionItemsByRole.length > 0) {
      content += `## Action Items by Role\n\n`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        const roleDisplay = roleGroup.speakerRole ? ` (${roleGroup.speakerRole})` : '';
        content += `### ${roleGroup.speakerName}${roleDisplay}\n\n`;
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
    
    <h2>${mode === 'demo' ? 'Demo Meeting Overview' : mode === 'development' ? 'Development Meeting Overview' : 'Meeting Overview'}</h2>
    <div class="overview">${summary.meetingOverview}</div>`;

    if (summary.actionItemsByRole.length > 0) {
      content += `<h2>Action Items by Role</h2>`;
      summary.actionItemsByRole.forEach((roleGroup) => {
        const roleDisplay = roleGroup.speakerRole ? ` (${roleGroup.speakerRole})` : '';
        content += `<h3>${roleGroup.speakerName}${roleDisplay}</h3>`;
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
        {!summary && !isGenerating && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Psychology />}
              onClick={handleGenerateSummary}
              disabled={!transcriptText}
              sx={{ mb: 2 }}
            >
              Generate Meeting Summary
            </Button>
            <Typography variant="body2" color="text.secondary">
              Creates a comprehensive summary with role-aware action items.
              <br />
              Works with or without custom speaker names.
            </Typography>
          </Box>
        )}

        {/* Loading State */}
        {isGenerating && (
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
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => clearError()}
          >
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Summary Content */}
        {summary && !isGenerating && (
          <Box>
            {/* Summary Header with Metadata */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">Summary Generated</Typography>
                <Box sx={{ flexGrow: 1 }} />
                
                {/* Action Buttons */}
                <Tooltip title="Share via email">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Email />}
                    onClick={() => setEmailDialogOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    Share
                  </Button>
                </Tooltip>

                <Tooltip title="Copy full summary">
                  <IconButton
                    onClick={() => handleCopyToClipboard(formatAsText(summary), "Summary")}
                    size="small"
                  >
                    <ContentCopy />
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
                {mode === 'demo' ? 'Demo Meeting Overview' : mode === 'development' ? 'Development Meeting Overview' : 'Meeting Overview'}
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
                            {roleGroup.speakerRole ? `${roleGroup.speakerRole} • ` : ''}{roleGroup.actionItems.length} action items
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

      {/* Email Composition Dialog */}
      <EmailCompositionDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        summary={summary}
        speakerMappings={effectiveSpeakerMappings}
        onSend={handleSendEmail}
      />
    </Card>
  );
};

export default SummaryDisplay;
