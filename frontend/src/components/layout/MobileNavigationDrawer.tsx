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
  AccountBalance as TokenIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import { useNavigationStore } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserProfileDialogOpen } from '../../stores/userProfileStore';
import { useTokenBalance } from '../../stores/tokenStore';
import { useTheme as useCustomTheme } from '../../theme/useTheme';

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
  const balance = useTokenBalance();

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
          width: 320, // Slightly wider for better content layout
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}>
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 'bold',
          color: 'white',
        }}>
          Meeting-Summary.io
        </Typography>
        <IconButton 
          onClick={closeMobileDrawer} 
          aria-label="Close navigation menu"
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List>
        {isAuthenticated && (
          <>
            {/* Token Balance - Enhanced Mobile Display */}
            <ListItem sx={{ py: 2, px: 3 }}>
              <Box sx={{ 
                width: '100%',
                p: 2.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <TokenIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}>
                      Tokens
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      lineHeight: 1,
                    }}>
                      {balance.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton
                  onClick={handleTokenPurchaseClick}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  aria-label="Buy more tokens"
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Navigation Section Header */}
            <ListItem sx={{ py: 1, px: 3 }}>
              <Typography variant="overline" color="text.secondary" sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: 0.5,
              }}>
                Navigation
              </Typography>
            </ListItem>

            {/* Home/History Toggle */}
            {location.pathname === '/history' ? (
              <ListItem disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  onClick={handleNavigateHome}
                  sx={{ 
                    minHeight: 56, // Larger touch target
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    mx: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: 'primary.main',
                  }}>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Home" 
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: '1rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  onClick={handleNavigateHistory}
                  sx={{ 
                    minHeight: 56, // Larger touch target
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    mx: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: 'primary.main',
                  }}>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Meeting History" 
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: '1rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Account Section Header */}
            <ListItem sx={{ py: 1, px: 3 }}>
              <Typography variant="overline" color="text.secondary" sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: 0.5,
              }}>
                Account
              </Typography>
            </ListItem>

            {/* Account Settings */}
            <ListItem disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={handleProfileClick}
                sx={{ 
                  minHeight: 56, // Larger touch target
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  mx: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: 'primary.main',
                }}>
                  <ProfileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Account Settings" 
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '1rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Support Section Header */}
        <ListItem sx={{ py: 1, px: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: 0.5,
          }}>
            Support & Settings
          </Typography>
        </ListItem>

        {/* Help & Support */}
        <ListItem disablePadding sx={{ px: 2 }}>
          <ListItemButton
            onClick={handleHelpClick}
            sx={{ 
              minHeight: 56, // Larger touch target
              py: 2,
              px: 2,
              borderRadius: 2,
              mx: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: 'primary.main',
            }}>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Help & Support" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '1rem',
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Accessibility Settings */}
        <ListItem disablePadding sx={{ px: 2 }}>
          <ListItemButton
            onClick={handleAccessibilityClick}
            sx={{ 
              minHeight: 56, // Larger touch target
              py: 2,
              px: 2,
              borderRadius: 2,
              mx: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: 'primary.main',
            }}>
              <AccessibilityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Accessibility Settings" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '1rem',
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Theme Toggle */}
        <ListItem disablePadding sx={{ px: 2 }}>
          <ListItemButton
            onClick={handleThemeToggle}
            sx={{ 
              minHeight: 56, // Larger touch target
              py: 2,
              px: 2,
              borderRadius: 2,
              mx: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: 'primary.main',
            }}>
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </ListItemIcon>
            <ListItemText 
              primary={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'} 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '1rem',
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Sign Out */}
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 2 }} />
            <ListItem disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={handleSignOut}
                sx={{ 
                  minHeight: 56, // Larger touch target
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  mx: 1,
                  backgroundColor: 'error.main',
                  color: 'error.contrastText',
                  '&:hover': {
                    backgroundColor: 'error.dark',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: 'error.contrastText',
                }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Sign Out" 
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: 'error.contrastText',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};