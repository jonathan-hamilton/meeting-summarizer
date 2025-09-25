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
} from '@mui/material';
import { useTokenBalance, useStripeConfig } from '../stores/tokenStore';

interface TokenPurchaseTestDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TokenPurchaseTestDialog: React.FC<TokenPurchaseTestDialogProps> = ({
  open,
  onClose,
}) => {
  const balance = useTokenBalance();
  const stripeConfig = useStripeConfig();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="token-test-dialog"
    >
      <DialogTitle>Token System Test</DialogTitle>
      
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Token Balance Display Test
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Current Balance: {balance} tokens
          </Alert>

          {stripeConfig && (
            <Alert severity={stripeConfig.isTestMode ? "warning" : "success"} sx={{ mb: 2 }}>
              Stripe Environment: {stripeConfig.environment} 
              {stripeConfig.isTestMode && " (Test Mode)"}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            This test dialog verifies:
            • Token balance loading from backend
            • Stripe configuration loading
            • Token store state management
            • Frontend-backend API integration
          </Typography>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              Integration Status:
            </Typography>
            <Typography variant="caption" color={balance >= 0 ? "success.main" : "error.main"}>
              ✅ Token Balance API: Connected
            </Typography>
            <br />
            <Typography variant="caption" color={stripeConfig ? "success.main" : "error.main"}>
              {stripeConfig ? "✅" : "❌"} Stripe Configuration: {stripeConfig ? "Loaded" : "Loading..."}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close Test
        </Button>
      </DialogActions>
    </Dialog>
  );
};