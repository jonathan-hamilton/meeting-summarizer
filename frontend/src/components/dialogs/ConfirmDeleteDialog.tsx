import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface ConfirmDeleteDialogProps {
  open: boolean;
  speakerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = React.memo(
  ({ open, speakerName, onConfirm, onCancel }) => (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
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
    </Dialog>
  )
);

ConfirmDeleteDialog.displayName = "ConfirmDeleteDialog";

export default ConfirmDeleteDialog;
