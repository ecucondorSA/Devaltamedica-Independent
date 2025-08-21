/**
 * @fileoverview Configuración para hooks UI
 */

export interface UIConfig {
  theme: {
    defaultMode: 'light' | 'dark';
    breakpoints: Record<string, string>;
  };
  toast: {
    defaultDuration: number;
    position: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  theme: {
    defaultMode: 'light',
    breakpoints: {
      base: '0px',
      sm: '480px',
      md: '768px',
      lg: '992px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  toast: {
    defaultDuration: 3000,
    position: 'top-right',
  },
};