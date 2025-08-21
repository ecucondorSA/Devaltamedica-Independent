// 🎨 ALTAMEDICA TAILWIND CONFIGURATION
// Sistema de diseño médico con azul celeste corporativo

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🏥 COLORES PRIMARIOS ALTAMEDICA - AZUL CELESTE
        'primary-altamedica': '#0077CC',     // Azul celeste principal
        'secondary-altamedica': '#4CAF50',   // Verde médico
        
        primary: {
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#7CC4FF',
          300: '#36A9FF',
          400: '#0090FF',
          500: '#0077CC', // AZUL CELESTE ALTAMEDICA
          600: '#0066B3',
          700: '#004C99',
          800: '#003366',
          900: '#001F3F',
        },
        
        secondary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Verde médico
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        
        // 🚨 ESTADOS MÉDICOS
        success: '#4CAF50',
        warning: '#FF9800',
        danger: '#F44336',
        info: '#0077CC',
        
        // 🌫️ GRISES MÉDICOS
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
        telemedicine: '#00BCD4',
        emergency: '#FF1744',
        vaccination: '#8BC34A',
        diagnostic: '#3F51B5',
        therapy: '#9C27B0',
        surgery: '#FF5722',
      },
      
      backgroundImage: {
        // 🎨 GRADIENTES MÉDICOS
        'gradient-primary-altamedica': 'linear-gradient(135deg, #0077CC 0%, #00BCD4 100%)',
        'gradient-secondary-altamedica': 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
        'gradient-emergency': 'linear-gradient(135deg, #F44336 0%, #FF1744 100%)',
        'gradient-telemedicine': 'linear-gradient(135deg, #0077CC 0%, #00BCD4 100%)',
      },
      
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      
      borderRadius: {
        'medical': '0.75rem',
      },
      
      boxShadow: {
        'medical': '0 4px 6px rgba(0, 119, 204, 0.15)',
        'medical-lg': '0 10px 15px rgba(0, 119, 204, 0.15)',
        'emergency': '0 0 20px rgba(244, 67, 54, 0.4)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-conservative': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Plugin para utilidades médicas custom
    function({ addUtilities }) {
      const newUtilities = {
        '.bg-medical-pattern': {
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230077CC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        },
        '.text-shadow-medical': {
          textShadow: '0 2px 4px rgba(0, 119, 204, 0.1)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  safelist: [
    // Clases médicas que siempre deben incluirse
    'bg-primary-altamedica',
    'bg-secondary-altamedica',
    'text-primary-altamedica',
    'text-secondary-altamedica',
    'border-primary-altamedica',
    'border-secondary-altamedica',
    'bg-gradient-primary-altamedica',
    'bg-gradient-secondary-altamedica',
  ],
};