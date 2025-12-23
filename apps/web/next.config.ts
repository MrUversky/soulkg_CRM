import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

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
  
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default withNextIntl(nextConfig);
