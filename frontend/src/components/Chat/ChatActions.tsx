import React from 'react';
import {
  Button,
  ButtonGroup,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Navigation as NavigateIcon,
  Visibility as ScrollIcon,
  Settings as DialogIcon,
  PlayArrow as TriggerIcon,
} from '@mui/icons-material';
import type { ChatAction } from '../../stores/chatStore';

interface ChatActionsProps {
  actions: ChatAction[];
  onActionClick: (action: ChatAction) => void;
}

/**
 * Actionable buttons that appear with AI responses
 * Allows users to directly execute navigation, dialog opening, scrolling, etc.
 */
export const ChatActions: React.FC<ChatActionsProps> = ({ actions, onActionClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!actions || actions.length === 0) {
    return null;
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'navigate':
        return <NavigateIcon fontSize={isMobile ? "medium" : "small"} />;
      case 'scroll':
        return <ScrollIcon fontSize={isMobile ? "medium" : "small"} />;
      case 'dialog':
        return <DialogIcon fontSize={isMobile ? "medium" : "small"} />;
      case 'trigger':
        return <TriggerIcon fontSize={isMobile ? "medium" : "small"} />;
      default:
        return null;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'navigate':
        return 'primary';
      case 'scroll':
        return 'secondary';
      case 'dialog':
        return 'info';
      case 'trigger':
        return 'success';
      default:
        return 'primary';
    }
  };

  // Group actions by type for better organization
  const groupedActions = actions.reduce((groups, action) => {
    const key = action.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(action);
    return groups;
  }, {} as Record<string, ChatAction[]>);

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Quick Actions:
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(groupedActions).map(([type, typeActions]) => (
          <ButtonGroup 
            key={type}
            size={isMobile ? "medium" : "small"}
            variant="outlined"
            orientation="horizontal"
            sx={{ flexWrap: 'wrap' }}
          >
            {typeActions.map((action, index) => (
              <Button
                key={`${type}-${index}`}
                onClick={() => onActionClick(action)}
                startIcon={getActionIcon(action.type)}
                color={getActionColor(action.type) as any}
                sx={{
                  textTransform: 'none',
                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                  px: isMobile ? 2 : 1.5,
                  py: isMobile ? 1 : 0.5,
                  minWidth: 'auto',
                  minHeight: isMobile ? 44 : 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {action.label}
              </Button>
            ))}
          </ButtonGroup>
        ))}
      </Box>
    </Box>
  );
};