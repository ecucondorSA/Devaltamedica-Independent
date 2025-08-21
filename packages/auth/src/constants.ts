// AUTH_CONSTANTS para SSO de AltaMedica
export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'altamedica-development-secret-key-2025',
  REFRESH_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_EXPIRY: '15m',
} as const;

export const SSO_COOKIE_NAMES = {
  ACCESS_TOKEN: 'altamedica_sso_token',
  REFRESH_TOKEN: 'altamedica_refresh_token',
} as const;