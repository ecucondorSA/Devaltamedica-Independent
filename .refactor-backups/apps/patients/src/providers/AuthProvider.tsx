/**
 * Re-exportación del sistema de autenticación centralizado
 * Este archivo elimina la duplicación y redirige al paquete centralizado @altamedica/auth
 */

// Re-exportar todo desde el paquete centralizado
export {
    AuthProvider, AuthStorage, LoginButton,
    LogoutButton,
    ProtectedComponent, UserProfile, formatUserRole, useAuth, useLoginForm, useProtectedRoute, useRegisterForm, useRole, validateEmail,
    validatePassword
} from "@altamedica/auth';

// Re-exportar tipos
export type {
    AuthContextType, AuthState, LoginCredentials,
    RegisterData,
    TokenData, User,
    UserRole
} from "@altamedica/auth';

