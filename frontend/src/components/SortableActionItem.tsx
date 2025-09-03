import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Delete,
  DragIndicator,
} from '@mui/icons-material';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ActionItem } from '../types';

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

export default SortableActionItem;
