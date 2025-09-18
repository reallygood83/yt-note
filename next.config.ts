import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;