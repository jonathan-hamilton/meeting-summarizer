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
} from '@mui/material';
import {
  History as HistoryIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAppMode } from '../../contexts/AppModeContext';
import { useAuthStore } from '../../stores/authStore';
import { useUserProfileDialogOpen } from '../../stores/userProfileStore';
import { SessionIndicator } from '../SessionIndicator';
import { TokenBalanceDisplay } from '../TokenBalanceDisplay';
import { MoreMenu } from './MoreMenu';

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
  const { mode: appMode } = useAppMode();
  const { isAuthenticated, logout } = useAuthStore();
  const openProfileDialog = useUserProfileDialogOpen();
  
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
          {/* Development controls - only visible when backend is running in Local environment and user is authenticated */}
          {backendEnvironment === 'Local' && isAuthenticated && (
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
        
        {/* Right-aligned controls */}
        <Box sx={{ position: "absolute", right: 0, display: "flex", alignItems: "center" }}>
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
                      >
                        <HomeIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Meeting History">
                      <IconButton 
                        color="inherit" 
                        onClick={() => navigate('/history')}
                        aria-label="View meeting history"
                      >
                        <HistoryIcon />
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
                    sx={{ 
                      ml: 1,
                      mr: 2,
                      minWidth: '80px',
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
    </AppBar>
  );
};