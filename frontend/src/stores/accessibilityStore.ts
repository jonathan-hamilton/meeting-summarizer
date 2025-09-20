import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AccessibilityState {
  // Live region announcements for screen readers
  announcement: string;
  
  // Dialog states - centralized for keyboard shortcuts
  helpDialogOpen: boolean;
  privacyPolicyOpen: boolean;
  
  // Modal focus management
  activeModalId: string | null;
  focusElementBeforeModal: HTMLElement | null;
  modalStack: string[]; // Track multiple modals for nested scenarios
  
  // Actions
  setAnnouncement: (message: string, timeout?: number) => void;
  clearAnnouncement: () => void;
  setHelpDialogOpen: (open: boolean) => void;
  setPrivacyPolicyOpen: (open: boolean) => void;
  
  // Modal management actions
  openModal: (modalId: string, focusElement?: HTMLElement) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Focus management
  setFocusElementBeforeModal: (element: HTMLElement | null) => void;
  restoreFocusAfterModal: () => void;
  
  // Utility actions for common announcements
  announceTranscriptionComplete: () => void;
  announceModeChange: (mode: 'development' | 'production') => void;
  announceThemeChange: (theme: 'light' | 'dark') => void;
  announceModalOpen: (modalName: string) => void;
  announceModalClose: (modalName: string) => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      announcement: '',
      helpDialogOpen: false,
      privacyPolicyOpen: false,
      activeModalId: null,
      focusElementBeforeModal: null,
      modalStack: [],
      
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
      
      setPrivacyPolicyOpen: (open: boolean) => set({ privacyPolicyOpen: open }),
      
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
    }),
    {
      name: 'accessibility-store',
    }
  )
);