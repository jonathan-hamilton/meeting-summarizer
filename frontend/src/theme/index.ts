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
      main: '#1565c0', // Slightly darker, less vibrant blue
      light: '#42a5f5',
      dark: '#1557b0',
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
      default: '#d0d0d0', // Much darker than #e8e8e8
      paper: '#e0e0e0',   // Much darker than #f0f0f0
    },
    text: {
      primary: '#1a1a1a',   // Even darker text for better contrast
      secondary: '#3a3a3a', // Darker secondary text
    },
    divider: '#c8c8c8', // More visible dividers
    action: {
      hover: 'rgba(0, 0, 0, 0.08)', // Stronger hover states
      selected: 'rgba(0, 0, 0, 0.15)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Mobile-first responsive typography
    h1: {
      fontSize: '1.75rem', // Mobile: 28px
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (min-width:768px)': {
        fontSize: '2.25rem', // Tablet: 36px
      },
      '@media (min-width:1200px)': {
        fontSize: '2.5rem', // Desktop: 40px
      },
    },
    h2: {
      fontSize: '1.5rem', // Mobile: 24px
      fontWeight: 500,
      lineHeight: 1.25,
      '@media (min-width:768px)': {
        fontSize: '1.875rem', // Tablet: 30px
      },
      '@media (min-width:1200px)': {
        fontSize: '2rem', // Desktop: 32px
      },
    },
    h3: {
      fontSize: '1.25rem', // Mobile: 20px
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (min-width:768px)': {
        fontSize: '1.5rem', // Tablet: 24px
      },
      '@media (min-width:1200px)': {
        fontSize: '1.75rem', // Desktop: 28px
      },
    },
    h4: {
      fontSize: '1.125rem', // Mobile: 18px
      fontWeight: 500,
      lineHeight: 1.35,
      '@media (min-width:768px)': {
        fontSize: '1.25rem', // Tablet: 20px
      },
      '@media (min-width:1200px)': {
        fontSize: '1.5rem', // Desktop: 24px
      },
    },
    h5: {
      fontSize: '1rem', // Mobile: 16px
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:768px)': {
        fontSize: '1.125rem', // Tablet: 18px
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem', // Desktop: 20px
      },
    },
    h6: {
      fontSize: '0.875rem', // Mobile: 14px
      fontWeight: 500,
      lineHeight: 1.45,
      '@media (min-width:768px)': {
        fontSize: '1rem', // Tablet: 16px
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem', // Desktop: 16px
      },
    },
    body1: {
      fontSize: '1rem', // Mobile: 16px
      lineHeight: 1.5,
      '@media (min-width:768px)': {
        fontSize: '1rem', // Tablet: 16px
      },
    },
    body2: {
      fontSize: '0.875rem', // Mobile: 14px
      lineHeight: 1.43,
      '@media (min-width:768px)': {
        fontSize: '0.875rem', // Tablet: 14px
      },
    },
    button: {
      fontSize: '0.875rem', // Mobile: 14px
      fontWeight: 500,
      textTransform: 'none' as const, // Avoid all caps for better readability
      '@media (min-width:768px)': {
        fontSize: '0.875rem', // Tablet: 14px
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,      // Mobile portrait (320px+ in practice)
      sm: 768,    // Mobile landscape / Small tablet 
      md: 1024,   // Tablet
      lg: 1200,   // Desktop
      xl: 1536,   // Large desktop (MUI default)
    },
  },
  spacing: (factor: number) => `${0.25 * factor}rem`, // Base: 4px, mobile-optimized
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
  components: {
    // Add subtle elevation to paper components
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none', // Remove default gradient
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: '#1a1a1a', // Consistent elevated surface
          }),
        }),
        elevation1: ({ theme }) => ({
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.16)',
          }),
          ...(theme.palette.mode === 'dark' && {
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.6)',
          }),
        }),
        elevation2: ({ theme }) => ({
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12), 0px 1px 3px rgba(0, 0, 0, 0.16)',
          }),
          ...(theme.palette.mode === 'dark' && {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.4), 0px 1px 3px rgba(0, 0, 0, 0.6)',
          }),
        }),
        elevation4: ({ theme }) => ({
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12), 0px 2px 6px rgba(0, 0, 0, 0.16)',
          }),
          ...(theme.palette.mode === 'dark' && {
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.5), 0px 2px 6px rgba(0, 0, 0, 0.7)',
          }),
        }),
      },
    },
    // Improve card definition
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.12)',
          }),
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333',
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.4)',
          }),
        }),
      },
    },
    // Better dialog styling
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.16), 0px 4px 16px rgba(0, 0, 0, 0.12)',
          }),
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: '#1a1a1a',
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.6), 0px 4px 16px rgba(0, 0, 0, 0.8)',
          }),
        }),
      },
    },
    // Enhanced AppBar with gradient
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
          }),
          ...(theme.palette.mode === 'dark' && {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0px 4px 12px rgba(102, 126, 234, 0.3)',
            color: '#ffffff',
          }),
        }),
      },
    },
    // Enhanced Button styling with gradient
    MuiButton: {
      styleOverrides: {
        containedPrimary: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0px 4px 12px rgba(102, 126, 234, 0.3)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              boxShadow: '0px 6px 16px rgba(102, 126, 234, 0.4)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #4e63c6 0%, #5e377e 100%)',
            },
          }),
        }),
      },
    },
    // Enhanced Chip styling with gradient
    MuiChip: {
      styleOverrides: {
        colorPrimary: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }),
        }),
      },
    },
    // Better Alert styling for error messages
    MuiAlert: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          ...(ownerState.severity === 'error' && {
            backgroundColor: theme.palette.mode === 'light' ? '#ffebee' : '#5f2120',
            border: `1px solid ${theme.palette.mode === 'light' ? '#f44336' : '#d32f2f'}`,
            '& .MuiAlert-message': {
              color: theme.palette.mode === 'light' ? '#000000' : '#ffffff',
              fontWeight: 500,
            },
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'light' ? '#d32f2f' : '#f44336',
            },
          }),
        }),
      },
    },
  },
};

// Dark theme configuration
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',      // Gradient start color as main
      light: '#9bb5ff',     // Lighter version
      dark: '#4c63d2',      // Darker version
    },
    secondary: {
      main: '#764ba2',      // Gradient end color as secondary
      light: '#a478d0',
      dark: '#5e3c82',
    },
    warning: {
      main: '#ffa726',
      light: '#ffcc02',
      dark: '#ff8f00',
    },
    background: {
      default: '#0a0a0a',   // True dark background
      paper: '#1a1a1a',     // Elevated surfaces
    },
    text: {
      primary: '#ffffff',   // Pure white for maximum readability
      secondary: '#b3b3b3', // Better contrast than #aaaaaa
    },
    divider: '#333333',     // Visible but subtle dividers
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',     // Subtle white hover
      selected: 'rgba(255, 255, 255, 0.12)',  // Subtle white selection
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
  },
  typography: lightThemeOptions.typography,
  shape: lightThemeOptions.shape,
  breakpoints: {
    values: {
      xs: 0,      // Mobile portrait (320px+ in practice)
      sm: 768,    // Mobile landscape / Small tablet 
      md: 1024,   // Tablet
      lg: 1200,   // Desktop
      xl: 1536,   // Large desktop (MUI default)
    },
  },
  spacing: (factor: number) => `${0.25 * factor}rem`, // Base: 4px, mobile-optimized
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
