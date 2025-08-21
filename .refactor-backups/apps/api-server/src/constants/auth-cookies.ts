/**
 * Fallback local de nombres de cookies de autenticación
 * Mantener sincronizado con @altamedica/auth/constants/cookies.ts
 */
export const AUTH_COOKIES = {
  token: 'altamedica_token',
  refresh: 'altamedica_refresh',
  user: 'altamedica_user',
  session: 'altamedica_session',
  csrf: 'altamedica_csrf',
} as const;

export const LEGACY_AUTH_COOKIES = {
  token: 'auth-token',
  refresh: 'refresh-token',
  user: 'user-info',
} as const;
