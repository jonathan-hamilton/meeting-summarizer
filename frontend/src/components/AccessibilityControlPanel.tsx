/**
 * AccessibilityControlPanel Component
 * S6.6 Increment 5: Color & Visual Accessibility
 * Provides user controls for accessibility preferences
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Contrast as ContrastIcon,
  MotionPhotosOff as MotionOffIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { useTheme } from '../theme/useTheme';
import { 
  validateColorPalette, 
  getAccessibilityRating
} from '../theme/colorContrast';
import { SPEAKER_COLORS, HIGH_CONTRAST_SPEAKER_COLORS } from '../theme/speakerColors';

interface AccessibilityControlPanelProps {
  open: boolean;
  onClose: () => void;
}

export const AccessibilityControlPanel: React.FC<AccessibilityControlPanelProps> = ({
  open,
  onClose,
}) => {
  const {
    highContrast,
    reduceMotion,
    enhancedFocusIndicators,
    largeText,
    systemPreferences,
    setHighContrast,
    setReduceMotion,
    setEnhancedFocusIndicators,
    setLargeText,
    detectSystemPreferences,
    setAnnouncement,
  } = useAccessibilityStore();
  
  const { mode, toggleHighContrast } = useTheme();

  // Validate current color palette
  const validateCurrentColors = () => {
    const colors = highContrast ? HIGH_CONTRAST_SPEAKER_COLORS : SPEAKER_COLORS;
    const backgrounds = mode === 'light' ? ['#ffffff'] : ['#121212'];
    return validateColorPalette([...colors], backgrounds);
  };

  const colorValidation = validateCurrentColors();
  const accessibleColors = colorValidation.filter(result => result.isAccessible).length;
  const totalColors = colorValidation.length;

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    toggleHighContrast(); // Also update theme
    setAnnouncement(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleMotionToggle = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    setAnnouncement(`Motion ${newValue ? 'reduced' : 'restored'}`);
  };

  const handleFocusIndicatorsToggle = () => {
    const newValue = !enhancedFocusIndicators;
    setEnhancedFocusIndicators(newValue);
  };

  const handleLargeTextToggle = () => {
    const newValue = !largeText;
    setLargeText(newValue);
  };

  const resetToSystemDefaults = () => {
    detectSystemPreferences();
    setHighContrast(systemPreferences.prefersHighContrast);
    setReduceMotion(systemPreferences.prefersReducedMotion);
    setAnnouncement('Accessibility settings reset to system preferences');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="accessibility-panel-title"
    >
      <DialogTitle id="accessibility-panel-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessibilityIcon />
          Accessibility Settings
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Current Status Overview */}
          <Alert 
            severity={accessibleColors === totalColors ? 'success' : 'warning'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              {accessibleColors} of {totalColors} color combinations meet WCAG AA standards 
              ({((accessibleColors / totalColors) * 100).toFixed(0)}% compliance)
            </Typography>
          </Alert>

          {/* Color & Visual Accessibility */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ContrastIcon />
              Color & Visual
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={highContrast}
                    onChange={handleHighContrastToggle}
                    aria-describedby="high-contrast-description"
                  />
                }
                label={
                  <Box>
                    <Typography>High Contrast Mode</Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      id="high-contrast-description"
                    >
                      Increases color contrast for better visibility
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={largeText}
                    onChange={handleLargeTextToggle}
                    aria-describedby="large-text-description"
                  />
                }
                label={
                  <Box>
                    <Typography>Large Text</Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      id="large-text-description"
                    >
                      Increases text size by 25% for better readability
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* Motion & Animation */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MotionOffIcon />
              Motion & Animation
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={reduceMotion}
                    onChange={handleMotionToggle}
                    aria-describedby="reduce-motion-description"
                  />
                }
                label={
                  <Box>
                    <Typography>Reduce Motion</Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      id="reduce-motion-description"
                    >
                      Minimizes animations and transitions for comfort
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* Focus & Navigation */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VisibilityIcon />
              Focus & Navigation
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={enhancedFocusIndicators}
                    onChange={handleFocusIndicatorsToggle}
                    aria-describedby="focus-indicators-description"
                  />
                }
                label={
                  <Box>
                    <Typography>Enhanced Focus Indicators</Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      id="focus-indicators-description"
                    >
                      Makes keyboard focus more visible and prominent
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* System Preferences Detection */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VolumeIcon />
              System Preferences
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Dark Mode: ${systemPreferences.prefersDarkMode ? 'Enabled' : 'Disabled'}`}
                color={systemPreferences.prefersDarkMode ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label={`High Contrast: ${systemPreferences.prefersHighContrast ? 'Enabled' : 'Disabled'}`}
                color={systemPreferences.prefersHighContrast ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label={`Reduced Motion: ${systemPreferences.prefersReducedMotion ? 'Enabled' : 'Disabled'}`}
                color={systemPreferences.prefersReducedMotion ? 'primary' : 'default'}
                size="small"
              />
            </Stack>
            
            <Button
              variant="outlined"
              onClick={resetToSystemDefaults}
              sx={{ mt: 2 }}
              startIcon={<AccessibilityIcon />}
            >
              Reset to System Preferences
            </Button>
          </Box>

          {/* Color Accessibility Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Color Accessibility Details
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Current color palette accessibility:
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {colorValidation.slice(0, 5).map((result, index) => {
                const rating = getAccessibilityRating(result.color, result.background);
                return (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: result.color,
                          borderRadius: '50%',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Typography variant="body2">
                        Ratio: {result.ratio.toFixed(2)}:1 
                      </Typography>
                      <Chip
                        label={rating.rating}
                        color={result.isAccessible ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};