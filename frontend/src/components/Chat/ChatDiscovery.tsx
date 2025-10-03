import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useChatStore } from '../../stores/chatStore';

/**
 * First-time user discovery dialog for chat assistant
 */
export const ChatDiscovery: React.FC = () => {
  const { hasShownDiscovery, setDiscoveryShown, openChat } = useChatStore();

  // Show discovery dialog on first visit
  useEffect(() => {
    // Small delay to let the page load completely
    const timer = setTimeout(() => {
      if (!hasShownDiscovery) {
        // The dialog will show automatically due to !hasShownDiscovery
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasShownDiscovery]);

  const handleGotIt = () => {
    setDiscoveryShown();
  };

  const handleTryItNow = () => {
    setDiscoveryShown();
    openChat();
  };

  return (
    <Dialog
      open={!hasShownDiscovery}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BotIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" component="span">
            Meet Your AI Assistant
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity="info" 
          variant="outlined"
          sx={{ mb: 2 }}
          icon={<ChatIcon />}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            New Feature Available
          </Typography>
        </Alert>

        <Typography variant="body1" paragraph>
          I'm here to help you navigate meeting-summary.io! I can answer questions about:
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>File uploads:</strong> Supported formats, size limits, and quality tips
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>Transcription:</strong> Processing status, speaker detection, and troubleshooting
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>Speaker mapping:</strong> How to assign names and roles to speakers
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>Summaries & Email:</strong> Generating summaries and sharing results
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Look for the gray chat button in the bottom-right corner whenever you need help. 
          You can ask me questions anytime during your workflow!
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleGotIt}
          variant="outlined"
        >
          Got it
        </Button>
        <Button 
          onClick={handleTryItNow}
          variant="contained"
          startIcon={<ChatIcon />}
        >
          Try it now
        </Button>
      </DialogActions>
    </Dialog>
  );
};