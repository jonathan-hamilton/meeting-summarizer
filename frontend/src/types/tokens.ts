// Token system types for payment and balance management

export interface TokenPurchase {
  id: string;
  userId: string;
  tokenCount: number;
  amountPaid: number; // in USD cents
  paymentIntentId: string;
  stripeCustomerId?: string;
  purchasedAt: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface TokenUsage {
  id: string;
  userId: string;
  meetingId: string;
  tokensConsumed: number;
  usedAt: string;
  description: string;
}

export interface TokenBalance {
  current: number;
  lastUpdated: string;
  isLoading: boolean;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number; // in USD cents
  tokenCount: number;
  status: string;
  created: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  tokensPurchased?: number;
  amountPaid?: number;
  packageName?: string;
  errorMessage?: string;
  errorCode?: string;
}

export interface TokenCalculation {
  durationMinutes: number;
  baseTokens: number;
  volumeDiscountMultiplier: number;
  volumeDiscountPercentage: number;
  finalTokens: number;
  costInUsd: number;
  costPerMinute: number;
  savingsFromDiscount: number;
  discountDescription: string;
}

export interface StripeConfig {
  publishableKey: string;
  isTestMode: boolean;
  environment: string;
}

// Token store state interface
export interface TokenState {
  // Balance state
  balance: number;
  balanceLastUpdated: Date | null;
  isBalanceLoading: boolean;
  
  // Purchase state
  isPurchaseInProgress: boolean;
  currentPaymentIntent: PaymentIntent | null;
  
  // History state
  purchaseHistory: TokenPurchase[];
  usageHistory: TokenUsage[];
  isHistoryLoading: boolean;
  
  // Stripe configuration
  stripeConfig: StripeConfig | null;
  isStripeConfigLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
  
  // Purchase actions
  startPurchase: () => void;
  completePurchase: (result: PaymentResult) => void;
  cancelPurchase: () => void;
  
  // History actions
  loadPurchaseHistory: () => Promise<void>;
  loadUsageHistory: () => Promise<void>;
  addPurchase: (purchase: TokenPurchase) => void;
  addUsage: (usage: TokenUsage) => void;
  
  // Configuration actions
  loadStripeConfig: () => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// Pre-defined token packages for purchase
export interface TokenPackage {
  id: string;
  name: string;
  tokenCount: number;
  priceUsd: number; // in dollars (not cents)
  description: string;
  isPopular?: boolean;
  savingsPercentage?: number;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokenCount: 500,
    priceUsd: 25.00,
    description: 'Perfect for getting started - ~125 minutes of meetings',
  },
  {
    id: 'professional', 
    name: 'Professional Pack',
    tokenCount: 1200,
    priceUsd: 54.00, // 10% bulk discount
    description: 'Great for regular users - ~300 minutes of meetings',
    isPopular: true,
    savingsPercentage: 10
  },
  {
    id: 'business',
    name: 'Business Pack', 
    tokenCount: 2500,
    priceUsd: 100.00, // 20% bulk discount  
    description: 'Best for teams and heavy users - ~625 minutes of meetings',
    savingsPercentage: 20
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokenCount: 5000, 
    priceUsd: 175.00, // 30% bulk discount
    description: 'Maximum value for organizations - ~1250 minutes of meetings',
    savingsPercentage: 30
  }
];