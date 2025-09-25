import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  AccountBalance as TokenIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useTokenStore, useStripeConfig } from '../stores/tokenStore';
import { useAuthStore } from '../stores/authStore';
import { TOKEN_PACKAGES } from '../types/tokens';
import type { TokenPackage, PaymentResult } from '../types/tokens';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029';

interface TokenPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
}

// Payment form component that uses Stripe Elements
const PaymentForm: React.FC<{
  selectedPackage: TokenPackage;
  onPaymentComplete: (result: PaymentResult) => void;
  onCancel: () => void;
}> = ({ selectedPackage, onPaymentComplete, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentComplete({
          success: true,
          paymentIntentId: paymentIntent.id,
          tokensPurchased: selectedPackage.tokenCount,
          amountPaid: selectedPackage.priceUsd,
          packageName: selectedPackage.name
        });
      } else {
        setPaymentError('Payment was not completed');
        setIsProcessing(false);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {paymentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {paymentError}
        </Alert>
      )}

      <PaymentElement />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isProcessing}
          sx={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : <PaymentIcon />}
          sx={{ flex: 1 }}
        >
          {isProcessing ? 'Processing...' : `Pay $${selectedPackage.priceUsd}`}
        </Button>
      </Box>
    </Box>
  );
};

export const TokenPurchaseDialog: React.FC<TokenPurchaseDialogProps> = ({
  open,
  onClose,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'complete' | 'error'>('select');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  const stripeConfig = useStripeConfig();
  const { accessToken, user } = useAuthStore();
  const { 
    isPurchaseInProgress,
    startPurchase,
    completePurchase,
    cancelPurchase,
    loadStripeConfig,
    error: tokenStoreError
  } = useTokenStore();

  // Initialize Stripe when config is available
  useEffect(() => {
    if (stripeConfig?.publishableKey) {
      setStripePromise(loadStripe(stripeConfig.publishableKey));
    }
  }, [stripeConfig]);

  // Load Stripe config when dialog opens
  useEffect(() => {
    if (open && !stripeConfig) {
      loadStripeConfig();
    }
  }, [open, stripeConfig, loadStripeConfig]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPackage(null);
      setPaymentStep('select');
      setPaymentResult(null);
      setClientSecret(null);
      if (isPurchaseInProgress) {
        cancelPurchase();
      }
    }
  }, [open, isPurchaseInProgress, cancelPurchase]);

  const handlePackageSelect = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    startPurchase(pkg.tokenCount);

    try {
      // Create payment intent
      const url = `${API_BASE_URL}/api/Payment/create-payment-intent`;
      console.log('🚀 Making payment intent request to:', url);
      console.log('🚀 API_BASE_URL:', API_BASE_URL);
      console.log('🚀 User:', user);
      console.log('🚀 Request body:', { 
        userId: user?.id,
        email: user?.email,
        tokenCount: pkg.tokenCount, 
        amount: pkg.priceUsd
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          tokenCount: pkg.tokenCount,
          amount: pkg.priceUsd, // Amount in USD (not cents for this API)
        }),
      });

      console.log('🚀 Response status:', response.status);
      console.log('🚀 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚀 Response error text:', errorText);
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentStep('payment');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentStep('error');
      setPaymentResult({
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to initialize payment'
      });
    }
  };

  const handlePaymentComplete = (result: PaymentResult) => {
    setPaymentResult(result);
    completePurchase(result);
    
    if (result.success) {
      setPaymentStep('complete');
    } else {
      setPaymentStep('error');
    }
  };

  const handleClose = () => {
    if (isPurchaseInProgress && paymentStep === 'payment') {
      cancelPurchase();
    }
    onClose();
  };

  const renderPackageSelection = () => (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TokenIcon color="primary" />
          Choose Token Package
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a token package to purchase. Tokens are used for meeting transcription and AI-powered summaries.
          {stripeConfig && (
            <Chip 
              label={stripeConfig.environment}
              size="small" 
              color={stripeConfig.isTestMode ? "warning" : "success"}
              sx={{ ml: 1 }}
            />
          )}
        </Typography>

        <Grid container spacing={2}>
          {TOKEN_PACKAGES.map((pkg) => (
            <Grid item xs={12} sm={6} key={pkg.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={(e) => {
                  console.log('🎯 Card clicked!', pkg);
                  handlePackageSelect(pkg);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      {pkg.name}
                    </Typography>
                    {pkg.isPopular && (
                      <Chip label="Popular" color="primary" size="small" />
                    )}
                  </Box>
                  
                  <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                    ${pkg.priceUsd}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {pkg.tokenCount.toLocaleString()} tokens
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ${(pkg.priceUsd / pkg.tokenCount).toFixed(4)} per token
                  </Typography>
                  
                  <Typography variant="body2">
                    {pkg.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {tokenStoreError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {tokenStoreError}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </>
  );

  const renderPaymentForm = () => (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            Complete Purchase
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {selectedPackage && (
          <>
            <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Package:</Typography>
                  <Typography fontWeight="bold">{selectedPackage.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tokens:</Typography>
                  <Typography>{selectedPackage.tokenCount.toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ${selectedPackage.priceUsd}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {stripePromise && clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#1976d2',
                    }
                  }
                }}
              >
                <PaymentForm
                  selectedPackage={selectedPackage}
                  onPaymentComplete={handlePaymentComplete}
                  onCancel={handleClose}
                />
              </Elements>
            )}
          </>
        )}
      </DialogContent>
    </>
  );

  const renderCompletePage = () => (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon color="success" />
          Purchase Complete!
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="success" sx={{ mb: 3 }}>
          Your token purchase was successful!
        </Alert>

        {paymentResult && selectedPackage && (
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Receipt
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Package" 
                    secondary={selectedPackage.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Tokens Purchased" 
                    secondary={`${selectedPackage.tokenCount.toLocaleString()} tokens`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Amount Paid" 
                    secondary={`$${selectedPackage.priceUsd}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Payment ID" 
                    secondary={paymentResult.paymentIntentId}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          Continue
        </Button>
      </DialogActions>
    </>
  );

  const renderErrorPage = () => (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          Purchase Failed
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {paymentResult?.errorMessage || 'An error occurred during payment processing.'}
        </Alert>
        
        <Typography variant="body2" color="text.secondary">
          Your payment was not processed. Please try again or contact support if the issue persists.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setPaymentStep('select')} variant="outlined">
          Try Again
        </Button>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="token-purchase-dialog"
    >
      {paymentStep === 'select' && renderPackageSelection()}
      {paymentStep === 'payment' && renderPaymentForm()}
      {paymentStep === 'complete' && renderCompletePage()}
      {paymentStep === 'error' && renderErrorPage()}
    </Dialog>
  );
};