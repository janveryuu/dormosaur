/** @type {import('next').NextConfig} */
// The scanners read PDFs with pdfjs (text layer, no rendering) and straighten
// photos with sharp. pdfjs loads its worker and fonts at runtime, which Next's
// dependency tracing cannot see, so those files are included explicitly.
const scannerFiles = [
  './node_modules/pdfjs-dist/legacy/build/pdf*.mjs',
  './node_modules/pdfjs-dist/package.json',
  './node_modules/pdfjs-dist/standard_fonts/**',
]

const nextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'sharp'],
  outputFileTracingIncludes: {
    '/api/schedule/parse': scannerFiles,
    '/api/deadlines/parse': scannerFiles,
  },
  images: {
    unoptimized: false,
  },
}

export default nextConfig
