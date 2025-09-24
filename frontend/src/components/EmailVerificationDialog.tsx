import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { CheckCircle, Home, Email } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import EmailVerificationService from '../services/emailVerificationService';

const emailVerificationService = new EmailVerificationService();

const EmailVerificationDialog: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const { user, checkVerificationStatus, resendVerificationEmail } = useAuthStore();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to main app page
    if (!user) {
      navigate('/app');
      return;
    }

    const verifyToken = async () => {
      // If no token provided (e.g., redirected from login), show error state for unverified user
      if (!token) {
        setVerificationStatus('error');
        setError('Email verification required. Please check your email and click the verification link, or request a new one below.');
        return;
      }

      try {
        setVerificationStatus('verifying');
        
        // URL decode the token to handle Base64 characters (+, /, =)
        const decodedToken = decodeURIComponent(token);
        
        // Attempt to verify the token
        await emailVerificationService.verifyEmail(decodedToken);
        
        // Refresh user verification status
        await checkVerificationStatus();
        
        setVerificationStatus('success');
      } catch (error: any) {
        console.error('Email verification failed:', error);
        
        // Check if user is already verified
        if (error.message?.includes('already verified') || error.message?.includes('already confirmed')) {
          setVerificationStatus('already-verified');
        } else {
          setVerificationStatus('error');
          setError(error.message || 'Verification failed');
        }
      }
    };

    verifyToken();
  }, [token, checkVerificationStatus]);

  const handleContinueToApp = () => {
    navigate('/');
  };

  const handleClose = () => {
    navigate('/app');
  };

  const handleResendVerificationEmail = async () => {
    if (!user) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      // The error will be handled by the auth store and shown in the global error state
    } finally {
      setResendLoading(false);
    }
  };

  if (verificationStatus === 'verifying') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Verifying Your Email
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we verify your email address...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {verificationStatus === 'success' && (
          <>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              Email Verified Successfully!
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Your email address has been verified. You now have full access to all Meeting Summarizer features.
            </Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              Welcome to Meeting Summarizer! You can now:
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Upload and transcribe audio files</li>
                <li>Generate AI-powered meeting summaries</li>
                <li>Access your meeting history</li>
                <li>Save and share summaries</li>
              </ul>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={handleContinueToApp}
              >
                Continue to App
              </Button>
            </Box>
          </>
        )}

        {verificationStatus === 'already-verified' && (
          <>
            <CheckCircle sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="info.main">
              Already Verified
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Your email address is already verified. You have full access to all Meeting Summarizer features.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleContinueToApp}
            >
              Continue to App
            </Button>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <Typography variant="h4" gutterBottom color="error.main">
              {!token ? 'Email Verification Required' : 'Verification Failed'}
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              {!token 
                ? 'Your account is registered but your email address needs to be verified before you can access all features.'
                : 'We couldn\'t verify your email address. This may be due to an invalid or expired verification link.'
              }
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>
            )}
            
            {resendSuccess && (
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  New verification email sent successfully! Please check your inbox and click the new verification link.
                </Typography>
              </Alert>
            )}
            
            <Typography variant="body2" paragraph color="text.secondary">
              {!token 
                ? 'Please check your email for a verification link, or request a new one below if you haven\'t received it.'
                : 'You can request a new verification email below, or contact support if you continue to have issues.'
              }
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
                startIcon={resendLoading ? <CircularProgress size={16} /> : <Email />}
                sx={{ 
                  textTransform: 'none',
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              >
                {resendLoading ? 'Sending New Verification Email...' : 'Send New Verification Email'}
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleClose}
              >
                Close
              </Button>
            </Box>
          </>
        )}

        <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.disabled' }}>
          Logged in as: {user?.email}
        </Typography>
      </Paper>
    </Container>
  );
};

export default EmailVerificationDialog;