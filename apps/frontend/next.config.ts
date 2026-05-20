import type { NextConfig } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:4291';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@anvara/config'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
