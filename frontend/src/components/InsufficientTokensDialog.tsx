import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Error as ErrorIcon,
  AccountBalanceWallet as WalletIcon,
  AccessTime as TimeIcon,
  ShoppingCart as ShoppingCartIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';

interface InsufficientTokensDialogProps {
  open: boolean;
  onClose: () => void;
  requiredTokens: number;
  availableTokens: number;
  estimatedDuration: number;
  fileName?: string;
  onPurchaseTokens?: () => void;
  onTrySmaller?: () => void;
}

const InsufficientTokensDialog: React.FC<InsufficientTokensDialogProps> = ({
  open,
  onClose,
  requiredTokens,
  availableTokens,
  estimatedDuration,
  fileName,
  onPurchaseTokens,
  onTrySmaller,
}) => {
  const tokenDeficit = requiredTokens - availableTokens;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <ErrorIcon color="warning" />
          <Typography variant="h6">Insufficient Tokens</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2}>
          {/* File Information */}
          {fileName && (
            <Alert severity="info" icon={<UploadIcon />}>
              <Typography variant="body2">
                <strong>File:</strong> {fileName}
              </Typography>
            </Alert>
          )}

          {/* Token Balance Information */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Token Requirements
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <Chip
                icon={<WalletIcon />}
                label={`Available: ${availableTokens.toFixed(2)}`}
                color={availableTokens > 0 ? "primary" : "default"}
                variant="outlined"
              />
              <Chip
                icon={<ErrorIcon />}
                label={`Required: ${requiredTokens}`}
                color="error"
                variant="outlined"
              />
            </Stack>
            
            <Alert severity="warning">
              <Typography variant="body2">
                You need <strong>{tokenDeficit}</strong> more token{tokenDeficit !== 1 ? 's' : ''} to process this file.
              </Typography>
            </Alert>
          </Box>

          {/* File Details */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Processing Details
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<TimeIcon />}
                label={`~${estimatedDuration} minutes`}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Large files require batch processing with token consumption
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Solutions */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              What would you like to do?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have a few options to proceed:
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Stack spacing={1} width="100%">
          {/* Primary action buttons */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {onPurchaseTokens && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ShoppingCartIcon />}
                onClick={() => {
                  onPurchaseTokens();
                  onClose();
                }}
              >
                Purchase Tokens
              </Button>
            )}
            
            {onTrySmaller && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={() => {
                  onTrySmaller();
                  onClose();
                }}
              >
                Try Smaller File
              </Button>
            )}
          </Stack>

          {/* Secondary actions */}
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Files under 5 minutes don't require tokens
            </Typography>
            <Button
              variant="text"
              color="inherit"
              onClick={onClose}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default InsufficientTokensDialog;
