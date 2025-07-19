import { useContext } from 'react';
import type { ThemeContextType } from '../types';
import { ThemeContext } from './ThemeContext';

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
