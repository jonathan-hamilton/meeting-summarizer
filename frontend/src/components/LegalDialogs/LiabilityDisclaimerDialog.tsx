/**
 * Liability Disclaimer Dialog
 * Shows Liability Disclaimer content in modal dialog
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
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

interface LiabilityDisclaimerDialogProps {
  open: boolean;
  onClose: () => void;
}

export const LiabilityDisclaimerDialog: React.FC<LiabilityDisclaimerDialogProps> = ({
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
          Liability Disclaimer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Effective Date: September 21, 2025
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 3 } }}>
          
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Important Notice:</strong> This service uses artificial intelligence for transcription 
              and summarization. AI-generated content may contain errors, inaccuracies, or omissions. 
              Always verify important information independently.
            </Typography>
          </Alert>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">AI Accuracy Disclaimer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Our transcription and summarization services use advanced artificial intelligence models, 
                including OpenAI Whisper and GPT. While these technologies are highly sophisticated, 
                they are not infallible and may produce:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Transcription errors, especially with accents, technical terms, or poor audio quality" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Misinterpretation of context or meaning in summaries" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Omission of important details or nuances" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Incorrect identification of speakers or topics" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Business Decision Risk</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>You acknowledge and agree that:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• AI-generated transcripts and summaries should not be used as the sole basis for important business decisions" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• You will independently verify any critical information before taking action" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• We are not responsible for decisions made based on AI-generated content" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• The service is provided 'as-is' without guarantees of accuracy or completeness" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Limitation of Liability</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </Typography>
              <Typography paragraph>
                Vertec Solutions LLC, its officers, directors, employees, and agents shall not be liable 
                for any direct, indirect, incidental, special, consequential, or punitive damages arising 
                from or related to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Use of or reliance on AI-generated transcripts or summaries" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Business decisions made based on service output" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Lost profits, revenue, or business opportunities" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Data loss, corruption, or unauthorized access" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Service interruptions or technical failures" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Professional Advice Disclaimer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Our service provides general transcription and summarization capabilities only. 
                The AI-generated content does not constitute:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Legal, medical, financial, or professional advice" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Certified or legally binding transcripts" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Professional interpretation or analysis" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Substitute for human expertise or judgment" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">User Responsibility</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                By using our service, you agree to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Review and verify all AI-generated content before use" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Use appropriate judgment when acting on summarized information" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Obtain professional advice for critical matters" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Accept full responsibility for your use of the service" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            <strong>Contact Information:</strong><br />
            Vertec Solutions LLC<br />
            Email: support@meeting-summary.io<br />
            <br />
            For questions about this disclaimer, please contact us at the above email address.
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