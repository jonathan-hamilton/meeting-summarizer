import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import type { ChatMessage } from '../../stores/chatStore';
import { ChatActions } from './ChatActions';
import { ChatActionService } from '../../services/chatActionService';

interface ChatMessageProps {
  message: ChatMessage;
}

/**
 * Individual chat message component
 */
export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.isUser;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          backgroundColor: isUser 
            ? (theme) => theme.palette.primary.main 
            : (theme) => theme.palette.grey[600],
          fontSize: '0.875rem',
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
      </Avatar>

      <Paper
        elevation={1}
        sx={{
          maxWidth: '80%',
          p: 1.5,
          backgroundColor: isUser
            ? (theme) => theme.palette.primary.main
            : '#f5f5f5', // Light gray background for bot messages
          color: isUser
            ? (theme) => theme.palette.primary.contrastText
            : (theme) => theme.palette.text.primary,
          borderRadius: 2,
          border: isUser 
            ? 'none'
            : (theme) => `1px solid ${theme.palette.divider}`,
          '&:hover': {
            elevation: 2,
          },
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap', // Preserve line breaks
            color: isUser 
              ? '#ffffff !important' // Force white text for user messages with !important
              : '#000000 !important', // Force black text for bot messages with !important
            fontWeight: 400,
          }}
        >
          {message.content}
        </Typography>

        {/* Show actionable buttons for AI messages only */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <ChatActions 
            actions={message.actions}
            onActionClick={(action) => ChatActionService.executeAction(action)}
          />
        )}
        
        <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Chip
            label={message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              color: isUser 
                ? 'rgba(255, 255, 255, 0.8)' // Semi-transparent white for user messages
                : (theme) => theme.palette.text.secondary,
              borderColor: isUser 
                ? 'rgba(255, 255, 255, 0.5)' // Semi-transparent white border
                : (theme) => theme.palette.divider,
              backgroundColor: 'transparent',
              '& .MuiChip-label': {
                color: isUser 
                  ? 'rgba(255, 255, 255, 0.8)'
                  : (theme) => theme.palette.text.secondary,
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};