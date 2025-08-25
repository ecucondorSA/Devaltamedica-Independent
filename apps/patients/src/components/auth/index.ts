/**
 * index.ts - Exportaciones del Módulo de Autenticación
 * Proyecto: Altamedica Pacientes
 * Consolidación de componentes de auth para importación limpia
 */

// 🔐 Componentes principales de autenticación
export { default as AuthGuard } from './AuthGuard';
// export {
//   LoginMedicalForm,
//   LoginMedicalFormCompact,
//   LoginMedicalFormModal,
// } from './LoginMedicalForm';

// 🪝 Hooks de autenticación
// Temporalmente exportamos desde el index principal
export { useAuth } from '@altamedica/auth';
// export { useLoginForm } from '../../hooks/useLoginForm';

// 📝 Tipos y interfaces
// export type { LoginFormData, LoginFormErrors, LoginFormState } from '../../hooks/useLoginForm';

export type { AuthState, LoginCredentials, RegisterData, User } from '@altamedica/auth';

// 🎯 Configuraciones por defecto
export const AUTH_CONFIG = {
  // URLs de redirección
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/login',
    afterRegister: '/dashboard',
    forgotPassword: '/auth/forgot-password',
    register: '/auth/register',
  },

  // Configuración de seguridad
  security: {
    maxLoginAttempts: 3,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    passwordMinLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  },

  // Mensajes de error estándar
  errorMessages: {
    invalidCredentials: 'Email o contraseña incorrectos',
    accountLocked: 'Cuenta temporalmente bloqueada por seguridad',
    sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    networkError: 'Error de conexión. Verifica tu conexión a internet',
    serverError: 'Error del servidor. Intenta nuevamente en unos minutos',
  },
};

export default {
  // LoginMedicalForm,
  // useLoginForm,
  // useAuth,
  AUTH_CONFIG,
};
