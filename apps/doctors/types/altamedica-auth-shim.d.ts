declare module '@altamedica/auth' {
  export interface SSOConfig {
    appName: string;
    allowedRoles?: string[];
    loginUrl?: string;
    apiUrl?: string;
    publicPaths?: string[];
    debug?: boolean;
    unauthorizedUrl?: string;
    enableCORS?: boolean;
    allowedOrigins?: string[];
  }
  export function createSSOMiddleware(config: SSOConfig): any;
  export const ssoMiddlewareConfig: { matcher: string[] };
}
