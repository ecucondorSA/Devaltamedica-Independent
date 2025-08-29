import { appConfigs, withProfile } from '@altamedica/config-next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const config = withProfile(appConfigs.companies({
  // Custom configuration for companies app
  transpilePackages: [
    // Additional packages specific to companies
    '@altamedica/marketplace-hooks',
    '@altamedica/maps', // For hospital redistribution maps
  ],
  
  // Image domains for company content
  images: {
    domains: [
      'localhost',
      'altamedica.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'company-logos.altamedica.com', // Company logos CDN
    ],
  },
  
  // Custom webpack config for companies app
  webpack: (config, { isServer, dev }) => {
    // Development alias for marketplace-hooks
    if (dev) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['@altamedica/marketplace-hooks'] = path.resolve(
        __dirname,
        '../../packages/marketplace-hooks/src'
      );
    }
    
    if (!isServer) {
      // Node.js polyfills
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Additional experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      // Note: recharts removed due to Turbopack issues
    ],
    externalDir: true,
    scrollRestoration: true,
  },

  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore for build
  },
  
  // Company-specific headers
  async headers() {
    const baseHeaders = await appConfigs.companies().headers();
    return [
      ...baseHeaders,
      {
        source: '/api/marketplace/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
      {
        source: '/operations-hub',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Allow embedding in same origin for dashboard
          },
        ],
      },
    ];
  },
  
  // Companies-specific redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/operations-hub',
        permanent: true,
      },
      {
        source: '/crisis-management',
        destination: '/operations-hub',
        permanent: true,
      },
    ];
  }
}), 'marketplace');

export default config;