import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased for large import files (57MB+)
    },
  },
};

export default nextConfig;
