import { appConfigs, withProfile } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver rutas absolutas al monorepo para alias explícitos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// (Rutas calculadas previamente eliminadas por no usarse)

/** @type {import('next').NextConfig} */
const config = withProfile(
  appConfigs.doctors({
    transpilePackages: [
      '@altamedica/medical-services',
      '@altamedica/telemedicine-core',
      '@altamedica/api-client',
      '@altamedica/hooks',
      '@altamedica/ui',
      '@altamedica/utils',
      '@altamedica/marketplace-hooks',
      '@altamedica/medical',
      '@altamedica/auth',
      '@altamedica/types',
      '@altamedica/firebase',
      '@altamedica/shared',
    ],
    compiler: {
      styledComponents: true,
      removeConsole: process.env.NODE_ENV === 'production' && {
        exclude: ['error', 'warn'],
      },
    },
    images: {
      domains: [
        'localhost',
        'altamedica.com',
        'firebasestorage.googleapis.com',
        'lh3.googleusercontent.com',
        'storage.googleapis.com',
      ],
    },
    webpack: (config, { isServer }) => {
      // Configuración para resolver módulos con pnpm workspaces
      config.resolve.symlinks = true;
      
      // Agregar resolución explícita para packages problemáticos
      config.resolve.alias = {
        ...config.resolve.alias,
        '@altamedica/telemedicine-core': path.resolve(__dirname, '../../packages/telemedicine-core'),
        '@altamedica/medical': path.resolve(__dirname, '../../packages/medical'),
        '@altamedica/utils': path.resolve(__dirname, '../../packages/utils'),
        '@altamedica/hooks': path.resolve(__dirname, '../../packages/hooks'),
        '@altamedica/ui': path.resolve(__dirname, '../../packages/ui'),
        '@altamedica/auth': path.resolve(__dirname, '../../packages/auth'),
        '@altamedica/auth/client': path.resolve(__dirname, '../../packages/auth/dist/client.mjs'),
        '@altamedica/firebase': path.resolve(__dirname, '../../packages/firebase'),
        '@altamedica/types': path.resolve(__dirname, '../../packages/types'),
        '@altamedica/shared': path.resolve(__dirname, '../../packages/shared'),
        '@altamedica/shared/services/logger.service': path.resolve(__dirname, '../../packages/shared/src/services/logger.service.ts'),
        '@altamedica/api-client': path.resolve(__dirname, '../../packages/api-client'),
        '@altamedica/marketplace-hooks': path.resolve(__dirname, '../../packages/marketplace-hooks'),
      };
      
      // Asegurar que webpack pueda resolver módulos fuera del directorio actual
      config.resolve.modules = [
        ...config.resolve.modules,
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname, '../../packages'),
      ];
      
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          process: false,
          buffer: false,
          stream: false,
          crypto: false,
          util: false,
          fs: false,
          net: false,
          tls: false,
        };
        // Removed DefinePlugin that was causing webpack error
        config.resolve.alias = {
          ...config.resolve.alias,
          'node:process': false,
          'node:buffer': false,
          'node:stream': false,
        };
      }
      return config;
    },
    experimental: {
      optimizePackageImports: [
        'lucide-react',
        '@radix-ui/react-icons',
        'recharts',
        'd3',
      ],
      scrollRestoration: true,
      externalDir: true,
      optimizeCss: false, // Disable CSS optimization to avoid webpack error
    },
    typescript: {
      // ignoreBuildErrors: true, // Temporalmente ignorar errores de TypeScript para permitir build
    },
    eslint: {
      // ignoreDuringBuilds: true, // Temporalmente ignorar errores de ESLint para permitir build
    },
    swcMinify: false, // Disable SWC minification to avoid webpack error
    async headers() {
      const baseHeaders = await appConfigs.doctors().headers();
      return [
        ...baseHeaders,
        { source: '/api/medical/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }] },
        { source: '/telemedicine/(.*)', headers: [{ key: 'Permissions-Policy', value: 'camera=(*), microphone=(*), display-capture=(*)' }] },
      ];
    },
  }),
  'telemedicine'
);

export default config;
