import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Token as TokenIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useUserProfileStore, useUserProfileDialogState, useUserProfileDialogClose } from '../stores/userProfileStore';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { UserProfileForm } from './UserProfileForm';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import FocusTrap from 'focus-trap-react';

export const UserProfileDialog: React.FC = () => {
  const isOpen = useUserProfileDialogState();
  const close = useUserProfileDialogClose();
  const profile = useUserProfileStore((state) => state.profile);
  const stats = useUserProfileStore((state) => state.stats);
  const isLoading = useUserProfileStore((state) => state.isLoading);
  const error = useUserProfileStore((state) => state.error);
  
  // Get authenticated user from auth store
  const authUser = useAuthStore((state) => state.user);
  const { resendVerificationEmail } = useAuthStore();
  
  // Get current token balance from token store (this updates after transactions)
  const currentTokenBalance = useTokenStore((state) => state.balance);
  
  // Get actions separately to avoid re-renders
  const setProfile = useUserProfileStore((state) => state.setProfile);
  const setError = useUserProfileStore((state) => state.setError);
  
  // Accessibility store for modal management
  const { openModal, closeModal, announceModalOpen, announceModalClose } = useAccessibilityStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // TODO: Add function to load additional user stats from API when endpoints are available

  // Clear any test profile data when component mounts if we have authenticated user
  useEffect(() => {
    if (authUser && profile && profile.email === 'demo@meetingsummary.io') {
      // Clear test profile so we use auth user data instead
      setProfile(null);
    }
  }, [authUser, profile, setProfile]);

  // Modal lifecycle management
  useEffect(() => {
    if (isOpen) {
      openModal('userProfile');
      announceModalOpen('User Profile Settings');
    } else {
      closeModal('userProfile');
      announceModalClose('User Profile Settings');
    }
    
    // Cleanup on unmount
    return () => {
      if (isOpen) {
        closeModal('userProfile');
      }
    };
  }, [isOpen, openModal, closeModal, announceModalOpen, announceModalClose]);

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    setResendLoading(false);
    setResendSuccess(false);
    close();
  };

  const handleEditComplete = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleResendVerificationEmail = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      // The error will be handled by the auth store and shown in the global error state
    } finally {
      setResendLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Use authUser as the primary data source, fall back to profile store if needed
  const displayUser = authUser || profile;

  if (!displayUser) {
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <FocusTrap 
        active={isOpen && !isLoading}
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
        }}
      >
        <div>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountIcon color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Edit Profile' : 'My Account'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isEditing ? (
          <UserProfileForm 
            profile={displayUser}
            onCancel={() => setIsEditing(false)}
            onSave={handleEditComplete}
          />
        ) : (
          <Box sx={{ pt: 1 }}>
            {/* Basic Profile Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {displayUser.firstName} {displayUser.lastName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {displayUser.email}
                  </Typography>
                </Box>

                {/* Email Verification Status */}
                {authUser && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email Verification
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {authUser.emailVerified ? (
                          <>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Chip 
                              label="Verified" 
                              color="success" 
                              size="small"
                              sx={{ width: 'fit-content' }}
                            />
                          </>
                        ) : (
                          <>
                            <WarningIcon color="warning" fontSize="small" />
                            <Chip 
                              label="Unverified" 
                              color="warning" 
                              size="small"
                              sx={{ width: 'fit-content' }}
                            />
                          </>
                        )}
                      </Box>
                      
                      {!authUser.emailVerified && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleResendVerificationEmail}
                          disabled={resendLoading}
                          startIcon={resendLoading ? <CircularProgress size={16} /> : <EmailIcon />}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: 'auto'
                          }}
                        >
                          {resendLoading ? 'Sending...' : 'Resend'}
                        </Button>
                      )}
                    </Box>
                    
                    {resendSuccess && (
                      <Alert severity="success" sx={{ mt: 1, py: 0.5 }}>
                        <Typography variant="body2">
                          Verification email sent successfully! Please check your inbox.
                        </Typography>
                      </Alert>
                    )}
                    
                    {!authUser.emailVerified && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Verify your email to access all features including file uploads and transcription.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Token Balance */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TokenIcon color="primary" />
                <Typography variant="h6">
                  Token Balance
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'primary.light',
                borderRadius: 1,
                color: 'primary.contrastText'
              }}>
                <Typography variant="h4" component="span">
                  {currentTokenBalance.toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  tokens available
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tokens are used to process meeting recordings. 
                Each 15-minute segment costs 100 tokens.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Account Statistics */}
            {stats && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Account Statistics
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Meetings
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalMeetings}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="h6">
                      {stats.completedMeetings}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Storage Used
                    </Typography>
                    <Typography variant="body1">
                      {(stats.totalStorageUsed / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(stats.lastActivityAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Account Details */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Member since {formatDate(displayUser.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!isEditing && (
          <>
            <Button onClick={() => setIsEditing(true)} variant="outlined">
              Edit Profile
            </Button>
            <Button onClick={handleClose} variant="contained">
              Close
            </Button>
          </>
        )}
      </DialogActions>
        </div>
      </FocusTrap>
    </Dialog>
  );
};
