/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/tailwind-config/unified-preset')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
    './src/types/**/*.{js,ts,jsx,tsx,mdx}',
    './src/services/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  plugins: [
    function({ addUtilities, theme }) {
      addUtilities({
        '.patient-card': {
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: theme('boxShadow.altamedica'),
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          border: `2px solid ${theme('colors.border.DEFAULT')}`,
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: theme('boxShadow.altamedica-lg'),
            borderColor: theme('colors.primary.300')
          }
        },
        '.patient-button': {
          backgroundColor: theme('colors.primary.500'),
          color: 'white',
          fontWeight: '600',
          borderRadius: '0.75rem',
          padding: '1rem 2rem',
          fontSize: '1rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            transform: 'scale(1.03)'
          }
        },
        '.patient-badge': {
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          textTransform: 'uppercase'
        },
        '.patient-health-excellent': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.800'),
          border: `2px solid ${theme('colors.success.300')}`
        }
      })
    }
  ]
}