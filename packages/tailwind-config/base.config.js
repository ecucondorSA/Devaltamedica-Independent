/**
 * 🎨 TAILWIND BASE CONFIGURATION
 * 
 * Configuración base unificada para todas las aplicaciones de AltaMedica
 * Importa el tema compartido y define configuraciones comunes
 */

const altamedicaTheme = require('./altamedica-theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  
  theme: {
    extend: {
      ...altamedicaTheme,
      
      // Fuentes
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        medical: ['IBM Plex Sans', 'sans-serif'],
      },
      
      // Animaciones
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      
      // Espaciado médico
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      
      // Bordes redondeados médicos
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        'medical': '0.625rem',
      },
      
      // Sombras médicas
      boxShadow: {
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'medical-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-lg': '0 0 30px rgba(6, 182, 212, 0.4)',
      },
      
      // Transiciones médicas
      transitionTimingFunction: {
        'medical': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Z-index médicos
      zIndex: {
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal-backdrop': 1040,
        'modal': 1050,
        'popover': 1060,
        'tooltip': 1070,
        'notification': 1080,
      },
      
      // Breakpoints personalizados
      screens: {
        'xs': '475px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      
      // Aspectos ratio médicos
      aspectRatio: {
        'medical-card': '16 / 10',
        'medical-chart': '4 / 3',
        'medical-portrait': '3 / 4',
      },
      
      // Gradientes médicos
      backgroundImage: {
        'gradient-medical': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-emergency': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-altamedica': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};