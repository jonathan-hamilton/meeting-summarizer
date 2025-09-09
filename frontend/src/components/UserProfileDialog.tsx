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
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountCircle as AccountIcon,
  Token as TokenIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useUserProfileStore, useUserProfileDialogState, useUserProfileDialogClose } from '../stores/userProfileStore';
import { useAuthStore } from '../stores/authStore';
import { UserProfileForm } from './UserProfileForm';

export const UserProfileDialog: React.FC = () => {
  const isOpen = useUserProfileDialogState();
  const close = useUserProfileDialogClose();
  const profile = useUserProfileStore((state) => state.profile);
  const stats = useUserProfileStore((state) => state.stats);
  const isLoading = useUserProfileStore((state) => state.isLoading);
  const error = useUserProfileStore((state) => state.error);
  
  // Get authenticated user from auth store
  const authUser = useAuthStore((state) => state.user);
  
  // Get actions separately to avoid re-renders
  const setProfile = useUserProfileStore((state) => state.setProfile);
  const setError = useUserProfileStore((state) => state.setError);
  
  const [isEditing, setIsEditing] = useState(false);

  // TODO: Add function to load additional user stats from API when endpoints are available

  // Clear any demo profile data when component mounts if we have real auth user
  useEffect(() => {
    if (authUser && profile && profile.email === 'demo@meetingsummary.io') {
      // Clear demo profile so we use auth user data instead
      setProfile(null);
    }
  }, [authUser, profile, setProfile]);

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    close();
  };

  const handleEditComplete = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setIsEditing(false);
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
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountIcon color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Edit Profile' : 'My Account'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
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
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Chip 
                    label={displayUser.isPaidUser ? 'Paid User' : 'Demo User'}
                    color={displayUser.isPaidUser ? 'primary' : 'default'}
                    size="small"
                    sx={{ width: 'fit-content' }}
                  />
                </Box>
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
                  {displayUser.tokenBalance.toLocaleString()}
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
    </Dialog>
  );
};
