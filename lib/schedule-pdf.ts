import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'

// Gemini still receives the original PDF. Rasterization is only an OCR fallback.
export async function renderSchedulePdf(bytes: Buffer): Promise<Buffer[]> {
  const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'))
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(nodeRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href
  const root = path.dirname(nodeRequire.resolve('pdfjs-dist/package.json'))
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: path.join(root, 'standard_fonts').replace(/\\/g, '/') + '/',
    wasmUrl: path.join(root, 'wasm').replace(/\\/g, '/') + '/',
    useSystemFonts: false,
    verbosity: 0,
  })
  const images: Buffer[] = []
  try {
    const document = await task.promise
    // Partial extraction is preferable to an unbounded multi-page OCR job.
    for (let index = 1; index <= Math.min(document.numPages, 4); index++) {
      const page = await document.getPage(index)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: Math.min(3, 3200 / Math.max(base.width, base.height)) })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      await page.render({ canvas: null, canvasContext: canvas.getContext('2d') as unknown as CanvasRenderingContext2D, viewport }).promise
      images.push(canvas.toBuffer('image/png'))
      page.cleanup()
    }
    return images
  } finally {
    await task.destroy()
  }
}
