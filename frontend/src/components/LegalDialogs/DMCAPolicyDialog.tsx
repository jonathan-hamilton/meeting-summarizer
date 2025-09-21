/**
 * DMCA Policy Dialog
 * Shows DMCA Policy content in modal dialog
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
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
} from "@mui/icons-material";

interface DMCAPolicyDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DMCAPolicyDialog: React.FC<DMCAPolicyDialogProps> = ({
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
          DMCA Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Digital Millennium Copyright Act Compliance Policy
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 3 } }}>
          
          <Alert severity="info" icon={<GavelIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              Meeting Summary respects intellectual property rights and complies with the 
              Digital Millennium Copyright Act (DMCA). This policy outlines our procedures 
              for addressing copyright infringement claims.
            </Typography>
          </Alert>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Reporting Copyright Infringement</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                If you believe your copyrighted work has been infringed through our service, 
                please provide our designated agent with the following information:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Physical or electronic signature of the copyright owner or authorized representative" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Identification of the copyrighted work claimed to be infringed" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Identification of the infringing material and its location on our service" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Your contact information (address, phone, email)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Statement of good faith belief that use is not authorized" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Statement that the notification is accurate and you are authorized to act" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Designated DMCA Agent</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>Copyright Agent:</strong><br />
                Jonathan Hamilton<br />
                Vertec Solutions LLC<br />
                Email: dmca@meeting-summary.io<br />
                Phone: [To be provided upon DMCA agent registration]<br />
                <br />
                <em>Note: This agent information will be filed with the US Copyright Office 
                upon production deployment.</em>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Takedown Procedure</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Upon receiving a valid DMCA notice, we will:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Remove or disable access to the allegedly infringing material within 24-72 hours" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Notify the user who uploaded the content" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Provide information about the counter-notification process" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Document the takedown for our records" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Counter-Notification Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                If you believe your content was wrongly removed, you may file a counter-notification 
                containing:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Your physical or electronic signature" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Identification of the removed material and its former location" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Statement under penalty of perjury that removal was due to mistake or misidentification" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Your contact information and consent to jurisdiction" />
                </ListItem>
              </List>
              <Typography paragraph>
                We will restore the content within 10-14 business days unless the original 
                complainant files a court action.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Repeat Infringer Policy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                We maintain a policy of terminating accounts of users who are repeat copyright 
                infringers. Our procedure includes:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• First violation: Warning and content removal" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Second violation: Temporary account suspension" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Third violation: Permanent account termination" />
                </ListItem>
              </List>
              <Typography paragraph>
                We reserve the right to terminate accounts immediately for egregious violations 
                or when required by law.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">False Claims and Misrepresentation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                <strong>Warning:</strong> Filing false DMCA notices or counter-notifications may result in:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Liability for damages under Section 512(f) of the DMCA" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Perjury charges for false statements" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Attorney fees and court costs" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Termination of your account" />
                </ListItem>
              </List>
              <Typography paragraph>
                Only file notices if you have a good faith belief in the validity of your claim.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Safe Harbor Compliance</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Meeting Summary qualifies for safe harbor protection under DMCA Section 512(c) as we:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Do not have actual knowledge of infringing activity" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Act expeditiously to remove infringing material when notified" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Have designated an agent for receiving infringement notices" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Implement a repeat infringer termination policy" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Do not receive direct financial benefit from infringing activity" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            <strong>Contact Information:</strong><br />
            DMCA Agent: Jonathan Hamilton<br />
            Vertec Solutions LLC<br />
            Email: dmca@meeting-summary.io<br />
            General Support: support@meeting-summary.io<br />
            <br />
            This policy is effective as of September 21, 2025, and may be updated as needed 
            to maintain compliance with applicable laws.
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