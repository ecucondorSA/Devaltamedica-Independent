import { useMemo } from 'react';
import { useTheme } from './useTheme';

export interface MedicalThemeColors {
  // Colores principales de AltaMedica
  primary: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  secondary: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  // Colores semánticos médicos
  success: string;
  warning: string;
  error: string;
  info: string;
  // Estados médicos
  critical: string;
  stable: string;
  improving: string;
  // Backgrounds
  background: {
    default: string;
    paper: string;
    disabled: string;
  };
  // Textos
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
}

export interface MedicalThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface MedicalTheme {
  colors: MedicalThemeColors;
  spacing: MedicalThemeSpacing;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
}

const lightTheme: MedicalTheme = {
  colors: {
    primary: {
      light: '#60a5fa',
      main: '#2563eb',
      dark: '#1d4ed8',
      contrast: '#ffffff',
    },
    secondary: {
      light: '#94a3b8',
      main: '#64748b',
      dark: '#475569',
      contrast: '#ffffff',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    critical: '#dc2626',
    stable: '#059669',
    improving: '#0891b2',
    background: {
      default: '#ffffff',
      paper: '#f8fafc',
      disabled: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
      hint: '#cbd5e1',
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    xxl: '3rem',   // 48px
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
};

const darkTheme: MedicalTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: {
      light: '#93c5fd',
      main: '#3b82f6',
      dark: '#2563eb',
      contrast: '#ffffff',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      disabled: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b',
      hint: '#475569',
    },
  },
};

export interface UseMedicalThemeReturn {
  theme: MedicalTheme;
  isDark: boolean;
  colors: MedicalThemeColors;
  spacing: MedicalThemeSpacing;
  // Utilidades de estilo
  getStatusColor: (status: 'critical' | 'stable' | 'improving' | 'unknown') => string;
  getContrastText: (backgroundColor: string) => string;
}

export const useMedicalTheme = (): UseMedicalThemeReturn => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const getStatusColor = useMemo(() => {
    return (status: 'critical' | 'stable' | 'improving' | 'unknown'): string => {
      switch (status) {
        case 'critical':
          return theme.colors.critical;
        case 'stable':
          return theme.colors.stable;
        case 'improving':
          return theme.colors.improving;
        case 'unknown':
        default:
          return theme.colors.text.secondary;
      }
    };
  }, [theme]);

  const getContrastText = useMemo(() => {
    return (backgroundColor: string): string => {
      // Simplified contrast calculation
      // In production, you might want to use a proper contrast calculation
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      return brightness > 128 ? theme.colors.text.primary : '#ffffff';
    };
  }, [theme]);

  return {
    theme,
    isDark,
    colors: theme.colors,
    spacing: theme.spacing,
    getStatusColor,
    getContrastText,
  };
};