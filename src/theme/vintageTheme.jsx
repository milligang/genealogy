import { createTheme } from '@mui/material/styles';

export const vintageTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d4a574',
      light: '#e6c9a8',
      dark: '#b8935f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b7355',
      light: '#a89379',
      dark: '#6e5a43',
    },
    background: {
      default: '#f4e4c1',
      paper: '#faf7f0',
    },
    text: {
      primary: '#5c4a2f',
      secondary: '#8b7355',
    },
    divider: '#d4a574',
  },
  typography: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    h6: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 600,
    },
    body1: {
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    body2: {
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    button: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(92, 74, 47, 0.1)',
    '0 4px 8px rgba(92, 74, 47, 0.15)',
    '0 6px 12px rgba(92, 74, 47, 0.2)',
    '0 8px 16px rgba(92, 74, 47, 0.25)',
    '0 10px 20px rgba(92, 74, 47, 0.3)',
    '0 12px 24px rgba(92, 74, 47, 0.35)',
    '0 14px 28px rgba(92, 74, 47, 0.4)',
    '0 16px 32px rgba(92, 74, 47, 0.45)',
    ...Array(16).fill('0 20px 40px rgba(92, 74, 47, 0.5)'),
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation2: {
          border: '2px solid #d4a574',
        },
        elevation3: {
          border: '2px solid #d4a574',
        },
        elevation4: {
          border: '2px solid #d4a574',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(92, 74, 47, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(92, 74, 47, 0.3)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '3px solid #faf7f0',
          boxShadow: '0 2px 4px rgba(92, 74, 47, 0.2)',
        },
      },
    },
  },
});

// Vintage-specific colors for ReactFlow elements
export const vintageColors = {
  nodeHandle: '#8b7355',
  edgeParentChild: '#8b7355',
  edgeSpouse: '#c97d7d',
  background: '#f4e4c1',
  backgroundDots: '#d4a574',
  gender: {
    male: {
      primary: '#7ba3c4',
      light: '#a8c5dc',
      border: '#6589ab',
    },
    female: {
      primary: '#d89bb5',
      light: '#e6bccf',
      border: '#c57d9a',
    },
  },
};