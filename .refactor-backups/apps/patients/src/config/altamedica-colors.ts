/**
 * altamedica-colors.ts - Configuración de Colores Corporativos
 * Proyecto: Altamedica Pacientes
 * Diseño: Paleta de colores oficial de Altamedica
 */

// 🎨 Paleta de colores corporativos de Altamedica
export const ALTAMEDICA_COLORS = {
  // Colores principales
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Azul principal
    600: '#2563eb', // Azul corporativo
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Colores secundarios
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Colores de éxito
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Colores de advertencia
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Colores de error
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Colores neutros
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Colores médicos especializados
  medical: {
    telemedicine: '#8b5cf6', // Púrpura para telemedicina
    emergency: '#ef4444',    // Rojo para emergencias
    consultation: '#3b82f6', // Azul para consultas
    prescription: '#dc2626', // Rojo para medicamentos
    lab: '#f59e0b',          // Amarillo para laboratorio
    health: '#22c55e',       // Verde para salud
  },
};

// 🎯 Gradientes corporativos
export const ALTAMEDICA_GRADIENTS = {
  primary: 'bg-gradient-to-r from-blue-600 to-blue-700',
  secondary: 'bg-gradient-to-r from-blue-500 to-purple-600',
  success: 'bg-gradient-to-r from-green-500 to-green-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  error: 'bg-gradient-to-r from-red-500 to-red-600',
  medical: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700',
  hero: 'bg-gradient-to-br from-blue-50 via-neutral-50 to-blue-50',
};

// 🏥 Estados médicos
export const MEDICAL_STATUS_COLORS = {
  normal: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
  },
  excellent: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
  },
};

// 📱 Colores de categorías de videos
export const VIDEO_CATEGORY_COLORS = {
  salud: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  citas: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  telemedicina: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  historial: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  medicamentos: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
};

// 🎨 Colores de accesos rápidos
export const QUICK_ACCESS_COLORS = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    hover: 'hover:border-blue-300',
    icon: 'text-blue-600 bg-blue-100',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    hover: 'hover:border-green-300',
    icon: 'text-green-600 bg-green-100',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    hover: 'hover:border-purple-300',
    icon: 'text-purple-600 bg-purple-100',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    hover: 'hover:border-orange-300',
    icon: 'text-orange-600 bg-orange-100',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    hover: 'hover:border-red-300',
    icon: 'text-red-600 bg-red-100',
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    border: 'border-teal-200',
    hover: 'hover:border-teal-300',
    icon: 'text-teal-600 bg-teal-100',
  },
};

// 🎯 Función para obtener colores dinámicamente
export const getAltamedicaColor = (category: string, type: 'bg' | 'text' | 'border' | 'icon' = 'bg') => {
  const colors = ALTAMEDICA_COLORS[category as keyof typeof ALTAMEDICA_COLORS];
  if (!colors) return '';
  
  switch (type) {
    case 'bg':
      return colors[500];
    case 'text':
      return colors[600];
    case 'border':
      return colors[200];
    case 'icon':
      return colors[600];
    default:
      return colors[500];
  }
};

// 🏥 Función para obtener colores de estado médico
export const getMedicalStatusColor = (status: string) => {
  return MEDICAL_STATUS_COLORS[status as keyof typeof MEDICAL_STATUS_COLORS] || MEDICAL_STATUS_COLORS.normal;
};

// 📱 Función para obtener colores de categoría de video
export const getVideoCategoryColor = (category: string) => {
  return VIDEO_CATEGORY_COLORS[category as keyof typeof VIDEO_CATEGORY_COLORS] || VIDEO_CATEGORY_COLORS.salud;
};

// 🎨 Función para obtener colores de acceso rápido
export const getQuickAccessColor = (color: string) => {
  return QUICK_ACCESS_COLORS[color as keyof typeof QUICK_ACCESS_COLORS] || QUICK_ACCESS_COLORS.blue;
}; 