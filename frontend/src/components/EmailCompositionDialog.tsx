import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Close,
  Email,
} from '@mui/icons-material';
import { useEmailStore } from '../stores/emailStore';

interface EmailCompositionDialogProps {
  onSend?: (data: any) => void;
}

const EmailCompositionDialog: React.FC<EmailCompositionDialogProps> = ({ onSend: _onSend }) => {
  console.log('🚨 EmailCompositionDialog COMPONENT CALLED - start of function');
  
  // Email store state
  const {
    isDialogOpen: open,
    closeDialog,
    subject: storeSubject,
    content: storeContent,
    recipients: storeRecipients,
    setSubject: setStoreSubject,
    setContent: setStoreContent,
    setRecipients: _setStoreRecipients,
    // Transcript options
    includeTranscript,
    transcriptOnly,
    transcriptData,
    setIncludeTranscript,
  } = useEmailStore();

  console.log('📧 EMAIL DIALOG DEBUG:', {
    open,
    isDialogOpen: open,
  });

  // Debug: Track when open state changes
  React.useEffect(() => {
    console.log('📧 EmailCompositionDialog useEffect - open changed to:', open);
    if (open) {
      console.log('📧 DIALOG SHOULD BE VISIBLE NOW!');
      
      // DOM inspection
      setTimeout(() => {
        console.log('🔍 DOM INSPECTION:');
        const dialogs = document.querySelectorAll('[role="dialog"]');
        const backdrops = document.querySelectorAll('.MuiBackdrop-root');
        console.log('🔍 Found dialogs:', dialogs.length, 'backdrops:', backdrops.length);
        
        if (dialogs.length > 0) {
          const style = window.getComputedStyle(dialogs[0]);
          console.log('🔍 Dialog style:', {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex
          });
        }
      }, 200);
    }
  }, [open]);

  const handleClose = () => {
    console.log('📧 Closing dialog');
    closeDialog();
  };

  console.log('🧪 EmailCompositionDialog about to return, open:', open);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          minHeight: '70vh',
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Email color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#000', fontWeight: 'bold' }}>
            Share Meeting Summary
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          {/* Recipients Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#000', fontWeight: 'bold' }}>
              Recipients
            </Typography>
            <TextField
              label="Add recipient email"
              value=""
              onChange={() => {}}
              placeholder="Enter email address..."
              fullWidth
              variant="outlined"
            />
            {storeRecipients.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {storeRecipients.map((email, index) => (
                  <Typography key={index} variant="body2" sx={{ color: '#000' }}>
                    • {email}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
          
          {/* Subject */}
          <TextField
            label="Subject"
            value={storeSubject}
            onChange={(e) => setStoreSubject(e.target.value)}
            fullWidth
            variant="outlined"
          />
          
          {/* Content */}
          <TextField
            label="Email Content"
            value={storeContent}
            onChange={(e) => setStoreContent(e.target.value)}
            multiline
            rows={8}
            fullWidth
            variant="outlined"
          />
          
          {/* Append Transcript Option - Show only for summary emails with transcript data */}
          {!transcriptOnly && transcriptData && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeTranscript}
                  onChange={(e) => setIncludeTranscript(e.target.checked)}
                  color="primary"
                />
              }
              label="Append full transcript to email"
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleClose} variant="contained" color="primary">
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailCompositionDialog;