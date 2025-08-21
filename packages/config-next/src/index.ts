/**
 * @altamedica/config-next
 * Secure Next.js configuration with HIPAA-compliant headers
 */
 
// Nota: evitamos depender de los tipos de 'next' para poder compilar el paquete
// de forma independiente dentro del monorepo sin instalar 'next' aquí.
export type NextConfig = Record<string, any>;

export type SecurityHeader = { key: string; value: string };

/**
 * HIPAA-compliant security headers
 * Based on OWASP recommendations and healthcare requirements
 */
export const hipaaSecurityHeaders: SecurityHeader[] = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(*), microphone=(*), geolocation=(self), notifications=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

/**
 * Additional headers for PHI protection
 */
export const phiProtectionHeaders: SecurityHeader[] = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
];

export interface CSPConfig {
  dev?: boolean;
  customDirectives?: Record<string, string>;
  reportUri?: string;
}

/**
 * Builds Content Security Policy header
 * Allows customization while maintaining security
 */
export function buildCsp(config: CSPConfig = {}): string {
  const { dev = false, customDirectives = {}, reportUri } = config;
  
  const defaultDirectives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': `'self'${dev ? " 'unsafe-eval' 'unsafe-inline'" : " 'nonce-{nonce}'"}`,
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'img-src': "'self' data: blob: https:",
    'font-src': "'self' https://fonts.gstatic.com",
    'connect-src': `'self'${dev ? " http://localhost:* ws://localhost:* wss://localhost:*" : ""} https://api.altamedica.com`,
    'media-src': "'self' blob:",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
    'upgrade-insecure-requests': '',
  };
  
  // Merge custom directives
  const finalDirectives = { ...defaultDirectives, ...customDirectives };
  
  // Build CSP string
  let csp = Object.entries(finalDirectives)
    .filter(([_, value]) => value !== '')
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
    
  // Add report-uri if provided
  if (reportUri) {
    csp += `; report-uri ${reportUri}`;
  }
  
  return csp;
}

export interface CreateNextConfigOptions {
  /** Application name for logging */
  appName: string;
  /** Additional security headers */
  extraHeaders?: SecurityHeader[];
  /** Enable PHI protection headers on specific routes */
  phiRoutes?: string[];
  /** Custom CSP configuration */
  cspConfig?: CSPConfig;
  /** Monorepo packages to transpile */
  transpilePackages?: string[];
  /** Enable ChunkLoadError handler in development */
  enableChunkErrorHandler?: boolean;
  /** Custom webpack configuration */
  webpack?: (config: any, options: any) => any;
  /** Image optimization configuration */
  images?: {
    domains?: string[];
    deviceSizes?: number[];
    imageSizes?: number[];
  };
  /** Environment variables to expose to client */
  publicRuntimeConfig?: Record<string, any>;
  /** Server-only configuration */
  serverRuntimeConfig?: Record<string, any>;
  /** Experimental features */
  experimental?: Record<string, any>;
}

/**
 * Creates a secure Next.js configuration with HIPAA compliance
 */
