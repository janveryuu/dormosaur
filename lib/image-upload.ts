import 'server-only'
import sharp from 'sharp'
import { InputError } from '@/lib/api-security'

const JPEG_DATA_URL_RE = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/
const MAX_INPUT_PIXELS = 25_000_000

/**
 * Validates a JPEG data URL, guards against pixel bombs, and re-encodes through
 * sharp so EXIF GPS/camera metadata and polyglot payloads are completely stripped.
 */
export async function sanitizeJpegUpload(
  dataUrl: unknown,
  opts: {
    maxBytes: number
    missingMessage: string
    invalidMessage: string
    tooLargeMessage: string
    maxEdge?: number
    quality?: number
  },
): Promise<Buffer> {
  const match = typeof dataUrl === 'string' ? JPEG_DATA_URL_RE.exec(dataUrl) : null
  if (!match) throw new InputError(opts.missingMessage)

  const rawBytes = Buffer.from(match[1], 'base64')
  if (rawBytes.length < 4 || rawBytes[0] !== 0xff || rawBytes[1] !== 0xd8 || rawBytes[2] !== 0xff) {
    throw new InputError(opts.invalidMessage)
  }
  if (rawBytes.length > opts.maxBytes * 1.5) {
    throw new InputError(opts.tooLargeMessage, 413)
  }

  let clean: Buffer
  try {
    let pipeline = sharp(rawBytes, { limitInputPixels: MAX_INPUT_PIXELS }).rotate()
    if (opts.maxEdge) {
      pipeline = pipeline.resize(opts.maxEdge, opts.maxEdge, { fit: 'inside', withoutEnlargement: true })
    }
    clean = await pipeline.jpeg({ quality: opts.quality ?? 82, mozjpeg: true }).toBuffer()
  } catch {
    throw new InputError(opts.invalidMessage)
  }

  if (clean.length > opts.maxBytes) {
    throw new InputError(opts.tooLargeMessage, 413)
  }
  return clean
}
