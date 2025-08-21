/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/tailwind-config/unified-preset')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  plugins: [
    function({ addUtilities, theme }) {
      addUtilities({
        '.admin-dashboard-bg': {
          backgroundColor: theme('colors.background.secondary'),
          minHeight: '100vh'
        },
        '.admin-card': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: theme('boxShadow.altamedica'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.altamedica-lg')
          }
        },
        '.admin-button': {
          backgroundColor: theme('colors.primary.500'),
          color: 'white',
          fontWeight: '600',
          borderRadius: '0.5rem',
          padding: '0.75rem 1.5rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            transform: 'scale(1.02)'
          }
        }
      })
    }
  ]
}