import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSummaryStore } from '../stores/summaryStore';
import { useAuthStore } from '../stores/authStore';
import type { SavedSummary } from '../types';

interface SavedSummariesListProps {
  onSummarySelected?: (summary: SavedSummary) => void;
  showActions?: boolean;
  maxHeight?: string | number;
}

const SavedSummariesList: React.FC<SavedSummariesListProps> = ({
  onSummarySelected,
  showActions = true,
  maxHeight = 400,
}) => {
  const { user } = useAuthStore();
  const {
    savedSummaries,
    loadStatus,
    selectedSavedSummary,
    loadUserSummaries,
    selectSavedSummary,
    deleteSavedSummary,
    saveSummary,
    summary: currentSummary,
  } = useSummaryStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState<SavedSummary | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveFileName, setSaveFileName] = useState('');

  // Load saved summaries when component mounts
  useEffect(() => {
    if (user?.id && loadStatus === 'idle') {
      loadUserSummaries(user.id);
    }
  }, [user?.id, loadStatus, loadUserSummaries]);

  // Handle summary selection
  const handleSelectSummary = async (summary: SavedSummary) => {
    if (user?.id) {
      await selectSavedSummary(summary.id, user.id);
      if (onSummarySelected) {
        onSummarySelected(summary);
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (summary: SavedSummary) => {
    setSummaryToDelete(summary);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (summaryToDelete && user?.id) {
      await deleteSavedSummary(summaryToDelete.id, user.id);
      setSummaryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Handle save current summary
  const handleSaveCurrentSummary = () => {
    const defaultTitle = `Meeting Summary - ${new Date().toLocaleDateString()}`;
    const defaultFileName = 'transcript.txt';
    
    setSaveTitle(defaultTitle);
    setSaveFileName(defaultFileName);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (user?.id && currentSummary && saveTitle && saveFileName) {
      await saveSummary(user.id, saveTitle, saveFileName);
      setSaveDialogOpen(false);
      setSaveTitle('');
      setSaveFileName('');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loadStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadStatus === 'error') {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load saved summaries. Please try again.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Saved Summaries ({savedSummaries.length})
          </Typography>
          {showActions && currentSummary && (
            <Button
              startIcon={<SaveIcon />}
              variant="outlined"
              size="small"
              onClick={handleSaveCurrentSummary}
            >
              Save Current
            </Button>
          )}
        </Box>

        {savedSummaries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No saved summaries yet.
            </Typography>
            {currentSummary && (
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleSaveCurrentSummary}
              >
                Save Your First Summary
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ maxHeight, overflow: 'auto' }}>
            <List dense>
              {savedSummaries.map((summary) => (
                <ListItem
                  key={summary.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedSavedSummary?.id === summary.id ? 'action.selected' : 'background.paper',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {summary.title}
                        </Typography>
                        {selectedSavedSummary?.id === summary.id && (
                          <Chip label="Current" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {summary.transcriptFileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(summary.createdAt)}
                        </Typography>
                        {summary.actionItems.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • {summary.actionItems.length} action items
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  {showActions && (
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleSelectSummary(summary)}
                          title="Load this summary"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDeleteClick(summary)}
                          title="Delete this summary"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Saved Summary</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{summaryToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Current Summary Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Current Summary</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Summary Title"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Give your summary a descriptive title"
            />
            <TextField
              fullWidth
              label="Source File Name"
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              helperText="Reference to the original transcript file"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmSave} 
            variant="contained"
            disabled={!saveTitle || !saveFileName}
          >
            Save Summary
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SavedSummariesList;