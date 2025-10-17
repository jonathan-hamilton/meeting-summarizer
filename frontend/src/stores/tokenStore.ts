import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '../services/authService';
import type { 
  TokenState, 
  TokenPurchase, 
  TokenUsage, 
  PaymentResult,
  StripeConfig 
} from '../types/tokens';
import { useAuthStore } from './authStore';

// Token API service calls
// Environment detection for different deployment modes
const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5173';
const isContainer = window.location.hostname === 'localhost' && window.location.port === '8080';

let API_BASE_URL: string;
if (isLocalDev) {
  API_BASE_URL = 'http://localhost:5029';
} else if (isContainer) {
  API_BASE_URL = 'http://localhost:8080';
} else {
  API_BASE_URL = '';
}

class TokenAPI {
  static async getBalance(): Promise<{ balance: number }> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) throw new Error('No access token available');

    const response = await fetch(`${API_BASE_URL}/api/token/balance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }

    return response.json();
  }

  static async getPurchaseHistory(): Promise<TokenPurchase[]> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) throw new Error('No access token available');

    const response = await fetch(`${API_BASE_URL}/api/token/purchases`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase history: ${response.statusText}`);
    }

    return response.json();
  }

  static async getUsageHistory(): Promise<TokenUsage[]> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) throw new Error('No access token available');

    const response = await fetch(`${API_BASE_URL}/api/token/history`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage history: ${response.statusText}`);
    }

    const historyData = await response.json();
    return historyData.usages || []; // Extract just the usage data from combined history
  }

  static async getStripeConfig(): Promise<StripeConfig> {
    const response = await fetch(`${API_BASE_URL}/api/environment/stripe`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe configuration: ${response.statusText}`);
    }

    return response.json();
  }
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      // Initial state
      balance: 0,
      balanceLastUpdated: null,
      isBalanceLoading: false,
      
      isPurchaseInProgress: false,
      currentPaymentIntent: null,
      
      purchaseHistory: [],
      usageHistory: [],
      isHistoryLoading: false,
      
      stripeConfig: null,
      isStripeConfigLoading: false,
      
      error: null,

      // Balance actions
      updateBalance: (newBalance: number) => {
        set({ 
          balance: newBalance, 
          balanceLastUpdated: new Date() 
        });
        
        // Also update the auth store for consistency
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          // Update user with new token balance
          const updatedUser = {
            ...authStore.user,
            tokenBalance: newBalance
          };
          
          // Update the authStore state directly
          useAuthStore.setState({ user: updatedUser });
          
          // Also update the authService
          const authService = AuthService.getInstance();
          authService.setUser(updatedUser);
        }
      },

      refreshBalance: async () => {
        set({ isBalanceLoading: true, error: null });
        
        try {
          const { balance } = await TokenAPI.getBalance();
          get().updateBalance(balance);
        } catch (error) {
          console.error('Failed to refresh token balance:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh balance',
            isBalanceLoading: false 
          });
          return;
        }
        
        set({ isBalanceLoading: false });
      },

      // Purchase actions
      startPurchase: (tokenCount: number) => {
        set({ 
          isPurchaseInProgress: true,
          error: null 
        });
        console.log(`Starting purchase for ${tokenCount} tokens`);
      },

      completePurchase: (result: PaymentResult) => {
        set({ isPurchaseInProgress: false, currentPaymentIntent: null });
        
        if (result.success && result.tokensPurchased) {
          // Update balance with new tokens
          const currentBalance = get().balance;
          get().updateBalance(currentBalance + result.tokensPurchased);
          
          // Add purchase to history if we have the details
          if (result.paymentIntentId && result.amountPaid) {
            const newPurchase: TokenPurchase = {
              id: result.paymentIntentId,
              userId: useAuthStore.getState().user?.id || '',
              tokenCount: result.tokensPurchased,
              amountPaid: result.amountPaid,
              paymentIntentId: result.paymentIntentId,
              purchasedAt: new Date().toISOString(),
              status: 'completed'
            };
            
            get().addPurchase(newPurchase);
          }
          
          console.log(`Purchase completed: ${result.tokensPurchased} tokens added`);
        } else {
          set({ 
            error: result.errorMessage || 'Purchase failed' 
          });
          console.error('Purchase failed:', result.errorMessage);
        }
      },

      cancelPurchase: () => {
        set({ 
          isPurchaseInProgress: false,
          currentPaymentIntent: null,
          error: null 
        });
        console.log('Purchase cancelled');
      },

      // History actions
      loadPurchaseHistory: async () => {
        set({ isHistoryLoading: true, error: null });
        
        try {
          const purchases = await TokenAPI.getPurchaseHistory();
          set({ 
            purchaseHistory: purchases,
            isHistoryLoading: false 
          });
        } catch (error) {
          console.error('Failed to load purchase history:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load purchase history',
            isHistoryLoading: false 
          });
        }
      },

      loadUsageHistory: async () => {
        set({ isHistoryLoading: true, error: null });
        
        try {
          const usage = await TokenAPI.getUsageHistory();
          set({ 
            usageHistory: usage,
            isHistoryLoading: false 
          });
        } catch (error) {
          console.error('Failed to load usage history:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load usage history',
            isHistoryLoading: false 
          });
        }
      },

      addPurchase: (purchase: TokenPurchase) => {
        set((state) => ({
          purchaseHistory: [purchase, ...state.purchaseHistory]
        }));
      },

      addUsage: (usage: TokenUsage) => {
        set((state) => ({
          usageHistory: [usage, ...state.usageHistory]
        }));
        
        // Deduct tokens from balance
        const newBalance = Math.max(0, get().balance - usage.tokensConsumed);
        get().updateBalance(newBalance);
      },

      // Configuration actions
      loadStripeConfig: async () => {
        // Return early if already loaded
        if (get().stripeConfig) return;
        
        set({ isStripeConfigLoading: true, error: null });
        
        try {
          const config = await TokenAPI.getStripeConfig();
          set({ 
            stripeConfig: config,
            isStripeConfigLoading: false 
          });
        } catch (error) {
          console.error('Failed to load Stripe configuration:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load Stripe configuration',
            isStripeConfigLoading: false 
          });
        }
      },

      // Utility actions
      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          balance: 0,
          balanceLastUpdated: null,
          isBalanceLoading: false,
          isPurchaseInProgress: false,
          currentPaymentIntent: null,
          purchaseHistory: [],
          usageHistory: [],
          isHistoryLoading: false,
          stripeConfig: null,
          isStripeConfigLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'token-store', // Key for localStorage
      partialize: (state) => ({
        // Only persist essential state, not loading states or errors
        balance: state.balance,
        balanceLastUpdated: state.balanceLastUpdated,
        purchaseHistory: state.purchaseHistory,
        usageHistory: state.usageHistory,
        stripeConfig: state.stripeConfig
      })
    }
  )
);

// Selector hooks for common use cases
export const useTokenBalance = () => useTokenStore((state) => state.balance);
export const useTokenLoading = () => useTokenStore((state) => state.isBalanceLoading || state.isPurchaseInProgress);
export const useTokenError = () => useTokenStore((state) => state.error);
export const usePurchaseInProgress = () => useTokenStore((state) => state.isPurchaseInProgress);
export const useStripeConfig = () => useTokenStore((state) => state.stripeConfig);