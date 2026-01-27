/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  // output: "standalone" - disabled: standalone has MODULE_NOT_FOUND (lib/url) with Node 22
  // Use "next start" for production instead
  // Optimize compilation and build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Enable faster refresh and compilation
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Faster refresh in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Fix for lucide-react and other ESM modules
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.jsx': ['.jsx', '.tsx'],
      },
    };

    // Fix Zod tree-shaking issue - ensure Zod is properly bundled
    if (!isServer) {
      // Ensure Zod is properly resolved and not aggressively tree-shaken
      config.resolve.alias = {
        ...config.resolve.alias,
        'zod': require.resolve('zod'),
      };
      
      // Add Zod to optimization configuration
      config.optimization = {
        ...config.optimization,
        // Preserve side effects to prevent incorrect tree-shaking of Zod methods
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Zod gets its own chunk to prevent tree-shaking issues
            zod: {
              name: 'zod',
              test: /[\\/]node_modules[\\/](zod)[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
              enforce: true, // Force this chunk to always be created
            },
            // Vendor chunk for large libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // React Query chunk
            reactQuery: {
              name: 'react-query',
              test: /[\\/]node_modules[\\/](@tanstack[\\/]react-query)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Radix UI components
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // Lucide React icons
            lucide: {
              name: 'lucide-react',
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // Common vendor chunk
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  // Optimize bundle size
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./node_modules/**/*.wasm"],
    },
    // Disable optimizeCss to avoid critters dependency issues
    // optimizeCss: true,
  },
  images: {
    domains: ['196.188.249.48'],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '196.188.249.48',
      },
      {
        protocol: 'https',
        hostname: '196.188.249.48',
      },
    ],
  },
  // Enable static page generation where possible
  // This pre-renders pages at build time for faster load
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;


