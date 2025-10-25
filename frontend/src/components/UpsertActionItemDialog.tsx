import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ActionItem } from '../types';

interface UpsertActionItemDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to call when dialog should close */
  onClose: () => void;
  /** Function to call when saving action item */
  onSave: (actionItem: Omit<ActionItem, 'id'>) => void;
  /** Existing action item to edit (null for new action item) */
  actionItem?: ActionItem | null;
  /** Available speakers for assignment */
  speakers?: string[];
}

/**
 * S5.2 Increment 2: Dialog component for creating and editing action items
 * 
 * Features:
 * - Create new action items with description and assignee
 * - Edit existing action items
 * - Responsive design with proper mobile support
 * - Form validation and error handling
 * - Material-UI integration with consistent styling
 */
export const UpsertActionItemDialog: React.FC<UpsertActionItemDialogProps> = ({
  open,
  onClose,
  onSave,
  actionItem = null,
  speakers = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Form state
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [errors, setErrors] = useState<{
    description?: string;
    assignedTo?: string;
  }>({});

  // Initialize form when dialog opens or action item changes
  useEffect(() => {
    if (open) {
      if (actionItem) {
        // Editing existing action item
        setDescription(actionItem.description || '');
        setAssignedTo(actionItem.assignedTo === 'Unassigned' ? '' : (actionItem.assignedTo || ''));
      } else {
        // Creating new action item
        setDescription('');
        setAssignedTo(''); // Default to unassigned (empty string)
      }
      setErrors({});
    }
  }, [open, actionItem]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    // No validation needed for assignedTo since it's a dropdown with predefined options
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const actionItemData: Omit<ActionItem, 'id'> = {
      description: description.trim(),
      assignedTo: assignedTo || 'Unassigned', // Use "Unassigned" if empty string selected
      confidence: actionItem?.confidence ?? 1.0, // Preserve existing confidence or default to 1.0
      isExplicitAssignment: assignedTo !== '', // True if user selected a specific assignee
      sourceText: actionItem?.sourceText, // Preserve existing source text
      createdAt: actionItem?.createdAt ?? new Date().toISOString(), // Preserve existing createdAt or set new
      modifiedAt: new Date().toISOString() // Always update modifiedAt
    };

    onSave(actionItemData);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      handleSave();
    }
  };

  const title = actionItem ? 'Edit Action Item' : 'Add Action Item';

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          ...(isMobile && {
            m: 0,
            maxHeight: '100vh',
            height: '100vh'
          })
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleCancel}
          size={isMobile ? "medium" : "small"}
          sx={{ 
            ml: 1,
            minHeight: isMobile ? 44 : 'auto',
            minWidth: isMobile ? 44 : 'auto',
          }}
        >
          <CloseIcon fontSize={isMobile ? "medium" : "small"} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            pt: 1
          }}
          onKeyDown={handleKeyPress}
        >
          {/* Description Field */}
          <TextField
            label="Description"
            multiline
            rows={3}
            maxRows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description || 'What needs to be done?'}
            placeholder="Enter action item description..."
            required
            aria-label="Action item description"
            aria-describedby="description-helper-text"
            fullWidth
            variant="outlined"
            inputProps={{
              maxLength: 500
            }}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: theme.palette.background.default
              }
            }}
          />

          {/* Assignee Field */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="assignee-select-label">Assigned To (Optional)</InputLabel>
            <Select
              labelId="assignee-select-label"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              label="Assigned To (Optional)"
              error={!!errors.assignedTo}
              sx={{
                '& .MuiSelect-select': {
                  backgroundColor: theme.palette.background.default
                }
              }}
            >
              {speakers.map((speaker) => (
                <MenuItem key={speaker} value={speaker}>
                  {speaker}
                </MenuItem>
              ))}
            </Select>
            {errors.assignedTo && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.assignedTo}
              </Typography>
            )}
            {!errors.assignedTo && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                Leave blank if not assigned to a specific person
              </Typography>
            )}
          </FormControl>

          {/* Character Count */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography
              variant="caption"
              color={description.length > 450 ? 'error' : 'text.secondary'}
            >
              {description.length}/500 characters
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="inherit"
          size={isMobile ? "large" : "medium"}
          sx={{
            minHeight: isMobile ? 48 : 'auto',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!description.trim()}
          size={isMobile ? "large" : "medium"}
          sx={{
            minHeight: isMobile ? 48 : 'auto',
          }}
        >
          {actionItem ? 'Update' : 'Add'} Action Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpsertActionItemDialog;
