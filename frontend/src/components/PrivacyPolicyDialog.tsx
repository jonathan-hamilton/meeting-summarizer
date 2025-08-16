/**
 * Privacy Policy Dialog (S3.1)
 * Shows privacy policy on first visit in production environment
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useEnvironment } from "../contexts/EnvironmentProvider";

const PRIVACY_POLICY_KEY = 'meetingSummarizer_privacyPolicyAccepted';

interface PrivacyPolicyDialogProps {
  /**
   * Force show dialog (for testing/preview)
   */
  forceShow?: boolean;
  /**
   * Callback when policy is accepted
   */
  onAccepted?: () => void;
}

/**
 * Privacy policy dialog that appears once per browser on first visit in production
 */
export const PrivacyPolicyDialog: React.FC<PrivacyPolicyDialogProps> = ({
  forceShow = false,
  onAccepted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isProductionMode } = useEnvironment();

  /**
   * Check if privacy policy has been accepted before
   */
  const hasAcceptedPolicy = (): boolean => {
    try {
      return localStorage.getItem(PRIVACY_POLICY_KEY) === 'true';
    } catch (error) {
      console.warn('Unable to access localStorage for privacy policy check:', error);
      return false;
    }
  };

  /**
   * Mark privacy policy as accepted
   */
  const markPolicyAccepted = (): void => {
    try {
      localStorage.setItem(PRIVACY_POLICY_KEY, 'true');
    } catch (error) {
      console.warn('Unable to save privacy policy acceptance to localStorage:', error);
    }
  };

  /**
   * Determine if dialog should be shown
   */
  useEffect(() => {
    const shouldShow = forceShow || (isProductionMode && !hasAcceptedPolicy());
    setIsOpen(shouldShow);
  }, [forceShow, isProductionMode]);

  /**
   * Handle policy acceptance
   */
  const handleAccept = () => {
    markPolicyAccepted();
    setIsOpen(false);
    onAccepted?.();
  };

  return (
    <Dialog
      open={isOpen}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="span">
            Privacy & Data Handling Policy
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" icon={<SecurityIcon />}>
            <Typography variant="body1" gutterBottom>
              <strong>Your Privacy is Protected</strong>
            </Typography>
            <Typography variant="body2">
              Meeting Summarizer uses a privacy-first approach with session-only data storage. 
              Your meeting data never leaves your browser and is automatically deleted when you close the tab.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Core Privacy Principles */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Core Privacy Principles
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="No Permanent Storage"
                secondary="Your meeting data is never saved to our servers or databases"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Session-Only Data"
                secondary="All data exists only in your browser session and is automatically cleared"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Automatic Cleanup"
                secondary="Data is automatically deleted when you close your browser tab or after 2 hours of inactivity"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Local Processing"
                secondary="All speaker assignments and modifications happen locally in your browser"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Detailed Information */}
        <Box sx={{ mb: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <StorageIcon />
                <Typography variant="subtitle1">Data Storage & Handling</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>What data is stored:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Speaker name assignments and modifications" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Session activity timestamps" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Temporary transcript processing data" />
                </ListItem>
              </List>
              <Typography variant="body2" paragraph>
                <strong>Where data is stored:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Browser sessionStorage (cleared when tab closes)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Browser memory (cleared when page refreshes)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• No server-side storage or databases" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon />
                <Typography variant="subtitle1">Session Management</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Your session automatically expires after 2 hours of inactivity. You'll receive 
                warnings 5 minutes before expiration with options to extend your session.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Session features:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 2-hour automatic timeout" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Warning notifications before expiry" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Session extension options" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Manual data clearing available" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <DeleteIcon />
                <Typography variant="subtitle1">Data Deletion</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Your data is automatically deleted in the following scenarios:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• When you close your browser tab" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• After 2 hours of inactivity" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• When you refresh the page" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• When you manually clear session data" />
                </ListItem>
              </List>
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                No recovery is possible once data is deleted - this ensures complete privacy protection.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contact Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Questions about this policy?</strong> This privacy-first approach ensures your meeting 
            data remains completely private and under your control. By using this application, you 
            acknowledge that all data processing happens locally in your browser with no permanent storage.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleAccept}
          variant="contained"
          size="large"
          fullWidth
          startIcon={<CheckIcon />}
        >
          I Understand & Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyDialog;
