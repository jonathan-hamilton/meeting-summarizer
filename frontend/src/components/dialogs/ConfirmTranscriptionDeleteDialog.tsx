import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Warning } from "@mui/icons-material";

interface ConfirmTranscriptionDeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmTranscriptionDeleteDialog: React.FC<ConfirmTranscriptionDeleteDialogProps> = React.memo(
  ({ open, onConfirm, onCancel }) => (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Remove Transcription
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to remove this transcription? This will:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li">Clear all transcript data</Typography>
          <Typography component="li">Remove all speaker mappings</Typography>
          <Typography component="li">Reset the page to its original state</Typography>
        </Box>
        <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Remove Transcription
        </Button>
      </DialogActions>
    </Dialog>
  )
);

ConfirmTranscriptionDeleteDialog.displayName = "ConfirmTranscriptionDeleteDialog";

export default ConfirmTranscriptionDeleteDialog;
