// 🔄 Re-export del AuthProvider centralizado desde @altamedica/auth
// Este archivo mantiene compatibilidad durante la migración
export { AuthContext, AuthProvider, useAuth } from '@altamedica/auth/client';
export type { User, UserRole } from '@altamedica/types';
