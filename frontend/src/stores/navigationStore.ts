import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface NavigationState {
  // Mobile drawer state
  mobileDrawerOpen: boolean;
  
  // Actions
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mobileDrawerOpen: false,
      
      // Actions
      openMobileDrawer: () => {
        set({ mobileDrawerOpen: true });
      },
      
      closeMobileDrawer: () => {
        set({ mobileDrawerOpen: false });
      },
      
      toggleMobileDrawer: () => {
        const { mobileDrawerOpen } = get();
        set({ mobileDrawerOpen: !mobileDrawerOpen });
      },
    }),
    {
      name: 'navigation-store', // Name for devtools
    }
  )
);

// Convenience hooks for specific actions
export const useOpenMobileDrawer = () => useNavigationStore(state => state.openMobileDrawer);
export const useCloseMobileDrawer = () => useNavigationStore(state => state.closeMobileDrawer);
export const useToggleMobileDrawer = () => useNavigationStore(state => state.toggleMobileDrawer);
export const useMobileDrawerOpen = () => useNavigationStore(state => state.mobileDrawerOpen);