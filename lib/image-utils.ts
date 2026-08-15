/**
 * lib/image-utils.ts
 * Client-side image compression & optimization helper for fast OCR processing.
 * Reduces 10MB camera photos to ~300KB while preserving ultra-crisp text sharpness.
 */

export async function compressImageForOcr(
  input: File | string,
  maxDimension = 1800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Read input into Data URL if it is a File
    if (typeof input !== 'string') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string
        processDataUrl(rawDataUrl, maxDimension, quality, resolve, reject)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(input)
    } else {
      processDataUrl(input, maxDimension, quality, resolve, reject)
    }
  })
}

function processDataUrl(
  dataUrl: string,
  maxDimension: number,
  quality: number,
  resolve: (res: string) => void,
  reject: (err: any) => void
) {
  // If not in browser environment (SSR), return as-is
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return resolve(dataUrl)
  }

  const img = new Image()
  img.onload = () => {
    try {
      let width = img.width
      let height = img.height

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return resolve(dataUrl)
      }

      // Enable high-quality image smoothing for text clarity
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Fill white background for transparent PNGs
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG for maximum compression efficiency
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    } catch (err) {
      console.warn('[Image Compression Notice] Falling back to original data URL:', err)
      resolve(dataUrl)
    }
  }

  img.onerror = (err) => {
    console.warn('[Image Load Error] Using raw data URL:', err)
    resolve(dataUrl)
  }

  img.src = dataUrl
}
