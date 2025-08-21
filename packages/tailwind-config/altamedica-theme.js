// AltaMedica Unified Theme Configuration
// Sistema de diseño unificado con 4 colores principales
// Última actualización: Enero 2025

import colors from 'tailwindcss/colors'

// Paleta de 4 colores unificada
const altamedicaColors = {
  // 1. Color Primario - Azul Celeste BRILLANTE AltaMedica (Cyan)
  primary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Color principal - CYAN BRILLANTE
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  
  // 2. Color Neutro - Grises para textos y fondos
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Gris principal
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // 3. Color de Éxito - Verde para estados positivos
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Verde principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // 4. Color de Alerta - Rojo para errores y críticos
  alert: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Rojo principal
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // 5. Colores Especiales Argentina - Azules Argentinos
  argentina: {
    50: '#f0f8ff',
    100: '#e7f4ff',
    200: '#d4ebff',
    300: '#74ACDF', // Azul argentino claro
    400: '#6ba3d6',
    500: '#74ACDF', // Azul argentino principal
    600: '#005691', // Azul argentino oscuro
    700: '#004d7a',
    800: '#004364',
    900: '#003a4e',
    950: '#002d38',
  },
}

// Configuración de tema unificada
const altamedicaTheme = {
  colors: {
  // Colores básicos necesarios para utilidades estándar
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
    // Colores principales (4 colores)
    primary: altamedicaColors.primary,
    neutral: altamedicaColors.neutral,
    success: altamedicaColors.success,
    alert: altamedicaColors.alert,
    
    // Colores especiales Argentina
    argentina: altamedicaColors.argentina,
    argentinaBlue: '#74ACDF', // Alias directo
    argentinaDarkBlue: '#005691', // Alias directo para el oscuro
    
    // Alias para compatibilidad
    gray: altamedicaColors.neutral,
    green: altamedicaColors.success,
    red: altamedicaColors.alert,
    
    // Colores funcionales derivados
    background: {
      DEFAULT: '#ffffff',
      secondary: altamedicaColors.neutral[50],
      tertiary: altamedicaColors.neutral[100],
    },
    
    foreground: {
      DEFAULT: altamedicaColors.neutral[900],
      secondary: altamedicaColors.neutral[700],
      tertiary: altamedicaColors.neutral[500],
    },
    
    border: {
      DEFAULT: altamedicaColors.neutral[200],
      secondary: altamedicaColors.neutral[300],
    },
    
    // Estados médicos usando los 4 colores
    medical: {
      emergency: altamedicaColors.alert[600],
      urgent: altamedicaColors.alert[500],
      consultation: altamedicaColors.primary[500],
      routine: altamedicaColors.primary[400],
      healthy: altamedicaColors.success[500],
      stable: altamedicaColors.success[400],
      info: altamedicaColors.primary[300],
      neutral: altamedicaColors.neutral[500],
    },
    
    // Mantener compatibilidad con código existente
    sky: altamedicaColors.primary,
    blue: {
      ...colors.blue,
      500: '#3b82f6', // Mantener para compatibilidad
    },
  },
  
  extend: {
    // Tipografía centralizada - CRÍTICO para identidad de marca
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'], // Texto principal
      display: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'], // Títulos y destacados
      mono: ['Fira Code', 'monospace'], // Código y datos técnicos
    },
    
    // Sombras corporativas - actualizadas con el nuevo cyan brillante
    boxShadow: {
      'altamedica': '0 4px 6px -1px rgba(6, 182, 212, 0.1), 0 2px 4px -1px rgba(6, 182, 212, 0.06)',
      'altamedica-lg': '0 10px 15px -3px rgba(6, 182, 212, 0.1), 0 4px 6px -2px rgba(6, 182, 212, 0.05)',
      'altamedica-xl': '0 20px 25px -5px rgba(6, 182, 212, 0.1), 0 10px 10px -5px rgba(6, 182, 212, 0.04)',
    },
    
    // Colores sólidos - SIN GRADIENTES (Diseño moderno y directo)
    backgroundImage: {
      // Mantenemos las claves por compatibilidad pero ahora son colores sólidos
      'altamedica-solid': '#06b6d4', // Cyan brillante sólido
      'altamedica-success': '#22c55e', // Verde sólido
      'altamedica-alert': '#ef4444', // Rojo sólido
      'altamedica-neutral': '#64748b', // Gris sólido
      'argentina-solid': '#74ACDF', // Azul Argentina sólido
    },
    
    // Animaciones
    animation: {
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'slide-up': 'slideUp 0.3s ease-out',
      'fade-in': 'fadeIn 0.3s ease-in',
    },
    
    keyframes: {
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    },
  },
}

// Configuración de plugins para efectos adicionales
const altamedicaPlugins = [
  // Plugin para clases utilitarias personalizadas
  function({ addUtilities, theme }) {
    const newUtilities = {
      // Textos con los colores principales
      '.text-altamedica': {
        color: theme('colors.primary.500'),
      },
      '.text-altamedica-dark': {
        color: theme('colors.primary.700'),
      },
      
      // Fondos con gradientes
      '.bg-altamedica': {
        backgroundColor: theme('colors.primary.500'),
      },
      '.bg-gradient-altamedica': {
        backgroundImage: theme('backgroundImage.altamedica-gradient'),
      },
      
      // Bordes
      '.border-altamedica': {
        borderColor: theme('colors.primary.500'),
      },
      
      // Efectos hover usando los 4 colores
      '.hover-primary': {
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme('colors.primary.50'),
          borderColor: theme('colors.primary.500'),
        },
      },
      '.hover-success': {
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme('colors.success.50'),
          borderColor: theme('colors.success.500'),
        },
      },
      '.hover-alert': {
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme('colors.alert.50'),
          borderColor: theme('colors.alert.500'),
        },
      },
      
      // Utilidades para colores argentinos
      '.text-argentina': {
        color: theme('colors.argentinaBlue'),
      },
      '.text-argentina-dark': {
        color: theme('colors.argentinaDarkBlue'),
      },
      '.bg-argentina': {
        backgroundColor: theme('colors.argentinaBlue'),
      },
      '.bg-argentina-dark': {
        backgroundColor: theme('colors.argentinaDarkBlue'),
      },
      '.border-argentina': {
        borderColor: theme('colors.argentinaBlue'),
      },
      '.border-argentina-dark': {
        borderColor: theme('colors.argentinaDarkBlue'),
      },
      '.ring-argentina': {
        '--tw-ring-color': theme('colors.argentinaBlue'),
      },
      '.ring-argentina-dark': {
        '--tw-ring-color': theme('colors.argentinaDarkBlue'),
      },
      '.hover-argentina': {
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme('colors.argentina.50'),
          borderColor: theme('colors.argentinaBlue'),
        },
      },
    }
    
    addUtilities(newUtilities)
  },
]

// Export completo para Tailwind
const altamedicaTailwindConfig = {
  theme: altamedicaTheme,
  plugins: altamedicaPlugins,
}

// Función helper para obtener colores
const getColor = (colorPath) => {
  const paths = colorPath.split('.')
  let result = altamedicaColors
  for (const path of paths) {
    result = result[path]
  }
  return result
}

// Exports
export {
  altamedicaColors,
  altamedicaTheme,
  altamedicaPlugins,
  altamedicaTailwindConfig,
  getColor
}