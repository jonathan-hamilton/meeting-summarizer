import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Typography,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import type { UserProfile, UpdateUserRequest } from '../stores/userProfileStore';
import { userProfileService } from '../services/userProfileService';
import { useAuthStore } from '../stores/authStore';

interface UserProfileFormProps {
  profile: UserProfile;
  onCancel: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  profile,
  onCancel,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Auth store for password change
  const { changePassword } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updates: UpdateUserRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      const updatedProfile = await userProfileService.updateUserProfile(profile.id, updates);
      onSave(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handlePasswordInputChange = (field: keyof typeof passwordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError(null);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handlePasswordSubmit = async () => {
    // Validate form
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
        setPasswordChangeOpen(false);
      }, 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isChanged = 
    formData.firstName !== profile.firstName || 
    formData.lastName !== profile.lastName;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="First Name"
          value={formData.firstName}
          onChange={handleInputChange('firstName')}
          required
          fullWidth
          disabled={isLoading}
          error={error !== null && !formData.firstName.trim()}
          helperText={error !== null && !formData.firstName.trim() ? 'First name is required' : ''}
          inputProps={{
            autoComplete: "given-name"
          }}
        />

        <TextField
          label="Last Name"
          value={formData.lastName}
          onChange={handleInputChange('lastName')}
          required
          fullWidth
          disabled={isLoading}
          error={error !== null && !formData.lastName.trim()}
          helperText={error !== null && !formData.lastName.trim() ? 'Last name is required' : ''}
          inputProps={{
            autoComplete: "family-name"
          }}
        />

        <TextField
          label="Email"
          value={profile.email}
          disabled
          fullWidth
          helperText="Email cannot be changed. Contact support if you need to update your email address."
          inputProps={{
            autoComplete: "username email"
          }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Password Change Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockResetIcon color="action" fontSize="small" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Password & Security
            </Typography>
            <Button
              variant={passwordChangeOpen ? "outlined" : "text"}
              size="small"
              onClick={() => setPasswordChangeOpen(!passwordChangeOpen)}
              endIcon={
                <ExpandMoreIcon 
                  sx={{ 
                    transform: passwordChangeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              }
            >
              Change Password
            </Button>
          </Box>

          <Collapse in={passwordChangeOpen}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Password changed successfully!
                </Alert>
              )}
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                mt: (passwordSuccess || passwordError) ? 0 : -1 
              }}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange('currentPassword')}
                  required={passwordChangeOpen}
                  fullWidth
                  disabled={passwordLoading}
                  size="small"
                  inputProps={{
                    autoComplete: "current-password"
                  }}
                />

                <TextField
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange('newPassword')}
                  required={passwordChangeOpen}
                  fullWidth
                  disabled={passwordLoading}
                  size="small"
                  helperText="Minimum 8 characters with uppercase, lowercase, and number"
                  inputProps={{
                    autoComplete: "new-password"
                  }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordInputChange('confirmNewPassword')}
                  required={passwordChangeOpen}
                  fullWidth
                  disabled={passwordLoading}
                  size="small"
                  inputProps={{
                    autoComplete: "new-password"
                  }}
                />

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    size="small"
                    onClick={() => {
                      setPasswordChangeOpen(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: '',
                      });
                      setPasswordError(null);
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    onClick={handlePasswordSubmit}
                    disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword}
                    startIcon={passwordLoading ? <CircularProgress size={16} /> : undefined}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            onClick={onCancel} 
            disabled={isLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading || !isChanged}
            startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
