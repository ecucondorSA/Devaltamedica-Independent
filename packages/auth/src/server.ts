// @altamedica/auth/server - Exports solo para el servidor/backend
// Este archivo contiene código que usa Node.js APIs y no debe ejecutarse en el navegador

// Firebase Admin SDK
export {
  getAuth,
  verifyIdToken,
  createCustomToken,
  setCustomUserClaims,
  getUser,
  deleteUser,
  listUsers,
  updateUser,
  createUser,
  revokeRefreshTokens
} from './firebase-admin';

// SSO Service removido. Usar cookies de sesión + endpoints backend.

// Constantes del servidor (con process.env)
export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'altamedica-development-secret-key-2025',
  REFRESH_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_EXPIRY: '15m',
} as const;

// Re-export tipos que son útiles en el servidor
export type {
  User,
  UserRole,
  UserType,
  TokenData
} from './types';