import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#2E7D32',
  secondary: '#0288D1',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  muted: '#6B6B6B',
  danger: '#C62828',
  success: '#2E7D32',
  warning: '#F9A825',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.danger,
  },
};
