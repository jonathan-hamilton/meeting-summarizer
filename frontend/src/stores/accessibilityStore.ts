import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AccessibilityState {
  // Live region announcements for screen readers
  announcement: string;
  
  // Dialog states - centralized for keyboard shortcuts
  helpDialogOpen: boolean;
  
  // Modal focus management
  activeModalId: string | null;
  focusElementBeforeModal: HTMLElement | null;
  modalStack: string[]; // Track multiple modals for nested scenarios
  
  // Color & Visual Accessibility (S6.6 Increment 5)
  highContrast: boolean;
  reduceMotion: boolean;
  enhancedFocusIndicators: boolean;
  largeText: boolean;
  
  // System preferences detection
  systemPreferences: {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    prefersDarkMode: boolean;
  };
  
  // Actions
  setAnnouncement: (message: string, timeout?: number) => void;
  clearAnnouncement: () => void;
  setHelpDialogOpen: (open: boolean) => void;
  
  // Modal management actions
  openModal: (modalId: string, focusElement?: HTMLElement) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Focus management
  setFocusElementBeforeModal: (element: HTMLElement | null) => void;
  restoreFocusAfterModal: () => void;
  
  // Color & Visual Accessibility Actions (S6.6 Increment 5)
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setEnhancedFocusIndicators: (enabled: boolean) => void;
  setLargeText: (enabled: boolean) => void;
  
  // System preferences detection
  detectSystemPreferences: () => void;
  
  // Color accessibility utilities
  announceHighContrastChange: (enabled: boolean) => void;
  announceMotionPreferenceChange: (enabled: boolean) => void;
  
  // Utility actions for common announcements
  announceTranscriptionComplete: () => void;
  announceModeChange: (mode: 'development' | 'production') => void;
  announceThemeChange: (theme: 'light' | 'dark') => void;
  announceModalOpen: (modalName: string) => void;
  announceModalClose: (modalName: string) => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  devtools(
    persist(
      (set, get) => ({
      // Initial state
      announcement: '',
      helpDialogOpen: false,
      activeModalId: null,
      focusElementBeforeModal: null,
      modalStack: [],
      
      // Color & Visual Accessibility Initial State
      highContrast: false,
      reduceMotion: false,
      enhancedFocusIndicators: true, // Default to enabled for better accessibility
      largeText: false,
      
      // System preferences (detected on initialization)
      systemPreferences: {
        prefersReducedMotion: typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
          : false,
        prefersHighContrast: typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-contrast: high)').matches 
          : false,
        prefersDarkMode: typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-color-scheme: dark)').matches 
          : false,
      },
      
      // Actions
      setAnnouncement: (message: string, timeout = 1000) => {
        set({ announcement: message });
        if (timeout > 0) {
          setTimeout(() => {
            // Only clear if the message hasn't changed
            if (get().announcement === message) {
              set({ announcement: '' });
            }
          }, timeout);
        }
      },
      
      clearAnnouncement: () => set({ announcement: '' }),
      
      setHelpDialogOpen: (open: boolean) => set({ helpDialogOpen: open }),
      
      // Modal management
      openModal: (modalId: string, focusElement?: HTMLElement) => {
        const state = get();
        
        // Store focus element if provided or use currently focused element
        const elementToStore = focusElement || document.activeElement as HTMLElement;
        
        set({
          activeModalId: modalId,
          focusElementBeforeModal: elementToStore,
          modalStack: [...state.modalStack, modalId]
        });
        
        // Announce modal opening to screen readers
        get().announceModalOpen(modalId);
      },
      
      closeModal: (modalId: string) => {
        const state = get();
        const newStack = state.modalStack.filter(id => id !== modalId);
        const newActiveModal = newStack.length > 0 ? newStack[newStack.length - 1] : null;
        
        set({
          activeModalId: newActiveModal,
          modalStack: newStack,
          // Only clear focus element if we're closing the last modal
          focusElementBeforeModal: newStack.length === 0 ? null : state.focusElementBeforeModal
        });
        
        // Restore focus if this was the last modal
        if (newStack.length === 0) {
          get().restoreFocusAfterModal();
        }
        
        // Announce modal closing to screen readers
        get().announceModalClose(modalId);
      },
      
      closeAllModals: () => {
        set({
          activeModalId: null,
          modalStack: []
        });
        get().restoreFocusAfterModal();
      },
      
      isModalOpen: (modalId: string) => {
        return get().modalStack.includes(modalId);
      },
      
      // Focus management
      setFocusElementBeforeModal: (element: HTMLElement | null) => {
        set({ focusElementBeforeModal: element });
      },
      
      restoreFocusAfterModal: () => {
        const { focusElementBeforeModal } = get();
        if (focusElementBeforeModal && document.contains(focusElementBeforeModal)) {
          focusElementBeforeModal.focus();
        }
        set({ focusElementBeforeModal: null });
      },
      
      // Utility actions for common announcements
      announceTranscriptionComplete: () => {
        get().setAnnouncement('Transcription completed successfully');
      },
      
      announceModeChange: (mode: 'development' | 'production') => {
        get().setAnnouncement(`Switched to ${mode} mode`);
      },
      
      announceThemeChange: (theme: 'light' | 'dark') => {
        get().setAnnouncement(`Switched to ${theme} theme`);
      },
      
      announceModalOpen: (modalName: string) => {
        const friendlyName = modalName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        get().setAnnouncement(`${friendlyName} dialog opened`);
      },
      
      announceModalClose: (modalName: string) => {
        const friendlyName = modalName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        get().setAnnouncement(`${friendlyName} dialog closed`);
      },
      
      // Color & Visual Accessibility Actions
      setHighContrast: (enabled: boolean) => {
        set({ highContrast: enabled });
        
        // Announce change to screen readers
        get().announceHighContrastChange(enabled);
      },
      
      setReduceMotion: (enabled: boolean) => {
        set({ reduceMotion: enabled });
        
        // Announce change to screen readers
        get().announceMotionPreferenceChange(enabled);
      },
      
      setEnhancedFocusIndicators: (enabled: boolean) => {
        set({ enhancedFocusIndicators: enabled });
        
        get().setAnnouncement(
          enabled ? 'Enhanced focus indicators enabled' : 'Enhanced focus indicators disabled'
        );
      },
      
      setLargeText: (enabled: boolean) => {
        set({ largeText: enabled });
        
        // Apply CSS custom property for text scaling
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty(
            '--text-scale-factor', 
            enabled ? '1.25' : '1'
          );
        }
        
        get().setAnnouncement(
          enabled ? 'Large text mode enabled' : 'Large text mode disabled'
        );
      },
      
      // System Preference Detection
      detectSystemPreferences: () => {
        if (typeof window === 'undefined') return;
        
        const systemPreferences = {
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
          prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        };
        
        set({ systemPreferences });
        
        // Auto-apply system preferences if user hasn't manually set them
        const currentState = get();
        if (systemPreferences.prefersReducedMotion && !currentState.reduceMotion) {
          get().setReduceMotion(true);
        }
        if (systemPreferences.prefersHighContrast && !currentState.highContrast) {
          get().setHighContrast(true);
        }
      },
      
      // Accessibility-specific announcements
      announceHighContrastChange: (enabled: boolean) => {
        get().setAnnouncement(
          enabled ? 'High contrast mode enabled' : 'High contrast mode disabled'
        );
      },
      
      announceMotionPreferenceChange: (enabled: boolean) => {
        get().setAnnouncement(
          enabled ? 'Reduced motion enabled' : 'Motion restored'
        );
      },
    }),
    {
      name: 'accessibility-store',
      // Persist visual accessibility preferences
      partialize: (state) => ({
        highContrast: state.highContrast,
        reduceMotion: state.reduceMotion,
        enhancedFocusIndicators: state.enhancedFocusIndicators,
        largeText: state.largeText,
      }),
    }
    ),
    {
      name: 'accessibility-store-devtools',
    }
  )
);