'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Type,
  UploadCloud,
  WandSparkles,
  X,
  RefreshCw,
} from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { PillButton } from '@/components/ios/pill-button'
import { ActivityIndicator } from '@/components/ios/activity-indicator'
import { useSchedule } from '@/components/schedule-provider'

type ImportMode = 'text' | 'camera' | 'photo'

const stages = [
  'Reading deadline source',
  'Analyzing document layout & dates',
  'Detecting course codes & due times',
  'Categorizing exams & assignments',
]

const sampleDeadlinesText = `MATH 101 Calculus Midterm Exam 1 on Oct 24 @ 2pm
CHEM 120 General Chemistry Lab Report 2 due next Friday 11:59pm
ENG 205 Modern Literature Essay draft on Nov 3
CS 150 Python Mini Project Submission due Dec 1 @ 5:00pm
PSY 110 Quiz 3 on Monday morning`

export default function ImportDeadlinesPage() {
  const router = useRouter()
  const { classes } = useSchedule()
  const [mode, setMode] = React.useState<ImportMode>('text')
  const [rawText, setRawText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [stage, setStage] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Camera state
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = React.useState(false)
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [cameraError, setCameraError] = React.useState<string | null>(null)

  // File upload state
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; size: string; previewUrl: string } | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const photoInputRef = React.useRef<HTMLInputElement | null>(null)

  // ─── Camera MediaStream Stream Handling ─────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your browser. You can upload a photo instead!')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
        setCameraActive(true)
      }
    } catch (err) {
      console.warn('Camera permission denied or unavailable:', err)
      setCameraError('Camera access is needed to scan deadlines — you can also paste text or upload a photo instead.')
    }
  }

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

  // Capture photo from camera video stream
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
    }
  }

  // Handle Photo / Image File Select
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid PNG or JPEG image file.')
      return
    }
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB'
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedFile({ name: file.name, size: sizeKb, previewUrl: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  // Handle Deadline Import Process
  const handleProcessImport = async () => {
    setErrorMessage(null)
    setLoading(true)
    setStage(0)

    const stageInterval = setInterval(() => {
      setStage((s) => Math.min(s + 1, stages.length - 1))
    }, 450)

    try {
      let payloadContent = rawText
      let payloadMode: 'text' | 'camera' | 'photo' = 'text'

      if (mode === 'camera') {
        payloadMode = 'camera'
        payloadContent = capturedImage || sampleDeadlinesText
      } else if (mode === 'photo') {
        payloadMode = 'photo'
        payloadContent = uploadedFile?.previewUrl || sampleDeadlinesText
      }

      const res = await fetch('/api/deadlines/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: payloadMode,
          content: payloadContent,
          userClasses: classes.map((c) => ({ code: c.code, subject: c.subject })),
        }),
      })

      const data = await res.json()
      clearInterval(stageInterval)

      if (!res.ok || !data.success) {
        setLoading(false)
        setErrorMessage(
          data.error || "We couldn't read this clearly — try retaking the photo with better lighting, or paste the text instead."
        )
        return
      }

      if (Array.isArray(data.deadlines) && data.deadlines.length > 0) {
        try {
          sessionStorage.setItem('dormosaur_parsed_deadlines_draft', JSON.stringify(data.deadlines))
          if (payloadMode !== 'text') {
            sessionStorage.setItem('dormosaur_parsed_deadlines_image', payloadContent)
          } else {
            sessionStorage.removeItem('dormosaur_parsed_deadlines_image')
          }
        } catch (e) {
          console.error('SessionStorage save notice:', e)
        }
        router.push('/deadlines/review')
      } else {
        setLoading(false)
        setErrorMessage('No deadlines could be recognized. Please try pasting raw text or uploading a clearer image.')
      }
    } catch (err) {
      clearInterval(stageInterval)
      setLoading(false)
      console.error('Process deadlines error:', err)
      setErrorMessage('An unexpected connection error occurred. Please try again.')
    }
  }

  return (
    <>
      <ScreenHeader
        title="Import deadlines"
        backHref="/deadlines"
        eyebrow="AI Deadline Scanner"
        subtitle="Paste text, scan with camera, or upload a photo. Messy is completely fine."
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-16">
        {/* ── Mint Circle Header Badge ── */}
        <div className="flex items-center gap-3.5 rounded-3xl bg-card p-4 shadow-ios border border-border/60">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs">
            <CheckSquare className="size-6" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-foreground">Import your deadlines</h2>
            <p className="text-[12.5px] text-muted-foreground">
              Exams, assignments, and quizzes extracted into your schedule in seconds.
            </p>
          </div>
        </div>

        {/* ── Mode Switcher Segmented Tabs ── */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-fill p-1.5 shadow-inner">
          {[
            { id: 'text', label: 'Paste Text', icon: Type },
            { id: 'camera', label: 'Camera', icon: Camera },
            { id: 'photo', label: 'Photos / Files', icon: ImageIcon },
          ].map((item) => {
            const Icon = item.icon
            const active = mode === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id as ImportMode)
                  setErrorMessage(null)
                }}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-[12.5px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-card text-foreground shadow-ios ring-1 ring-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`size-4.5 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} strokeWidth={2.2} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── ERROR MESSAGE BANNER ── */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-[13.5px] text-destructive shadow-xs"
          >
            <AlertTriangle className="size-5 shrink-0" />
            <p className="flex-1 font-medium">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="text-destructive/70 hover:text-destructive">
              <X className="size-4" />
            </button>
          </motion.div>
        )}

        {/* ── MODE 1: PASTED TEXT ── */}
        {mode === 'text' && (
          <div className="flex flex-col gap-2">
            <div className="relative rounded-3xl bg-card shadow-ios border border-border/60 p-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={7}
                placeholder="Paste unorganized deadline notes here, e.g.&#10;MATH 101 Midterm 1 on Oct 24 @ 2pm&#10;CHEM 120 Lab Report 2 due next Friday 11:59pm&#10;CS 150 Python Project due Dec 1"
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[12px] text-muted-foreground">
                <span>{rawText.length} characters</span>
                {rawText && (
                  <button
                    onClick={() => setRawText('')}
                    className="text-destructive font-semibold hover:underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRawText(sampleDeadlinesText)}
              className="self-start text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ✨ Use sample deadlines
            </button>
          </div>
        )}

        {/* ── MODE 2: CAMERA CAPTURE ── */}
        {mode === 'camera' && (
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-3xl bg-black min-h-[300px] flex items-center justify-center shadow-ios border border-border/60">
              {cameraError ? (
                <div className="p-6 text-center text-white flex flex-col items-center gap-3">
                  <Camera className="size-10 text-muted-foreground" />
                  <p className="text-[14px] leading-relaxed max-w-sm text-gray-300">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-[13px] font-bold text-white shadow-sm"
                  >
                    Try Camera Again
                  </button>
                </div>
              ) : capturedImage ? (
                <div className="relative w-full">
                  <img
                    src={capturedImage}
                    alt="Captured deadline still"
                    className="w-full max-h-[360px] object-contain bg-black"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <span className="text-[13px] font-semibold text-white">Photo captured</span>
                    <button
                      onClick={() => {
                        setCapturedImage(null)
                        startCamera()
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-white/30"
                    >
                      <RefreshCw className="size-3.5" /> Retake
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full max-h-[360px] object-cover"
                  />
                  {cameraActive && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                      <button
                        onClick={capturePhoto}
                        className="flex size-16 items-center justify-center rounded-full bg-white shadow-ios border-4 border-emerald-600 active:scale-90 transition-transform"
                        title="Capture Photo"
                      >
                        <div className="size-10 rounded-full bg-emerald-600" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-center text-[12px] text-muted-foreground">
              Photograph paper planners, printed syllabi, or whiteboard notes.
            </p>
          </div>
        )}

        {/* ── MODE 3: PHOTOS / FILES UPLOAD ── */}
        {mode === 'photo' && (
          <div className="flex flex-col gap-3">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlePhotoSelect(f)
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handlePhotoSelect(f)
              }}
              onClick={() => photoInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-600 bg-emerald-500/10'
                  : 'border-border/80 bg-card hover:bg-accent/40 shadow-ios'
              }`}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  {uploadedFile.previewUrl && (
                    <img
                      src={uploadedFile.previewUrl}
                      alt="Uploaded preview"
                      className="size-24 rounded-2xl object-cover shadow-sm border"
                    />
                  )}
                  <p className="text-[14.5px] font-bold text-foreground">{uploadedFile.name}</p>
                  <p className="text-[12px] text-muted-foreground">{uploadedFile.size}</p>
                  <span className="mt-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Click to choose a different photo
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                    <UploadCloud className="size-6" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      Click to upload or drag & drop photo
                    </p>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">
                      Accepts PNG or JPEG images from camera roll or files
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PRIMARY ACTION BUTTON ── */}
        <PillButton
          size="lg"
          full
          onClick={handleProcessImport}
          disabled={
            loading ||
            (mode === 'text' && !rawText.trim()) ||
            (mode === 'camera' && !capturedImage) ||
            (mode === 'photo' && !uploadedFile)
          }
          className="shadow-ios-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[16px] py-4"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <ActivityIndicator className="size-4" />
              <span>{stages[stage]}…</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <WandSparkles className="size-4.5" />
              <span>Organize My Deadlines</span>
            </span>
          )}
        </PillButton>
      </div>
    </>
  )
}
