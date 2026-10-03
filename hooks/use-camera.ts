'use client'
import * as React from 'react'

// Camera streams can resolve after mode changes or unmount. Always stop the
// acquired stream, including streams that never attach to the video element.
export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const [status, setStatus] = React.useState<{ active: boolean; error: string | null }>({ active: false, error: null })
  const streamRef = React.useRef<MediaStream | null>(null)
  const [requestVersion, restart] = React.useReducer((n: number) => n + 1, 0)
  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus({ active: false, error: null })
  }, [videoRef])
  const startCamera = React.useCallback(() => { stopCamera(); restart() }, [stopCamera])
  React.useEffect(() => {
    if (!enabled) return
    let disposed = false
    const video = videoRef.current
    const request = navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 3200 }, height: { ideal: 2400 } } })
    if (!request) return
    void request.then(async stream => {
      if (disposed || !video) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream; video.srcObject = stream
      await video.play()
      if (!disposed) setStatus({ active: true, error: null })
    }).catch(() => {
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
      if (video) video.srcObject = null
      if (!disposed) setStatus({ active: false, error: 'Camera access is unavailable. Allow camera access or upload a photo instead.' })
    })
    return () => { disposed = true; streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; if (video) video.srcObject = null }
  }, [enabled, videoRef, requestVersion])
  const supported = typeof navigator === 'undefined' || Boolean(navigator.mediaDevices?.getUserMedia)
  return { cameraActive: enabled && status.active, cameraError: enabled && !supported ? 'Your browser cannot use the camera. Upload a photo instead.' : status.error, stopCamera, startCamera }
}
