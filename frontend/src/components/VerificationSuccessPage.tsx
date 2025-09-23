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
import { CheckCircle, Home, ArrowBack } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import EmailVerificationService from '../services/emailVerificationService';

const emailVerificationService = new EmailVerificationService();

const VerificationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const { user, checkVerificationStatus } = useAuthStore();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        setVerificationStatus('verifying');
        
        // Attempt to verify the token
        await emailVerificationService.verifyEmail(token);
        
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

  const handleBackToApp = () => {
    navigate(-1);
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
              Verification Failed
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We couldn't verify your email address. This may be due to an invalid or expired verification link.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" paragraph color="text.secondary">
              Please try requesting a new verification email from your account settings, or contact support if you continue to have issues.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBackToApp}
              >
                Back to App
              </Button>
              <Button
                variant="contained"
                onClick={handleContinueToApp}
              >
                Continue Anyway
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

export default VerificationSuccessPage;