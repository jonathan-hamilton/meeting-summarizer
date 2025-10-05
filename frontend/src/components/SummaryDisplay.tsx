import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import SummaryHeader from "./SummaryHeader";
import ActionItemsSection from "./ActionItemsSection";
import FormattedSummaryText from "./FormattedSummaryText";

import {
  Psychology,
} from "@mui/icons-material";
import type { SpeakerMapping, MeetingSummary, ActionItem } from "../types";
import { useSpeakerSessionStore } from "../stores/speakerSessionStore";
import { useSummaryStore } from "../stores/summaryStore";
import { useEmailStore } from "../stores/emailStore";
import { useAppMode } from "../contexts/AppModeContext";
import { useAuthStore } from "../stores/authStore";
import { createApiService } from "../services/apiServiceFactory";

// EmailCompositionDialog now handled by TranscriptDisplay

import UpsertActionItemDialog from "./UpsertActionItemDialog";

interface SummaryDisplayProps {
  transcriptionId: string;
  transcriptText: string;
  speakerMappings?: SpeakerMapping[];
  detectedSpeakers?: string[];
  onSummaryGenerated?: (summary: MeetingSummary) => void;
  aiSummaryRef?: React.RefCallback<HTMLElement>; // Optional ref for scroll positioning
  // Additional props for email functionality
  fileName?: string;
  speakerSegments?: any[];
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
  fileName,
  speakerSegments = [],
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
    reorderActionItems,
    // Auto-save related state and actions (S6.10)
    enableAutoSave,
    disableAutoSave,
    triggerAutoSave,
    autoSaveEnabled,
    // Summary persistence actions
    loadUserSummaries,
    selectSavedSummary,
    selectedSavedSummary
  } = useSummaryStore();
  
  // Get authentication state for user ID
  const { user, isLoading: isAuthLoading } = useAuthStore();
  
  // Get the current app mode to pass to the summary generation
  const { mode } = useAppMode();
  
  // Email store for handling email dialog
  const { openDialog: openEmailDialog } = useEmailStore();
  
  // Load existing summary when transcriptionId changes or component mounts
  useEffect(() => {
    const loadExistingSummary = async () => {
      console.log('🔍 SummaryDisplay loadExistingSummary called:', {
        userId: user?.id,
        transcriptionId: transcriptionId,
        hasUser: !!user?.id,
        hasTranscriptionId: !!transcriptionId,
        isAuthLoading: isAuthLoading
      });

      // Wait for authentication to finish loading
      if (isAuthLoading) {
        console.log('⏳ Auth still loading, waiting...');
        return;
      }

      if (!user?.id || !transcriptionId) {
        console.log('❌ Early return from loadExistingSummary:', {
          noUserId: !user?.id,
          noTranscriptionId: !transcriptionId
        });
        clearSummary();
        return;
      }

      try {
        // Load all user summaries
        await loadUserSummaries(user.id);
        
        // Find existing summary for this meeting ID
        const currentState = useSummaryStore.getState();
        console.log('🔍 Looking for existing summary with meetingId:', transcriptionId);
        console.log('🔍 Available saved summaries:', currentState.savedSummaries.map(s => ({
          id: s.id,
          title: s.title,
          meetingId: s.meetingId,
          transcriptFileName: s.transcriptFileName
        })));
        
        // Try exact match first
        const exactMatch = currentState.savedSummaries.find(
          s => s.meetingId === transcriptionId
        );
        
        // Also try string vs UUID comparison (in case of type mismatch)
        const stringMatch = currentState.savedSummaries.find(
          s => String(s.meetingId) === String(transcriptionId)
        );
        
        // FALLBACK MATCHING COMMENTED OUT FOR ID CONSISTENCY TESTING
        // Try matching by filename if the IDs don't match
        // const filenameMatch = fileName ? currentState.savedSummaries.find(
        //   s => s.transcriptFileName === fileName
        // ) : null;
        
        // Try to find the most recent auto-saved summary (last resort)
        // const recentAutoSave = currentState.savedSummaries.find(
        //   s => s.title?.includes('Auto-saved')
        // );
        
        console.log('🔍 Exact match found:', !!exactMatch);
        console.log('🔍 String match found:', !!stringMatch);
        // console.log('🔍 Filename match found:', !!filenameMatch);
        // console.log('🔍 Recent auto-save found:', !!recentAutoSave);
        console.log('🔍 Comparison details:', {
          transcriptionId,
          transcriptionIdType: typeof transcriptionId,
          fileName,
          sampleMeetingId: currentState.savedSummaries[0]?.meetingId,
          sampleMeetingIdType: typeof currentState.savedSummaries[0]?.meetingId,
          availableFilenames: currentState.savedSummaries.map(s => s.transcriptFileName)
        });
        
        // ONLY USE EXACT ID MATCHING FOR TESTING
        const existingSummary = exactMatch || stringMatch;
        // const existingSummary = exactMatch || stringMatch || filenameMatch || recentAutoSave;

        if (existingSummary) {
          console.log('Found existing summary:', existingSummary.id, existingSummary.title);
          // Load the existing summary
          await selectSavedSummary(existingSummary.id, user.id);
        } else {
          console.log('No existing summary found for meetingId:', transcriptionId);
          // No existing summary, clear current state
          clearSummary();
        }
      } catch (error) {
        console.error('Failed to load existing summary:', error);
        clearSummary();
      }
    };

    loadExistingSummary();
  }, [transcriptionId, user?.id, isAuthLoading, clearSummary, loadUserSummaries, selectSavedSummary]);

  // Auto-save management (S6.10 Phase 4)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enable auto-save when component mounts with authenticated user and valid context
  useEffect(() => {
    if (user?.id && fileName && mode === 'production') {
      enableAutoSave(user.id, fileName, transcriptionId);
      
      return () => {
        disableAutoSave();
      };
    }
  }, [user?.id, fileName, transcriptionId, mode, enableAutoSave, disableAutoSave]);
  
  // Debounced auto-save trigger on summary or action items change
  const triggerDebouncedAutoSave = useCallback(() => {
    if (!autoSaveEnabled || !summary) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for debounced auto-save (5 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave();
    }, 5000);
  }, [autoSaveEnabled, summary, triggerAutoSave]);
  
  // Trigger auto-save when summary or action items change
  useEffect(() => {
    if (summary && autoSaveEnabled) {
      triggerDebouncedAutoSave();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [summary, actionItems, triggerDebouncedAutoSave]);

  // Use store mappings if available, otherwise fall back to props
  const effectiveSpeakerMappings = useMemo(() => {
    return speakerMappings_store.length > 0 ? speakerMappings_store : (speakerMappings || []);
  }, [speakerMappings_store, speakerMappings]);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  // Email dialog now handled by TranscriptDisplay EmailCompositionDialog

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



  // Email sending now handled by EmailCompositionDialog

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

  const handlePdfDownload = async () => {
    try {
      if (!selectedSavedSummary?.id) {
        showSnackbar("Cannot download PDF: Summary not saved", "error");
        return;
      }

      console.log('📄 Starting summary PDF download for summary ID:', selectedSavedSummary.id);
      const apiService = createApiService(mode);
      await (apiService as any).downloadSummaryPdf(selectedSavedSummary.id);
      showSnackbar("PDF download started!", "success");
    } catch (error: any) {
      console.error('PDF download failed:', error);
      showSnackbar(error.message || "Failed to download PDF", "error");
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEmailShare = () => {
    console.log('📧 Summary EMAIL button clicked - opening email dialog with summary context');
    console.log('🔍 Debug - summary:', summary);
    console.log('🔍 Debug - summary type:', typeof summary);
    console.log('🔍 Debug - summary null?:', summary === null);
    console.log('🔍 Debug - summary undefined?:', summary === undefined);
    console.log('🔍 Debug - actionItems:', actionItems);
    
    // Construct transcript data for email functionality
    const transcriptData = fileName && transcriptText ? {
      transcriptionId: transcriptionId,
      fileName: fileName,
      speakerSegments: speakerSegments,
      transcribedText: transcriptText,
    } : null;
    
    // Open email dialog with summary context
    console.log('🔍 DEBUG: Opening email dialog with summary:', {
      hasSummary: !!summary,
      summaryId: summary?.summaryId,
      overviewLength: summary?.meetingOverview?.length || 0,
      actionItemsCount: actionItems.length,
      speakerMappingsCount: effectiveSpeakerMappings.length
    });
    
    openEmailDialog({
      summary: summary,
      actionItems: actionItems,
      speakerMappings: effectiveSpeakerMappings,
      transcriptData: transcriptData,
      transcriptOnly: false,
      includeTranscriptDefault: true, // Show "Append Transcript" checkbox for summary emails
    });
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
            <SummaryHeader
              summary={summary}
              totalActionItems={getTotalActionItems()}
              speakerCount={effectiveSpeakerMappings.length || detectedSpeakers.length}
              onShareClick={handleEmailShare}
              onPdfDownload={handlePdfDownload}
            />



            {/* Meeting Overview */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {mode === 'development' ? 'Development Meeting Overview' : 'Meeting Overview'}
              </Typography>
              <FormattedSummaryText text={summary.meetingOverview} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Action Items Section */}
            <ActionItemsSection
              actionItems={actionItems}
              speakerMappings={effectiveSpeakerMappings}
              onCreateActionItem={handleCreateActionItem}
              onEditActionItem={handleEditActionItem}
              onDeleteActionItem={handleDeleteActionItem}
              onReorderActionItems={reorderActionItems}
              onUpdateActionItem={updateActionItem}
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

      {/* Email Composition Dialog - Now handled by TranscriptDisplay */}

      {/* Action Item Dialog */}
      <UpsertActionItemDialog
        open={actionItemDialogOpen}
        onClose={() => setActionItemDialogOpen(false)}
        onSave={handleSaveActionItem}
        actionItem={editingActionItem}
        speakers={availableSpeakers}
      />
    </Card>
  );
};

export default SummaryDisplay;
