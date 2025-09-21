import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import {
  History as HistoryIcon,
  AutoMode as AutoSaveIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useSummaryStore } from '../stores/summaryStore';
import { useAuthStore } from '../stores/authStore';
import { useAppMode } from '../contexts/AppModeContext';

interface SaveOptionsProps {
  transcriptFileName?: string;
  onViewHistory?: () => void;
}

const SaveOptions: React.FC<SaveOptionsProps> = ({
  transcriptFileName = 'transcript.txt',
  onViewHistory,
}) => {
  const { user } = useAuthStore();
  const { mode } = useAppMode();
  const {
    summary,
    saveSummary,
    autoSaveEnabled,
    saveStatus,
    selectedSavedSummary,
    savedSummaries,
  } = useSummaryStore();

  const [quickSaveDialogOpen, setQuickSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  // Auto-generate a default title
  const generateDefaultTitle = () => {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Meeting Summary - ${date} ${time}`;
  };

  // Handle custom save with dialog
  const handleCustomSave = () => {
    setSaveTitle(generateDefaultTitle());
    setQuickSaveDialogOpen(true);
  };

  const handleConfirmCustomSave = async () => {
    if (!user?.id || !summary || !saveTitle.trim()) return;

    try {
      await saveSummary(user.id, saveTitle.trim(), transcriptFileName);
      setQuickSaveDialogOpen(false);
      setSaveTitle('');
    } catch (error) {
      console.error('Custom save failed:', error);
    }
  };

  // Don't show in demo mode
  if (mode === 'demo') {
    return null;
  }

  // Don't show if no user or no summary
  if (!user?.id || !summary) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            {!user?.id 
              ? "Sign in to save and manage your meeting summaries" 
              : "Generate a summary to enable save options"}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Save Options
          </Typography>
          
          {/* Auto-save status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {autoSaveEnabled && (
              <Chip
                icon={<AutoSaveIcon />}
                label="Auto-save ON"
                color="success"
                size="small"
              />
            )}
            {saveStatus === 'saving' && (
              <Chip
                label="Saving..."
                color="primary"
                size="small"
              />
            )}
            {saveStatus === 'saved' && (
              <Chip
                label="Saved"
                color="success"
                size="small"
              />
            )}
            {saveStatus === 'error' && (
              <Chip
                label="Save failed"
                color="error"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Current summary info */}
        {selectedSavedSummary && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Currently viewing: <strong>{selectedSavedSummary.title}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(selectedSavedSummary.createdAt).toLocaleString()}
            </Typography>
          </Alert>
        )}

        {/* Save actions - simplified for auto-save mode */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {/* Custom save button - for creating new named versions */}
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={handleCustomSave}
            disabled={saveStatus === 'saving'}
            size="small"
          >
            Save As...
          </Button>

          {/* View history button */}
          {onViewHistory && savedSummaries.length > 0 && (
            <Button
              variant="text"
              startIcon={<HistoryIcon />}
              onClick={onViewHistory}
              size="small"
            >
              History ({savedSummaries.length})
            </Button>
          )}
        </Stack>

        {/* Save stats */}
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            You have {savedSummaries.length} saved summaries
            {autoSaveEnabled && " • Auto-save enabled"}
          </Typography>
        </Box>
      </CardContent>

      {/* Custom Save Dialog */}
      <Dialog open={quickSaveDialogOpen} onClose={() => setQuickSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Summary As...</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Summary Title"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              helperText="Choose a descriptive title for this summary"
              autoFocus
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Source: {transcriptFileName}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmCustomSave} 
            variant="contained"
            disabled={!saveTitle.trim()}
          >
            Save Summary
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SaveOptions;