import React, { useState, useEffect, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Typography,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { ProgressNotification } from '../../types/progress';

interface ProgressNotificationProps {
  notification: ProgressNotification | null;
  onClose: () => void;
  autoHideDuration?: number;
}

const NotificationSlide = React.forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const ProgressNotificationComponent: React.FC<ProgressNotificationProps> = ({
  notification,
  onClose,
  autoHideDuration = 6000,
}) => {
  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  }, [onClose]);

  if (!notification) {
    return null;
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const shouldAutoHide = notification.autoHide !== false;
  const duration = notification.duration || autoHideDuration;

  return (
    <Snackbar
      open={true}
      autoHideDuration={shouldAutoHide ? duration : null}
      onClose={handleClose}
      TransitionComponent={NotificationSlide}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          padding: 0,
        },
      }}
    >
      <Alert
        severity={notification.type}
        icon={getIcon()}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            flex: 1,
          },
        }}
      >
        <AlertTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {notification.title}
        </AlertTitle>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {notification.message}
        </Typography>
        
        {/* Optional file ID display for debugging */}
        {notification.fileId && process.env.NODE_ENV === 'development' && (
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              display: 'block',
              opacity: 0.7,
              fontFamily: 'monospace',
            }}
          >
            File ID: {notification.fileId}
          </Typography>
        )}
      </Alert>
    </Snackbar>
  );
};

// Notification queue manager
interface NotificationQueueManagerProps {
  children?: React.ReactNode;
}

// Progress notification context
const ProgressNotificationContext = React.createContext<{
  addNotification: (notification: ProgressNotification) => void;
  removeNotification: (id: string) => void;
} | null>(null);

export const NotificationQueueManager: React.FC<NotificationQueueManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<ProgressNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<ProgressNotification | null>(null);

  // Add notification to queue
  const addNotification = useCallback((notification: ProgressNotification) => {
    setNotifications(prev => [...prev, notification]);
  }, []);

  // Remove notification from queue
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (currentNotification?.id === id) {
      setCurrentNotification(null);
    }
  }, [currentNotification]);

  // Show next notification when current one closes
  useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      const next = notifications[0];
      setCurrentNotification(next);
      setNotifications(prev => prev.slice(1));
    }
  }, [currentNotification, notifications]);

  const handleCloseCurrentNotification = useCallback(() => {
    if (currentNotification) {
      setCurrentNotification(null);
    }
  }, [currentNotification]);

  // Provide notification context to children
  const contextValue = React.useMemo(() => ({
    addNotification,
    removeNotification,
  }), [addNotification, removeNotification]);

  return (
    <ProgressNotificationContext.Provider value={contextValue}>
      {children}
      <ProgressNotificationComponent
        notification={currentNotification}
        onClose={handleCloseCurrentNotification}
      />
    </ProgressNotificationContext.Provider>
  );
};

// Hook to use progress notifications
export const useProgressNotification = () => {
  const context = React.useContext(ProgressNotificationContext);
  if (!context) {
    throw new Error('useProgressNotification must be used within a NotificationQueueManager');
  }
  return context;
};

// Convenience functions for common notification types
export const createProgressNotification = {
  success: (title: string, message: string, fileId?: string): ProgressNotification => ({
    id: `${Date.now()}-${Math.random()}`,
    type: 'success',
    title,
    message,
    fileId,
    timestamp: new Date(),
    autoHide: true,
    duration: 4000,
  }),

  error: (title: string, message: string, fileId?: string): ProgressNotification => ({
    id: `${Date.now()}-${Math.random()}`,
    type: 'error',
    title,
    message,
    fileId,
    timestamp: new Date(),
    autoHide: false, // Error notifications should be manually dismissed
  }),

  warning: (title: string, message: string, fileId?: string): ProgressNotification => ({
    id: `${Date.now()}-${Math.random()}`,
    type: 'warning',
    title,
    message,
    fileId,
    timestamp: new Date(),
    autoHide: true,
    duration: 6000,
  }),

  info: (title: string, message: string, fileId?: string): ProgressNotification => ({
    id: `${Date.now()}-${Math.random()}`,
    type: 'info',
    title,
    message,
    fileId,
    timestamp: new Date(),
    autoHide: true,
    duration: 5000,
  }),
};

export default ProgressNotificationComponent;