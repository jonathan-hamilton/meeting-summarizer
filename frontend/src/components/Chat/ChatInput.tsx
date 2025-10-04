import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import { useChatStore } from '../../stores/chatStore';

interface ChatInputProps {
  disabled?: boolean;
}

/**
 * Chat input component with send button
 */
export const ChatInput: React.FC<ChatInputProps> = ({ disabled = false }) => {
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading, sessionLimitReached } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || sessionLimitReached || disabled) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = disabled || isLoading || sessionLimitReached;
  
  const getPlaceholder = () => {
    if (sessionLimitReached) {
      return 'Message limit reached - refresh to continue';
    }
    if (isLoading) {
      return 'Sending message...';
    }
    return 'Ask about the app...';
  };

  const getHelperText = () => {
    if (sessionLimitReached) {
      return 'Refresh the page to start a new conversation';
    }
    return 'Press Enter to send, Shift+Enter for new line'; // Hide message count
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <TextField
        fullWidth
        multiline
        maxRows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={getPlaceholder()}
        disabled={isDisabled}
        helperText={getHelperText()}
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={isDisabled ? 'Cannot send message' : 'Send message'}>
                <span>
                  <IconButton
                    type="submit"
                    disabled={isDisabled || !message.trim()}
                    size="small"
                    color="primary"
                    aria-label="Send message"
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
          sx: {
            backgroundColor: (theme) => theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: (theme) => theme.palette.divider,
            },
          },
        }}
        sx={{
          '& .MuiFormHelperText-root': {
            fontSize: '0.75rem',
            color: sessionLimitReached 
              ? (theme) => theme.palette.error.main 
              : (theme) => theme.palette.text.secondary, // Remove warning color for message count
          },
        }}
      />
    </Box>
  );
};