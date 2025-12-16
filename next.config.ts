import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
