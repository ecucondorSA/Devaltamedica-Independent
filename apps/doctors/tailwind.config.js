// Tailwind config con tema VS Code Monokai atenuado
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/tailwind-config/unified-preset')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // VS Code Monokai Atenuado - Tema médico profesional
        monokai: {
          // Fondo principal más suave que el Monokai original
          background: '#2c2c2c',      // En lugar de #272822 (más suave)
          surface: '#363636',          // Paneles y cards
          panel: '#404040',           // Sidebars y paneles laterales
          border: '#4a4a4a',         // Bordes sutiles
          hover: '#4f4f4f',          // Estados hover
          
          // Textos optimizados para uso médico
          text: {
            primary: '#f8f8f2',      // Texto principal (blanco cálido)
            secondary: '#c9c9c9',    // Texto secundario
            muted: '#8a8a8a',        // Texto atenuado
            accent: '#a6e22e',       // Verde Monokai (para éxitos)
          },
          
          // Colores de acento médicos basados en Monokai
          accent: {
            blue: '#66d9ef',         // Azul cian (información)
            green: '#a6e22e',        // Verde (éxito, disponible)
            orange: '#fd971f',       // Naranja (advertencias)
            pink: '#f92672',         // Rosa/rojo (crítico, ocupado)
            purple: '#ae81ff',       // Púrpura (especialidad)
            yellow: '#e6db74',       // Amarillo (pendiente)
          },
          
          // Estados específicos médicos
          status: {
            available: '#a6e22e',    // Doctor disponible
            busy: '#fd971f',         // En consulta
            offline: '#75715e',      // Desconectado
            emergency: '#f92672',    // Emergencia
          }
        },
        
        // Alias para facilitar uso
        vscode: {
          bg: '#2c2c2c',
          surface: '#363636',
          sidebar: '#404040',
          border: '#4a4a4a',
          text: '#f8f8f2',
          accent: '#66d9ef'
        }
      }
    }
  },
  plugins: [
    // Plugin con utilidades VS Code Monokai para interfaz médica
    function({ addUtilities, theme }) {
      addUtilities({
        // Layout VS Code
        '.vscode-layout': {
          backgroundColor: '#2c2c2c',
          color: '#f8f8f2',
          fontFamily: 'Consolas, "Courier New", monospace',
          height: '100vh',
          overflow: 'hidden'
        },
        '.vscode-titlebar': {
          backgroundColor: '#404040',
          borderBottom: '1px solid #4a4a4a',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          fontSize: '0.875rem',
          fontWeight: '500'
        },
        '.vscode-sidebar': {
          backgroundColor: '#404040',
          borderRight: '1px solid #4a4a4a',
          width: '16rem',
          height: '100%',
          overflow: 'auto'
        },
        '.vscode-panel': {
          backgroundColor: '#363636',
          border: '1px solid #4a4a4a',
          borderRadius: '0.25rem'
        },
        '.vscode-tab': {
          backgroundColor: '#2c2c2c',
          borderRight: '1px solid #4a4a4a',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: '#4f4f4f'
          },
          '&.active': {
            backgroundColor: '#363636',
            borderBottom: '2px solid #66d9ef'
          }
        },
        '.vscode-status-bar': {
          backgroundColor: '#66d9ef',
          color: '#2c2c2c',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          fontSize: '0.75rem',
          fontWeight: '500'
        },

        // Componentes médicos con tema Monokai
        '.medical-card-monokai': {
          backgroundColor: '#363636',
          borderRadius: '0.5rem',
          border: '1px solid #4a4a4a',
          padding: '1rem',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#404040',
            borderColor: '#66d9ef'
          }
        },
        '.medical-button-monokai': {
          backgroundColor: '#66d9ef',
          color: '#2c2c2c',
          fontWeight: '600',
          borderRadius: '0.25rem',
          padding: '0.5rem 1rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#a6e22e',
            transform: 'scale(1.02)'
          }
        },
        '.status-available': {
          color: '#a6e22e',
          fontWeight: '600'
        },
        '.status-busy': {
          color: '#fd971f',
          fontWeight: '600'
        },
        '.status-offline': {
          color: '#75715e',
          fontWeight: '600'
        },
        '.status-emergency': {
          color: '#f92672',
          fontWeight: '600',
          animation: 'pulse 2s infinite'
        }
      })
    }
  ]
}