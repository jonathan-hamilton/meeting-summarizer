import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { UserProfile, UpdateUserRequest } from '../stores/userProfileStore';
import { userProfileService } from '../services/userProfileService';

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
        />

        <TextField
          label="Email"
          value={profile.email}
          disabled
          fullWidth
          helperText="Email cannot be changed. Contact support if you need to update your email address."
        />

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
