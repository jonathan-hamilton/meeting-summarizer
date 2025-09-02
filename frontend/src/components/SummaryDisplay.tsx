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
import TourPopover from "./TourPopover";
import {
  Psychology,
  ContentCopy,
  Person,
  Assignment,
  Schedule,
  CheckCircle,
  Email,
  Add,
  Edit,
  Delete,
  DragIndicator,
  ExpandMore,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
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
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

// Sortable Action Item Component
interface SortableActionItemProps {
  item: ActionItem;
  onEdit: (item: ActionItem) => void;
  onDelete: (id: string) => void;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        cursor: isDragging ? 'grabbing' : 'auto',
      }}
    >
      <DragIndicator 
        {...attributes}
        {...listeners}
        sx={{ 
          color: 'text.secondary', 
          cursor: 'grab', 
          mt: 0.5,
          '&:hover': { color: 'primary.main' }
        }} 
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {item.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={item.assignedTo || 'Unassigned'}
            size="small"
            variant="outlined"
            color={item.assignedTo ? 'primary' : 'default'}
          />
          {item.confidence < 0.8 && (
            <Chip
              label="Low Confidence"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => onEdit(item)}
          color="primary"
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(item.id)}
          color="error"
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

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
  const { isActive: isTourActive, closeStep, isCurrentStep, triggerStepAction } = useTourStore();
  
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

  // Accordion expansion state - track which speaker accordions are expanded
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag and drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const draggedItem = actionItems.find((item) => item.id === active.id);
      const targetItem = actionItems.find((item) => item.id === over.id);
      
      if (draggedItem && targetItem) {
        // Check if we're moving to a different speaker
        const needsReassignment = draggedItem.assignedTo !== targetItem.assignedTo;
        
        if (needsReassignment) {
          // Update the assignedTo field to match the target speaker
          updateActionItem(draggedItem.id, { assignedTo: targetItem.assignedTo });
          
          // Auto-expand the target accordion to show the newly assigned item
          if (targetItem.assignedTo) {
            setExpandedAccordions(prev => new Set(prev).add(targetItem.assignedTo!));
          }
          
          setSnackbar({
            open: true,
            message: `Action item reassigned to ${targetItem.assignedTo || 'Unassigned'}`,
            severity: "success",
          });
        } else {
          // Just reorder within the same speaker group
          const oldIndex = actionItems.findIndex((item) => item.id === active.id);
          const newIndex = actionItems.findIndex((item) => item.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedItems = arrayMove(actionItems, oldIndex, newIndex);
            reorderActionItems(reorderedItems);
          }
        }
      }
    }
  };

  // Handle accordion expansion/collapse
  const handleAccordionChange = (speakerId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(speakerId);
        // Trigger step action when accordion is expanded for the first time
        triggerStepAction('expand-action-items');
      } else {
        newSet.delete(speakerId);
      }
      return newSet;
    });
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
    setSnackbar({
      open: true,
      message: "Action item deleted successfully!",
      severity: "success",
    });
  };

  const handleSaveActionItem = (actionItemData: Omit<ActionItem, 'id'>) => {
    if (editingActionItem) {
      // Update existing action item
      updateActionItem(editingActionItem.id, actionItemData);
      setSnackbar({
        open: true,
        message: "Action item updated successfully!",
        severity: "success",
      });
    } else {
      // Create new action item
      addActionItem(actionItemData);
      setSnackbar({
        open: true,
        message: "Action item created successfully!",
        severity: "success",
      });
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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Group action items by speaker with stable ordering
  const groupedActionItems = useMemo(() => {
    const groups: { [speakerId: string]: { speakerName: string; items: ActionItem[] } } = {};
    
    // First, populate the groups with action items
    actionItems.forEach(item => {
      const speakerId = item.assignedTo || 'Unassigned';
      
      if (!groups[speakerId]) {
        // Find speaker name from mappings
        const speakerMapping = effectiveSpeakerMappings.find(m => m.speakerId === speakerId);
        const speakerName = speakerMapping?.name || (speakerId === 'Unassigned' ? 'Unassigned' : speakerId);
        
        groups[speakerId] = {
          speakerName,
          items: []
        };
      }
      
      groups[speakerId].items.push(item);
    });
    
    // Create ordered list based on speaker mappings order, then add Unassigned at the end
    const orderedGroups: Array<{ speakerId: string; speakerName: string; items: ActionItem[] }> = [];
    
    // Add speakers in the order they appear in speaker mappings (maintains original order)
    effectiveSpeakerMappings.forEach(mapping => {
      if (groups[mapping.speakerId]) {
        orderedGroups.push({
          speakerId: mapping.speakerId,
          speakerName: groups[mapping.speakerId].speakerName,
          items: groups[mapping.speakerId].items
        });
      }
    });
    
    // Add any other assigned speakers that aren't in mappings (shouldn't happen, but safe fallback)
    Object.entries(groups).forEach(([speakerId, group]) => {
      if (speakerId !== 'Unassigned' && !orderedGroups.find(g => g.speakerId === speakerId)) {
        orderedGroups.push({
          speakerId,
          speakerName: group.speakerName,
          items: group.items
        });
      }
    });
    
    // Always add Unassigned at the end if it has items
    if (groups['Unassigned']) {
      orderedGroups.push({
        speakerId: 'Unassigned',
        speakerName: 'Unassigned',
        items: groups['Unassigned'].items
      });
    }
    
    return orderedGroups;
  }, [actionItems, effectiveSpeakerMappings]);

  const getTotalActionItems = (): number => {
    return actionItems.length;
  };

  return (
    <Card sx={{ width: "100%", position: "relative" }}>
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
              onClick={() => {
                triggerStepAction('generate-summary');
                handleGenerateSummary();
              }}
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

        {/* Step 8 Tour Popover - Generate Summary */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(8)}
          step={8}
          title="Generate Summary"
          description="Click 'GENERATE MEETING SUMMARY' to create a comprehensive summary with action items."
          onClose={() => closeStep(8)}
          totalSteps={11}
          position={{ top: '5px', right: '50px' }}
          maxWidth="300px"
        />

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
                    onClick={() => {
                      setEmailDialogOpen(true);
                      triggerStepAction('open-email-dialog');
                    }}
                    sx={{ mr: 1 }}
                  >
                    Share
                  </Button>
                </Tooltip>

                {/* Step 11 Tour Popover - Share via Email */}
                <TourPopover
                  open={isDemo && isTourActive && isCurrentStep(11)}
                  step={11}
                  title="Share Summary via Email"
                  description="Click 'SHARE' to send the meeting summary and action items via email to participants."
                  onClose={() => closeStep(11)}
                  totalSteps={11}
                  position={{ top: '50px', right: '190px' }}
                  maxWidth="300px"
                />

                <Tooltip title="Copy full summary">
                  <IconButton
                    onClick={() => handleCopyToClipboard(summary.meetingOverview, "Summary")}
                    size="small"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>

                {/* Step 10 Tour Popover - Copy Summary */}
                <TourPopover
                  open={isDemo && isTourActive && isCurrentStep(10)}
                  step={10}
                  title="(Optional) Copy Summary"
                  description="You can copy the summary to your clipboard using this button to paste it elsewhere."
                  onClose={() => closeStep(10)}
                  totalSteps={11}
                  position={{ top: '150px', right: '10px' }}
                  maxWidth="300px"
                />

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

            {/* Action Items by Speaker */}
            {actionItems.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Action Items ({actionItems.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleCreateActionItem}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>
                
                {/* Step 9 Tour Popover - Expand Action Items */}
                <TourPopover
                  open={isDemo && isTourActive && isCurrentStep(9)}
                  step={9}
                  title="Add/Edit/Delete Action Items"
                  description="Click the ▼ to expand the Action Items. You can add, edit, delete, and drag action items between speakers."
                  onClose={() => closeStep(9)}
                  totalSteps={11}
                  position={{ top: '310px', left: '575px' }}
                  maxWidth="400px"
                />
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={actionItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {groupedActionItems.map((group) => (
                      <Accordion 
                        key={group.speakerId} 
                        sx={{ mb: 1 }}
                        expanded={expandedAccordions.has(group.speakerId)}
                        onChange={handleAccordionChange(group.speakerId)}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Person color="primary" />
                            <Box>
                              <Typography variant="subtitle1">
                                {group.speakerName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {group.items.length} action items
                              </Typography>
                            </Box>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {group.items.map((item) => (
                              <SortableActionItem
                                key={item.id}
                                item={item}
                                onEdit={handleEditActionItem}
                                onDelete={handleDeleteActionItem}
                              />
                            ))}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </SortableContext>
                </DndContext>
              </Box>
            )}

            {/* Empty state when no action items exist */}
            {actionItems.length === 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Action Items (0)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleCreateActionItem}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    bgcolor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No action items yet. Generate a meeting summary or add custom action items to get started.
                  </Typography>
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

      {/* Step 16 Tour Popover - Tour Completion */}
      <TourPopover
        open={isDemo && isTourActive && isCurrentStep(16)}
        step={16}
        title="Tour Completion"
        description="Congratulations! You've completed the demo tour. Sign up to start processing your own meeting recordings."
        onClose={() => closeStep(16)}
        totalSteps={16}
        position={{ top: '325px', left: '375px' }}
        maxWidth="400px"
      />
    </Card>
  );
};

export default SummaryDisplay;
