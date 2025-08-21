// === ALTAMEDICA DESIGN SYSTEM COMPATIBLE CON TAILWIND V4 ===

export const theme = {
  // Gradientes como clases CSS personalizadas
  gradients: {
    primary: 'bg-gradient-primary',
    hero: 'bg-gradient-hero',
    cta: 'bg-gradient-cta',
    dark: 'bg-gradient-dark',
    card: {
      primary: 'bg-gradient-card-primary',
      secondary: 'bg-gradient-card-secondary',
      success: 'bg-gradient-card-success',
      warning: 'bg-gradient-card-warning',
      danger: 'bg-gradient-card-danger',
      ai: 'bg-gradient-card-ai',
    }
  },

  // Tipografía escalable
  typography: {
    display: {
      hero: 'text-4xl md:text-6xl font-bold text-slate-800 leading-tight',
      section: 'text-4xl font-bold text-slate-800 leading-tight',
      subsection: 'text-3xl font-bold text-slate-800 leading-tight',
      card: 'text-xl font-bold text-slate-800',
    },
    body: {
      large: 'text-xl text-slate-600 leading-relaxed',
      base: 'text-base text-slate-600 leading-normal',
      small: 'text-sm text-slate-600',
      xs: 'text-xs text-slate-500',
    },
    labels: {
      primary: 'text-lg font-bold text-gradient-primary',
      secondary: 'text-sm font-medium text-gray-700',
    }
  },

  // Espaciado consistente
  spacing: {
    section: 'py-20',
    sectionSm: 'py-12',
    container: 'max-w-7xl mx-auto px-6',
    card: 'p-6',
    cardSm: 'p-4',
    element: {
      xs: 'mb-4',
      sm: 'mb-6',
      md: 'mb-8',
      lg: 'mb-12',
      xl: 'mb-16',
    }
  },

  // Sombras y bordes
  shadows: {
    card: 'shadow-lg border border-slate-200',
    elevated: 'shadow-2xl border border-sky-200',
    soft: 'shadow-sm border border-slate-100',
  },

  // Estados interactivos
  interactions: {
    button: `
      hover:shadow-xl hover:scale-105 
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
      active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-all duration-300 ease-in-out
    `,
    card: `
      hover:shadow-lg 
      transition-all duration-200 ease-in-out
    `,
    expandable: `
      hover:bg-slate-50 
      transition-colors duration-200
    `,
  },

  // Colores de la marca
  colors: {
    primary: '#005A9C',
    secondary: '#00A786',
    accent: '#EA580C',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    ai: '#7C3AED',
    text: {
      primary: '#1A365D',
      secondary: '#64748B',
      muted: '#94A3B8',
    }
  }
} as const;

// Componentes de utilidad reutilizables - usando clases CSS personalizadas
export const buttonVariants = {
  primary: `btn-primary`,
  secondary: `btn-secondary`,
  accent: `btn-accent`,
  outline: `
    border-2 border-white text-white 
    px-8 py-4 rounded-xl text-lg font-semibold 
    hover:bg-white hover:text-blue-600 
    ${theme.interactions.button}
  `,
} as const;

export const cardVariants = {
  default: `card-default`,
  elevated: `card-elevated`,
  gradient: (variant: keyof typeof theme.gradients.card) => 
    `${theme.gradients.card[variant]} rounded-2xl border border-slate-200/50 ${theme.interactions.card}`,
} as const;

// Helper para crear gradientes dinámicos si es necesario
export const createGradient = (from: string, to: string, direction = '90deg') => {
  return {
    background: `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`,
  };
};

// Utilidades para animaciones
export const animations = {
  fadeInUp: 'animate-fade-in-up',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  pulseMedical: 'pulse-medical',
} as const;

// Utilidades para responsive
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
