import { appConfigs, withProfile } from '@altamedica/config-next';

/** @type {import('next').NextConfig} */
const config = withProfile(
  appConfigs.patients({
    transpilePackages: [
      '@altamedica/patient-services',
      '@altamedica/medical-hooks',
      '@altamedica/telemedicine-core',
      '@altamedica/api-client',
      '@altamedica/hooks',
      '@altamedica/auth',
      '@altamedica/ui',
      '@altamedica/shared',
      '@altamedica/types',
      '@altamedica/firebase',
      '@altamedica/anamnesis',
      '@altamedica/utils',
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
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
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
