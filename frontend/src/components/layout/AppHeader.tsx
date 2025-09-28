import React from 'react';
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
  onModeDoubleClick: () => void;
  onTokenPurchaseClick?: () => void;
  sessionStatus: 'active' | 'warning' | 'expired';
  getAppBarSx: () => any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onHelpClick,
  onAccessibilityClick,
  onModeToggle,
  onModeDoubleClick,
  onTokenPurchaseClick,
  sessionStatus,
  getAppBarSx,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: appMode } = useAppMode();
  const { isAuthenticated, logout } = useAuthStore();
  const openProfileDialog = useUserProfileDialogOpen();

  const handleSignOutClick = () => {
    logout();
    navigate('/app');
  };

  return (
    <AppBar position="static" sx={getAppBarSx()}>
      <Toolbar sx={{ width: "100%", position: "relative", justifyContent: "center" }}>
        {/* Left-aligned controls */}
        <Box sx={{ position: "absolute", left: 0, display: "flex", alignItems: "center" }}>
          {/* Development controls - only visible in local development environment and when authenticated */}
          {import.meta.env.DEV && isAuthenticated && (
            <>
              {/* Mode Toggle Switch - Toggle between development and production modes */}
              <Tooltip
                title={
                  appMode === 'production'
                    ? "Production mode (real API calls, Legal Acceptance enabled)"
                    : "Development mode (mocked API calls) - Double-click to test Legal Acceptance"
                }
              >
                <Switch
                  checked={appMode === 'production'}
                  onChange={onModeToggle}
                  onDoubleClick={onModeDoubleClick}
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
                      <IconButton color="inherit" onClick={() => navigate('/app')}>
                        <HomeIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Meeting History">
                      <IconButton color="inherit" onClick={() => navigate('/history')}>
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