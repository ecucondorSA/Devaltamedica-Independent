/**
 * Middleware exports for @altamedica/auth
 */

export { authGuard, createAuthMiddleware } from './auth-guard';
// SSO middleware removed - using session-based auth only
// export { 
//   createSSOMiddleware, 
//   ssoMiddlewareConfig,
//   type SSOConfig 
// } from './sso-middleware';