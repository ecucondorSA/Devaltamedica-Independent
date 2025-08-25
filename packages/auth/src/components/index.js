/**
 * @fileoverview Componentes de autenticación unificados
 * @module @altamedica/auth/components
 * @description Componentes React para manejo de autenticación y autorización
 */
// 🛡️ Guards de autenticación
export { AuthGuard, ProtectedRoute, PublicRoute, RouteGuard } from './AuthGuard';
// Nota: UserRole debe importarse desde '@altamedica/types'
// TODO: Futuros componentes a agregar
// export { LoginForm } from './LoginForm';
// export { RegisterForm } from './RegisterForm';
// export { ForgotPasswordForm } from './ForgotPasswordForm';
// export { UserMenu } from './UserMenu';
// export { SessionTimeout } from './SessionTimeout';
