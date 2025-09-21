/**
 * Privacy Policy Dialog
 * Shows Privacy Policy content in modal dialog (for footer access)
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
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

interface PrivacyPolicyFooterDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PrivacyPolicyFooterDialog: React.FC<PrivacyPolicyFooterDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="h2">
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Effective Date: September 21, 2025
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 3 } }}>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">1. Information We Collect</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>Account Information:</strong> Email address, name, and authentication credentials 
                when you create an account.
              </Typography>
              <Typography paragraph>
                <strong>Audio Files:</strong> Meeting recordings and audio files you upload for transcription 
                and summarization.
              </Typography>
              <Typography paragraph>
                <strong>Generated Content:</strong> AI-generated transcripts, summaries, and analysis 
                produced from your uploaded files.
              </Typography>
              <Typography paragraph>
                <strong>Usage Data:</strong> Service usage patterns, feature interactions, and performance metrics.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">2. How We Use Your Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Provide transcription and summarization services" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Maintain your meeting history and account" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Process payments and manage billing" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Improve our AI models and service quality" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Send service-related notifications" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Comply with legal obligations" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">3. Data Storage and Security</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>Storage Period:</strong> We store your data for 365 days to provide persistent 
                access to your meeting history. Users receive 30-day deletion warnings.
              </Typography>
              <Typography paragraph>
                <strong>Security Measures:</strong> Enterprise-grade encryption at rest and in transit, 
                secure authentication, and regular security audits.
              </Typography>
              <Typography paragraph>
                <strong>Third-Party Processing:</strong> Your audio files may be processed by OpenAI's 
                services for transcription and summarization under their enterprise data processing agreement.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">4. Data Sharing and Disclosure</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                We do not sell or rent your personal information. We may share data only in these circumstances:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• With OpenAI for AI processing services (under enterprise agreement)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• With Stripe for payment processing" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• When required by law or legal process" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• To protect our rights or prevent fraud" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• With your explicit consent" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">5. Your Privacy Rights</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>GDPR Rights (EU residents):</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Access: Request copies of your personal data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Rectification: Correct inaccurate information" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Erasure: Request deletion of your data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Portability: Export your data in machine-readable format" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Restriction: Limit processing of your data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Objection: Object to data processing" />
                </ListItem>
              </List>
              <Typography paragraph>
                <strong>CCPA Rights (California residents):</strong> Right to know, delete, and opt-out 
                of sale (though we don't sell personal information).
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">6. Cookies and Tracking</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                We use essential cookies for authentication and service functionality. We do not use 
                tracking cookies or third-party analytics beyond basic service operation.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">7. International Data Transfers</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Data is processed in the United States with appropriate safeguards for international 
                transfers under applicable data protection laws.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">8. Contact and Data Protection Officer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                For privacy-related questions, data requests, or to exercise your rights, contact our 
                Data Protection Officer at privacy@meeting-summary.io.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            <strong>Contact Information:</strong><br />
            Vertec Solutions LLC<br />
            Email: support@meeting-summary.io<br />
            Privacy Officer: privacy@meeting-summary.io<br />
            <br />
            This policy may be updated periodically. Material changes will be communicated via email 
            or service notification.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};