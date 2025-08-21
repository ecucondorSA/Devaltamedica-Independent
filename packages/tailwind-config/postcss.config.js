/**
 * 🎨 POSTCSS UNIFIED CONFIGURATION
 * 
 * Configuración PostCSS compartida para todas las aplicaciones
 */

module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-import': {},
    'postcss-nesting': {},
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: false,
        }]
      }
    } : {})
  },
};