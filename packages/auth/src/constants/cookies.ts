/**
 * Auth cookie names standardized across the platform
 * HIPAA: tokens must be stored in HttpOnly/Secure cookies set by api-server
 */
export const AUTH_COOKIES = {
  token: 'altamedica_token',
  refresh: 'altamedica_refresh',
  user: 'altamedica_user',
} as const;

export type AuthCookieName = typeof AUTH_COOKIES[keyof typeof AUTH_COOKIES];

/**
 * Legacy cookie names kept for backward compatibility during migration
 */
export const LEGACY_AUTH_COOKIES = {
  token: 'auth-token',
  refresh: 'refresh-token',
  user: 'user-info',
} as const;
