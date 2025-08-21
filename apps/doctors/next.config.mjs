import { appConfigs, withProfile } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver rutas absolutas al monorepo para alias explícitos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// apps/doctors -> repo root
const repoRoot = path.resolve(__dirname, '../../..');
// Rutas a código fuente para desarrollo: evitar problemas de resolución en dist
const hooksSrcPath = path.resolve(repoRoot, 'packages/hooks/src');
const apiClientSrcPath = path.resolve(repoRoot, 'packages/api-client/src');
const apiClientHooksSrcPath = path.resolve(repoRoot, 'packages/api-client/src/hooks/index.ts');

/** @type {import('next').NextConfig} */
const config = withProfile(
  appConfigs.doctors({
    transpilePackages: [
      '@altamedica/medical-services',
      '@altamedica/telemedicine-core',
      // Necesario para resolver subpath exports "@altamedica/api-client/hooks" desde paquetes enlazados
      '@altamedica/api-client',
      '@altamedica/hooks',
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
      // Alias explícitos para paquetes internos con subpath exports en dev/ssr
      config.resolve.alias = {
        ...config.resolve.alias,
        // Resolver a código fuente en dev para evitar subpath exports de dist
        '@altamedica/hooks': hooksSrcPath,
        '@altamedica/api-client': apiClientSrcPath,
        '@altamedica/api-client/hooks': apiClientHooksSrcPath,
      };

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
      ignoreBuildErrors: process.env.NODE_ENV === 'development',
    },
    eslint: {
      ignoreDuringBuilds: process.env.NODE_ENV === 'development',
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
