// 🎨 ALTAMEDICA COLOR SYSTEM - PALETA MÉDICA OFICIAL
// Sistema de colores basado en el azul celeste corporativo de AltaMedica
// Optimizado para accesibilidad WCAG 2.2 AAA y contextos médicos

export const colors = {
  // 🏥 COLORES PRIMARIOS ALTAMEDICA
  primary: {
    50: '#E6F4FF',   // Azul celeste muy claro
    100: '#BAE0FF',  // Azul celeste claro
    200: '#7CC4FF',  // Azul celeste suave
    300: '#36A9FF',  // Azul celeste medio
    400: '#0090FF',  // Azul celeste vibrante
    500: '#0077CC',  // AZUL CELESTE ALTAMEDICA (Principal)
    600: '#0066B3',  // Azul celeste oscuro
    700: '#004C99',  // Azul celeste profundo
    800: '#003366',  // Azul celeste muy oscuro
    900: '#001F3F',  // Azul celeste noche
  },

  // 🌿 COLORES SECUNDARIOS MÉDICOS
  secondary: {
    50: '#E8F5E9',   // Verde médico muy claro
    100: '#C8E6C9',  // Verde médico claro
    200: '#A5D6A7',  // Verde médico suave
    300: '#81C784',  // Verde médico medio
    400: '#66BB6A',  // Verde médico vibrante
    500: '#4CAF50',  // Verde médico (Secundario)
    600: '#43A047',  // Verde médico oscuro
    700: '#388E3C',  // Verde médico profundo
    800: '#2E7D32',  // Verde médico muy oscuro
    900: '#1B5E20',  // Verde médico noche
  },

  // 🚨 ESTADOS MÉDICOS
  medical: {
    normal: '#4CAF50',      // Verde - Estado normal
    warning: '#FF9800',     // Naranja - Precaución
    critical: '#F44336',    // Rojo - Crítico
    emergency: '#D32F2F',   // Rojo oscuro - Emergencia
    excellent: '#0077CC',   // Azul celeste - Excelente
    info: '#2196F3',        // Azul info - Información
  },

  // 🎯 COLORES FUNCIONALES
  functional: {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#0077CC',
    danger: '#D32F2F',
  },

  // 🌫️ ESCALA DE GRISES MÉDICOS
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // 🌈 COLORES ESPECIALES MÉDICOS
  special: {
    telemedicine: '#00BCD4',    // Cyan - Telemedicina
    emergency: '#FF1744',       // Rojo brillante - Emergencia
    vaccination: '#8BC34A',     // Verde lima - Vacunación
    diagnostic: '#3F51B5',      // Índigo - Diagnóstico
    therapy: '#9C27B0',         // Púrpura - Terapia
    surgery: '#FF5722',         // Naranja profundo - Cirugía
  },

  // 🎨 GRADIENTES MÉDICOS
  gradients: {
    primary: 'linear-gradient(135deg, #0077CC 0%, #00BCD4 100%)',
    secondary: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
    emergency: 'linear-gradient(135deg, #F44336 0%, #FF1744 100%)',
    telemedicine: 'linear-gradient(135deg, #0077CC 0%, #00BCD4 100%)',
  },

  // 🔲 FONDOS MÉDICOS
  backgrounds: {
    primary: '#FFFFFF',
    secondary: '#F5F9FF',      // Azul celeste muy suave
    tertiary: '#E6F4FF',       // Azul celeste ultra suave
    emergency: '#FFEBEE',      // Rojo muy suave
    success: '#E8F5E9',        // Verde muy suave
    warning: '#FFF3E0',        // Naranja muy suave
  },

  // 📝 TEXTO
  text: {
    primary: '#212121',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
    link: '#0077CC',
    linkHover: '#0066B3',
  },

  // 🔍 TRANSPARENCIAS
  alpha: {
    primary10: 'rgba(0, 119, 204, 0.1)',
    primary20: 'rgba(0, 119, 204, 0.2)',
    primary30: 'rgba(0, 119, 204, 0.3)',
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    white80: 'rgba(255, 255, 255, 0.8)',
    white90: 'rgba(255, 255, 255, 0.9)',
  }
} as const;

// 🎯 TIPO DE COLORES
export type ColorSystem = typeof colors;

// 🏥 TOKENS DE DISEÑO MÉDICO
export const medicalTokens = {
  // Espaciado
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },

  // Radio de bordes médicos
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',  // Círculo
  },

  // Sombras médicas
  shadows: {
    sm: '0 1px 3px rgba(0, 119, 204, 0.12)',
    md: '0 4px 6px rgba(0, 119, 204, 0.15)',
    lg: '0 10px 15px rgba(0, 119, 204, 0.15)',
    xl: '0 20px 25px rgba(0, 119, 204, 0.15)',
    emergency: '0 0 20px rgba(244, 67, 54, 0.4)',
  },

  // Transiciones
  transitions: {
    fast: '150ms ease-in-out',
    base: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Tipografía médica
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
} as const;

// 🎨 EXPORTAR TODO
export default { colors, medicalTokens };