/**
 * lib/image-utils.ts
 * Preserve schedule text; optimize only oversized images for the inline upload.
 */

export async function compressImageForOcr(
  input: File | string,
  maxDimension = 3200,
  quality = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Read input into Data URL if it is a File
    if (typeof input !== 'string') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string
        processDataUrl(rawDataUrl, maxDimension, quality, resolve)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(input)
    } else {
      processDataUrl(input, maxDimension, quality, resolve)
    }
  })
}

function processDataUrl(
  dataUrl: string,
  maxDimension: number,
  quality: number,
  resolve: (res: string) => void
) {
  // PDFs are native Gemini inputs, not images to rasterize or re-encode.
  if (dataUrl.startsWith('data:application/pdf;')) return resolve(dataUrl)

  // If not in browser environment (SSR), return as-is
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return resolve(dataUrl)
  }

  const img = new Image()
  img.onload = () => {
    try {
      let width = img.width
      let height = img.height
      // 3 MiB binary leaves room for base64/JSON in a 4.5 MB request body.
      const maxBytes = 3 * 1024 * 1024
      const sourceBytes = Math.ceil((dataUrl.split(',')[1]?.length || 0) * 3 / 4)
      if (sourceBytes <= maxBytes) {
        return resolve(dataUrl)
      }

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

      // Keep PNG screenshots lossless where they fit the upload budget.
      const isPng = dataUrl.startsWith('data:image/png;')
      let compressedDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality)
      if (isPng && compressedDataUrl.length > maxBytes * 4 / 3) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      }
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

/**
 * Crops an input image to a 1:1 square centered on the subject and resizes it to a compact, crisp avatar (e.g. 320x320, < 25KB).
 */
export async function cropAndCompressAvatar(
  input: File | string,
  targetSize = 320,
  quality = 0.88
): Promise<{ dataUrl: string; blob: Blob | null }> {
  return new Promise((resolve, reject) => {
    const handleDataUrl = (dataUrl: string) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve({ dataUrl, blob: null })
      }

      const img = new Image()
      img.onload = () => {
        try {
          const width = img.width
          const height = img.height
          const minDim = Math.min(width, height)
          const sx = (width - minDim) / 2
          const sy = (height - minDim) / 2

          const canvas = document.createElement('canvas')
          canvas.width = targetSize
          canvas.height = targetSize

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            return resolve({ dataUrl, blob: null })
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Draw center square crop
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize)

          const croppedDataUrl = canvas.toDataURL('image/webp', quality) || canvas.toDataURL('image/jpeg', quality)

          canvas.toBlob(
            (blob) => {
              resolve({ dataUrl: croppedDataUrl, blob })
            },
            'image/webp',
            quality
          )
        } catch (err) {
          console.warn('[Avatar Crop Notice] Falling back to original:', err)
          resolve({ dataUrl, blob: null })
        }
      }

      img.onerror = (err) => {
        console.warn('[Avatar Load Notice] Falling back:', err)
        resolve({ dataUrl, blob: null })
      }

      img.src = dataUrl
    }

    if (typeof input !== 'string') {
      const reader = new FileReader()
      reader.onload = (e) => handleDataUrl(e.target?.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(input)
    } else {
      handleDataUrl(input)
    }
  })
}
