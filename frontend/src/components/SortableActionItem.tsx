import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Edit,
  Delete,
  DragIndicator,
  KeyboardArrowUp,
  KeyboardArrowDown,
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
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp = false, 
  canMoveDown = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        p: isMobile ? 3 : 2,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: isMobile ? 2 : 1,
        border: '1px solid',
        borderColor: 'divider',
        cursor: isDragging ? 'grabbing' : 'auto',
        width: '100%',
        overflow: 'visible',
        borderRadius: isMobile ? 2 : 1,
        '&:hover': isMobile ? {
          borderColor: 'primary.main',
          boxShadow: 1,
        } : {},
      }}
    >
      {isMobile ? (
        // Mobile Layout: Improved card design
        <>
          {/* Header with content and move controls */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2,
                  lineHeight: 1.5,
                  wordWrap: 'break-word',
                  fontWeight: 500,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.description}
              </Typography>
              
              {/* Metadata chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={item.assignedTo || 'Unassigned'}
                  size="small"
                  variant="outlined"
                  color={item.assignedTo ? 'primary' : 'default'}
                  sx={{ fontWeight: 500 }}
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

            {/* Move controls for mobile */}
            <Box sx={{ ml: 2, flexShrink: 0 }}>
              <Stack direction="column" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => onMoveUp?.(item.id)}
                  disabled={!canMoveUp}
                  sx={{
                    minHeight: 44,
                    minWidth: 44,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                  aria-label="Move action item to previous user"
                >
                  <KeyboardArrowUp fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onMoveDown?.(item.id)}
                  disabled={!canMoveDown}
                  sx={{
                    minHeight: 44,
                    minWidth: 44,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                  aria-label="Move action item to next user"
                >
                  <KeyboardArrowDown fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Box>

          {/* Action buttons for mobile */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
            <IconButton
              size="medium"
              onClick={() => onEdit(item)}
              color="primary"
              sx={{
                minHeight: 44,
                minWidth: 44,
                border: '1px solid',
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'primary.50',
                },
              }}
              aria-label="Edit action item"
            >
              <Edit fontSize="medium" />
            </IconButton>
            <IconButton
              size="medium"
              onClick={() => onDelete(item.id)}
              color="error"
              sx={{
                minHeight: 44,
                minWidth: 44,
                border: '1px solid',
                borderColor: 'error.main',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'error.50',
                },
              }}
              aria-label="Delete action item"
            >
              <Delete fontSize="medium" />
            </IconButton>
          </Box>
        </>
      ) : (
        // Desktop Layout: Keep existing horizontal layout
        <>
          {/* Desktop drag handle */}
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{ 
              color: 'text.secondary',
              cursor: isDragging ? 'grabbing' : 'grab',
              '&:hover': { color: 'primary.main' },
              '&:active': { 
                color: 'primary.main',
                backgroundColor: 'action.selected'
              }
            }}
            aria-label="Drag to reorder action item"
          >
            <DragIndicator fontSize="small" />
          </IconButton>
          
          {/* Desktop content */}
          <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1, 
                wordWrap: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
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
          
          {/* Desktop action buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexShrink: 0,
            alignItems: 'flex-start'
          }}>
            <IconButton
              size="small"
              onClick={() => onEdit(item)}
              color="primary"
              sx={{
                zIndex: 1,
              }}
              aria-label="Edit action item"
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(item.id)}
              color="error"
              sx={{
                zIndex: 1,
              }}
              aria-label="Delete action item"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SortableActionItem;
