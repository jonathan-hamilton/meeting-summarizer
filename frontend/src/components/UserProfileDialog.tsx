import React, { useState, useEffect, useCallback } from 'react';
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
import { userProfileService } from '../services/userProfileService';
import { UserProfileForm } from './UserProfileForm';

export const UserProfileDialog: React.FC = () => {
  const isOpen = useUserProfileDialogState();
  const close = useUserProfileDialogClose();
  const profile = useUserProfileStore((state) => state.profile);
  const stats = useUserProfileStore((state) => state.stats);
  const isLoading = useUserProfileStore((state) => state.isLoading);
  const error = useUserProfileStore((state) => state.error);
  
  // Get actions separately to avoid re-renders
  const setProfile = useUserProfileStore((state) => state.setProfile);
  const setStats = useUserProfileStore((state) => state.setStats);
  const setLoading = useUserProfileStore((state) => state.setLoading);
  const setError = useUserProfileStore((state) => state.setError);
  
  const [isEditing, setIsEditing] = useState(false);

  // Memoize loadUserData to prevent infinite re-renders
  const loadUserData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [userProfile, userStats] = await Promise.all([
        userProfileService.getUserProfile(userId),
        userProfileService.getUserStats(userId),
      ]);
      
      setProfile(userProfile);
      setStats(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProfile, setStats]);

  // Load user data when dialog opens - only if we have a profile but no stats
  useEffect(() => {
    // If dialog is opening and we don't have a profile, create a demo profile
    if (isOpen && !profile) {
      const demoProfile = {
        id: 'demo-user-001',
        email: 'demo@meetingsummary.io',
        firstName: 'Demo',
        lastName: 'User',
        isPaidUser: false,
        tokenBalance: 250,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      
      const demoStats = {
        userId: 'demo-user-001',
        tokenBalance: 250,
        isPaidUser: false,
        totalMeetings: 12,
        completedMeetings: 10,
        pendingMeetings: 2,
        totalStorageUsed: 1024 * 1024 * 45, // 45 MB
        lastActivityAt: new Date().toISOString(),
        accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      };
      
      setProfile(demoProfile);
      setStats(demoStats);
    }
    
    // Temporarily disable automatic loading to prevent infinite loops
    // TODO: Re-enable once proper authentication is implemented
    /*
    if (isOpen && profile?.id && !stats && !isLoading) {
      loadUserData(profile.id);
    }
    */
  }, [isOpen, profile, setProfile, setStats, loadUserData]);

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

  if (!profile) {
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
            profile={profile}
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
                    {profile.firstName} {profile.lastName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {profile.email}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Chip 
                    label={profile.isPaidUser ? 'Paid User' : 'Demo User'}
                    color={profile.isPaidUser ? 'primary' : 'default'}
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
                  {profile.tokenBalance.toLocaleString()}
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
                  Member since {formatDate(profile.createdAt)}
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
