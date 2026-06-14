import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tb-static.uber.com' },
      { protocol: 'https', hostname: 'd1ralsognjng37.cloudfront.net' },
    ],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ],
    }]
  },
};

export default nextConfig;
