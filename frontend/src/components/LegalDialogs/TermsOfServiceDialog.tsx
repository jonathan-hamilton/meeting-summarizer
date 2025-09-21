/**
 * Terms of Service Dialog
 * Shows Terms of Service content in modal dialog
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

interface TermsOfServiceDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TermsOfServiceDialog: React.FC<TermsOfServiceDialogProps> = ({
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
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Effective Date: September 21, 2025
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 3 } }}>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">1. Service Overview</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Meeting Summary provides AI-powered transcription and summarization services for audio files. 
                Our service uses OpenAI Whisper for transcription and GPT models for intelligent summarization.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">2. User Accounts and Registration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                You must create an account to access our services. You are responsible for maintaining 
                the confidentiality of your account credentials and for all activities under your account.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">3. Payment and Billing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Our services operate on a token-based pricing model. Tokens are purchased in advance 
                and consumed based on processing time and AI model usage. All payments are processed 
                securely through Stripe.
              </Typography>
              <Typography paragraph>
                <strong>Refund Policy:</strong> Refunds may be provided for failed processing or 
                service outages as outlined in our refund policy.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">4. Data Storage and Retention</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                We store your uploaded audio files and generated transcripts for 365 days to provide 
                persistent access to your meeting history. After this period, data is automatically deleted.
              </Typography>
              <Typography paragraph>
                Users will receive notifications 30 days before data deletion and may download their 
                content before expiration.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">5. Service Level Agreement</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                We commit to 99.9% service availability on a monthly basis. In case of service outages:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 10% service credit for 99.0-99.9% uptime" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 30% service credit for 95.0-99.0% uptime" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 100% service credit for below 95.0% uptime" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">6. Acceptable Use</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                You may not use our service for illegal activities, to infringe copyrights, 
                or to violate the rights of others. We reserve the right to terminate accounts 
                that violate these terms.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">7. Intellectual Property</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                You retain ownership of your uploaded content. We obtain only the necessary rights 
                to process your files and provide our services. Our AI models and software remain 
                our intellectual property.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">8. Limitation of Liability</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Our liability is limited to the amount paid for services in the preceding 12 months. 
                We are not liable for consequential, incidental, or punitive damages.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">9. Termination</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Either party may terminate this agreement at any time. Upon termination, 
                you will lose access to the service and your data will be deleted according 
                to our retention policy.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">10. Governing Law</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                These terms are governed by the laws of Delaware, United States. 
                Any disputes will be resolved in Delaware state courts.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            <strong>Contact Information:</strong><br />
            Vertec Solutions LLC<br />
            Email: support@meeting-summary.io<br />
            <br />
            For questions about these Terms of Service, please contact us at the above email address.
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