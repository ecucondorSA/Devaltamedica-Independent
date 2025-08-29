// Utilidades centralizadas de redirección por rol
// Objetivo: eliminar duplicación en web-app, patients, doctors, etc.
// FUTURO: mover a paquete @altamedica/routing si crece.
import { NextResponse } from 'next/server';
// Puertos por defecto en dev (mantener sincronizados con docker / docs)
const DEFAULT_DEV_PORTS = {
    patient: 3003,
    doctor: 3002,
    company: 3004,
    admin: 3005
};
// Variables de entorno opcionales para overrides (staging/prod)
// Ej: NEXT_PUBLIC_PATIENTS_URL, etc.
const ENV_URLS = {
    patient: process.env.NEXT_PUBLIC_PATIENTS_URL,
    doctor: process.env.NEXT_PUBLIC_DOCTORS_URL,
    company: process.env.NEXT_PUBLIC_COMPANIES_URL,
    admin: process.env.NEXT_PUBLIC_ADMIN_URL
};
export function getAppBaseUrl(role) {
    const envUrl = ENV_URLS[role];
    if (envUrl)
        return envUrl.replace(/\/$/, '');
    // fallback dev
    const port = DEFAULT_DEV_PORTS[role];
    return `http://localhost:${port}`;
}
const DEFAULT_DASHBOARD_PATH = {
    patient: '/', // pacientes aterrizan en raíz app
    doctor: '/dashboard',
    company: '/dashboard',
    admin: '/dashboard'
};
export function getRedirectUrlForRole(role, opts = {}) {
    const base = getAppBaseUrl(role);
    if (opts.target === 'root')
        return base;
    const map = { ...DEFAULT_DASHBOARD_PATH, ...(opts.dashboardPathMap || {}) };
    const path = map[role] || '/';
    return base + path;
}
// Decodifica (sin validar criptográficamente) un JWT para extraer el payload y rol
export function decodeRoleFromToken(token) {
    if (!token)
        return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2)
            return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const role = payload.role;
        if (role === 'patient' || role === 'doctor' || role === 'company' || role === 'admin')
            return role;
        return null;
    }
    catch {
        return null;
    }
}
const DEFAULT_CONFIG = {
    cookieNames: ['auth-token', 'altamedica_token'],
    enforceRole: 'patient', // se sobrescribe al usar en cada app
    redirectIfMismatch: true,
    mismatchStrategy: 'own-role-app',
    gatewayUrl: 'http://localhost:3000',
    autoRedirectAuthenticatedRoot: true
};
// Middleware helper genérico para colocar en cada app especializada
export function handleAppRoleRedirect(request, appRole, config) {
    const cfg = { ...DEFAULT_CONFIG, enforceRole: appRole, ...(config || {}) };
    const cookieNames = cfg.cookieNames && cfg.cookieNames.length > 0 ? cfg.cookieNames : DEFAULT_CONFIG.cookieNames;
    const token = cookieNames
        .map((n) => request.cookies.get(n)?.value)
        .find(Boolean);
    const role = decodeRoleFromToken(token || null);
    const path = request.nextUrl.pathname;
    // 1. Usuario autenticado en raíz de la app => redirige a dashboard propio
    if (cfg.autoRedirectAuthenticatedRoot && path === '/' && role === appRole) {
        return NextResponse.redirect(getRedirectUrlForRole(appRole));
    }
    // 2. Usuario con rol distinto accede a app equivocada
    if (cfg.redirectIfMismatch && role && role !== appRole) {
        if (cfg.mismatchStrategy === 'home-gateway') {
            const gateway = cfg.gatewayUrl || DEFAULT_CONFIG.gatewayUrl;
            return NextResponse.redirect(new URL(gateway));
        }
        // estrategia 'own-role-app': enviarlo a su dashboard real
        return NextResponse.redirect(getRedirectUrlForRole(role));
    }
    return null; // continuar
}
// Gateway: decide a dónde mandar tras login si no confías en backend
export function inferPostLoginRedirect(role) {
    if (!role)
        return '/';
    return getRedirectUrlForRole(role);
}
// Helper para Next.js Route Handler / API para consolidar respuesta de login
export function buildLoginResponsePayload(role, extra = {}) {
    return {
        success: true,
        role,
        redirectUrl: getRedirectUrlForRole(role),
        ...extra
    };
}
