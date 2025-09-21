import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Define custom theme interface
declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
    accessibility: {
      focusVisible: {
        outline: string;
        outlineOffset: string;
        backgroundColor?: string;
      };
      highContrast: {
        enabled: boolean;
        border: string;
        focusOutline: string;
      };
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
    accessibility?: {
      focusVisible?: {
        outline?: string;
        outlineOffset?: string;
        backgroundColor?: string;
      };
      highContrast?: {
        enabled?: boolean;
        border?: string;
        focusOutline?: string;
      };
    };
  }
}

// Light theme configuration
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff6b8a',
      dark: '#9a0036',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  status: {
    danger: '#e53e3e',
  },
  accessibility: {
    focusVisible: {
      outline: '3px solid #005fcc', // High contrast blue
      outlineOffset: '2px',
    },
    highContrast: {
      enabled: false,
      border: '2px solid #000000',
      focusOutline: '4px solid #0066cc',
    },
  },
};

// Dark theme configuration
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#bbdefb',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#ffc1cc',
      dark: '#c2185b',
    },
    warning: {
      main: '#ffa726',
      light: '#ffcc02',
      dark: '#ff8f00',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
  typography: lightThemeOptions.typography,
  shape: lightThemeOptions.shape,
  status: {
    danger: '#f56565',
  },
  accessibility: {
    focusVisible: {
      outline: '3px solid #90caf9', // Light blue for dark theme
      outlineOffset: '2px',
      backgroundColor: 'rgba(144, 202, 249, 0.1)', // Subtle background highlight
    },
    highContrast: {
      enabled: false,
      border: '2px solid #ffffff',
      focusOutline: '4px solid #90caf9',
    },
  },
};

// High contrast theme configurations
const highContrastLightOptions: ThemeOptions = {
  ...lightThemeOptions,
  palette: {
    ...lightThemeOptions.palette,
    primary: {
      main: '#000000', // Pure black for maximum contrast
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff', // Pure white
      light: '#ffffff',
      dark: '#cccccc',
      contrastText: '#000000',
    },
    text: {
      primary: '#000000', // Pure black text
      secondary: '#000000', // Also black for high contrast
    },
    background: {
      default: '#ffffff', // Pure white background
      paper: '#ffffff',
    },
    divider: '#000000', // Black dividers
  },
  accessibility: {
    ...lightThemeOptions.accessibility,
    highContrast: {
      enabled: true,
      border: '3px solid #000000',
      focusOutline: '5px solid #000000',
    },
  },
};

const highContrastDarkOptions: ThemeOptions = {
  ...darkThemeOptions,
  palette: {
    ...darkThemeOptions.palette,
    primary: {
      main: '#ffffff', // Pure white for maximum contrast
      light: '#ffffff',
      dark: '#cccccc',
      contrastText: '#000000',
    },
    secondary: {
      main: '#000000', // Pure black
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#ffffff', // Pure white text
      secondary: '#ffffff', // Also white for high contrast
    },
    background: {
      default: '#000000', // Pure black background
      paper: '#000000',
    },
    divider: '#ffffff', // White dividers
  },
  accessibility: {
    ...darkThemeOptions.accessibility,
    highContrast: {
      enabled: true,
      border: '3px solid #ffffff',
      focusOutline: '5px solid #ffffff',
    },
  },
};

// Create themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);
export const highContrastLightTheme = createTheme(highContrastLightOptions);
export const highContrastDarkTheme = createTheme(highContrastDarkOptions);

// Theme selection helper
export const getTheme = (mode: 'light' | 'dark', highContrast: boolean = false) => {
  if (highContrast) {
    return mode === 'light' ? highContrastLightTheme : highContrastDarkTheme;
  }
  return mode === 'light' ? lightTheme : darkTheme;
};

// Default export for convenience
export default lightTheme;
