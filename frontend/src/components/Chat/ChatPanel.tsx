import React, { useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { useChatStore } from '../../stores/chatStore';
import { useChatAnalyticsStore } from '../../stores/chatAnalyticsStore';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Main chat panel with messages and input
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({ open, onClose }) => {
  const { 
    messages, 
    isLoading, 
    error, 
    sessionLimitReached,
    clearMessages,
    setError,
    sessionId,
  } = useChatStore();
  
  const { startSession, endSession } = useChatAnalyticsStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track session analytics
  useEffect(() => {
    if (open && sessionId) {
      startSession(sessionId);
    }
    
    return () => {
      if (sessionId) {
        endSession(undefined, true); // Assume issue resolved when chat is closed
      }
    };
  }, [open, sessionId, startSession, endSession]);

  const handleRefresh = () => {
    if (sessionId) {
      endSession(undefined, false); // Session ended without resolution
    }
    clearMessages();
    setError(null);
  };

  const getWelcomeMessage = () => {
    if (sessionLimitReached) {
      return "You've reached the message limit for this session. Refresh to start a new conversation.";
    }
    if (messages.length === 0) {
      return "Hi! I'm here to help you navigate meeting-summary.io. Ask me about uploading files, transcription, speaker mapping, or any other features!";
    }
    return null;
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        zIndex: 1300,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          height: '100vh',
          backgroundColor: (theme) => theme.palette.background.default,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon />
          <Typography variant="h6" component="h2">
            Chat Assistant
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {sessionLimitReached && (
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{ color: 'inherit' }}
              aria-label="Start new conversation"
            >
              <RefreshIcon />
            </IconButton>
          )}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'inherit' }}
            aria-label="Close chat"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Status Bar - Hide message count, only show when limit reached */}
      {sessionLimitReached && (
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: (theme) => theme.palette.grey[50],
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Session limit reached
          </Typography>
        </Box>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Welcome Message */}
        {welcomeMessage && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: (theme) => theme.palette.info.light,
              color: (theme) => theme.palette.info.contrastText,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">
              {welcomeMessage}
            </Typography>
          </Paper>
        )}

        {/* Session Limit Reached Actions */}
        {sessionLimitReached && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mb: 1 }}
            >
              Start New Conversation
            </Button>
            <Typography variant="caption" display="block" color="text.secondary">
              This will clear your chat history
            </Typography>
          </Box>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessageComponent key={message.id} message={message} />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              color: (theme) => theme.palette.text.secondary,
            }}
          >
            <CircularProgress size={16} />
            <Typography variant="body2">
              Assistant is typing...
            </Typography>
          </Box>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input Area */}
      <ChatInput disabled={sessionLimitReached} />
    </Drawer>
  );
};