// Tailwind config para Companies usando preset unificado
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/tailwind-config/unified-preset')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // VS Code Dark Theme Colors
        vscode: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          
          // Sidebar
          sidebar: '#252526',
          sidebarForeground: '#cccccc',
          
          // Activity Bar
          activityBar: '#333333',
          activityBarBadge: '#007acc',
          activityBarForeground: '#ffffff',
          
          // Editor
          editor: '#1e1e1e',
          editorLineNumber: '#858585',
          
          // Panel
          panel: '#252526',
          panelBorder: '#3c3c3c',
          
          // Button
          button: '#0e639c',
          buttonHover: '#1177bb',
          
          // Input
          input: '#3c3c3c',
          inputBorder: '#3c3c3c',
          
          // List
          listHover: '#2a2d2e',
          listActive: '#094771',
          
          // Status Bar
          statusBar: '#007acc',
          statusBarForeground: '#ffffff',
          
          // Border
          border: '#3c3c3c',
          
          // Medical Crisis Colors
          crisis: {
            critical: '#f85149',
            warning: '#f9826c',
            info: '#58a6ff',
            success: '#3fb950'
          }
        }
      }
    }
  },
  plugins: [
    function({ addUtilities, addComponents, theme }) {
      addComponents({
        '.company-card': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 20px -2px rgba(6, 182, 212, 0.15), 0 8px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${theme('colors.neutral.200')}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '3px',
            background: `linear-gradient(90deg, ${theme('colors.primary.500')} 0%, ${theme('colors.primary.400')} 100%)`,
            opacity: '0',
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            borderColor: theme('colors.primary.300'),
            '&::before': { opacity: '1' },
          }
        }
      })
      addUtilities({
        '.text-company-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.primary.600')} 0%, ${theme('colors.primary.400')} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.company-focus': {
          outline: 'none',
          boxShadow: `0 0 0 3px ${theme('colors.primary.500')}40`,
        },
      })
    }
  ]
}
