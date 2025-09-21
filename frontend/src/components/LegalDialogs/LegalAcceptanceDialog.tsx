/**
 * Legal Acceptance Dialog (S6.7)
 * Combined Terms of Service and Liability Disclaimer for first-time users
 * Replaces the existing Privacy Policy dialog for initial legal acceptance
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
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useAppMode } from "../../contexts/AppModeContext";

const LEGAL_ACCEPTANCE_KEY = "meeting-summary-legal-accepted";

interface LegalAcceptanceDialogProps {
  forceShow?: boolean;
  onAccepted?: () => void;
}

/**
 * Legal Acceptance Dialog Component
 * Shows Terms of Service and Liability Disclaimer for first-time users
 * Requires explicit acceptance before proceeding
 */
export const LegalAcceptanceDialog: React.FC<LegalAcceptanceDialogProps> = ({
  forceShow = false,
  onAccepted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadLiability, setHasReadLiability] = useState(false);
  const { isProduction } = useAppMode();

  /**
   * Check if legal documents have been accepted before
   */
  const hasAcceptedLegal = (): boolean => {
    try {
      return localStorage.getItem(LEGAL_ACCEPTANCE_KEY) === 'true';
    } catch (error) {
      console.warn('Unable to access localStorage for legal acceptance check:', error);
      return false;
    }
  };

  /**
   * Mark legal documents as accepted
   */
  const markLegalAccepted = (): void => {
    try {
      localStorage.setItem(LEGAL_ACCEPTANCE_KEY, 'true');
    } catch (error) {
      console.warn('Unable to save legal acceptance to localStorage:', error);
    }
  };

  /**
   * Handle acceptance - user must acknowledge both documents
   */
  const handleAccept = (): void => {
    if (!hasReadTerms || !hasReadLiability) {
      return; // Prevent acceptance if not both acknowledged
    }

    markLegalAccepted();
    setIsOpen(false);
    onAccepted?.();
  };

  /**
   * Check if dialog should show on component mount
   */
  useEffect(() => {
    if (forceShow || (isProduction && !hasAcceptedLegal())) {
      setIsOpen(true);
    }
  }, [forceShow, isProduction]);

  const canAccept = hasReadTerms && hasReadLiability;

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => {}} // Prevent closing without acceptance
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon color="primary" />
          <Typography variant="h5" component="h2">
            Legal Agreement Required
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please review and accept our Terms of Service and Liability Disclaimer to continue
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 3 } }}>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Required:</strong> You must review and acknowledge both documents below 
              before using Meeting Summary services.
            </Typography>
          </Alert>

          {/* Terms of Service Section */}
          <Accordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: hasReadTerms ? 'action.selected' : 'inherit',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Terms of Service
                {hasReadTerms && <Typography variant="body2" color="success.main">(✓ Reviewed)</Typography>}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                <Typography variant="body2" paragraph>
                  <strong>Service Overview:</strong> Meeting Summary provides AI-powered transcription 
                  and summarization services using OpenAI Whisper and GPT models.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Payment & Billing:</strong> Token-based pricing model with Stripe payment processing. 
                  Refunds available for failed processing or service outages.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Data Storage:</strong> We store your files and transcripts for 365 days with 
                  30-day deletion warnings. All data is encrypted and securely stored.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Service Level Agreement:</strong> 99.9% uptime commitment with service credits:
                  10% for 99.0-99.9% uptime, 30% for 95.0-99.0% uptime, 100% for below 95.0% uptime.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Acceptable Use:</strong> No illegal activities, copyright infringement, 
                  or violation of others' rights. We reserve the right to terminate violating accounts.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Limitation of Liability:</strong> Our liability is limited to amounts paid 
                  in the preceding 12 months. No liability for consequential or punitive damages.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Governing Law:</strong> Delaware, United States law applies to these terms.
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasReadTerms}
                    onChange={(e) => setHasReadTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label="I have read and understand the Terms of Service"
              />
            </AccordionDetails>
          </Accordion>

          {/* Liability Disclaimer Section */}
          <Accordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: hasReadLiability ? 'action.selected' : 'inherit',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Liability Disclaimer
                {hasReadLiability && <Typography variant="body2" color="success.main">(✓ Reviewed)</Typography>}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> This service uses AI which may contain errors. 
                  Always verify important information independently.
                </Typography>
              </Alert>
              
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                <Typography variant="body2" paragraph>
                  <strong>AI Accuracy Disclaimer:</strong> Our AI models may produce transcription errors, 
                  misinterpretations, omissions, or incorrect speaker identification. Results are not guaranteed 
                  to be 100% accurate.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Business Decision Risk:</strong> AI-generated content should not be the sole basis 
                  for important business decisions. You must independently verify critical information before taking action.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>No Professional Advice:</strong> Our service does not provide legal, medical, 
                  financial, or professional advice. AI output is not certified or legally binding.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Limitation of Liability:</strong> Vertec Solutions LLC is not liable for damages 
                  arising from AI-generated content, business decisions based on service output, 
                  lost profits, data issues, or service interruptions.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>User Responsibility:</strong> You agree to review and verify all AI content, 
                  use appropriate judgment, obtain professional advice for critical matters, and accept 
                  full responsibility for your use of the service.
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasReadLiability}
                    onChange={(e) => setHasReadLiability(e.target.checked)}
                    color="primary"
                  />
                }
                label="I understand the AI limitations and accept the liability disclaimer"
              />
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            By clicking "Agree and Consent" below, you acknowledge that you have read, 
            understood, and agree to be bound by both the Terms of Service and Liability Disclaimer.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}>
        <Button 
          onClick={handleAccept}
          variant="contained" 
          fullWidth
          disabled={!canAccept}
          size="large"
          sx={{ py: 1.5 }}
        >
          {canAccept ? 'Agree and Consent' : 'Please review both documents above'}
        </Button>
        
        <Typography variant="caption" color="text.secondary" align="center">
          You must accept these terms to use Meeting Summary services
        </Typography>
      </DialogActions>
    </Dialog>
  );
};