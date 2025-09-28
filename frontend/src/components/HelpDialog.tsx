/**
 * Help & FAQ Dialog (S3.5)
 * Privacy-focused help and frequently asked questions
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Help as HelpIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Help dialog with privacy-focused FAQ and user guidance
 */
export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <HelpIcon color="primary" />
          Help & Frequently Asked Questions
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" icon={<SecurityIcon />} sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Your Privacy is Protected</strong>
          </Typography>
          <Typography variant="body2">
            Meeting-Summary.io uses a privacy-first approach with session-only data storage. 
            Your meeting data is never permanently stored and is automatically cleared when you close your browser.
          </Typography>
        </Alert>

        {/* FAQ Section Header */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Frequently Asked Questions
        </Typography>

        {/* Privacy & Data Handling */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">Privacy & Data Handling</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon><ScheduleIcon /></ListItemIcon>
                <ListItemText 
                  primary="How long is my data stored?"
                  secondary="Your meeting data exists only during your browser session (typically 2 hours). When you close the browser or session expires, all data is automatically deleted."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><StorageIcon /></ListItemIcon>
                <ListItemText 
                  primary="Where is my data stored?"
                  secondary="All data is stored temporarily in your browser's session storage. Nothing is saved to our servers permanently."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><DeleteIcon /></ListItemIcon>
                <ListItemText 
                  primary="How do I clear my data?"
                  secondary="Simply close your browser window or wait for the session to expire. You can also clear browser data manually."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LockIcon /></ListItemIcon>
                <ListItemText 
                  primary="Is my data secure?"
                  secondary="Yes! Session-based storage is more secure than permanent storage because data automatically expires and cannot be accessed after your session ends."
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Features Section */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
          Features
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <ScheduleIcon color="primary" />
              <Typography variant="h6">Session Management</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Session timeout warnings"
                  secondary="You'll receive warnings before your session expires, with options to extend your session or export your data."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Extending your session"
                  secondary="When you receive a timeout warning, click 'Extend Session' to continue working for another period."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Exporting before expiry"
                  secondary="Use the export options to save your meeting summaries before your session expires."
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon color="primary" />
              <Typography variant="h6">Email Sharing</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Instant email delivery"
                  secondary="Send professional meeting summaries directly from the application with SMTP delivery."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Recipient suggestions"
                  secondary="Smart recipient suggestions based on speaker mappings with email addresses."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Professional templates"
                  secondary="Automatically generated HTML email templates with company branding and formatting."
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">Speaker Management</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Speaker identification"
                  secondary="AI-powered speaker diarization automatically detects and separates different speakers in your meetings."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Custom speaker mapping"
                  secondary="Assign real names and roles to detected speakers for more readable transcripts and summaries."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Segment-level editing"
                  secondary="Click any transcript segment to reassign it to a different speaker for perfect accuracy."
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          Have more questions? This privacy-first approach ensures your meeting data remains secure and under your control.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
};
