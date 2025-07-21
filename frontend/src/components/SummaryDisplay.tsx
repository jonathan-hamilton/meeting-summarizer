import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Snackbar,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from "@mui/material";
import {
  ExpandMore,
  ContentCopy,
  Download,
  Refresh,
  Psychology,
  ChecklistRtl,
  Gavel,
  Business,
  Notes,
  Print,
} from "@mui/icons-material";
import type {
  SummaryResult,
  SummaryStyle,
  SpeakerMapping,
  ExportFormat,
  TranscriptionSummaryRequest,
} from "../types";
import { SummaryStyle as SummaryStyleEnum } from "../types";
import { apiService } from "../services/apiService";

interface SummaryDisplayProps {
  transcriptionId: string;
  speakerMappings?: SpeakerMapping[];
  onSummaryGenerated?: (summary: SummaryResult) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`summary-tabpanel-${index}`}
    aria-labelledby={`summary-tab-${index}`}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  transcriptionId,
  speakerMappings,
  onSummaryGenerated,
}) => {
  const [summaries, setSummaries] = useState<
    Record<SummaryStyle, SummaryResult | null>
  >({
    [SummaryStyleEnum.Brief]: null,
    [SummaryStyleEnum.Detailed]: null,
    [SummaryStyleEnum.ActionItems]: null,
    [SummaryStyleEnum.KeyDecisions]: null,
    [SummaryStyleEnum.ExecutiveSummary]: null,
  });

  const [loading, setLoading] = useState<Record<SummaryStyle, boolean>>({
    [SummaryStyleEnum.Brief]: false,
    [SummaryStyleEnum.Detailed]: false,
    [SummaryStyleEnum.ActionItems]: false,
    [SummaryStyleEnum.KeyDecisions]: false,
    [SummaryStyleEnum.ExecutiveSummary]: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState(500);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  const summaryStyles: Array<{
    style: SummaryStyle;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      style: SummaryStyleEnum.Brief,
      label: "Brief Summary",
      description: "Concise overview of key points",
      icon: <Notes />,
    },
    {
      style: SummaryStyleEnum.Detailed,
      label: "Detailed Analysis",
      description: "Comprehensive breakdown with context",
      icon: <Psychology />,
    },
    {
      style: SummaryStyleEnum.ActionItems,
      label: "Action Items",
      description: "Tasks and next steps identified",
      icon: <ChecklistRtl />,
    },
    {
      style: SummaryStyleEnum.KeyDecisions,
      label: "Key Decisions",
      description: "Important decisions and outcomes",
      icon: <Gavel />,
    },
    {
      style: SummaryStyleEnum.ExecutiveSummary,
      label: "Executive Summary",
      description: "High-level overview for leadership",
      icon: <Business />,
    },
  ];

  // Extract available roles from speaker mappings
  const availableRoles = speakerMappings
    ? Array.from(
        new Set(speakerMappings.map((mapping) => mapping.role))
      ).filter(Boolean)
    : [];

  const handleGenerateSummary = async (style: SummaryStyle) => {
    if (!transcriptionId) {
      setError("No transcription ID provided");
      return;
    }

    setLoading((prev) => ({ ...prev, [style]: true }));
    setError(null);

    try {
      const request: TranscriptionSummaryRequest = {
        transcriptionId,
        style,
        targetRole: selectedRole || undefined,
        maxTokens,
      };

      const response = await apiService.generateTranscriptionSummary(
        transcriptionId,
        request
      );

      if (response.success && response.data) {
        setSummaries((prev) => ({ ...prev, [style]: response.data! }));
        onSummaryGenerated?.(response.data);
        showSnackbar("Summary generated successfully!", "success");
      } else {
        const errorMessage = response.message || "Failed to generate summary";
        setError(errorMessage);
        showSnackbar(errorMessage, "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading((prev) => ({ ...prev, [style]: false }));
    }
  };

  const handleCopyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSnackbar(`${type} copied to clipboard!`, "success");
    } catch {
      showSnackbar("Failed to copy to clipboard", "error");
    }
  };

  const handleExport = (summary: SummaryResult, format: ExportFormat) => {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
      case "markdown":
        content = formatAsMarkdown(summary);
        mimeType = "text/markdown";
        fileExtension = "md";
        break;
      case "html":
        content = formatAsHtml(summary);
        mimeType = "text/html";
        fileExtension = "html";
        break;
      case "text":
      default:
        content = formatAsText(summary);
        mimeType = "text/plain";
        fileExtension = "txt";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meeting-summary-${summary.summaryType}-${
      new Date().toISOString().split("T")[0]
    }.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSnackbar(`Summary exported as ${format.toUpperCase()}!`, "success");
  };

  const formatAsText = (summary: SummaryResult): string => {
    let content = `Meeting Summary - ${summary.summaryType}\n`;
    content += `Generated: ${new Date(summary.generatedAt).toLocaleString()}\n`;
    if (summary.generatedFor) {
      content += `Target Role: ${summary.generatedFor}\n`;
    }
    content += `Processing Time: ${summary.processingTimeMs}ms\n`;
    content += `Token Count: ${summary.tokenCount}\n\n`;

    content += `Summary:\n${summary.content}\n\n`;

    if (summary.actionItems && summary.actionItems.length > 0) {
      content += `Action Items:\n`;
      summary.actionItems.forEach((item, index) => {
        content += `${index + 1}. ${item}\n`;
      });
      content += "\n";
    }

    if (summary.keyDecisions && summary.keyDecisions.length > 0) {
      content += `Key Decisions:\n`;
      summary.keyDecisions.forEach((decision, index) => {
        content += `${index + 1}. ${decision}\n`;
      });
      content += "\n";
    }

    if (summary.nextSteps && summary.nextSteps.length > 0) {
      content += `Next Steps:\n`;
      summary.nextSteps.forEach((step, index) => {
        content += `${index + 1}. ${step}\n`;
      });
    }

    return content;
  };

  const formatAsMarkdown = (summary: SummaryResult): string => {
    let content = `# Meeting Summary - ${summary.summaryType}\n\n`;
    content += `**Generated:** ${new Date(
      summary.generatedAt
    ).toLocaleString()}  \n`;
    if (summary.generatedFor) {
      content += `**Target Role:** ${summary.generatedFor}  \n`;
    }
    content += `**Processing Time:** ${summary.processingTimeMs}ms  \n`;
    content += `**Token Count:** ${summary.tokenCount}  \n\n`;

    content += `## Summary\n\n${summary.content}\n\n`;

    if (summary.actionItems && summary.actionItems.length > 0) {
      content += `## Action Items\n\n`;
      summary.actionItems.forEach((item, index) => {
        content += `${index + 1}. ${item}\n`;
      });
      content += "\n";
    }

    if (summary.keyDecisions && summary.keyDecisions.length > 0) {
      content += `## Key Decisions\n\n`;
      summary.keyDecisions.forEach((decision, index) => {
        content += `${index + 1}. ${decision}\n`;
      });
      content += "\n";
    }

    if (summary.nextSteps && summary.nextSteps.length > 0) {
      content += `## Next Steps\n\n`;
      summary.nextSteps.forEach((step, index) => {
        content += `${index + 1}. ${step}\n`;
      });
    }

    return content;
  };

  const formatAsHtml = (summary: SummaryResult): string => {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Summary - ${summary.summaryType}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1976d2; }
        h2 { color: #424242; }
        .metadata { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        ol { padding-left: 20px; }
    </style>
</head>
<body>
    <h1>Meeting Summary - ${summary.summaryType}</h1>
    <div class="metadata">
        <strong>Generated:</strong> ${new Date(
          summary.generatedAt
        ).toLocaleString()}<br>`;

    if (summary.generatedFor) {
      content += `        <strong>Target Role:</strong> ${summary.generatedFor}<br>`;
    }
    content += `        <strong>Processing Time:</strong> ${
      summary.processingTimeMs
    }ms<br>
        <strong>Token Count:</strong> ${summary.tokenCount}
    </div>
    
    <h2>Summary</h2>
    <div class="content">${summary.content.replace(/\n/g, "<br>")}</div>`;

    if (summary.actionItems && summary.actionItems.length > 0) {
      content += `    
    <h2>Action Items</h2>
    <ol>`;
      summary.actionItems.forEach((item) => {
        content += `        <li>${item}</li>`;
      });
      content += `    </ol>`;
    }

    if (summary.keyDecisions && summary.keyDecisions.length > 0) {
      content += `    
    <h2>Key Decisions</h2>
    <ol>`;
      summary.keyDecisions.forEach((decision) => {
        content += `        <li>${decision}</li>`;
      });
      content += `    </ol>`;
    }

    if (summary.nextSteps && summary.nextSteps.length > 0) {
      content += `    
    <h2>Next Steps</h2>
    <ol>`;
      summary.nextSteps.forEach((step) => {
        content += `        <li>${step}</li>`;
      });
      content += `    </ol>`;
    }

    content += `
</body>
</html>`;

    return content;
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const renderSummaryContent = (summary: SummaryResult) => (
    <Card elevation={2}>
      <CardContent>
        {/* Summary Metadata */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
            <Chip label={summary.summaryType} color="primary" size="small" />
            {summary.generatedFor && (
              <Chip
                label={`For: ${summary.generatedFor}`}
                color="secondary"
                size="small"
              />
            )}
            <Chip
              label={`${summary.tokenCount} tokens`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${summary.processingTimeMs}ms`}
              variant="outlined"
              size="small"
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Generated: {new Date(summary.generatedAt).toLocaleString()}
          </Typography>
        </Box>

        {/* Main Content */}
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {summary.content}
        </Typography>

        {/* Action Items */}
        {summary.actionItems && summary.actionItems.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <ChecklistRtl sx={{ mr: 1, verticalAlign: "middle" }} />
                Action Items ({summary.actionItems.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ol" sx={{ pl: 2 }}>
                {summary.actionItems.map((item, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Key Decisions */}
        {summary.keyDecisions && summary.keyDecisions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Gavel sx={{ mr: 1, verticalAlign: "middle" }} />
                Key Decisions ({summary.keyDecisions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ol" sx={{ pl: 2 }}>
                {summary.keyDecisions.map((decision, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1 }}>
                    {decision}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Next Steps */}
        {summary.nextSteps && summary.nextSteps.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                Next Steps ({summary.nextSteps.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ol" sx={{ pl: 2 }}>
                {summary.nextSteps.map((step, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1 }}>
                    {step}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Action Buttons */}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title="Copy to clipboard">
            <IconButton
              onClick={() => handleCopyToClipboard(summary.content, "Summary")}
              size="small"
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>

          <ButtonGroup size="small" variant="outlined">
            <Button
              startIcon={<Download />}
              onClick={() => handleExport(summary, "text")}
            >
              TXT
            </Button>
            <Button onClick={() => handleExport(summary, "markdown")}>
              MD
            </Button>
            <Button onClick={() => handleExport(summary, "html")}>HTML</Button>
          </ButtonGroup>

          <Tooltip title="Print summary">
            <IconButton size="small" onClick={() => window.print()}>
              <Print />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderSummaryTab = (style: SummaryStyle, index: number) => {
    const summary = summaries[style];
    const isLoading = loading[style];
    const styleInfo = summaryStyles.find((s) => s.style === style)!;

    return (
      <TabPanel value={selectedTab} index={index}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            {styleInfo.icon}
            <Box>
              <Typography variant="h6">{styleInfo.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {styleInfo.description}
              </Typography>
            </Box>
          </Stack>

          {!summary && !isLoading && (
            <Paper
              sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}
            >
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No summary generated yet for {styleInfo.label.toLowerCase()}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Psychology />}
                onClick={() => handleGenerateSummary(style)}
                disabled={!transcriptionId}
              >
                Generate {styleInfo.label}
              </Button>
            </Paper>
          )}

          {isLoading && (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                Generating {styleInfo.label.toLowerCase()}...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This may take up to 30 seconds
              </Typography>
            </Paper>
          )}

          {summary && !isLoading && (
            <Box>
              {renderSummaryContent(summary)}
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  startIcon={<Refresh />}
                  onClick={() => handleGenerateSummary(style)}
                  variant="outlined"
                  size="small"
                >
                  Regenerate
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>
    );
  };

  return (
    <Box>
      {/* Configuration Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Summary Configuration
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Target Role (Optional)</InputLabel>
              <Select
                value={selectedRole}
                label="Target Role (Optional)"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <MenuItem value="">
                  <em>No specific role</em>
                </MenuItem>
                {availableRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="number"
              label="Max Tokens"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              inputProps={{ min: 100, max: 2000 }}
              sx={{ minWidth: 120 }}
            />

            <Button
              variant="outlined"
              startIcon={<Psychology />}
              onClick={() => {
                // Generate all summary types
                Object.values(SummaryStyleEnum).forEach((style) => {
                  if (!summaries[style]) {
                    handleGenerateSummary(style);
                  }
                });
              }}
              disabled={Object.values(loading).some(Boolean)}
            >
              Generate All
            </Button>
          </Stack>

          {speakerMappings && speakerMappings.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Role-aware summaries will be generated using speaker mappings for{" "}
              {speakerMappings.length} speakers.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {summaryStyles.map((style) => (
              <Tab
                key={style.style}
                label={style.label}
                icon={
                  loading[style.style] ? (
                    <CircularProgress size={16} />
                  ) : summaries[style.style] ? (
                    <Box sx={{ color: "success.main" }}>✓</Box>
                  ) : undefined
                }
                iconPosition="end"
              />
            ))}
          </Tabs>
        </Box>

        {summaryStyles.map((style, index) =>
          renderSummaryTab(style.style, index)
        )}
      </Card>

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
    </Box>
  );
};

export default SummaryDisplay;
