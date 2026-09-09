import type { NextConfig } from 'next';

// Password auth uses only these fixed Firebase APIs; email actions run on Firebase's hosted page.
// No wildcard Google hosts, popups, Analytics, or embedded auth frames are enabled.
const authConnectSource = ' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com';

const nextConfig: NextConfig = {
  turbopack: {root: process.cwd()},
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
      {key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'" + authConnectSource + "; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"},
    ]}];
  }
};
export default nextConfig;
