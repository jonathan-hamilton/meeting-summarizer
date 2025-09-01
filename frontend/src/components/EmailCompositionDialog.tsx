import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Email,
  Send,
  Preview,
  Person,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import CodeEditor from '@uiw/react-textarea-code-editor';
import type { MeetingSummary, SpeakerMapping, ActionItem } from '../types';
import { emailService } from '../services/emailService';
import { useAppMode } from '../contexts/AppModeContext';
import { useTourStore } from '../stores/tourStore';
import { TourPopover } from './TourPopover';

interface EmailCompositionDialogProps {
  open: boolean;
  onClose: () => void;
  summary: MeetingSummary | null;
  speakerMappings: SpeakerMapping[];
  actionItems: ActionItem[];
  onSend?: (emailData: EmailData) => void;
}

interface EmailData {
  subject: string;
  content: string;
  recipients: string[];
  htmlContent: string;
}

const EmailCompositionDialog: React.FC<EmailCompositionDialogProps> = ({
  open,
  onClose,
  summary,
  speakerMappings,
  actionItems,
  onSend,
}) => {
  // Mode detection for demo mode handling
  const { mode, isDemo } = useAppMode();
  
  // Tour state management
  const { isActive: isTourActive, isStepClosed, closeStep } = useTourStore();
  
  // Email composition state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // S3.4 Increment 4: Real email sending state
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // S3.4: Get participant emails for intelligent suggestions
  const participantEmails = useMemo(() => {
    return speakerMappings
      .filter(mapping => mapping.email && mapping.email.trim() !== '')
      .map(mapping => ({
        email: mapping.email!,
        name: mapping.name,
        role: mapping.role
      }));
  }, [speakerMappings]);

  // S3.4: Suggest recipients based on speaker mappings
  const suggestedRecipients = useMemo(() => {
    return participantEmails.filter((participant: { email: string; name: string; role: string }) => 
      !recipients.includes(participant.email)
    );
  }, [participantEmails, recipients]);

  // Initialize content when summary changes
  useEffect(() => {
    if (summary && open) {
      const defaultSubject = `Meeting Summary - ${new Date().toLocaleDateString()}`;
      const defaultContent = generateEmailContent(summary, speakerMappings);
      
      setSubject(defaultSubject);
      setContent(defaultContent);
    }
  }, [summary, open, speakerMappings]);

  // Generate default email content from summary
  const generateEmailContent = (meetingSummary: MeetingSummary, speakers: SpeakerMapping[]): string => {
    const participantsList = speakers
      .map(speaker => `• ${speaker.name}${speaker.role ? ` - ${speaker.role}` : ''}`)
      .join('\n');

    // Group current action items by speaker
    const groupedActionItems: { [speakerId: string]: { speakerName: string; items: ActionItem[] } } = {};
    
    actionItems.forEach(item => {
      const speakerId = item.assignedTo || 'Unassigned';
      
      if (!groupedActionItems[speakerId]) {
        // Find speaker name from mappings
        const speakerMapping = speakers.find(m => m.speakerId === speakerId);
        const speakerName = speakerMapping?.name || (speakerId === 'Unassigned' ? 'Unassigned' : speakerId);
        
        groupedActionItems[speakerId] = {
          speakerName,
          items: []
        };
      }
      
      groupedActionItems[speakerId].items.push(item);
    });

    // Create action items list based on speaker mappings order, with Unassigned at the end
    const orderedGroups: Array<{ speakerId: string; speakerName: string; items: ActionItem[] }> = [];
    
    // Add speakers in order from speaker mappings
    speakers.forEach(mapping => {
      if (groupedActionItems[mapping.speakerId]) {
        orderedGroups.push({
          speakerId: mapping.speakerId,
          speakerName: groupedActionItems[mapping.speakerId].speakerName,
          items: groupedActionItems[mapping.speakerId].items
        });
      }
    });
    
    // Add any other assigned speakers that aren't in mappings
    Object.entries(groupedActionItems).forEach(([speakerId, group]) => {
      if (speakerId !== 'Unassigned' && !orderedGroups.find(g => g.speakerId === speakerId)) {
        orderedGroups.push({
          speakerId,
          speakerName: group.speakerName,
          items: group.items
        });
      }
    });
    
    // Add Unassigned at the end if it has items
    if (groupedActionItems['Unassigned']) {
      orderedGroups.push({
        speakerId: 'Unassigned',
        speakerName: 'Unassigned',
        items: groupedActionItems['Unassigned'].items
      });
    }

    const actionItemsList = orderedGroups
      .map(group => {
        const items = group.items
          .map(item => `  • ${item.description}`)
          .join('\n');
        return `${group.speakerName}:\n${items}`;
      })
      .join('\n\n');

    return `Hello team,

Please find the AI-generated meeting summary below:

## Meeting Overview
${meetingSummary.meetingOverview}

## Meeting Participants
${participantsList}

## Action Items
${actionItemsList || 'No action items assigned.'}

## Summary Details
- Generated: ${new Date().toLocaleString()}
- Processing time: ${meetingSummary.generation.processingTimeMs}ms
- Participants: ${meetingSummary.metadata.speakerCount}

---
*This summary was generated by AI and may require review. Please verify action items and assignments.*

Best regards`;
  };

  // Add recipient
  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && !recipients.includes(email)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setRecipients([...recipients, email]);
        setRecipientInput('');
        setError(null);
      } else {
        setError('Please enter a valid email address');
      }
    }
  };

  // Remove recipient
  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  // S3.4: Add all participants as recipients
  const handleAddAllParticipants = () => {
    const allEmails = participantEmails.map(p => p.email);
    const newRecipients = [...new Set([...recipients, ...allEmails])]; // Remove duplicates
    setRecipients(newRecipients);
  };

  // S3.4: Add suggested recipient
  const handleAddSuggestedRecipient = (email: string) => {
    if (!recipients.includes(email)) {
      setRecipients([...recipients, email]);
    }
  };

  // Handle send email with mode-aware behavior
  const handleSend = async () => {
    // Clear previous messages
    setError(null);
    setSendSuccess(null);
    setSendError(null);
    
    // Validation
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter an email subject');
      return;
    }

    if (!content.trim()) {
      setError('Please enter email content');
      return;
    }

    try {
      setIsSending(true);
      
      // Demo mode: Simulate email sending without real API calls
      if (mode === 'demo') {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSendSuccess(`✨ Demo: Email sent successfully to ${recipients.length} recipient(s)! (No actual emails were sent)`);
        
        // Call legacy onSend callback if provided for demo mode
        if (onSend) {
          const emailData: EmailData = {
            subject: subject.trim(),
            content: content.trim(),
            htmlContent: content.trim(), // Use same content for HTML
            recipients: [...recipients]
          };
          onSend(emailData);
        }
        
        // Close after a brief delay to show success message (consistent with production)
        setTimeout(() => {
          onClose();
        }, 2000);
        
        setIsSending(false);
        return;
      }
      
      // Production/Development mode: Real email sending
      // Use the user's edited content (convert to HTML if needed)
      let htmlContent = '';
      
      // Always use the user's edited content, not the original summary
      htmlContent = convertToHtml(content);

      // Send email via API
      const sendRequest = {
        recipients,
        subject: subject.trim(),
        content: htmlContent,
        plainTextContent: content.trim(),
        meetingSummary: summary || undefined,
        speakerMappings: speakerMappings.length > 0 ? speakerMappings : undefined,
      };

      const response = await emailService.sendEmail(sendRequest);

      if (response.success) {
        setSendSuccess(`Email sent successfully to ${response.recipientsCount} recipient(s)!`);
        
        // Clear draft after successful send
        if (summary) {
          sessionStorage.removeItem(`email-draft-${summary.summaryId}`);
        }
        
        // Call legacy onSend callback if provided
        const emailData: EmailData = {
          subject: subject.trim(),
          content: content.trim(),
          recipients,
          htmlContent,
        };
        onSend?.(emailData);
        
        // Close after a brief delay to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSendError(response.message || 'Failed to send email');
        if (response.errorDetails) {
          console.error('Email send error details:', response.errorDetails);
        }
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setSendError(`Failed to send email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Convert plain text to HTML for email
  const convertToHtml = (text: string): string => {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/## (.*?)(<br>|<\/p>)/g, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  // Handle dialog close
  const handleClose = () => {
    onClose();
  };

  if (!summary) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Email color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Share Meeting Summary
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* General Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Email Send Success Alert */}
          {sendSuccess && (
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              onClose={() => setSendSuccess(null)}
            >
              {sendSuccess}
            </Alert>
          )}

          {/* Email Send Error Alert */}
          {sendError && (
            <Alert 
              severity="error" 
              icon={<Error />}
              onClose={() => setSendError(null)}
            >
              {sendError}
            </Alert>
          )}

          {/* Recipients Section */}
          <Box sx={{ position: 'relative' }}>
            <Typography variant="subtitle2" gutterBottom>
              Recipients
            </Typography>
            
            {/* Step 12 Tour Popover - Add Email Recipients */}
            <TourPopover
              open={isDemo && isTourActive && !isStepClosed(12)}
              step={12}
              title="Add Email Recipients"
              description="Either 'ADD' an email manually, click individual emails (ex. 'speaker1@test.com') or 'ADD ALL PARTICIPANTS'"
              onClose={() => closeStep(12)}
              totalSteps={17}
              position={{ top: '0px', left: '320px' }}
              maxWidth="350px"
            />
            
            {/* Display current recipients if any */}
            {recipients.length > 0 && (
              <TextField
                size="small"
                label="Current Recipients"
                value={recipients.join(', ')}
                variant="outlined"
                multiline
                maxRows={3}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mb: 1, width: '100%' }}
              />
            )}
            
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                placeholder="Enter email address to add"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                sx={{ flexGrow: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddRecipient}
                startIcon={<Person />}
              >
                Add
              </Button>
            </Stack>

            {/* S3.4: Quick Actions for Participants */}
            {participantEmails.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={handleAddAllParticipants}
                    disabled={participantEmails.length === recipients.length}
                  >
                    Add All Participants ({participantEmails.length})
                  </Button>
                </Stack>
                
                {/* Suggested Recipients */}
                {suggestedRecipients.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Meeting Participants:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {suggestedRecipients.map((participant) => (
                        <Chip
                          key={participant.email}
                          label={`${participant.name} <${participant.email}>`}
                          onClick={() => handleAddSuggestedRecipient(participant.email)}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {recipients.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleRemoveRecipient(email)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Subject Section */}
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
          />

          {/* Content Section */}
          <Box sx={{ position: 'relative' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">
                Email Content
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  onClick={() => setIsPreview(!isPreview)}
                  startIcon={<Preview />}
                >
                  {isPreview ? 'Edit' : 'Preview'}
                </Button>
              </Stack>
            </Stack>

            {/* Step 14 Tour Popover - Preview Email */}
            <TourPopover
              open={isDemo && isTourActive && !isStepClosed(14)}
              step={14}
              title="Preview Email"
              description="Preview how your email will look with the meeting summary and action items included before sending it to recipients."
              onClose={() => closeStep(14)}
              totalSteps={16}
              position={{ top: '50px', left: '450px' }}
              maxWidth="350px"
            />

            {/* Step 13 Tour Popover - Edit Email Content */}
            <TourPopover
              open={isDemo && isTourActive && !isStepClosed(13)}
              step={13}
              title="Edit Email Content"
              description="Customize the email subject and add a personal message. The Meeting Summary and Action Items will be included automatically."
              onClose={() => closeStep(13)}
              totalSteps={17}
              position={{ top: '50px', left: '50px' }}
              maxWidth="350px"
            />

            {isPreview ? (
              <Paper sx={{ p: 2, minHeight: 300, bgcolor: 'background.default' }}>
                <div dangerouslySetInnerHTML={{ __html: convertToHtml(content) }} />
              </Paper>
            ) : (
              <CodeEditor
                value={content}
                language="text"
                onChange={(evn) => setContent(evn.target.value)}
                padding={15}
                style={{
                  fontSize: 14,
                  backgroundColor: '#f5f5f5',
                  fontFamily: 'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
                  minHeight: '300px',
                }}
                data-color-mode="light"
              />
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSend}
          startIcon={isSending ? <CircularProgress size={16} /> : <Send />}
          disabled={recipients.length === 0 || !subject.trim() || !content.trim() || isSending}
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>

      {/* Step 15 Tour Popover - Send Email */}
      <TourPopover
        open={isDemo && isTourActive && !isStepClosed(15)}
        step={15}
        title="Send Email"
        description="Send the meeting summary and action items to all recipients. In demo mode, no actual emails are sent."
        onClose={() => closeStep(15)}
        totalSteps={16}
        position={{ top: '670px', left: '600px' }}
        maxWidth="350px"
      />
    </Dialog>
  );
};

export default EmailCompositionDialog;
