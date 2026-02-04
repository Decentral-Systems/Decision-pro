/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        ".js": [".js", ".ts", ".tsx"],
        ".jsx": [".jsx", ".tsx"],
      },
    };

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            recharts: {
              name: "recharts",
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            reactQuery: {
              name: "react-query",
              test: /[\\/]node_modules[\\/](@tanstack[\\/]react-query)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            radix: {
              name: "radix-ui",
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            lucide: {
              name: "lucide-react",
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            vendor: {
              name: "vendor",
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
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/**/*.wasm"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "196.188.249.48",
      },
      {
        protocol: "https",
        hostname: "196.188.249.48",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
