/**
 * Hook useAuth unificado para toda la plataforma AltaMedica
 * Migrado desde auth-service y mejorado
 */
'use client';
// Import Next.js router safely for client-side usage
import { useRouter as useNextRouter } from 'next/navigation';
// Import UserRole from types package
import { UserRole } from '@altamedica/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAuthService, } from '../services/AuthService';
// Simple logger implementation to avoid circular dependencies
const logger = {
    info: (message, data) => {
        if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.log(message, data);
        }
    },
    warn: (message, data) => {
        if (typeof console !== 'undefined') {
            console.warn(message, data);
        }
    },
    error: (message, data) => {
        if (typeof console !== 'undefined') {
            console.error(message, data);
        }
    },
    debug: (message, data) => {
        if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.debug(message, data);
        }
    },
};
// Rutas por rol - Redirecciones corregidas por aplicación
const ROLE_ROUTES = {
    [UserRole.ADMIN]: 'http://localhost:3005', // Admin app (puerto 3005)
    [UserRole.DOCTOR]: 'http://localhost:3002', // Doctors app (puerto 3002)
    [UserRole.PATIENT]: 'http://localhost:3003', // Patients app (puerto 3003)
    [UserRole.COMPANY]: 'http://localhost:3004', // Companies app (puerto 3004)
};
// Ruta por defecto para roles desconocidos o undefined
const DEFAULT_ROUTE = 'http://localhost:3000';
/**
 * Obtiene la ruta apropiada para un rol dado, con redirección a aplicación específica
 */
