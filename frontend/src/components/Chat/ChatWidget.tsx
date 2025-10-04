import React from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
} from '@mui/material';
import {
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useChatStore } from '../../stores/chatStore';

interface ChatWidgetProps {
  className?: string;
}

/**
 * Floating chat widget button that toggles the chat panel
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const { isOpen, toggleChat, sessionLimitReached } = useChatStore();

  const getTooltipText = () => {
    if (sessionLimitReached) {
      return 'Chat limit reached - refresh to start new conversation';
    }
    if (isOpen) {
      return 'Close chat assistant';
    }
    return 'Chat assistant'; // Hide message count from tooltip
  };

  const getWidgetColor = () => {
    if (sessionLimitReached) return 'error';
    return 'default';
  };

  return (
    <Zoom in={!isOpen}>
      <Tooltip title={getTooltipText()} placement="left">
        <Badge
          badgeContent={sessionLimitReached ? '!' : undefined}
          color="error"
          variant={sessionLimitReached ? 'standard' : 'dot'}
          invisible={!sessionLimitReached}
        >
          <Fab
            className={className}
            color={getWidgetColor()}
            onClick={toggleChat}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300, // Higher than modals
              backgroundColor: (theme) => 
                sessionLimitReached 
                  ? theme.palette.error.main 
                  : theme.palette.grey[600],
              color: 'white',
              '&:hover': {
                backgroundColor: (theme) => 
                  sessionLimitReached 
                    ? theme.palette.error.dark 
                    : theme.palette.grey[700],
              },
              transition: 'all 0.3s ease-in-out',
            }}
            aria-label="Open chat assistant" // Always "open" since it only shows when closed
            disabled={false}
          >
            <ChatIcon />
          </Fab>
        </Badge>
      </Tooltip>
    </Zoom>
  );
};