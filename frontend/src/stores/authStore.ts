import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { AuthState, AuthActions, User, JwtPayload } from '../types/auth';
import AuthService from '../services/authService';
import EmailVerificationService from '../services/emailVerificationService';

type AuthStore = AuthState & AuthActions;

const authService = AuthService.getInstance();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      // Email verification state (S6.8)
      verificationPending: false,
      verificationError: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ email, password });
          
          // Decode user info from access token
          const decodedToken = jwtDecode<JwtPayload>(response.accessToken);
          
          // Extract user data from JWT claims - cast to any to access all possible claim fields
          const tokenClaims = decodedToken as any;
          
          // Try different possible claim field names
          const userId = tokenClaims.sub || tokenClaims.userId || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          const userEmail = tokenClaims.email || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
          const fullName = tokenClaims.name || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';
          const userRole = tokenClaims.role || tokenClaims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          
          // Validate required fields
          if (!userId || !userEmail) {
            console.error('❌ Missing required user fields from JWT:', { userId, userEmail });
            throw new Error('Invalid token: missing required user information');
          }
          
          // Split full name into first and last name
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const user: User = {
            id: userId,
            email: userEmail,
            firstName: firstName,
            lastName: lastName,
            role: userRole as 'User' | 'Admin' | 'SuperAdmin',
            isPaidUser: tokenClaims.isPaidUser === 'true',
            tokenBalance: parseInt(tokenClaims.tokenBalance) || 0,
            hasConsentedToDataProcessing: true, // If they logged in, they must have consented
            createdAt: new Date().toISOString(), // Will be updated from backend later
            lastActivityAt: new Date().toISOString(),
            totalMeetings: 0, // Will be updated from backend later
            // Email verification fields (S6.8) - will be updated via checkVerificationStatus
            emailVerified: false, // Default to false, will check with API
            emailVerificationExpiry: undefined
          };

          // console.log('Created user object:', user);

          // Store tokens in localStorage
          authService.setTokens(response.accessToken, response.refreshToken);
          authService.setUser(user);

          set({
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Check email verification status (S6.8) - don't await to avoid blocking login
          get().checkVerificationStatus().catch(console.error);

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (firstName: string, lastName: string, email: string, password: string, hasConsentedToDataProcessing: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register({ 
            firstName, 
            lastName, 
            email, 
            password,
            hasConsentedToDataProcessing
          });
          
          // Decode user info from access token
          const decodedToken = jwtDecode<JwtPayload>(response.accessToken);
          const user: User = {
            id: decodedToken.userId,
            email: decodedToken.email,
            firstName: decodedToken.firstName,
            lastName: decodedToken.lastName,
            role: decodedToken.role as 'User' | 'Admin' | 'SuperAdmin',
            isPaidUser: decodedToken.isPaidUser === 'true',
            tokenBalance: parseInt(decodedToken.tokenBalance) || 0,
            hasConsentedToDataProcessing: hasConsentedToDataProcessing,
            createdAt: new Date().toISOString(), // Will be updated from backend later
            lastActivityAt: new Date().toISOString(),
            totalMeetings: 0 // Will be updated from backend later
          };

          // Store tokens in localStorage
          authService.setTokens(response.accessToken, response.refreshToken);
          authService.setUser(user);

          set({
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Check email verification status (S6.8) - don't await to avoid blocking registration
          get().checkVerificationStatus().catch(console.error);

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        // Clear tokens from localStorage
        authService.clearTokens();
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          
          // Decode user info from new access token
          const decodedToken = jwtDecode<JwtPayload>(response.accessToken);
          const user: User = {
            id: decodedToken.userId,
            email: decodedToken.email,
            firstName: decodedToken.firstName,
            lastName: decodedToken.lastName,
            role: decodedToken.role as 'User' | 'Admin' | 'SuperAdmin',
            isPaidUser: decodedToken.isPaidUser === 'true',
            tokenBalance: parseInt(decodedToken.tokenBalance) || 0,
            hasConsentedToDataProcessing: true, // Preserved from existing session
            createdAt: new Date().toISOString(), // Will be updated from backend later
            lastActivityAt: new Date().toISOString(),
            totalMeetings: 0, // Will be updated from backend later
            // Email verification fields (S6.8) - will be refreshed via checkVerificationStatus
            emailVerified: false, // Default to false, will check with API
            emailVerificationExpiry: undefined
          };

          // Update stored tokens
          authService.setTokens(response.accessToken, response.refreshToken);
          authService.setUser(user);

          set({
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            error: null
          });

          // Check email verification status (S6.8) - don't await to avoid blocking token refresh
          get().checkVerificationStatus().catch(console.error);

          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });
        
        try {
          // Check if tokens exist in localStorage
          const storedAccessToken = authService.getAccessToken();
          const storedRefreshToken = authService.getRefreshToken();
          let storedUser = authService.getStoredUser();

          if (!storedAccessToken || !storedRefreshToken || !storedUser) {
            set({ 
              isLoading: false, 
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshToken: null
            });
            return;
          }

          // Check if stored user object is complete (has id and email)
          if (!storedUser.id || !storedUser.email) {
            console.log('🔧 Stored user incomplete, re-parsing from JWT token');
            try {
              // Re-parse user data from JWT token
              const decodedToken = jwtDecode<JwtPayload>(storedAccessToken);
              const tokenClaims = decodedToken as any;
              
              const userId = tokenClaims.sub || tokenClaims.userId || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
              const userEmail = tokenClaims.email || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
              const fullName = tokenClaims.name || tokenClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';
              const userRole = tokenClaims.role || tokenClaims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
              
              // Split full name into first and last name
              const nameParts = fullName.split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Create complete user object merging JWT data with stored data
              const completeUser: User = {
                id: userId,
                email: userEmail,
                firstName: firstName,
                lastName: lastName,
                role: userRole as 'User' | 'Admin' | 'SuperAdmin',
                isPaidUser: storedUser.isPaidUser || (tokenClaims.isPaidUser === 'true'),
                tokenBalance: storedUser.tokenBalance || parseInt(tokenClaims.tokenBalance) || 0,
                hasConsentedToDataProcessing: storedUser.hasConsentedToDataProcessing || true,
                createdAt: storedUser.createdAt || new Date().toISOString(),
                lastActivityAt: storedUser.lastActivityAt || new Date().toISOString(),
                totalMeetings: storedUser.totalMeetings || 0,
                // Email verification fields (S6.8) - prefer stored data, fallback to JWT claims
                emailVerified: storedUser.emailVerified ?? (tokenClaims.emailVerified === 'true'),
                emailVerificationExpiry: storedUser.emailVerificationExpiry
              };

              console.log('🔧 Re-created complete user:', completeUser);
              
              // Store the complete user object
              authService.setUser(completeUser);
              
              // Update the stored user for further processing
              storedUser = completeUser;
            } catch (error) {
              console.error('Failed to re-parse user from JWT:', error);
              get().logout();
              set({ isLoading: false });
              return;
            }
          }

          // Check if access token is expired
          if (authService.isTokenExpired(storedAccessToken)) {
            // Try to refresh the token
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) {
              set({ isLoading: false });
              return;
            }
          } else {
            // Access token is still valid
            // console.log('Access token valid, restoring user:', storedUser);
            set({
              user: storedUser,
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // Check email verification status (S6.8) - don't await to avoid blocking initialization
            get().checkVerificationStatus().catch(console.error);
          }
        } catch (error) {
          console.error('Auth status check failed:', error);
          get().logout();
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Email verification actions (S6.8)
      resendVerificationEmail: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          return { success: false, error: 'Not authenticated' };
        }

        set({ verificationPending: true, verificationError: null });
        
        try {
          const verificationService = EmailVerificationService.getInstance();
          const response = await verificationService.resendVerificationEmail(accessToken);
          
          set({ verificationPending: false });
          return { success: response.success };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
          set({ 
            verificationPending: false,
            verificationError: errorMessage 
          });
          return { success: false, error: errorMessage };
        }
      },

      checkVerificationStatus: async () => {
        const { accessToken, user } = get();
        if (!accessToken || !user) {
          return;
        }

        try {
          const verificationService = EmailVerificationService.getInstance();
          const status = await verificationService.getVerificationStatus(accessToken);
          
          // Update user verification status
          set({
            user: {
              ...user,
              emailVerified: status.emailVerified
            }
          });
        } catch (error) {
          console.error('Failed to check verification status:', error);
        }
      },

      clearVerificationError: () => {
        set({ verificationError: null });
      },

      // S6.2.2: Password change functionality
      changePassword: async (currentPassword: string, newPassword: string) => {
        const { accessToken } = get();
        if (!accessToken) {
          throw new Error('User not authenticated');
        }

        try {
          console.log('🔑 Attempting password change...');
          await authService.changePassword(currentPassword, newPassword, accessToken);
          console.log('✅ Password change successful');
          // Password change successful - no need to update tokens or user state
        } catch (error) {
          console.error('❌ Password change failed:', error);
          // Re-throw the error to be handled by the UI component
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
