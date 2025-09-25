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
  Brightness4,
  Brightness7,
  History as HistoryIcon,
  Home as HomeIcon,
  Help as HelpIcon,
  AccountCircle as AccountIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { useTheme } from '../../theme/useTheme';
import { useAppMode } from '../../contexts/AppModeContext';
import { useAuthStore } from '../../stores/authStore';
import { useUserProfileDialogOpen } from '../../stores/userProfileStore';
import { SessionIndicator } from '../SessionIndicator';
import { TokenBalanceDisplay } from '../TokenBalanceDisplay';

interface AppHeaderProps {
  onHelpClick: () => void;
  onAccessibilityClick: () => void;
  onModeToggle: () => void;
  onModeDoubleClick: () => void;
  onRegisterClick: () => void;
  onTokenPurchaseClick?: () => void;
  sessionStatus: 'active' | 'warning' | 'expired';
  getAppBarSx: () => any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onHelpClick,
  onAccessibilityClick,
  onModeToggle,
  onModeDoubleClick,
  onRegisterClick,
  onTokenPurchaseClick,
  sessionStatus,
  getAppBarSx,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useTheme();
  const { mode: appMode } = useAppMode();
  const { isAuthenticated, logout } = useAuthStore();
  const openProfileDialog = useUserProfileDialogOpen();

  const handleThemeToggle = () => {
    toggleTheme();
  };

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
          Meeting-Summary.io {appMode === 'demo' && '(Demo)'}
        </Typography>
        
        {/* Right-aligned controls */}
        <Box sx={{ position: "absolute", right: 0, display: "flex", alignItems: "center" }}>
          {/* Hide SessionIndicator in demo mode OR production mode */}
          {appMode === 'development' && (
            <SessionIndicator status={sessionStatus} />
          )}
          
          {/* Buttons for authenticated users in production mode - ordered left to right */}
          {appMode === 'production' && isAuthenticated && (
            <>
              {/* 0. Token Balance Display */}
              <TokenBalanceDisplay 
                onPurchaseClick={onTokenPurchaseClick}
                compact
              />

              {/* 1. SIGN OUT Button */}
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSignOutClick}
                sx={{ 
                  mr: 1,
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

              {/* 2. Account Button */}
              <Tooltip title="My Account">
                <IconButton color="inherit" onClick={openProfileDialog}>
                  <AccountIcon />
                </IconButton>
              </Tooltip>

              {/* 3. History Button */}
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

              {/* 4. Help & Privacy FAQ Button */}
              <Tooltip title="Help & Privacy FAQ">
                <IconButton 
                  color="inherit" 
                  onClick={onHelpClick} 
                  sx={{ ml: 1 }}
                  aria-label="Help & Privacy FAQ"
                >
                  <HelpIcon />
                </IconButton>
              </Tooltip>

              {/* 5. Accessibility Settings Button */}
              <Tooltip title="Accessibility Settings">
                <IconButton 
                  color="inherit" 
                  onClick={onAccessibilityClick} 
                  sx={{ ml: 1 }}
                  aria-label="Accessibility settings and preferences"
                >
                  <AccessibilityIcon />
                </IconButton>
              </Tooltip>

              {/* 6. Light/Dark Mode Toggle Button */}
              <IconButton 
                color="inherit" 
                onClick={handleThemeToggle} 
                sx={{ ml: 1 }}
                aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              >
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </>
          )}

          {/* Demo mode button - changed to SIGN UP for demo mode */}
          {appMode === 'demo' && (
            <Button
              variant="contained"
              color="secondary"
              onClick={onRegisterClick}
              sx={{ 
                ml: 1,
                minWidth: '80px',
                fontWeight: 'bold',
                backgroundColor: '#9C27B0',
                '&:hover': {
                  backgroundColor: '#7B1FA2'
                }
              }}
            >
              SIGN UP
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};