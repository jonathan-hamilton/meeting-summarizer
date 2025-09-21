import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getTheme } from './index';
import type { ThemeMode, ThemeContextType } from '../types';
import { ThemeContext } from './ThemeContext';
import { useAccessibilityStore } from '../stores/accessibilityStore';

// Theme provider component props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Use accessibility store for high contrast mode
  const { 
    highContrast, 
    setHighContrast: setHighContrastState,
    detectSystemPreferences 
  } = useAccessibilityStore();

  // Save theme preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Apply data-theme attribute to document element for CSS targeting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, [mode]);

  // Detect system preferences on mount
  useEffect(() => {
    detectSystemPreferences();
  }, [detectSystemPreferences]);

  // Listen for system preference changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      // Only update if no saved preference exists
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    darkModeQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const toggleHighContrast = () => {
    setHighContrastState(!highContrast);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
  };

  const currentTheme = getTheme(mode, highContrast);

  const contextValue: ThemeContextType = {
    mode,
    highContrast,
    toggleTheme,
    toggleHighContrast,
    setHighContrast,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
