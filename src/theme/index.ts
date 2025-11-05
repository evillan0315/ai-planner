import { createTheme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';

// Common configurations regardless of theme mode
const commonSettings = {
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      } as Partial<TextFieldProps>,
    },
    // MuiAppBar and MuiPaper styleOverrides removed as their background/text colors
    // are typically handled by the palette's background.default/paper or Tailwind classes.
  },
};

// Function to create theme based on current mode
export const getMuiTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#007ACC' : '#569CD6', // VS Code Blue (light/dark)
        light: mode === 'light' ? '#3399DD' : '#7AAFE0',
        dark: mode === 'light' ? '#005C99' : '#3D6D9F',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: mode === 'light' ? '#808080' : '#CC7A4E', // Neutral Gray (light) / VS Code Orange-Brown (dark)
        light: mode === 'light' ? '#A0A0A0' : '#E09F7C',
        dark: mode === 'light' ? '#606060' : '#A65E3E',
        contrastText: '#FFFFFF',
      },
      error: {
        main: mode === 'light' ? '#D32F2F' : '#CF6679', // Default MUI Red / Muted Red for dark
        light: mode === 'light' ? '#EF5350' : '#E57373',
        dark: mode === 'light' ? '#C62828' : '#B71C1C',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: mode === 'light' ? '#ED6C02' : '#FFA726', // Default MUI Orange / More vibrant orange for dark
        light: mode === 'light' ? '#FF9800' : '#FFB74D',
        dark: mode === 'light' ? '#E65100' : '#F57C00',
        contrastText: '#FFFFFF',
      },
      info: {
        main: mode === 'light' ? '#0288D1' : '#2196F3', // Default MUI Blue / More vibrant blue for dark
        light: mode === 'light' ? '#03A9F4' : '#64B5F6',
        dark: mode === 'light' ? '#01579B' : '#1976D2',
        contrastText: '#FFFFFF',
      },
      success: {
        main: mode === 'light' ? '#2E7D32' : '#66BB6A', // Default MUI Green / More vibrant green for dark
        light: mode === 'light' ? '#4CAF50' : '#81C784',
        dark: mode === 'light' ? '#1B5E20' : '#388E3C',
        contrastText: '#FFFFFF',
      },
      background: {
        default: mode === 'light' ? '#F8F8F8' : '#1E1E1E', // Light grey / Monaco editor dark background
        paper: mode === 'light' ? '#FFFFFF' : '#2D2D30', // Pure white / VS Code panels dark grey
      },
      text: {
        primary: mode === 'light' ? '#222222' : '#D4D4D4', // Dark gray / Monaco default text
        secondary: mode === 'light' ? '#6A6A6A' : '#808080', // Medium gray / Muted grey like Monaco comments
      },
      divider: mode === 'light' ? '#EEEEEE' : '#444444', // Light gray / Dark gray for borders
      action: {
        hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)', // Standard MUI hover alpha
        selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)', // Standard MUI selected alpha
      },
    },
    ...commonSettings,
  });
