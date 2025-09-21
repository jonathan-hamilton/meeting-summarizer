import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import SavedSummariesList from './SavedSummariesList';
import { useSummaryStore } from '../stores/summaryStore';
import { useAuthStore } from '../stores/authStore';
import type { SavedSummary } from '../types';

interface SavedSummariesDrawerProps {
  open: boolean;
  onClose: () => void;
  onSummarySelected?: (summary: SavedSummary) => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  width?: number;
}

const SavedSummariesDrawer: React.FC<SavedSummariesDrawerProps> = ({
  open,
  onClose,
  onSummarySelected,
  anchor = 'right',
  width = 400,
}) => {
  const { user } = useAuthStore();
  const { loadUserSummaries, loadStatus } = useSummaryStore();
  
  const handleRefresh = () => {
    if (user?.id) {
      loadUserSummaries(user.id);
    }
  };

  const handleSummarySelected = (summary: SavedSummary) => {
    if (onSummarySelected) {
      onSummarySelected(summary);
    }
    // Optionally close drawer after selection
    onClose();
  };

  const drawerContent = (
    <Box sx={{ width: width, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <HistoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Saved Summaries
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleRefresh}
            disabled={loadStatus === 'loading'}
            title="Refresh"
            sx={{ mr: 1 }}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Divider />

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {!user?.id ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sign In Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please sign in to view and manage your saved summaries.
            </Typography>
          </Box>
        ) : (
          <SavedSummariesList 
            onSummarySelected={handleSummarySelected}
            showActions={true}
            maxHeight="calc(100vh - 200px)"
          />
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Your summaries are automatically saved and synchronized.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SavedSummariesDrawer;