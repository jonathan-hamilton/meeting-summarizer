import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Help as HelpIcon,
  Accessibility as AccessibilityIcon,
  Brightness4,
  Brightness7,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../theme/useTheme';

interface MoreMenuProps {
  onHelpClick: () => void;
  onAccessibilityClick: () => void;
  onProfileClick: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  onHelpClick,
  onAccessibilityClick,
  onProfileClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode, toggleTheme } = useCustomTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleHelpClick = () => {
    onHelpClick();
    handleClose();
  };

  const handleAccessibilityClick = () => {
    onAccessibilityClick();
    handleClose();
  };

  const handleProfileClick = () => {
    onProfileClick();
    handleClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    handleClose();
  };

  return (
    <>
      <Tooltip title="More options">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-controls={open ? 'more-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label="More options"
          size={isMobile ? "medium" : "small"}
          sx={{ 
            ml: 1,
            minHeight: isMobile ? 44 : 'auto',
            minWidth: isMobile ? 44 : 'auto',
          }}
        >
          <MoreIcon fontSize={isMobile ? "medium" : "small"} />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="more-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={handleProfileClick}
          sx={{ minHeight: isMobile ? 48 : 'auto', py: isMobile ? 1.5 : 1 }}
        >
          <ListItemIcon>
            <ProfileIcon fontSize={isMobile ? "medium" : "small"} />
          </ListItemIcon>
          <ListItemText>Account Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleHelpClick}
          sx={{ minHeight: isMobile ? 48 : 'auto', py: isMobile ? 1.5 : 1 }}
        >
          <ListItemIcon>
            <HelpIcon fontSize={isMobile ? "medium" : "small"} />
          </ListItemIcon>
          <ListItemText>Help & Support</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={handleAccessibilityClick}
          sx={{ minHeight: isMobile ? 48 : 'auto', py: isMobile ? 1.5 : 1 }}
        >
          <ListItemIcon>
            <AccessibilityIcon fontSize={isMobile ? "medium" : "small"} />
          </ListItemIcon>
          <ListItemText>Accessibility Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleThemeToggle}
          sx={{ minHeight: isMobile ? 48 : 'auto', py: isMobile ? 1.5 : 1 }}
        >
          <ListItemIcon>
            {mode === 'dark' ? (
              <Brightness7 fontSize={isMobile ? "medium" : "small"} />
            ) : (
              <Brightness4 fontSize={isMobile ? "medium" : "small"} />
            )}
          </ListItemIcon>
          <ListItemText>
            {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};