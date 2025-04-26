import createNextIntlPlugin from 'next-intl/plugin';
import nextPWA from 'next-pwa';

// 1. Create the next-intl plugin instance
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// 2. Define the PWA configuration
const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
};

// 3. Create the PWA plugin instance
const withPWA = nextPWA(pwaConfig);

// 4. Define the base Next.js configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    loader: 'akamai',
    path: '/',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'alimny.kinde.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? `https://${process.env.VERCEL_URL}`,
    KINDE_SITE_URL: process.env.KINDE_SITE_URL ?? `https://${process.env.VERCEL_URL}`,
    KINDE_POST_LOGOUT_REDIRECT_URL:
      process.env.KINDE_POST_LOGOUT_REDIRECT_URL ?? `https://${process.env.VERCEL_URL}`,
    KINDE_POST_LOGIN_REDIRECT_URL:
      process.env.KINDE_POST_LOGIN_REDIRECT_URL ?? `https://${process.env.VERCEL_URL}`
  },
};

// 5. Apply the plugins sequentially and export
export default withPWA(withNextIntl(nextConfig));

