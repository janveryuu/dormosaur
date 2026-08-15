'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Type,
  UploadCloud,
  WandSparkles,
  X,
} from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { PillButton } from '@/components/ios/pill-button'
import { parseRawSchedule } from '@/lib/parser'
import { rawScheduleSample } from '@/lib/data'
import { compressImageForOcr } from '@/lib/image-utils'
import { ScheduleScanProgress } from '@/components/schedule/scan-progress'

type ImportMode = 'text' | 'camera' | 'photo' | 'file'

const stages = [
  'Reading schedule source',
  'Analyzing document layout & text',
  'Detecting course codes & times',
  'Matching days & assign colors',
]

const sampleOcrText = `MATH101 calculus 1 M&F 8:30-9:50am sci hall 204 reyes
chem 130 general chem lab, mon/wed 10:15 to 12, lab b11
ENG205 modern lit TTh 9:10-10:20 humanities 310 (tanaka)
cs150 intro programming tues-thurs 1pm-2:40pm tech 118
psy 110 mon-fri 3:00-4:20 west wing 22 dr patel`

export default function ImportSchedulePage() {
  const router = useRouter()
  const [mode, setMode] = React.useState<ImportMode>('text')
  const [raw, setRaw] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [stage, setStage] = React.useState(0)

  // Camera state
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = React.useState(false)
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [cameraError, setCameraError] = React.useState<string | null>(null)

  // File upload state
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; size: string; previewUrl?: string } | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const photoInputRef = React.useRef<HTMLInputElement | null>(null)

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (err) {
      console.warn('Camera access error or restricted:', err)
      setCameraError('Camera access denied or unavailable. You can upload a photo instead!')
    }
  }

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  React.useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, capturedImage])

  const [isOcrScanning, setIsOcrScanning] = React.useState(false)
  const [ocrError, setOcrError] = React.useState<string | null>(null)
  const [parsedClasses, setParsedClasses] = React.useState<ClassEntry[] | null>(null)
  const activeScanPromiseRef = React.useRef<Promise<any> | null>(null)

  const processImageWithGemini = async (rawImageInput: File | string) => {
    setIsOcrScanning(true)
    setOcrError(null)
    setParsedClasses(null)
    setRaw('')

    try {
      // 1. Client-side compression & downscaling to ~1800px (< 400KB)
      const compressedDataUrl = await compressImageForOcr(rawImageInput, 1800, 0.85)
      setCapturedImage(compressedDataUrl)

      // 2. Perform Single-Pass Gemini Vision Extraction
      const scanPromise = fetch('/api/schedule/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl, mode }),
      }).then((res) => res.json())

      activeScanPromiseRef.current = scanPromise
      const data = await scanPromise

      if (data.success && Array.isArray(data.classes) && data.classes.length > 0) {
        setParsedClasses(data.classes)
        setOcrError(null)
        return data.classes
      } else {
        setParsedClasses(null)
        setOcrError(data.error || "We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.")
        return null
      }
    } catch (err) {
      console.warn('Gemini vision processing error:', err)
      setParsedClasses(null)
      setOcrError("We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.")
      return null
    } finally {
      setIsOcrScanning(false)
      activeScanPromiseRef.current = null
    }
  }

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 1280
    canvas.height = videoRef.current.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setCapturedImage(dataUrl)
      stopCamera()
      processImageWithGemini(dataUrl)
    }
  }

  // Handle Photo / Image File Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageWithGemini(file)
    }
  }

  // Handle File Select (PDF / Document / ICS / TXT)
  const handleFileSelect = (file: File) => {
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB'
    if (file.type.startsWith('image/')) {
      setUploadedFile({ name: file.name, size: sizeKb })
      processImageWithGemini(file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || ''
        setUploadedFile({ name: file.name, size: sizeKb })
        if (textContent.trim()) {
          setRaw(textContent.trim())
          setOcrError(null)
        } else {
          setRaw('')
          setOcrError('The uploaded text file appears to be empty.')
        }
      }
      reader.readAsText(file)
    }
  }

  // Process Schedule Import
  const handleStartImport = async () => {
    setOcrError(null)

    // If active background scan is running, await its completion
    if (activeScanPromiseRef.current) {
      const data = await activeScanPromiseRef.current
      if (data?.success && Array.isArray(data.classes) && data.classes.length > 0) {
        try {
          sessionStorage.setItem('dormosaur_parsed_draft', JSON.stringify(data.classes))
        } catch (e) {}
        setLoading(true)
        return
      }
    }

    let classesToSave: ClassEntry[] = []

    if (mode === 'text') {
      const trimmedRaw = raw.trim()
      if (!trimmedRaw) {
        setOcrError("Please paste schedule text first.")
        return
      }
      classesToSave = parseRawSchedule(trimmedRaw)
    } else {
      if (parsedClasses && parsedClasses.length > 0) {
        classesToSave = parsedClasses
      } else if (raw.trim()) {
        classesToSave = parseRawSchedule(raw.trim())
      } else if (capturedImage) {
        const scanned = await processImageWithGemini(capturedImage)
        if (scanned && scanned.length > 0) {
          classesToSave = scanned
        }
      }
    }

    if (!classesToSave || classesToSave.length === 0) {
      setOcrError("We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.")
      return
    }

    try {
      sessionStorage.setItem('dormosaur_parsed_draft', JSON.stringify(classesToSave))
    } catch (e) {
      console.warn('Draft save notice:', e)
    }
    setLoading(true)
  }

  React.useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, stages.length - 1))
    }, 420)
    const done = setTimeout(() => router.push('/schedule/review'), 1900)
    return () => {
      clearInterval(id)
      clearTimeout(done)
    }
  }, [loading, router])

  return (
    <>
      <ScreenHeader
        title="Import schedule"
        backHref="/schedule"
        eyebrow="Step 1 of 2"
        subtitle="Paste text, snap a picture, or upload a file. Messy schedules are converted instantly."
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 pb-16">
        {/* ── Mode Switcher Tabs ── */}
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-fill p-1.5 shadow-inner">
          {[
            { id: 'text', label: 'Paste Text', icon: Type },
            { id: 'camera', label: 'Camera', icon: Camera },
            { id: 'photo', label: 'Photos', icon: ImageIcon },
            { id: 'file', label: 'Upload File', icon: FileText },
          ].map((item) => {
            const Icon = item.icon
            const active = mode === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id as ImportMode)
                }}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-card text-foreground shadow-ios'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`size-4.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2.2} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Main Input Card ── */}
        <div className="overflow-hidden rounded-4xl bg-card p-6 shadow-ios-lg">
          {/* TAB 1: PASTE TEXT */}
          {mode === 'text' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  Raw schedule text
                </span>
                <button
                  onClick={() => setRaw(rawScheduleSample)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <WandSparkles className="size-3.5" strokeWidth={2.2} />
                  Use sample text
                </button>
              </div>
              <textarea
                id="raw-schedule"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={8}
                disabled={loading}
                placeholder={rawScheduleSample}
                className="w-full resize-none rounded-3xl bg-fill p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted-foreground">
                <span>Copy straight from student portal or email</span>
                <span className="font-mono">{raw.trim() ? `${raw.trim().split(/\n+/).length} lines` : '0 lines'}</span>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CAMERA */}
          {mode === 'camera' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
              {!capturedImage ? (
                <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-fill p-4">
                  {cameraActive ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
                      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                      {/* Viewfinder overlay */}
                      <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed border-white/60" />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <button
                          onClick={capturePhoto}
                          className="flex size-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-90"
                        >
                          <div className="size-11 rounded-full border-2 border-primary bg-primary/20" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-6 px-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Camera className="size-7" strokeWidth={2} />
                      </div>
                      <p className="text-[14px] font-medium text-muted-foreground">
                        {cameraError || 'Allow camera permission to scan your printed timetable.'}
                      </p>
                      <button
                        onClick={startCamera}
                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-ios"
                      >
                        <Camera className="size-4" />
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex w-full flex-col items-center gap-4">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-fill p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImage} alt="Captured timetable" className="max-h-60 rounded-2xl object-contain" />
                    <button
                      onClick={() => {
                        setCapturedImage(null)
                        setRaw('')
                        startCamera()
                      }}
                      className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Photo captured & AI OCR text extracted!
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PHOTOS */}
          {mode === 'photo' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              {!capturedImage ? (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-separator bg-fill p-6 transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ImageIcon className="size-7" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Choose photo from library</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      PNG, JPG, HEIC, or screenshot of your syllabus
                    </p>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-ios">
                    Select Photo
                  </span>
                </div>
              ) : (
                <div className="relative flex w-full flex-col items-center gap-4">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-fill p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImage} alt="Uploaded photo" className="max-h-60 rounded-2xl object-contain" />
                    <button
                      onClick={() => {
                        setCapturedImage(null)
                        setRaw('')
                      }}
                      className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Image uploaded! High-accuracy text OCR ready.
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: FILE UPLOAD */}
          {mode === 'file' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.ics,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className={`flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-6 transition-all ${
                    dragOver
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-separator bg-fill hover:border-primary/50 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UploadCloud className="size-7" strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold">Click or drag & drop schedule file</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Supports PDF, TXT, ICS calendar export, or Image files
                    </p>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-ios">
                    Browse Files
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-3xl border border-border bg-fill p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold">{uploadedFile.name}</p>
                        <p className="text-[12px] text-muted-foreground">{uploadedFile.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null)
                        setRaw('')
                      }}
                      className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 px-2">
                    <CheckCircle2 className="size-4" />
                    File parsed successfully. Click Organize below!
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ── OCR Scan Status or Error Feedback ── */}
        <ScheduleScanProgress
          isScanning={isOcrScanning}
          isCompleted={Boolean(parsedClasses && parsedClasses.length > 0)}
          error={ocrError}
        />

        {ocrError && (
          <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-[13.5px] font-medium text-destructive dark:bg-destructive/20 shadow-xs">
            <X className="mt-0.5 size-4 shrink-0" />
            <span>{ocrError}</span>
          </div>
        )}

        {/* ── Submit Button ── */}
        <PillButton
          size="lg"
          full
          onClick={handleStartImport}
          disabled={loading || isOcrScanning || (mode === 'text' && raw.trim().length < 5) || (mode !== 'text' && !capturedImage && !uploadedFile)}
        >
          {loading ? (
            <>
              <ActivityIndicator />
              Organizing...
            </>
          ) : isOcrScanning ? (
            <>
              <ActivityIndicator />
              Scanning Image...
            </>
          ) : (
            <>
              <Sparkles className="size-4.5" strokeWidth={2.1} />
              Organize My Schedule
            </>
          )}
        </PillButton>

        {/* ── Progress Loader Stages ── */}
        <AnimatePresence>
          {loading && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl bg-card p-5 shadow-ios"
            >
              {stages.map((label, i) => (
                <li
                  key={label}
                  className="flex items-center gap-3 py-1.5 text-[14.5px] font-medium"
                >
                  <span
                    className={
                      i <= stage
                        ? 'size-2.5 rounded-full bg-primary animate-pulse'
                        : 'size-2.5 rounded-full bg-separator'
                    }
                  />
                  <span className={i <= stage ? 'text-foreground' : 'text-muted-foreground'}>
                    {label}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <p className="px-4 text-center text-[13px] leading-relaxed text-muted-foreground">
          Everything is processed locally. Review and adjust class times on the next screen before saving.
        </p>
      </div>
    </>
  )
}
