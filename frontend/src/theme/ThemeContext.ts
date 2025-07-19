import { createContext } from 'react';
import type { ThemeContextType } from '../types';

// Create theme context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
