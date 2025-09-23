import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Close, Email, Refresh } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

interface EmailVerificationBannerProps {
  /** Whether to show a close button (X) */
  dismissible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Position variant - 'fixed' shows as overlay, 'static' shows inline */
  variant?: 'fixed' | 'static';
  /** Severity level affects color scheme */
  severity?: 'warning' | 'info';
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  dismissible = false,
  onDismiss,
  variant = 'static',
  severity = 'warning'
}) => {
  const { 
    user, 
    verificationPending, 
    verificationError,
    resendVerificationEmail,
    clearVerificationError 
  } = useAuthStore();

  // Don't show banner if user is already verified
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    }
  };

  const handleDismiss = () => {
    if (verificationError) {
      clearVerificationError();
    }
    onDismiss?.();
  };

  return (
    <Alert
      severity={severity}
      sx={{
        mb: variant === 'static' ? 2 : 0,
        ...(variant === 'fixed' && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderRadius: 0,
          boxShadow: 2
        })
      }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            size="small"
            onClick={handleResendEmail}
            disabled={verificationPending}
            startIcon={
              verificationPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Refresh />
              )
            }
          >
            {verificationPending ? 'Sending...' : 'Resend'}
          </Button>
          {dismissible && (
            <IconButton
              aria-label="dismiss"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <Close fontSize="inherit" />
            </IconButton>
          )}
        </Box>
      }
      icon={<Email />}
    >
      <AlertTitle>Email Verification Required</AlertTitle>
      <Typography variant="body2">
        Please check your email ({user?.email}) and click the verification link to access all features.
      </Typography>
      {verificationError && (
        <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
          <strong>Error:</strong> {verificationError}
        </Typography>
      )}
    </Alert>
  );
};

export default EmailVerificationBanner;