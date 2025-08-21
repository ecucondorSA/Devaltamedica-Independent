import { altamedicaTailwindConfig } from '../../packages/tailwind-config/altamedica-theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Extender desde el tema unificado de AltaMedica
  theme: {
    ...altamedicaTailwindConfig.theme,
    extend: {
      ...altamedicaTailwindConfig.theme.extend,
      
      // Configuraciones específicas para Web App (landing page)
      backgroundImage: {
        ...altamedicaTailwindConfig.theme.extend.backgroundImage,
        // Gradientes adicionales para landing page
        'hero-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
        'feature-gradient': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'cta-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      },
      
      // Animaciones adicionales para landing page
      animation: {
        ...altamedicaTailwindConfig.theme.extend.animation,
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      
      keyframes: {
        ...altamedicaTailwindConfig.theme.extend.keyframes,
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  
  plugins: [
    // Usar plugins del tema unificado
    ...altamedicaTailwindConfig.plugins,
    
    // Plugin adicional específico para Web App
    function({ addUtilities, theme }) {
      const webAppUtilities = {
        '.hero-section': {
          backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.hero-title': {
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          color: 'white',
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        },
        '.hero-subtitle': {
          fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
          fontWeight: '300',
          color: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '600px',
          textAlign: 'center',
        },
        '.feature-card': {
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: theme('boxShadow.altamedica'),
          padding: '2rem',
          transition: 'all 0.4s ease',
          border: `1px solid ${theme('colors.border.DEFAULT')}`,
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme('boxShadow.altamedica-lg'),
            borderColor: theme('colors.primary.400')
          }
        },
        '.cta-button': {
          backgroundColor: theme('colors.success.500'),
          color: 'white',
          fontWeight: '700',
          fontSize: '1.125rem',
          borderRadius: '0.75rem',
          padding: '1rem 2.5rem',
          transition: 'all 0.3s ease',
          boxShadow: theme('boxShadow.altamedica'),
          '&:hover': {
            backgroundColor: theme('colors.success.600'),
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.altamedica-lg')
          }
        },
        '.primary-button': {
          backgroundColor: theme('colors.primary.500'),
          color: 'white',
          fontWeight: '600',
          borderRadius: '0.5rem',
          padding: '0.75rem 1.5rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            transform: 'scale(1.05)'
          }
        },
        '.section-padding': {
          paddingTop: '5rem',
          paddingBottom: '5rem',
        },
        '.landing-container': {
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        },
        '.gradient-text': {
          backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700',
        }
      }
      addUtilities(webAppUtilities)
    }
  ],
}