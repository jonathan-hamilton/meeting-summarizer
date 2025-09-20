import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AccessibilityState {
  // Live region announcements for screen readers
  announcement: string;
  
  // Dialog states - centralized for keyboard shortcuts
  helpDialogOpen: boolean;
  privacyPolicyOpen: boolean;
  
  // Actions
  setAnnouncement: (message: string, timeout?: number) => void;
  clearAnnouncement: () => void;
  setHelpDialogOpen: (open: boolean) => void;
  setPrivacyPolicyOpen: (open: boolean) => void;
  
  // Utility actions for common announcements
  announceTranscriptionComplete: () => void;
  announceModeChange: (mode: 'development' | 'production') => void;
  announceThemeChange: (theme: 'light' | 'dark') => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      announcement: '',
      helpDialogOpen: false,
      privacyPolicyOpen: false,
      
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
    }),
    {
      name: 'accessibility-store',
    }
  )
);