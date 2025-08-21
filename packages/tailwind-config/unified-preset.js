// Unified Tailwind Preset for AltaMedica
// Objetivo: un único preset consumible por TODAS las apps para eliminar divergencias.
// Uso en apps:  tailwind.config.{js,ts} => module.exports = { presets: [require('../../packages/tailwind-config/unified-preset')] }

const { altamedicaTheme, altamedicaPlugins } = require('./altamedica-theme')

// Core preset: NO declara "content" para que cada app defina su scope
module.exports = {
  darkMode: 'class', // habilitamos dark mode controlado por clase
  theme: altamedicaTheme,
  plugins: [
    ...altamedicaPlugins,
    // Plugin de tokens CSS para exponer variables (puente hacia design tokens futuros)
    function exposeDesignTokens({ addBase, theme }) {
      const colors = theme('colors')
      // Mapeo reducido inicial (se pueden ampliar tokens en iteraciones)
      addBase({
        ':root': {
          '--am-color-primary': colors.primary[500],
          '--am-color-primary-foreground': '#ffffff',
          '--am-color-bg': colors.background.DEFAULT,
          '--am-color-bg-alt': colors.background.secondary,
          '--am-color-border': colors.border.DEFAULT,
          '--am-color-text': colors.foreground.DEFAULT,
          '--am-color-text-muted': colors.foreground.tertiary,
          '--am-color-success': colors.success[500],
          '--am-color-alert': colors.alert[500],
          '--am-radius-sm': '4px',
          '--am-radius-md': '6px',
          '--am-radius-lg': '10px',
          '--am-shadow-focus': '0 0 0 3px rgba(6,182,212,0.35)',
        },
        '.dark': {
          '--am-color-bg': colors.neutral[900],
          '--am-color-bg-alt': colors.neutral[800],
          '--am-color-border': colors.neutral[700],
          '--am-color-text': colors.neutral[50],
          '--am-color-text-muted': colors.neutral[300],
          '--am-shadow-focus': '0 0 0 3px rgba(6,182,212,0.55)',
        }
      })
    }
  ],
  // Extensiones utilitarias comunes (ejemplo de alias de componentes básicos)
  safelist: [
    'text-altamedica',
    'bg-altamedica',
    'hover-primary',
    'hover-success',
    'hover-alert',
  ],
}
