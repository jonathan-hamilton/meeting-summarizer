import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance as TokenIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTokenStore, useTokenBalance, useTokenLoading, useTokenError } from '../stores/tokenStore';

interface TokenBalanceDisplayProps {
  onPurchaseClick?: () => void;
  compact?: boolean;
}

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({
  onPurchaseClick,
  compact = false,
}) => {
  const balance = useTokenBalance();
  const isLoading = useTokenLoading();
  const error = useTokenError();
  const { refreshBalance, clearError } = useTokenStore();

  const handleRefreshClick = () => {
    clearError();
    refreshBalance();
  };

  const handlePurchaseClick = () => {
    if (onPurchaseClick) {
      onPurchaseClick();
    }
  };

  // Determine color based on balance level
  const getBalanceColor = (balance: number) => {
    if (balance <= 10) return 'error';
    if (balance <= 50) return 'warning';
    return 'success';
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}k`;
    }
    return balance.toString();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
        <Tooltip 
          title={error ? `Error: ${error}` : `Token Balance: ${balance} tokens`}
          arrow
        >
          <Chip
            icon={isLoading ? <CircularProgress size={16} color="inherit" /> : <TokenIcon />}
            label={formatBalance(balance)}
            color={error ? 'error' : getBalanceColor(balance)}
            size="small"
            onClick={handlePurchaseClick}
            sx={{
              cursor: onPurchaseClick ? 'pointer' : 'default',
              '&:hover': onPurchaseClick ? {
                transform: 'scale(1.05)',
              } : {},
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        </Tooltip>

        {/* Refresh button - only show if there's an error */}
        {error && (
          <Tooltip title="Refresh balance" arrow>
            <IconButton
              size="small"
              onClick={handleRefreshClick}
              sx={{ ml: 0.5, p: 0.5 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mr: 2,
      p: 1,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      backgroundColor: 'background.paper',
    }}>
      {/* Token Icon */}
      <TokenIcon sx={{ mr: 1, color: 'primary.main' }} />
      
      {/* Balance Display */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography variant="caption" color="text.secondary">
          Tokens
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isLoading ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
              {balance.toLocaleString()}
            </Typography>
          )}
          
          {error && (
            <Tooltip title={`Error: ${error}`} arrow>
              <Typography variant="caption" color="error.main" sx={{ mr: 1 }}>
                !
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
        {/* Purchase Button */}
        {onPurchaseClick && (
          <Tooltip title="Buy more tokens" arrow>
            <IconButton
              size="small"
              onClick={handlePurchaseClick}
              sx={{ mb: 0.5, p: 0.5 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Refresh Button */}
        <Tooltip title="Refresh balance" arrow>
          <IconButton
            size="small"
            onClick={handleRefreshClick}
            disabled={isLoading}
            sx={{ p: 0.5 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};