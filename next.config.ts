/** @type {import('next').NextConfig} */
// The scanners read PDFs with pdfjs (text layer, no rendering) and straighten
// photos with sharp. pdfjs loads its worker and fonts at runtime, which Next's
// dependency tracing cannot see, so those files are included explicitly.
const scannerFiles = [
  './node_modules/pdfjs-dist/legacy/build/pdf*.mjs',
  './node_modules/pdfjs-dist/package.json',
  './node_modules/pdfjs-dist/standard_fonts/**',
]

const isDev = process.env.NODE_ENV === 'development'

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'sharp'],
  outputFileTracingIncludes: {
    '/api/schedule/parse': scannerFiles,
    '/api/deadlines/parse': scannerFiles,
  },
  images: {
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
    ]
  },
}

export default nextConfig
