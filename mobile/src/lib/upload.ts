import { File } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

/**
 * Turns a picked image into an upload the scanner reads well and the server
 * accepts (≤ ~3.2 MB binary inside a 4.4 MB JSON body).
 * - Long edge capped at 2400 px: small portal text stays legible, uploads stay fast.
 * - Screenshots (PNG) stay lossless; photos are JPEG at 0.9, stepping down only when > 3.2 MB.
 */
const MAX_EDGE = 2400
const MAX_BYTES = 3.2 * 1024 * 1024

export async function prepareImage(asset: { uri: string; width?: number; height?: number; mimeType?: string | null }): Promise<string> {
  const png = /png/i.test(asset.mimeType ?? '') || /\.png$/i.test(asset.uri)
  let w = asset.width || 0
  let h = asset.height || 0
  let ctx = ImageManipulator.manipulate(asset.uri)
  if (w > 0 && h > 0 && Math.max(w, h) > MAX_EDGE) {
    ctx = ctx.resize(w >= h ? { width: MAX_EDGE } : { height: MAX_EDGE })
  }
  let image = await ctx.renderAsync()
  if ((!w || !h) && Math.max(image.width, image.height) > MAX_EDGE) {
    w = image.width
    h = image.height
    image = await ImageManipulator.manipulate(asset.uri).resize(w >= h ? { width: MAX_EDGE } : { height: MAX_EDGE }).renderAsync()
  }

  let format = png ? SaveFormat.PNG : SaveFormat.JPEG
  let out = await image.saveAsync({ format, compress: png ? 1 : 0.9, base64: true })
  const qualities = [0.9, 0.82, 0.72]
  for (const q of qualities) {
    if ((out.base64?.length ?? 0) * 0.75 <= MAX_BYTES && format === SaveFormat.JPEG) break
    if ((out.base64?.length ?? 0) * 0.75 <= MAX_BYTES) break
    format = SaveFormat.JPEG
    out = await image.saveAsync({ format: SaveFormat.JPEG, compress: q, base64: true })
  }
  if (!out.base64) throw new Error('Could not read that image.')
  if (out.base64.length * 0.75 > MAX_BYTES) {
    throw new Error('That image is too large. Please crop or choose a smaller file.')
  }
  const mime = format === SaveFormat.PNG && out.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${out.base64}`
}

/** PDFs and other files go up as-is (the server reads a PDF's own text exactly). */
export async function prepareFile(asset: { uri: string; name: string; mimeType?: string | null; size?: number | null }): Promise<{ dataUrl: string; isImage: boolean }> {
  const mime = asset.mimeType ?? (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
  if (mime.startsWith('image/')) return { dataUrl: await prepareImage({ uri: asset.uri, mimeType: mime }), isImage: true }
  if ((asset.size ?? 0) > MAX_BYTES) throw new Error('That PDF is over 3 MB. Export just the schedule page and try again.')
  return { dataUrl: `data:${mime};base64,${await new File(asset.uri).base64()}`, isImage: false }
}
