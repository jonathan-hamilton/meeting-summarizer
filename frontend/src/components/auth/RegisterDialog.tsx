import React, { useState, useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff, Email, CheckCircle } from '@mui/icons-material';
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
  const { register, isLoading, error, clearError, resendVerificationEmail, checkEnvironmentRequirements, requiresInvitationForRegistration } = useAuthStore();
  const navigate = useNavigate();
  
  // Keep dialog open if there's an error to show, even if parent tries to close it
  const shouldBeOpen = Boolean(open || (error && !isLoading));
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: '' // S7.2: Invitation code for dev environment
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check environment requirements and parse URL for invitation codes when dialog opens
  useEffect(() => {
    if (open) {
      // Check if invitation codes are required in this environment
      checkEnvironmentRequirements();
      
      // Parse URL for invitation code
      const urlParams = new URLSearchParams(window.location.search);
      const invitationFromUrl = urlParams.get('invitation') || urlParams.get('code');
      
      if (invitationFromUrl) {
        setFormData(prev => ({ ...prev, invitationCode: invitationFromUrl }));
      }
    }
  }, [open, checkEnvironmentRequirements]);

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
    
    // Validate invitation code if required
    if (requiresInvitationForRegistration) {
      if (!formData.invitationCode.trim()) {
        errors.invitationCode = 'Invitation code is required for registration';
      } else if (formData.invitationCode.trim().length < 10) {
        errors.invitationCode = 'Please enter a valid invitation code';
      }
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
      true, // Always consent since we removed the checkbox
      formData.invitationCode || undefined
    );
    
    if (result.success) {
      // Show verification success message instead of immediately closing
      setFormErrors({});
      setRegistrationSuccess(true);
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
      invitationCode: ''
    });
    setFormErrors({});
    setRegistrationSuccess(false);
    setResendLoading(false);
    setResendSuccess(false);
    clearError();
    onClose();
  };

  const handleContinueToApp = () => {
    // Reset form and close dialog
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      invitationCode: ''
    });
    setFormErrors({});
    setRegistrationSuccess(false);
    setResendLoading(false);
    setResendSuccess(false);
    onClose();
    
    // Navigate to /app page using React Router (no page refresh)
    navigate('/app');
  };

  const handleSwitchToLogin = () => {
    handleClose();
    onSwitchToLogin?.();
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
        zIndex: 2000 // Ensure dialog appears above other elements
      }}
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          {registrationSuccess ? 'Welcome to Meeting Summarizer!' : 'Create Account'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {registrationSuccess ? 'Your account has been created successfully' : 'Join Meeting Summarizer to get started'}
        </Typography>
      </DialogTitle>

      {registrationSuccess ? (
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Account Created Successfully!
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Welcome {formData.firstName}! Your account has been created and you're now logged in.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                <Email sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                Email Verification Required
              </Typography>
              <Typography variant="body2">
                We've sent a verification email to <strong>{formData.email}</strong>. 
                Please check your inbox and click the verification link to access all features.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                You can still explore the app, but some features will be limited until your email is verified.
              </Typography>
              
              {resendSuccess && (
                <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2">
                    Verification email sent successfully! Please check your inbox.
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  onClick={handleResendVerificationEmail}
                  disabled={resendLoading}
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {resendLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Sending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </Box>
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Ready to start summarizing your meetings?
            </Typography>
          </Box>
        </DialogContent>
      ) : (
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
                aria-label="First name for registration"
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

            {/* S7.2: Invitation code field for development environment */}
            {(requiresInvitationForRegistration || formErrors.invitationCode) && (
              <TextField
                name="invitationCode"
                label="Invitation Code"
                type="text"
                value={formData.invitationCode}
                onChange={handleInputChange}
                error={!!formErrors.invitationCode}
                helperText={formErrors.invitationCode || 'Enter the invitation code you received'}
                fullWidth
                required={requiresInvitationForRegistration}
                disabled={isLoading}
                autoComplete="off"
                placeholder="ABC123XYZ"
              />
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
      )}

      {registrationSuccess && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleContinueToApp}
              sx={{ height: 48 }}
            >
              Continue to App
            </Button>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
};
