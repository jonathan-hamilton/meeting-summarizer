import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterDialog: React.FC<RegisterDialogProps> = ({ 
  open, 
  onClose, 
  onSwitchToLogin 
}) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  // Keep dialog open if there's an error to show, even if parent tries to close it
  const shouldBeOpen = Boolean(open || (error && !isLoading));
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    hasConsentedToDataProcessing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear global error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.hasConsentedToDataProcessing) {
      errors.hasConsentedToDataProcessing = 'You must agree to the data processing terms';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await register(
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
      formData.hasConsentedToDataProcessing
    );
    
    if (result.success) {
      // Only close dialog on successful registration
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        hasConsentedToDataProcessing: false
      });
      setFormErrors({});
      onClose();
      
      // Navigate to /app page using React Router (no page refresh)
      navigate('/app');
    }
    // If result.success is false, dialog stays open and error will be shown via the error state from auth store
    // If result.success is false, dialog stays open and error will be shown via the error state from auth store
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      hasConsentedToDataProcessing: false
    });
    setFormErrors({});
    clearError();
    onClose();
  };

  const handleSwitchToLogin = () => {
    handleClose();
    onSwitchToLogin?.();
  };

  return (
    <Dialog 
      open={shouldBeOpen} 
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return; // Prevent closing on backdrop click or escape key
        }
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
      sx={{
        zIndex: 2000 // Ensure dialog appears above tour steps (which typically use z-index around 1300-1500)
      }}
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Join Meeting Summarizer to get started
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                fullWidth
                required
                disabled={isLoading}
                autoComplete="given-name"
                autoFocus
              />
              
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                fullWidth
                required
                disabled={isLoading}
                autoComplete="family-name"
              />
            </Box>

            <TextField
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <TextField
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password || 'At least 8 characters with uppercase, lowercase, and number'}
              fullWidth
              required
              disabled={isLoading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              fullWidth
              required
              disabled={isLoading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="hasConsentedToDataProcessing"
                  checked={formData.hasConsentedToDataProcessing}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the processing of my personal data in accordance with the{' '}
                  <Link href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ alignItems: 'flex-start', mt: 1 }}
            />
            {formErrors.hasConsentedToDataProcessing && (
              <Typography variant="caption" color="error" sx={{ ml: 4, mt: -1 }}>
                {formErrors.hasConsentedToDataProcessing}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ height: 48 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            {onSwitchToLogin && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Button
                    variant="text"
                    onClick={handleSwitchToLogin}
                    disabled={isLoading}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    Sign in here
                  </Button>
                </Typography>
              </Box>
            )}

            <Button
              onClick={handleClose}
              disabled={isLoading}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};
