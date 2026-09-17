import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  devIndicators: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), geolocation=()' },
      { key: 'Content-Security-Policy', value: [
        "default-src 'self'",
        // 'unsafe-inline' required: Next.js injects inline bootstrap scripts for hydration.
        // 'unsafe-eval' only in dev: webpack/react-refresh uses eval(); not present in production.
        isDev
          ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
          : "script-src 'self' 'unsafe-inline'",
        // 'unsafe-inline' for JSX style props; fonts.googleapis.com for @import in globals.css
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // Actual font files are served from fonts.gstatic.com
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://images.unsplash.com",
        "media-src 'self' blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ') },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
    ] }];
  }
};
export default nextConfig;

