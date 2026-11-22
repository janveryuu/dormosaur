import { File } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

/**
 * Turns a picked image into an upload the scanner reads well and the server
 * accepts (≤ ~3.2 MB binary inside a 4.4 MB JSON body).
 * - Long edge capped at 2400 px: small portal text stays legible, uploads stay fast.
 * - Screenshots (PNG) stay lossless; photos are JPEG at 0.9. Never 0.7: it smears 8-pt text.
 */
const MAX_EDGE = 2400
const MAX_BYTES = 3.2 * 1024 * 1024

export async function prepareImage(asset: { uri: string; width?: number; height?: number; mimeType?: string | null }): Promise<string> {
  const png = /png/i.test(asset.mimeType ?? '') || /\.png$/i.test(asset.uri)
  let image = await ImageManipulator.manipulate(asset.uri).renderAsync()
  const w = asset.width || image.width, h = asset.height || image.height
  if (Math.max(w, h) > MAX_EDGE) image = await ImageManipulator.manipulate(asset.uri).resize(w >= h ? { width: MAX_EDGE } : { height: MAX_EDGE }).renderAsync()
  let out = await image.saveAsync({ format: png ? SaveFormat.PNG : SaveFormat.JPEG, compress: png ? 1 : 0.9, base64: true })
  if (png && (out.base64?.length ?? 0) * 0.75 > MAX_BYTES) out = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.92, base64: true })
  if (!out.base64) throw new Error('Could not read that image.')
  const mime = out.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${out.base64}`
}

/** PDFs and other files go up as-is (the server reads a PDF's own text exactly). */
export async function prepareFile(asset: { uri: string; name: string; mimeType?: string | null; size?: number | null }): Promise<{ dataUrl: string; isImage: boolean }> {
  const mime = asset.mimeType ?? (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
  if (mime.startsWith('image/')) return { dataUrl: await prepareImage({ uri: asset.uri, mimeType: mime }), isImage: true }
  if ((asset.size ?? 0) > MAX_BYTES) throw new Error('That PDF is over 3 MB. Export just the schedule page and try again.')
  return { dataUrl: `data:${mime};base64,${await new File(asset.uri).base64()}`, isImage: false }
}
