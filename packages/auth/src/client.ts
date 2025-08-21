'use client';
// @altamedica/auth/client - Exports seguros para el frontend
// Este archivo contiene solo código que puede ejecutarse en el navegador

// Contexto y Provider consolidado
export { AuthContext, AuthProvider, useAuth } from './hooks/useAuth';

// Hooks especializados (desde el nuevo useAuth consolidado)
export { useProtectedRoute, useRequireAuth, useRole } from './hooks/useAuth';

// Tipos principales (desde AuthService consolidado)
// UserRole proviene del paquete central de tipos
// Importar UserRole desde paquete de tipos central. Si hay problemas de resolución durante build temprano,
// verificar que @altamedica/types haya sido compilado primero.

// // Componentes de UI (comentado hasta migración)
// export {
//     LoginButton,
//     LogoutButton,
//     ProtectedComponent,
//     UserProfile
// } from './components';

// // Utilidades (comentado hasta migración)
// export {
//     AuthStorage,
//     formatUserRole,
//     validateEmail,
//     validatePassword
// } from './utils';

// Constantes del lado del cliente (sin process.env)
export const CLIENT_AUTH_CONSTANTS = {
  REFRESH_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_EXPIRY: '15m',
} as const;

export const SSO_COOKIE_NAMES = {
  ACCESS_TOKEN: 'altamedica_sso_token',
  REFRESH_TOKEN: 'altamedica_refresh_token',
} as const;

// Re-export SSO client functions if they exist
// Comentado temporalmente hasta migración completa
// export * from './sso-client';

// Tipos y enums necesarios en cliente para evitar importar el entry SSR
export { PublicUserRole } from './services/AuthService';
export type { RegisterData } from './services/AuthService';
