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
  Stack,
  Paper,
} from '@mui/material';
import {
  Info as InfoIcon,
  AccessTime as TimeIcon,
  AttachMoney as CostIcon,
  FilePresent as FileIcon,
  Discount as DiscountIcon,
} from '@mui/icons-material';

interface CostEstimationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onTokenPurchaseClick?: () => void; // New prop to open token purchase dialog
  fileName: string;
  fileSize: string;
  estimatedDuration: number;
  requiredTokens: number;
  availableTokens: number;
  hasDiscount?: boolean;
  discountPercentage?: number;
}

const CostEstimationDialog: React.FC<CostEstimationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onTokenPurchaseClick,
  fileName,
  fileSize,
  estimatedDuration,
  requiredTokens,
  availableTokens,
  hasDiscount = false,
  discountPercentage,
}) => {
  const hasSufficientTokens = availableTokens >= requiredTokens;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <InfoIcon color="primary" />
          <Typography variant="h6">Processing Cost Estimation</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* File Information */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FileIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  File Details
                </Typography>
              </Stack>
              <Box sx={{ ml: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Name:</strong> {fileName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Size:</strong> {fileSize}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<TimeIcon />}
                    label={`~${estimatedDuration} minutes`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Typography variant="caption" color="text.secondary">
                    (estimated duration)
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Cost Breakdown */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CostIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Processing Cost
                </Typography>
              </Stack>
              
              <Box sx={{ ml: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    label={`${requiredTokens} tokens`}
                    color="primary"
                    variant="filled"
                  />
                  <Chip
                    label={`${availableTokens} available`}
                    color={hasSufficientTokens ? "success" : "warning"}
                    variant="outlined"
                  />
                </Stack>

                {hasDiscount && discountPercentage && (
                  <Alert severity="success" icon={<DiscountIcon />} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{discountPercentage}% volume discount</strong> applied for files over{' '}
                      {discountPercentage === 30 ? '60' : discountPercentage === 20 ? '45' : '30'} minutes
                    </Typography>
                  </Alert>
                )}

                <Typography variant="caption" color="text.secondary">
                  Tokens are consumed only after successful processing
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Stack spacing={1} width="100%" direction="row" justifyContent="space-between">
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Stack direction="row" spacing={1}>
            {!hasSufficientTokens && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  console.log('🔵 Buy Tokens button clicked!');
                  console.log('🔵 Button state:', {
                    hasSufficientTokens,
                    currentTokens: availableTokens,
                    requiredTokens: requiredTokens
                  });
                  
                  try {
                    console.log('🔵 Opening token purchase dialog...');
                    
                    // Close the current dialog and open the token purchase dialog
                    onClose();
                    
                    if (onTokenPurchaseClick) {
                      console.log('🔵 Calling onTokenPurchaseClick callback');
                      onTokenPurchaseClick();
                    } else {
                      console.warn('⚠️ onTokenPurchaseClick callback not provided');
                    }
                  } catch (error) {
                    console.error('❌ Error in Buy Tokens button handler:', error);
                  }
                }}
              >
                Buy Tokens
              </Button>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={!hasSufficientTokens}
            >
              {hasSufficientTokens ? 'Process File' : 'Insufficient Tokens'}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default CostEstimationDialog;