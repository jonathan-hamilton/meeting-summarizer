import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  Add,
  Person,
  ExpandMore,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensors,
  useSensor,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TourPopover from './TourPopover';
import SortableActionItem from './SortableActionItem';
import type { ActionItem, SpeakerMapping } from '../types';

interface ActionItemsSectionProps {
  actionItems: ActionItem[];
  speakerMappings: SpeakerMapping[];
  isDemo: boolean;
  isTourActive: boolean;
  isCurrentStep: (step: number) => boolean;
  onCreateActionItem: () => void;
  onEditActionItem: (item: ActionItem) => void;
  onDeleteActionItem: (id: string) => void;
  onReorderActionItems: (items: ActionItem[]) => void;
  onUpdateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  onCloseStep: (step: number) => void;
  triggerStepAction: (action: string) => void;
  onSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({
  actionItems,
  speakerMappings,
  isDemo,
  isTourActive,
  isCurrentStep,
  onCreateActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onReorderActionItems,
  onUpdateActionItem,
  onCloseStep,
  triggerStepAction,
  onSnackbar,
}) => {
  // Accordion expansion state - track which speaker accordions are expanded
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          onUpdateActionItem(draggedItem.id, { assignedTo: targetItem.assignedTo });
          
          // Auto-expand the target accordion to show the newly assigned item
          if (targetItem.assignedTo) {
            setExpandedAccordions(prev => new Set(prev).add(targetItem.assignedTo!));
          }
          
          onSnackbar(`Action item reassigned to ${targetItem.assignedTo || 'Unassigned'}`, 'success');
        } else {
          // Just reorder within the same speaker group
          const oldIndex = actionItems.findIndex((item) => item.id === active.id);
          const newIndex = actionItems.findIndex((item) => item.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedItems = arrayMove(actionItems, oldIndex, newIndex);
            onReorderActionItems(reorderedItems);
          }
        }
      }
    }
  };

  // Group action items by speaker with stable ordering
  const groupedActionItems = useMemo(() => {
    const groups: { [speakerId: string]: { speakerName: string; items: ActionItem[] } } = {};
    
    // First, populate the groups with action items
    actionItems.forEach(item => {
      const speakerId = item.assignedTo || 'Unassigned';
      
      if (!groups[speakerId]) {
        // Find speaker name from mappings
        const speakerMapping = speakerMappings.find(m => m.speakerId === speakerId);
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
    speakerMappings.forEach(mapping => {
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
  }, [actionItems, speakerMappings]);

  if (actionItems.length === 0) {
    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Action Items (0)
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={onCreateActionItem}
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
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Action Items ({actionItems.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={onCreateActionItem}
          size="small"
        >
          Add Item
        </Button>
      </Box>
      
      {/* Step 11 Tour Popover - Expand Action Items */}
      <TourPopover
        open={isDemo && isTourActive && isCurrentStep(11)}
        step={11}
        onClose={() => onCloseStep(11)}
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
                      onEdit={onEditActionItem}
                      onDelete={onDeleteActionItem}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
};

export default ActionItemsSection;
