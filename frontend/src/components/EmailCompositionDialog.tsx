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
  Chip,
} from '@mui/material';
import {
  Close,
  Email,
  Add,
} from '@mui/icons-material';
import { useEmailStore } from '../stores/emailStore';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { EmailService } from '../services/emailService';
import FocusTrap from 'focus-trap-react';

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
    speakerMappings,
    recipientInput,
    summary,
    isSending,
    sendSuccess,
    sendError,
    setSending,
    setSendSuccess,
    setSendError,
    setSubject: setStoreSubject,
    setContent: setStoreContent,
    addRecipient,
    setRecipientInput,
    // Transcript options
    includeTranscript,
    transcriptOnly,
    transcriptData,
    setIncludeTranscript,
  } = useEmailStore();

  // Accessibility store for modal management
  const { openModal, closeModal, announceModalOpen, announceModalClose } = useAccessibilityStore();


  console.log('📧 EMAIL DIALOG DEBUG:', {
    open,
    isDialogOpen: open,
  });

  // Helper functions
  const handleAddRecipientFromInput = () => {
    const email = recipientInput.trim();
    if (email && !storeRecipients.includes(email)) {
      addRecipient(email);
      setRecipientInput(''); // Clear the input after adding
    }
  };

  const handleSendEmail = async () => {
    if (storeRecipients.length === 0) {
      setSendError('Please add at least one recipient');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const emailService = new EmailService();
      
      // Prepare email content - include transcript if checked and available
      let finalContent = storeContent;
      if (includeTranscript && transcriptData) {
        finalContent += '\n\n--- Full Meeting Transcript ---\n\n';
        if (transcriptData.transcribedText) {
          finalContent += transcriptData.transcribedText;
        }
      }

      const result = await emailService.sendEmail({
        recipients: storeRecipients,
        subject: storeSubject,
        content: finalContent,
        meetingSummary: summary || undefined,
        speakerMappings: speakerMappings,
      });

      if (result.success) {
        setSendSuccess(`Email sent successfully to ${result.recipientsCount} recipient(s)!`);
        // Close dialog after brief delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setSendError(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      setSendError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Get unique suggested emails from speaker mappings
  const getSuggestedEmails = () => {
    console.log('📧 Debug - speakerMappings:', speakerMappings);
    const emails = speakerMappings
      .filter(speaker => speaker.email && speaker.email.trim())
      .map(speaker => speaker.email!.trim());
    
    // Email validation and filtering logic
    
    // Remove duplicates using Set
    const uniqueEmails = Array.from(new Set(emails));
    // Remove duplicate emails
    return uniqueEmails;
  };



  // Modal lifecycle management
  React.useEffect(() => {
    if (open) {
      openModal('emailComposition');
      announceModalOpen('Share Meeting Summary via Email');
    } else {
      closeModal('emailComposition');
      announceModalClose('Share Meeting Summary via Email');
    }
    
    // Cleanup on unmount
    return () => {
      if (open) {
        closeModal('emailComposition');
      }
    };
  }, [open, openModal, closeModal, announceModalOpen, announceModalClose]);

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
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
        PaperProps={{
          style: {
            minHeight: '70vh',
          }
        }}
      >
      <FocusTrap 
        active={open && !isSending}
        focusTrapOptions={{
          allowOutsideClick: false,
          escapeDeactivates: true,
        }}
      >
        <div>
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
            {/* Recipient Input Field */}
            <TextField
              label="Add recipient email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRecipientFromInput()}
              placeholder="Enter email address..."
              fullWidth
              variant="outlined"
              InputProps={{
                endAdornment: recipientInput.trim() && (
                  <IconButton onClick={handleAddRecipientFromInput} size="small">
                    <Add />
                  </IconButton>
                )
              }}
            />
            
            {/* Suggested Recipients from Speaker Mappings */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'medium' }}>
                Meeting Participants ({getSuggestedEmails().length} found):
              </Typography>
              {getSuggestedEmails().length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {getSuggestedEmails().map((email, index) => (
                    <Chip
                      key={index}
                      label={email}
                      onClick={() => {
                        if (!storeRecipients.includes(email)) {
                          addRecipient(email);
                        }
                      }}
                      clickable
                      variant="outlined"
                      size="small"
                      color={storeRecipients.includes(email) ? "primary" : "default"}
                      sx={{
                        cursor: 'pointer',
                        opacity: storeRecipients.includes(email) ? 0.5 : 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No participants with email addresses found. Add email addresses in Speaker Mapping to see suggestions here.
                </Typography>
              )}
            </Box>
            
            {/* Recipients Heading and List */}
            {storeRecipients.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: 'white', fontWeight: 'bold' }}>
                  Recipients
                </Typography>
                {storeRecipients.map((email, index) => (
                  <Typography key={index} variant="body2" sx={{ color: 'white' }}>
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
        {/* Success/Error Messages */}
        {sendSuccess && (
          <Typography variant="body2" color="success.main" sx={{ flexGrow: 1 }}>
            ✅ {sendSuccess}
          </Typography>
        )}
        {sendError && (
          <Typography variant="body2" color="error.main" sx={{ flexGrow: 1 }}>
            ❌ {sendError}
          </Typography>
        )}
        
        <Button onClick={handleClose} variant="outlined" disabled={isSending}>
          Cancel
        </Button>
        <Button 
          onClick={handleSendEmail} 
          variant="contained" 
          color="primary"
          disabled={storeRecipients.length === 0 || isSending}
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
        </div>
      </FocusTrap>
    </Dialog>
  );
};

export default EmailCompositionDialog;