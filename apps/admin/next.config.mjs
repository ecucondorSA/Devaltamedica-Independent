import { appConfigs, withProfile } from '@altamedica/config-next';
import createBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const base = appConfigs.admin({
  // Custom configuration for admin app
  transpilePackages: [
    // Additional packages specific to admin
    '@altamedica/shared',
    '@altamedica/database',
  ],
  
  // Image domains for admin content
  images: {
    domains: [
      'localhost',
      'altamedica.com',
      'firebasestorage.googleapis.com',
      'admin-assets.altamedica.com',
    ],
  },
  
  // Custom webpack config for admin app
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Node.js polyfills
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        crypto: false,
        stream: false,
      };
    }
    
    return config;
  },
  
  // Additional experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@headlessui/react',
      '@radix-ui/react-icons',
    ],
  },

  // TypeScript and ESLint - stricter for admin
  typescript: {
    ignoreBuildErrors: false, // Admin should have no type errors
  },
  eslint: {
    ignoreDuringBuilds: false, // Admin should pass all linting
  },
  
  // Enhanced security headers for admin (already includes base from appConfigs)
  extraHeaders: [
    {
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
    },
    {
      key: 'X-Permitted-Cross-Domain-Policies',
      value: 'none'
    }
  ],
  
  // Admin-specific headers
  async headers() {
    const baseHeaders = await appConfigs.admin().headers();
    return [
      ...baseHeaders,
      {
        source: '/api/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
  
  // Admin-specific redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  }
});

export default withBundleAnalyzer(withProfile(base, 'adminSensitive'));