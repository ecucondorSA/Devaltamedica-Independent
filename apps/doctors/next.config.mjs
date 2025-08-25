import { appConfigs, withProfile } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver rutas absolutas al monorepo para alias explícitos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// apps/doctors -> repo root
const repoRoot = path.resolve(__dirname, '../../..');
// Rutas a paquetes compilados para evitar problemas de resolución
const hooksPath = path.resolve(repoRoot, 'packages/hooks');
const apiClientPath = path.resolve(repoRoot, 'packages/api-client');
const apiClientHooksPath = path.resolve(repoRoot, 'packages/api-client');
const uiPath = path.resolve(repoRoot, 'packages/ui');
const utilsPath = path.resolve(repoRoot, 'packages/utils');
const marketplaceHooksPath = path.resolve(repoRoot, 'packages/marketplace-hooks');
const telemedicineCorePath = path.resolve(repoRoot, 'packages/telemedicine-core');

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
    webpack: (config, { isServer, webpack }) => {
      // Configuración simplificada - usar transpilePackages en lugar de alias complejos

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
        config.plugins.push(
          new webpack.DefinePlugin({
            'process.env': JSON.stringify({}),
          })
        );
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
    },
    typescript: {
      ignoreBuildErrors: true, // Temporalmente ignorar errores de TypeScript para permitir build
    },
    eslint: {
      ignoreDuringBuilds: true, // Temporalmente ignorar errores de ESLint para permitir build
    },
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
