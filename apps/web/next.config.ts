import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Output configuration
  output: 'standalone',
  
  // Transpile packages from monorepo
  transpilePackages: ['@soul-kg-crm/shared'],
  
  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },
  
  // Webpack configuration for monorepo
  webpack: (config, { isServer }) => {
    // Handle monorepo packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
