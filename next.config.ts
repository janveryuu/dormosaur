/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['tesseract.js', 'tesseract.js-core', 'pdfjs-dist', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/schedule/parse': [
      './node_modules/tesseract.js/**',
      './node_modules/tesseract.js-core/**',
      './node_modules/@tesseract.js-data/eng/**',
      './node_modules/pdfjs-dist/legacy/build/pdf*.mjs',
      './node_modules/pdfjs-dist/standard_fonts/**',
      './node_modules/@napi-rs/canvas*/**',
    ],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
