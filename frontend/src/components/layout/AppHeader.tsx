import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Switch,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  History as HistoryIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAppMode } from '../../contexts/AppModeContext';
import { useAuthStore } from '../../stores/authStore';
import { useUserProfileDialogOpen } from '../../stores/userProfileStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { SessionIndicator } from '../SessionIndicator';
import { TokenBalanceDisplay } from '../TokenBalanceDisplay';
import { MoreMenu } from './MoreMenu';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';

interface AppHeaderProps {
  onHelpClick: () => void;
  onAccessibilityClick: () => void;
  onModeToggle: () => void;
  onTokenPurchaseClick?: () => void;
  sessionStatus: 'active' | 'warning' | 'expired';
  getAppBarSx: () => any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onHelpClick,
  onAccessibilityClick,
  onModeToggle,
  onTokenPurchaseClick,
  sessionStatus,
  getAppBarSx,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode: appMode } = useAppMode();
  const { isAuthenticated, logout } = useAuthStore();
  const openProfileDialog = useUserProfileDialogOpen();
  const { toggleMobileDrawer } = useNavigationStore();
  
  // State to track backend environment
  const [backendEnvironment, setBackendEnvironment] = useState<string | null>(null);
  
  // Check backend environment on mount
  useEffect(() => {
    const checkBackendEnvironment = async () => {
      try {
        const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5173';
        const apiUrl = isLocalDev ? 'http://localhost:5029/api' : '/api';
        const response = await fetch(`${apiUrl}/environment/features`);
        if (response.ok) {
          const data = await response.json();
          setBackendEnvironment(data.Environment);
        }
      } catch (error) {
        console.warn('Failed to fetch backend environment:', error);
      }
    };
    
    if (isAuthenticated) {
      checkBackendEnvironment();
    }
  }, [isAuthenticated]);

  const handleSignOutClick = () => {
    logout();
    navigate('/app');
  };

  return (
    <AppBar position="static" sx={getAppBarSx()}>
      <Toolbar sx={{ width: "100%", position: "relative", justifyContent: "center" }}>
        {/* Left-aligned controls */}
        <Box sx={{ position: "absolute", left: 0, display: "flex", alignItems: "center" }}>
          {/* Mobile Hamburger Menu - only visible on mobile */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              onClick={toggleMobileDrawer}
              sx={{ 
                mr: 1,
                minWidth: 44, // Touch target minimum
                minHeight: 44,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Development controls - only visible when backend is running in Local environment and user is authenticated */}
          {backendEnvironment === 'Local' && isAuthenticated && !isMobile && (
            <>
              {/* Mode Toggle Switch - Toggle between development and production modes */}
              <Tooltip
                title={
                  appMode === 'production'
                    ? "Production mode (real API calls, Legal Acceptance enabled)"
                    : "Development mode (mocked API calls)"
                }
              >
                <Switch
                  checked={appMode === 'production'}
                  onChange={onModeToggle}
                  color="default"
                  sx={{ mr: 1, cursor: 'pointer' }}
                  inputProps={{ 
                    'aria-label': 'Toggle between development and production mode',
                    'aria-describedby': 'mode-switch-description'
                  }}
                  id="mode-switch"
                />
              </Tooltip>
            </>
          )}
        </Box>
        
        {/* Centered title */}
        <Typography variant="h4" component="h1" sx={{ 
          textAlign: "center",
          fontWeight: "bold"
        }}>
          Meeting-Summary.io
        </Typography>
        
        {/* Right-aligned controls - hidden on mobile */}
        <Box sx={{ 
          position: "absolute", 
          right: 0, 
          display: { xs: 'none', sm: 'flex' }, // Hidden on mobile (xs), visible on sm+
          alignItems: "center" 
        }}>
          {appMode === 'development' && (
            <SessionIndicator status={sessionStatus} />
          )}
          
          {/* Authentication-based controls */}
          {appMode === 'production' && (
            <>
              {isAuthenticated ? (
                /* Authenticated user controls - reordered for consistent SIGN OUT position */
                <>
                  {/* Token Balance Display */}
                  <TokenBalanceDisplay 
                    onPurchaseClick={onTokenPurchaseClick}
                    compact
                  />

                  {/* History Button */}
                  {location.pathname === '/history' ? (
                    <Tooltip title="Home">
                      <IconButton 
                        color="inherit" 
                        onClick={() => navigate('/app')}
                        aria-label="Go to home page"
                        size={isMobile ? "medium" : "small"}
                        sx={{
                          minHeight: isMobile ? 44 : 'auto',
                          minWidth: isMobile ? 44 : 'auto',
                        }}
                      >
                        <HomeIcon fontSize={isMobile ? "medium" : "small"} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Meeting History">
                      <IconButton 
                        color="inherit" 
                        onClick={() => navigate('/history')}
                        aria-label="View meeting history"
                        size={isMobile ? "medium" : "small"}
                        sx={{
                          minHeight: isMobile ? 44 : 'auto',
                          minWidth: isMobile ? 44 : 'auto',
                        }}
                      >
                        <HistoryIcon fontSize={isMobile ? "medium" : "small"} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* More Menu Dropdown */}
                  <MoreMenu 
                    onHelpClick={onHelpClick}
                    onAccessibilityClick={onAccessibilityClick}
                    onProfileClick={openProfileDialog}
                  />

                  {/* SIGN OUT Button - moved to far right for consistency */}
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSignOutClick}
                    size={isMobile ? "large" : "medium"}
                    sx={{ 
                      ml: 1,
                      mr: 2,
                      minWidth: '80px',
                      minHeight: isMobile ? 44 : 'auto',
                      fontWeight: 'bold',
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565C0'
                      }
                    }}
                  >
                    SIGN OUT
                  </Button>
                </>
              ) : null}
            </>
          )}
        </Box>
      </Toolbar>
      
      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        onHelpClick={onHelpClick}
        onAccessibilityClick={onAccessibilityClick}
        onTokenPurchaseClick={onTokenPurchaseClick}
      />
    </AppBar>
  );
};