const getRoleRoute = (role) => {
    if (!role) {
        logger.warn(`[AuthProvider] Sin rol definido. Redirigiendo a web-app por defecto.`, null);
        return DEFAULT_ROUTE;
    }
    // Intentar encontrar la ruta exacta primero
    if (ROLE_ROUTES[role]) {
        const route = ROLE_ROUTES[role];
        logger.info(`[AuthProvider] Redirigiendo ${role} a: ${route}`, { role, route });
        return route;
    }
    // Mapeo de roles legacy que pueden existir por inconsistencias previas
    const legacyRoleMappings = {
        'company-admin': 'http://localhost:3004', // Mapear a companies app
        company_admin: 'http://localhost:3004',
        nurse: 'http://localhost:3002', // Los nurses van a doctors app
        staff: 'http://localhost:3002', // Staff médico va a doctors app
    };
    if (legacyRoleMappings[role.toLowerCase()]) {
        const route = legacyRoleMappings[role.toLowerCase()];
        logger.warn(`[AuthProvider] Mapeando rol legacy "${role}" a: ${route}`, { role, route });
        return route;
    }
    logger.warn(`[AuthProvider] Rol desconocido: "${role}". Redirigiendo a web-app por defecto.`, {
        role,
    });
    return DEFAULT_ROUTE;
};
const AuthContext = createContext(undefined);
export function AuthProvider({ children, redirectOnLogin = true, redirectOnLogout = true, loginPath = '/login', protectedPaths = [], }) {
    const router = useNextRouter();
    const authService = getAuthService();
    const [authState, setAuthState] = useState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });
    // Cargar usuario inicial
    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await authService.getCurrentUser();
                setAuthState({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                    error: null,
                });
            }
            catch (error) {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: 'Error loading user',
                });
            }
        };
        loadUser();
        // Suscribirse a cambios de autenticación
        const unsubscribe = authService.onAuthStateChange((user) => {
            setAuthState({
                user,
                isAuthenticated: !!user,
                isLoading: false,
                error: null,
            });
        });
        return unsubscribe;
    }, [authService]);
    // Proteger rutas
    useEffect(() => {
        if (!authState.isLoading && protectedPaths.length > 0) {
            const currentPath = window.location.pathname;
            const isProtected = protectedPaths.some((path) => currentPath.startsWith(path));
            if (isProtected && !authState.isAuthenticated) {
                const path = loginPath || '/login';
                router?.push(path);
            }
        }
    }, [authState.isLoading, authState.isAuthenticated, protectedPaths, loginPath, router]);
    // Métodos de autenticación
    const login = useCallback(async (credentials) => {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            const user = await authService.login(credentials);
            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            if (redirectOnLogin && user.role) {
                const route = getRoleRoute(user.role);
                // Si es una URL externa (diferente aplicación), usar window.location
                if (route.startsWith('http')) {
                    window.location.href = route;
                }
                else {
                    router?.push(route);
                }
            }
        }
        catch (error) {
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: error.message,
            });
            throw error;
        }
    }, [authService, redirectOnLogin, router]);
    const loginWithGoogle = useCallback(async () => {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            const user = await authService.loginWithGoogle();
            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            if (redirectOnLogin && user.role) {
                const route = getRoleRoute(user.role);
                // Si es una URL externa (diferente aplicación), usar window.location
                if (route.startsWith('http')) {
                    window.location.href = route;
                }
                else {
                    router?.push(route);
                }
            }
        }
        catch (error) {
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: error.message,
            });
            throw error;
        }
    }, [authService, redirectOnLogin, router]);
    const signUp = useCallback(async (data) => {
        // Renombrado de register a signUp
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            const user = await authService.signUp(data); // Llamar a signUp en el servicio
            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            if (redirectOnLogin && user.role) {
                const route = getRoleRoute(user.role);
                // Si es una URL externa (diferente aplicación), usar window.location
                if (route.startsWith('http')) {
                    window.location.href = route;
                }
                else {
                    router?.push(route);
                }
            }
        }
        catch (error) {
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: error.message,
            });
            throw error;
        }
    }, [authService, redirectOnLogin, router]);
    const logout = useCallback(async () => {
        setAuthState((prev) => ({ ...prev, isLoading: true }));
        try {
            await authService.logout();
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            if (redirectOnLogout) {
                router?.push('/');
            }
        }
        catch (error) {
            setAuthState((prev) => ({
                ...prev,
                isLoading: false,
                error: error.message,
            }));
            throw error;
        }
    }, [authService, redirectOnLogout, router]);
    const resetPassword = useCallback(async (email) => {
        await authService.resetPassword(email);
    }, [authService]);
    const updateProfile = useCallback(async (updates) => {
        if (!authState.user) {
            throw new Error('No user logged in');
        }
        setAuthState((prev) => ({ ...prev, isLoading: true }));
        try {
            await authService.updateUserProfile(authState.user.id, updates);
            setAuthState((prev) => ({
                ...prev,
                user: prev.user ? { ...prev.user, ...updates } : null,
                isLoading: false,
            }));
        }
        catch (error) {
            setAuthState((prev) => ({
                ...prev,
                isLoading: false,
                error: error.message,
            }));
            throw error;
        }
    }, [authService, authState.user]);
    // Helpers
    const hasRole = useCallback((role) => {
        return authState.user?.role === role;
    }, [authState.user]);
    const hasAnyRole = useCallback((roles) => {
        return !!authState.user && roles.includes(authState.user.role);
    }, [authState.user]);
    const isDoctor = useCallback(() => hasRole(UserRole.DOCTOR), [hasRole]);
    const isPatient = useCallback(() => hasRole(UserRole.PATIENT), [hasRole]);
    const isAdmin = useCallback(() => hasRole(UserRole.ADMIN), [hasRole]);
    const isCompanyUser = useCallback(() => {
        return hasRole(UserRole.COMPANY); // Simplificado a solo COMPANY
    }, [hasRole]);
    const canAccessTelemedicine = useCallback(() => {
        return (authState.isAuthenticated &&
            authState.user?.profileComplete === true &&
            authState.user?.emailVerified === true);
    }, [authState]);
    const hasCompletedProfile = useCallback(() => {
        return authState.user?.profileComplete === true;
    }, [authState.user]);
    // Verificar sesión SSO
    const checkSession = useCallback(async () => {
        try {
            // Verificar si hay usuario en el estado actual
            if (authState.user && authState.isAuthenticated) {
                return true;
            }
            // Intentar obtener el usuario actual del servicio
            const user = await authService.getCurrentUser();
            if (user) {
                setAuthState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger.error('[useAuth] Error verificando sesión:', error);
            return false;
        }
    }, [authState, authService]);
    // Navegación
    const redirectToRole = useCallback(() => {
        if (authState.user?.role) {
            const route = getRoleRoute(authState.user.role);
            // Si es una URL externa (diferente aplicación), usar window.location
            if (route.startsWith('http')) {
                window.location.href = route;
            }
            else {
                router?.push(route);
            }
        }
    }, [authState.user, router]);
    const redirectToLogin = useCallback(() => {
        const path = loginPath || '/login';
        router?.push(path);
    }, [router, loginPath]);
    const value = {
        ...authState,
        login,
        loginWithGoogle,
        signUp, // Exponer signUp en el contexto
        logout,
        resetPassword,
        updateProfile,
        hasRole,
        hasAnyRole,
        isDoctor,
        isPatient,
        isAdmin,
        isCompanyUser,
        canAccessTelemedicine,
        hasCompletedProfile,
        checkSession,
        redirectToRole,
        redirectToLogin,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// Hook principal
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
// Hook para proteger rutas
export function useProtectedRoute(allowedRoles) {
    const { isAuthenticated, isLoading, user, redirectToLogin } = useAuth();
    const router = useNextRouter();
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                redirectToLogin();
            }
            else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                router?.push('/unauthorized');
            }
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, redirectToLogin, router]);
    return {
        isAuthenticated,
        isLoading,
        hasAccess: !allowedRoles || (user && allowedRoles.includes(user.role)),
    };
}
// Hook para requerir autenticación
export function useRequireAuth() {
    const { isAuthenticated, isLoading, redirectToLogin } = useAuth();
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            redirectToLogin();
        }
    }, [isAuthenticated, isLoading, redirectToLogin]);
    return { isAuthenticated, isLoading };
}
// Hook para roles específicos
export function useRole(requiredRole) {
    const { user, hasRole } = useAuth();
    return {
        hasRequiredRole: hasRole(requiredRole),
        currentRole: user?.role || null,
    };
}
// Exportar todo
export { AuthContext };
