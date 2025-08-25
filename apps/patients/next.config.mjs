import { appConfigs, withProfile } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver rutas absolutas al monorepo para alias explícitos (evitar subpath exports de dist en dev)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
// Usaremos la versión publicada (dist) desde node_modules para @altamedica/hooks
const hooksNodeModulesPath = path.resolve(__dirname, 'node_modules/@altamedica/hooks');
const apiClientSrcPath = path.resolve(repoRoot, 'packages/api-client/src');
const apiClientHooksSrcPath = path.resolve(repoRoot, 'packages/api-client/src/hooks/index.ts');

/** @type {import('next').NextConfig} */
const config = withProfile(
  appConfigs.patients({
    transpilePackages: [
      '@altamedica/patient-services',
      '@altamedica/medical-hooks',
      '@altamedica/telemedicine-core',
      // Necesario para resolver subpath exports desde paquetes enlazados en dev/SSR
      '@altamedica/api-client',
      '@altamedica/hooks',
      '@altamedica/auth', // Transpile auth package to handle 'use client' directive
      '@altamedica/ui', // Agregar UI package para resolver componentes
    ],
    images: {
      domains: [
        'localhost',
        'altamedica.com',
        'firebasestorage.googleapis.com',
        'lh3.googleusercontent.com',
      ],
    },
    experimental: {
      optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
      scrollRestoration: true,
    },
    typescript: {
      ignoreBuildErrors: true, // Temporarily ignore for build
    },
    eslint: {
      ignoreDuringBuilds: true, // Temporarily ignore for build
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production' && {
        exclude: ['error', 'warn'],
      },
    },
    async headers() {
      const baseHeaders = await appConfigs.patients().headers();
      return [
        ...baseHeaders,
        {
          source: '/ai-diagnosis',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
          ],
        },
        {
          source: '/static/(.*)',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
      ];
    },
  }),
  'telemedicine'
);

export default config;
