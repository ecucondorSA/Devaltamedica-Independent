/**
 * @fileoverview Constantes para hooks UI
 */

export const BREAKPOINTS = {
  base: '0px',
  sm: '480px',
  md: '768px',
  lg: '992px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const THEME_COLORS = {
  primary: '#3182ce',
  secondary: '#718096',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e',
  info: '#3182ce',
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 300,
} as const;