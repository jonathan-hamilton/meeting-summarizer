import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPaidUser: boolean;
  tokenBalance: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  hasConsentedToDataProcessing?: boolean;
}

export interface UserStats {
  userId: string;
  tokenBalance: number;
  isPaidUser: boolean;
  totalMeetings: number;
  completedMeetings: number;
  pendingMeetings: number;
  totalStorageUsed: number;
  lastActivityAt: string;
  accountCreatedAt: string;
}

// Store state interface
interface UserProfileState {
  // Current user profile
  profile: UserProfile | null;
  stats: UserStats | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isProfileDialogOpen: boolean;
  
  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setStats: (stats: UserStats | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openProfileDialog: () => void;
  closeProfileDialog: () => void;
  clearProfile: () => void;
}

// Create the store
export const useUserProfileStore = create<UserProfileState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        profile: null,
        stats: null,
        isLoading: false,
        error: null,
        isProfileDialogOpen: false,

        // Actions
        setProfile: (profile) => 
          set({ profile }, false, 'setProfile'),

        setStats: (stats) => 
          set({ stats }, false, 'setStats'),

        updateProfile: (updates) => 
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null
          }), false, 'updateProfile'),

        setLoading: (isLoading) => 
          set({ isLoading }, false, 'setLoading'),

        setError: (error) => 
          set({ error }, false, 'setError'),

        openProfileDialog: () => 
          set({ isProfileDialogOpen: true }, false, 'openProfileDialog'),

        closeProfileDialog: () => 
          set({ isProfileDialogOpen: false }, false, 'closeProfileDialog'),

        clearProfile: () => 
          set({ 
            profile: null, 
            stats: null, 
            error: null, 
            isProfileDialogOpen: false 
          }, false, 'clearProfile'),
      }),
      {
        name: 'user-profile-store',
        // Only persist profile data, not UI state
        partialize: (state) => ({
          profile: state.profile,
          stats: state.stats,
        }),
      }
    ),
    {
      name: 'UserProfileStore',
    }
  )
);

// Convenience selectors with stable references
export const useUserProfile = () => useUserProfileStore((state) => state.profile);
export const useUserStats = () => useUserProfileStore((state) => state.stats);

// Separate selectors to avoid object recreation
export const useUserProfileDialogState = () => useUserProfileStore((state) => state.isProfileDialogOpen);
export const useUserProfileDialogOpen = () => useUserProfileStore((state) => state.openProfileDialog);
export const useUserProfileDialogClose = () => useUserProfileStore((state) => state.closeProfileDialog);

export const useUserProfileLoading = () => useUserProfileStore((state) => state.isLoading);
export const useUserProfileError = () => useUserProfileStore((state) => state.error);
