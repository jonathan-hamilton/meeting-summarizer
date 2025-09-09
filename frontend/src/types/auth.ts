// Authentication types for frontend
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPaidUser: boolean;
  tokenBalance: number;
  hasConsentedToDataProcessing: boolean;
  consentDate?: string;
  createdAt: string;
  lastActivityAt: string;
  totalMeetings: number;
  role: 'User' | 'Admin' | 'SuperAdmin';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  hasConsentedToDataProcessing: boolean;
}

export interface JwtPayload {
  sub: string; // user ID
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'User' | 'Admin' | 'SuperAdmin';
  isPaidUser: string;
  tokenBalance: string;
  exp: number;
  iat: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (firstName: string, lastName: string, email: string, password: string, hasConsentedToDataProcessing: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}
