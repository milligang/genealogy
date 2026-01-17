import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
      light: '#8b9def',
      dark: '#4c5fd4',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9168b8',
      dark: '#5a3880',
    },
    background: {
      default: '#1a202c',
      paper: '#2d3748',
    },
    text: {
      primary: '#f7fafc',
      secondary: '#a0aec0',
    },
    divider: '#4a5568',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.2)',
    '0 4px 8px rgba(0, 0, 0, 0.3)',
    '0 6px 12px rgba(0, 0, 0, 0.4)',
    '0 8px 16px rgba(0, 0, 0, 0.5)',
    '0 10px 20px rgba(0, 0, 0, 0.6)',
    '0 12px 24px rgba(0, 0, 0, 0.7)',
    '0 14px 28px rgba(0, 0, 0, 0.8)',
    '0 16px 32px rgba(0, 0, 0, 0.9)',
    ...Array(16).fill('0 20px 40px rgba(0, 0, 0, 1)'),
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation2: {
          border: '1px solid #4a5568',
        },
        elevation3: {
          border: '1px solid #4a5568',
        },
        elevation4: {
          border: '1px solid #4a5568',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.6)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
            backgroundColor: 'rgba(102, 126, 234, 0.08)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #2d3748',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  },
});

// Dark theme colors for ReactFlow elements
export const darkColors = {
  nodeHandle: '#667eea',
  edgeParentChild: '#667eea',
  edgeSpouse: '#ec4899',
  background: '#1a202c',
  backgroundDots: '#4a5568',
  gender: {
    male: {
      primary: '#60a5fa',
      light: '#93c5fd',
      border: '#3b82f6',
    },
    female: {
      primary: '#f472b6',
      light: '#f9a8d4',
      border: '#ec4899',
    },
  },
};