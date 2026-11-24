import sharp from 'sharp'

/**
 * Straightens tilted photos before the model reads them. In a wide grid, a
 * 2–3° tilt drifts the right-hand columns a whole time row against the labels.
 * Skew is estimated with a projection profile: the angle at which row sums of
 * dark pixels are most "peaky" is the one that makes table lines horizontal.
 */
export async function estimateSkew(input: Buffer): Promise<number> {
  const { data, info } = await sharp(input, { limitInputPixels: 25_000_000 }).rotate().greyscale().resize({ width: 700 }).raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height
  // Top edges of table lines and text: a pixel clearly darker than the one two rows above.
  const xs: number[] = [], ys: number[] = []
  for (let y = 2; y < h; y++) for (let x = 0; x < w; x++) if (data[(y - 2) * w + x] - data[y * w + x] > 25) { xs.push(x); ys.push(y) }
  if (xs.length < 200) return 0
  const score = (deg: number) => {
    const t = Math.tan((deg * Math.PI) / 180)
    const rows = new Float64Array(h)
    for (let i = 0; i < xs.length; i++) { const ry = Math.round(ys[i] - (xs[i] - w / 2) * t); if (ry >= 0 && ry < h) rows[ry]++ }
    let s = 0
    for (const r of rows) s += r * r
    return s
  }
  let best = 0, bestScore = score(0)
  for (let a = -6; a <= 6; a += 0.5) { const s = score(a); if (s > bestScore) { bestScore = s; best = a } }
  for (let a = best - 0.4; a <= best + 0.4 + 1e-9; a += 0.1) { const s = score(a); if (s > bestScore) { bestScore = s; best = a } }
  // Require a clear peak; flat profiles (sparse text) are not evidence of tilt.
  return bestScore > score(0) * 1.15 ? Math.round(best * 10) / 10 : 0
}

/** Returns a straightened PNG when the image is tilted by ≥0.4°, else null (send the original). */
export async function straighten(input: Buffer): Promise<Buffer | null> {
  try {
    const angle = await estimateSkew(input)
    if (Math.abs(angle) < 0.4) return null
    return await sharp(input, { limitInputPixels: 25_000_000 }).rotate().rotate(-angle, { background: '#ffffff' }).png({ compressionLevel: 6 }).toBuffer()
  } catch {
    return null
  }
}