export function createSecureNextConfig(options: CreateNextConfigOptions): NextConfig {
  const {
    appName,
    extraHeaders = [],
    phiRoutes = ['/patients', '/medical', '/appointments'],
    cspConfig = {},
    transpilePackages = [],
    enableChunkErrorHandler = true,
    webpack,
    images = {},
    publicRuntimeConfig = {},
    serverRuntimeConfig = {},
    experimental = {},
  } = options;

  const isDev = process.env.NODE_ENV === 'development';

  return {
    // Basic security
    poweredByHeader: false,
    compress: true,
    
    // Transpile monorepo packages
    transpilePackages: [
      '@altamedica/ui',
      '@altamedica/auth',
      '@altamedica/types',
      '@altamedica/hooks',
      '@altamedica/api-client',
      '@altamedica/medical',
      '@altamedica/database',
      '@altamedica/firebase',
      '@altamedica/shared',
      '@altamedica/utils',
      '@altamedica/maps',
      ...transpilePackages,
    ],
    
    // Image optimization
    images: {
      formats: ['image/webp', 'image/avif'],
      domains: ['localhost', 'altamedica.com', ...images.domains || []],
      deviceSizes: images.deviceSizes || [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: images.imageSizes || [16, 32, 48, 64, 96, 128, 256, 384],
    },
    
    // Security headers
    async headers() {
      const headers = [
        // Apply base security headers to all routes
        {
          source: '/(.*)',
          headers: [
            { key: 'Content-Security-Policy', value: buildCsp({ dev: isDev, ...cspConfig }) },
            ...hipaaSecurityHeaders,
            ...extraHeaders,
          ],
        },
      ];
      
      // Apply PHI protection headers to sensitive routes
      if (phiRoutes.length > 0) {
        headers.push({
          source: `/:path*(${phiRoutes.join('|')})`,
          headers: phiProtectionHeaders,
        });
      }
      
      return headers;
    },
    
    // Webpack configuration
    webpack: (config: any, options: any) => {
      // Add ChunkLoadError handler in development
      if (isDev && enableChunkErrorHandler) {
        config.plugins.push({
          apply: (compiler: any) => {
            compiler.hooks.compilation.tap('ChunkErrorHandler', (compilation: any) => {
              compilation.hooks.htmlWebpackPluginAfterHtmlProcessing?.tapAsync(
                'ChunkErrorHandler',
                (data: any, cb: any) => {
                  data.html = data.html.replace(
                    '</body>',
                    `<script>
                      if (process.env.NODE_ENV === 'development') {
                        window.addEventListener('error', function(e) {
                          if (e.error && e.error.name === 'ChunkLoadError') {
                            const url = new URL(window.location.href);
                            url.searchParams.set('nocache', Date.now());
                            window.location.replace(url.toString());
                          }
                        });
                      }
                    </script></body>`
                  );
                  cb(null, data);
                }
              );
            });
          },
        });
      }
      
      // Apply custom webpack config if provided
      if (webpack) {
        return webpack(config, options);
      }
      
      return config;
    },
    
    // Runtime configuration
    publicRuntimeConfig: {
      appName,
      ...publicRuntimeConfig,
    },
    serverRuntimeConfig: {
      ...serverRuntimeConfig,
    },
    
    // Experimental features
    experimental: {
      // Optimize CSS (Next 15 compatible)
      optimizeCss: true,
      ...experimental,
    },
    
    // Environment variables schema validation
    env: {
      NEXT_PUBLIC_APP_NAME: appName,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      NEXT_PUBLIC_SSO_URL: process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000',
    },
    
    // Redirects for common patterns
    async redirects() {
      return [
        // Redirect /index to /
        {
          source: '/index',
          destination: '/',
          permanent: true,
        },
        // Redirect old auth routes to new ones
        {
          source: '/login',
          destination: '/auth/login',
          permanent: true,
        },
        {
          source: '/register',
          destination: '/auth/register',
          permanent: true,
        },
      ];
    },
    
    // Custom 404 and error pages
    async rewrites() {
      return {
        beforeFiles: [],
        afterFiles: [],
        fallback: [],
      };
    },
  } as NextConfig;
}

/**
 * Utility to create app-specific configurations
 */
export const appConfigs = {
  webApp: (extraOptions?: Partial<CreateNextConfigOptions>) => 
    createSecureNextConfig({
      appName: 'web-app',
      phiRoutes: [],
      ...extraOptions,
    }),
    
  patients: (extraOptions?: Partial<CreateNextConfigOptions>) =>
    createSecureNextConfig({
      appName: 'patients',
      phiRoutes: ['/dashboard', '/medical', '/appointments', '/records'],
      ...extraOptions,
    }),
    
  doctors: (extraOptions?: Partial<CreateNextConfigOptions>) =>
    createSecureNextConfig({
      appName: 'doctors',
      phiRoutes: ['/patients', '/consultations', '/prescriptions', '/medical-records'],
      ...extraOptions,
    }),
    
  companies: (extraOptions?: Partial<CreateNextConfigOptions>) =>
    createSecureNextConfig({
      appName: 'companies',
      phiRoutes: ['/employees', '/health-data'],
      ...extraOptions,
    }),
    
  admin: (extraOptions?: Partial<CreateNextConfigOptions>) =>
    createSecureNextConfig({
      appName: 'admin',
      phiRoutes: ['/*'], // All admin routes are sensitive
      extraHeaders: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
      ...extraOptions,
    }),
};

/* ...existing code... */
export interface ProfileOptions {
  profile?: 'telemedicine' | 'marketplace' | 'adminSensitive';
}

function applyTelemedicineProfile(cfg: any) {
  cfg.optimization = cfg.optimization || {};
  cfg.optimization.splitChunks = cfg.optimization.splitChunks || { chunks: 'all', cacheGroups: {} };
  const groups = cfg.optimization.splitChunks.cacheGroups || {};
  cfg.optimization.splitChunks.cacheGroups = groups;
  groups.telemedicine = groups.telemedicine || {
    test: /[\\/]node_modules[\\/](webrtc|simple-peer|socket\.io)[\\/]/,
    name: 'telemedicine',
    chunks: 'all',
    priority: 20,
  };
  groups.firebase = groups.firebase || {
    test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
    name: 'firebase',
    chunks: 'all',
    priority: 18,
  };
  return cfg;
}

function applyMarketplaceProfile(cfg: any) {
  cfg.optimization = cfg.optimization || {};
  cfg.optimization.splitChunks = cfg.optimization.splitChunks || { chunks: 'all', cacheGroups: {} };
  const groups = cfg.optimization.splitChunks.cacheGroups || {};
  cfg.optimization.splitChunks.cacheGroups = groups;
  groups.maps = groups.maps || {
    test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
    name: 'maps',
    chunks: 'all',
    priority: 20,
  };
  groups.charts = groups.charts || {
    test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
    name: 'charts',
    chunks: 'all',
    priority: 15,
  };
  groups.firebase = groups.firebase || {
    test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
    name: 'firebase',
    chunks: 'all',
    priority: 18,
  };
  return cfg;
}

function applyAdminSensitiveProfile(cfg: any) {
  // Admin: performance budgets + vendor grouping + charts + firebase
  cfg.optimization = cfg.optimization || {};
  cfg.optimization.splitChunks = cfg.optimization.splitChunks || { chunks: 'all', cacheGroups: {} };
  const groups = cfg.optimization.splitChunks.cacheGroups || {};
  cfg.optimization.splitChunks.cacheGroups = groups;
  groups.vendor = groups.vendor || {
    test: /[\\/]node_modules[\\/]/,
    name: 'vendor',
    chunks: 'all',
    priority: 10,
  };
  groups.adminCharts = groups.adminCharts || {
    test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
    name: 'admin-charts',
    chunks: 'all',
    priority: 18,
  };
  groups.firebase = groups.firebase || {
    test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
    name: 'firebase',
    chunks: 'all',
    priority: 17,
  };
  cfg.performance = cfg.performance || { maxAssetSize: 250000, maxEntrypointSize: 250000 };
  return cfg;
}

export function withProfile(baseConfig: any, profile?: ProfileOptions['profile']): any {
  if (!profile) return baseConfig;
  const originalWebpack = baseConfig.webpack;
  baseConfig.webpack = (config: any, options: any) => {
    // Ejecutar webpack original primero
    let final = originalWebpack ? originalWebpack(config, options) : config;
    switch (profile) {
      case 'telemedicine':
        final = applyTelemedicineProfile(final);
        break;
      case 'marketplace':
        final = applyMarketplaceProfile(final);
        break;
      case 'adminSensitive':
        final = applyAdminSensitiveProfile(final);
        break;
    }
    return final;
  };
  return baseConfig;
}
