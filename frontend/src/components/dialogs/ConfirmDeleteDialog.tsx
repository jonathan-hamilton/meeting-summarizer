import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import FocusTrap from 'focus-trap-react';
import { useAccessibilityStore } from '../../stores/accessibilityStore';

interface ConfirmDeleteDialogProps {
  open: boolean;
  speakerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = React.memo(
  ({ open, speakerName, onConfirm, onCancel }) => {
    const { openModal, closeModal, announceModalOpen, announceModalClose } = useAccessibilityStore();

    // Modal lifecycle management
    React.useEffect(() => {
      if (open) {
        openModal('confirmDelete');
        announceModalOpen('Confirm Speaker Removal');
      } else {
        closeModal('confirmDelete');
        announceModalClose('Confirm Speaker Removal');
      }
      
      // Cleanup on unmount
      return () => {
        if (open) {
          closeModal('confirmDelete');
        }
      };
    }, [open, openModal, closeModal, announceModalOpen, announceModalClose]);

    return (
      <Dialog 
        open={open} 
        onClose={onCancel} 
        maxWidth="sm" 
        fullWidth
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
      >
        <FocusTrap 
          active={open}
          focusTrapOptions={{
            allowOutsideClick: false,
            escapeDeactivates: true,
          }}
        >
          <div>
        <DialogTitle>Confirm Speaker Removal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{speakerName || "this speaker"}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm} color="error" variant="contained">
            Remove Speaker
          </Button>
        </DialogActions>
          </div>
        </FocusTrap>
      </Dialog>
    );
  }
);

ConfirmDeleteDialog.displayName = "ConfirmDeleteDialog";

export default ConfirmDeleteDialog;
