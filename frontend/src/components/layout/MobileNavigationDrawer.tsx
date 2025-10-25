import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  Person as ProfileIcon,
  Help as HelpIcon,
  Accessibility as AccessibilityIcon,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { useNavigationStore } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserProfileDialogOpen } from '../../stores/userProfileStore';
import { useTheme as useCustomTheme } from '../../theme/useTheme';
import { TokenBalanceDisplay } from '../TokenBalanceDisplay';

interface MobileNavigationDrawerProps {
  onHelpClick: () => void;
  onAccessibilityClick: () => void;
  onTokenPurchaseClick?: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  onHelpClick,
  onAccessibilityClick,
  onTokenPurchaseClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Store hooks
  const { mobileDrawerOpen, closeMobileDrawer } = useNavigationStore();
  const { isAuthenticated, logout } = useAuthStore();
  const openProfileDialog = useUserProfileDialogOpen();
  const { mode: themeMode, toggleTheme } = useCustomTheme();

  // Navigation handlers with auto-close
  const handleNavigateHome = () => {
    navigate('/app');
    closeMobileDrawer();
  };

  const handleNavigateHistory = () => {
    navigate('/history');
    closeMobileDrawer();
  };

  const handleProfileClick = () => {
    openProfileDialog();
    closeMobileDrawer();
  };

  const handleHelpClick = () => {
    onHelpClick();
    closeMobileDrawer();
  };

  const handleAccessibilityClick = () => {
    onAccessibilityClick();
    closeMobileDrawer();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    closeMobileDrawer();
  };

  const handleSignOut = () => {
    logout();
    closeMobileDrawer();
  };

  const handleTokenPurchaseClick = () => {
    if (onTokenPurchaseClick) {
      onTokenPurchaseClick();
      closeMobileDrawer();
    }
  };

  // Only show drawer on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={closeMobileDrawer}
      variant="temporary"
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 280,
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Meeting-Summary.io
        </Typography>
        <IconButton onClick={closeMobileDrawer} aria-label="Close navigation menu">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List>
        {isAuthenticated && (
          <>
            {/* Token Balance - Mobile Display */}
            <ListItem sx={{ py: 1 }}>
              <Box sx={{ width: '100%' }}>
                <TokenBalanceDisplay 
                  onPurchaseClick={handleTokenPurchaseClick}
                  compact={false}
                />
              </Box>
            </ListItem>

            <Divider />

            {/* Home/History Toggle */}
            {location.pathname === '/history' ? (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleNavigateHome}
                  sx={{ 
                    minHeight: 44, // Touch target minimum
                    py: 1.5,
                  }}
                >
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleNavigateHistory}
                  sx={{ 
                    minHeight: 44, // Touch target minimum
                    py: 1.5,
                  }}
                >
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText primary="Meeting History" />
                </ListItemButton>
              </ListItem>
            )}

            <Divider />

            {/* Account Settings */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleProfileClick}
                sx={{ 
                  minHeight: 44, // Touch target minimum
                  py: 1.5,
                }}
              >
                <ListItemIcon>
                  <ProfileIcon />
                </ListItemIcon>
                <ListItemText primary="Account Settings" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Help & Support */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleHelpClick}
            sx={{ 
              minHeight: 44, // Touch target minimum
              py: 1.5,
            }}
          >
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItemButton>
        </ListItem>

        {/* Accessibility Settings */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleAccessibilityClick}
            sx={{ 
              minHeight: 44, // Touch target minimum
              py: 1.5,
            }}
          >
            <ListItemIcon>
              <AccessibilityIcon />
            </ListItemIcon>
            <ListItemText primary="Accessibility Settings" />
          </ListItemButton>
        </ListItem>

        {/* Theme Toggle */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleThemeToggle}
            sx={{ 
              minHeight: 44, // Touch target minimum
              py: 1.5,
            }}
          >
            <ListItemIcon>
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </ListItemIcon>
            <ListItemText primary={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
          </ListItemButton>
        </ListItem>

        {/* Sign Out */}
        {isAuthenticated && (
          <>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleSignOut}
                sx={{ 
                  minHeight: 44, // Touch target minimum
                  py: 1.5,
                  color: 'primary.main',
                  fontWeight: 'bold',
                }}
              >
                <ListItemIcon>
                  <LogoutIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="SIGN OUT" 
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};