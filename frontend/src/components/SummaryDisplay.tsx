import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  Stack,
} from "@mui/material";
import TourPopover from "./TourPopover";
import SummaryHeader from "./SummaryHeader";
import ActionItemsSection from "./ActionItemsSection";
import {
  Psychology,
} from "@mui/icons-material";
import type { SpeakerMapping, MeetingSummary, ActionItem } from "../types";
import { useSpeakerSessionStore } from "../stores/speakerSessionStore";
import { useSummaryStore } from "../stores/summaryStore";
import { useTourStore } from "../stores/tourStore";
import { useAppMode } from "../contexts/AppModeContext";
import EmailCompositionDialog from "./EmailCompositionDialog";
import UpsertActionItemDialog from "./UpsertActionItemDialog";

interface SummaryDisplayProps {
  transcriptionId: string;
  transcriptText: string;
  speakerMappings?: SpeakerMapping[];
  detectedSpeakers?: string[];
  onSummaryGenerated?: (summary: MeetingSummary) => void;
  aiSummaryRef?: React.RefCallback<HTMLElement>; // Optional ref for Step 9->10 tour scroll
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
  aiSummaryRef,
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
    clearSummary,
    actionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    reorderActionItems
  } = useSummaryStore();
  
  // Get the current app mode to pass to the summary generation
  const { mode, isDemo } = useAppMode();

  // Tour store for managing tour state and closed steps
  const { isActive: isTourActive, closeStep, isCurrentStep, triggerStepAction, isActionDisabledDuringTour } = useTourStore();
  
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

  // Action item dialog state
  const [actionItemDialogOpen, setActionItemDialogOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<ActionItem | null>(null);

  // Snackbar helper function
  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

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
        } else {
          console.error('❌ No speakers available for summary generation');
          showSnackbar("No speakers detected in the transcript. Cannot generate summary.", "error");
          return;
        }
      }

      await generateSummary(transcriptText, mappingsToUse, mode);
      
      // Trigger Step 11 tour advancement when summary generation completes
      if (isDemo && isTourActive) {
        triggerStepAction('summary-generated');
      }
      
      // Call the callback if provided
      if (onSummaryGenerated && summary) {
        onSummaryGenerated(summary);
      }
      
      showSnackbar("Meeting summary generated successfully!", "success");
    } catch (err) {
      console.error('Summary generation error:', err);
      showSnackbar(`Failed to generate meeting summary: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
    }
  };

  // Handle email sending
  const handleSendEmail = (emailData: any) => {
    // For now, just simulate sending and show success message
    // In a real implementation, this would call an email service
    showSnackbar(`Email sent successfully to ${emailData.recipients.length} recipient(s)!`, "success");
  };

  // Action item handlers
  const handleCreateActionItem = () => {
    setEditingActionItem(null);
    setActionItemDialogOpen(true);
  };

  const handleEditActionItem = (actionItem: ActionItem) => {
    setEditingActionItem(actionItem);
    setActionItemDialogOpen(true);
  };

  const handleDeleteActionItem = (actionItemId: string) => {
    deleteActionItem(actionItemId);
    showSnackbar("Action item deleted successfully!", "success");
  };

  const handleSaveActionItem = (actionItemData: Omit<ActionItem, 'id'>) => {
    if (editingActionItem) {
      // Update existing action item
      updateActionItem(editingActionItem.id, actionItemData);
      showSnackbar("Action item updated successfully!", "success");
    } else {
      // Create new action item
      addActionItem(actionItemData);
      showSnackbar("Action item created successfully!", "success");
    }
  };

  // Get available speakers for action item assignment
  const availableSpeakers = useMemo(() => {
    const speakers = new Set<string>();
    
    // Add speakers from mappings
    effectiveSpeakerMappings.forEach(mapping => {
      if (mapping.name && mapping.name.trim()) {
        speakers.add(mapping.name);
      }
    });
    
    // Add speakers from detected speakers if no mappings
    if (speakers.size === 0) {
      detectedSpeakers.forEach(speaker => speakers.add(speaker));
    }
    
    return Array.from(speakers).sort();
  }, [effectiveSpeakerMappings, detectedSpeakers]);
  
  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar(`${type} copied to clipboard!`, "success");
    } catch (err) {
      showSnackbar("Failed to copy to clipboard", "error");
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getTotalActionItems = (): number => {
    return actionItems.length;
  };

  return (
    <Card sx={{ width: "100%", position: "relative", overflow: "visible" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
          <Psychology color="primary" />
          <Typography 
            variant="h5" 
            component="h3"
            ref={(node) => {
              if (aiSummaryRef) {
                aiSummaryRef(node);
              }
            }}
          >
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
              onClick={() => {
                triggerStepAction('generate-summary');
                handleGenerateSummary();
              }}
              disabled={!transcriptText || isActionDisabledDuringTour('generate-summary')}
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

        {/* Step 10 Tour Popover - Generate Summary */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(10)}
          step={10}
          onClose={() => closeStep(10)}
          position={{ top: '-40px', right: '50px' }}
          maxWidth="300px"
          sx={{ zIndex: 10000 }}
        />

        {/* Summary Content */}
        {summary && !isGenerating && (
          <Box>
            {/* Summary Header with Metadata */}
            <SummaryHeader
              summary={summary}
              totalActionItems={getTotalActionItems()}
              isDemo={isDemo}
              isTourActive={isTourActive}
              isCurrentStep={isCurrentStep}
              onShareClick={() => setEmailDialogOpen(true)}
              onCopyClick={() => handleCopyToClipboard(summary.meetingOverview, "Summary")}
              onCloseStep={closeStep}
              triggerStepAction={triggerStepAction}
            />

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

            {/* Action Items Section */}
            <ActionItemsSection
              actionItems={actionItems}
              speakerMappings={effectiveSpeakerMappings}
              isDemo={isDemo}
              isTourActive={isTourActive}
              isCurrentStep={isCurrentStep}
              onCreateActionItem={handleCreateActionItem}
              onEditActionItem={handleEditActionItem}
              onDeleteActionItem={handleDeleteActionItem}
              onReorderActionItems={reorderActionItems}
              onUpdateActionItem={updateActionItem}
              onCloseStep={closeStep}
              triggerStepAction={triggerStepAction}
              onSnackbar={showSnackbar}
            />

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
        actionItems={actionItems}
        onSend={handleSendEmail}
      />

      {/* Action Item Dialog */}
      <UpsertActionItemDialog
        open={actionItemDialogOpen}
        onClose={() => setActionItemDialogOpen(false)}
        onSave={handleSaveActionItem}
        actionItem={editingActionItem}
        speakers={availableSpeakers}
      />

      {/* Step 18 Tour Popover - Tour Completion */}
      <TourPopover
        open={isDemo && isTourActive && isCurrentStep(18)}
        step={18}
        onClose={() => closeStep(18)}
        position={{ top: '325px', left: '375px' }}
        maxWidth="400px"
      />
    </Card>
  );
};

export default SummaryDisplay;
