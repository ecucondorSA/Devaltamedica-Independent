import { appConfigs } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

// Compatibilidad ESM: definir __filename/__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const config = appConfigs.webApp({
  // Custom configuration for web-app
  transpilePackages: [
    // Solo lo necesario para marketing/auth
    '@altamedica/ui',
    '@altamedica/auth',
  ],

  // Image domains for medical content
  images: {
    domains: [
      'localhost',
      'altamedica.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com', // Google OAuth avatars
    ],
  },

  // Custom webpack config for web-app
  webpack: (config, { isServer, dev }) => {
    const monorepoAliases = {
      '@altamedica/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@altamedica/firebase': path.resolve(__dirname, '../../packages/firebase/src'),
      '@altamedica/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@altamedica/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@altamedica/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
      '@altamedica/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@altamedica/types': path.resolve(__dirname, '../../packages/types/src'),
      '@altamedica/utils': path.resolve(__dirname, '../../packages/utils/src'),
    };

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...monorepoAliases,
    };
    // Client-side optimizations
  if (!isServer) {
      // Node.js polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
      };

      // Exclude Firebase Admin from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-admin/auth': 'commonjs firebase-admin/auth',
        'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
      });

      // Remover dependencias 3D de marketing scope
      config.resolve.alias = {
        ...config.resolve.alias,
        // Resolver paquetes internos del monorepo directo a sus src para
        // evitar problemas de linking con pnpm en entornos CI/contenerizados.
  '@altamedica/auth': path.resolve(__dirname, '../../packages/auth/src'),
  '@altamedica/firebase': path.resolve(__dirname, '../../packages/firebase/src'),
  '@altamedica/ui': path.resolve(__dirname, '../../packages/ui/src'),
  '@altamedica/shared': path.resolve(__dirname, '../../packages/shared/src'),
  '@altamedica/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
  '@altamedica/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
  '@altamedica/types': path.resolve(__dirname, '../../packages/types/src'),
  '@altamedica/utils': path.resolve(__dirname, '../../packages/utils/src'),
      };
    }

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          minSize: 20000,
          cacheGroups: {
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Mantener leaflet para mapa demo, excluir three/@react-three
            maps: {
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              name: 'maps',
              chunks: 'all',
              priority: 15,
              enforce: true,
              reuseExistingChunk: true,
            },
            ui: {
              test: /[\\/]node_modules[\\/](framer-motion|recharts|canvas-confetti)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 12,
              reuseExistingChunk: true,
            },
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: (module) => {
                // Get package name from path
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return packageName
                  ? `vendor-${packageName.replace('@', '').replace('/', '-')}`
                  : 'vendor';
              },
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            }
          }
        },
        runtimeChunk: {
          name: 'runtime'
        },
        moduleIds: 'deterministic',
      };
    }

    return config;
  },

  // Additional experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons'
    ],
    webpackBuildWorker: true,
    scrollRestoration: true,
    largePageDataBytes: 128 * 1000,
  },

  // TypeScript and ESLint for development
  // Permitir saltar validaciones de TS/ESLint en builds de baja memoria (set BUILD_LENIENT=1)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development' || process.env.BUILD_LENIENT === '1',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development' || process.env.BUILD_LENIENT === '1',
  },

  // App-specific redirects
  async redirects() {
    return [
      {
        source: '/telemedicine',
        destination: '/patients',
        permanent: true,
      },
      {
        source: '/doctors-portal',
        destination: '/doctors',
        permanent: true,
      }
    ];
  },

  // PWA preparation
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js',
      }
    ];
  }
});

export default config;
