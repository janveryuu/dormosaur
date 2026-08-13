'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BedDouble,
  Bell,
  BellRing,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ClipboardPaste,
  CookingPot,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  MapPin,
  Search,
  Sparkles,
  Type,
  UploadCloud,
  UtensilsCrossed,
  WandSparkles,
  Zap,
  X,
} from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { IosSwitch } from '@/components/ios/ios-switch'
import { ActivityIndicator } from '@/components/ios/activity-indicator'
import { rawScheduleSample } from '@/lib/data'
import { parseRawSchedule } from '@/lib/parser'
import { useSchedule } from '@/components/schedule-provider'
import { createClient } from '@/lib/supabase/client'
import { upsertUserProfile } from '@/lib/db'
import { COUNTRIES, getCountryByCode, type CountryInfo } from '@/lib/countries-data'
import { APPLIANCE_OPTIONS, type ApplianceType, type DietaryPreference } from '@/lib/appliances-data'
import { requestAndSubscribePush } from '@/lib/push-notifications'
import { cn } from '@/lib/utils'

const totalSteps = 7
type ImportMode = 'text' | 'camera' | 'photo' | 'file'

const sampleOcrText = `MATH101 calculus 1 M&F 8:30-9:50am sci hall 204 reyes
chem 130 general chem lab, mon/wed 10:15 to 12, lab b11
ENG205 modern lit TTh 9:10-10:20 humanities 310 (tanaka)
cs150 intro programming tues-thurs 1pm-2:40pm tech 118
psy 110 mon-fri 3:00-4:20 west wing 22 dr patel`

export default function OnboardingPage() {
  const router = useRouter()
  const { setProfile } = useSchedule()
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [name, setName] = React.useState('')
  const [school, setSchool] = React.useState('')
  const [dorm, setDorm] = React.useState(true)
  const [selectedCountryCode, setSelectedCountryCode] = React.useState('PH')
  const [selectedTimezone, setSelectedTimezone] = React.useState('Asia/Manila')
  const [selectedAppliances, setSelectedAppliances] = React.useState<ApplianceType[]>(['microwave', 'kettle'])
  const [dietaryPref, setDietaryPref] = React.useState<DietaryPreference>('none')
  const [dietaryNote, setDietaryNote] = React.useState('')
  const [countrySearch, setCountrySearch] = React.useState('')
  const [isCountryPickerOpen, setIsCountryPickerOpen] = React.useState(false)
  const [raw, setRaw] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [mode, setMode] = React.useState<ImportMode>('text')
  const [notifStatus, setNotifStatus] = React.useState<'idle' | 'enabling' | 'granted' | 'denied'>('idle')
  const [notifFeedback, setNotifFeedback] = React.useState<string | null>(null)

  const toggleAppliance = (id: ApplianceType | 'none') => {
    if (id === 'none') {
      setSelectedAppliances([])
    } else {
      setSelectedAppliances((prev) => {
        if (prev.includes(id)) {
          return prev.filter((a) => a !== id)
        } else {
          return [...prev, id]
        }
      })
    }
  }

  const selectedCountry = getCountryByCode(selectedCountryCode)

  const handleSelectCountry = (country: CountryInfo) => {
    setSelectedCountryCode(country.code)
    setSelectedTimezone(country.defaultTimezone)
    setIsCountryPickerOpen(false)
    setCountrySearch('')
  }

  const [isSessionLoaded, setIsSessionLoaded] = React.useState(false)

  // Pre-fill name & school from Google/auth metadata or existing Supabase profile row
  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata
        const fullName: string = meta?.full_name || meta?.name || ''
        
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id, name, school, dorm, country, timezone')
            .eq('id', data.user.id)
            .single()

          if (existing) {
            if (existing.name) setName(existing.name)
            else if (fullName) setName(fullName)
            if (existing.school) setSchool(existing.school)
          } else {
            if (fullName) setName(fullName)
            console.log('[Dormosaur Onboarding Mount] Creating initial row for user:', data.user.id)
            await upsertUserProfile(supabase, data.user.id, {
              name: fullName || '',
              school: '',
              dorm: 'Dorm Room',
              initials: fullName ? fullName.slice(0, 2).toUpperCase() : '',
              is_dorm_student: true,
              onboarding_completed: false,
              country: 'PH',
              timezone: 'Asia/Manila',
            })
          }
        } catch (e) {
          console.warn('[Dormosaur Onboarding Mount Notice] Profile check:', e)
          if (fullName && !name) setName(fullName)
        }
      }
      setIsSessionLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Camera & File state
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = React.useState(false)
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; size: string } | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const photoInputRef = React.useRef<HTMLInputElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Write collected step data to Supabase profiles table at every transition
  const saveStepData = async (stepNumber: number) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let partial: Record<string, unknown> = {}
      if (stepNumber === 0) {
        const trimmedName = name.trim()
        const parts = trimmedName ? trimmedName.split(' ') : []
        const calculatedInitials =
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : trimmedName
            ? trimmedName.slice(0, 2).toUpperCase()
            : ''
        partial = {
          name: trimmedName,
          school: school.trim(),
          initials: calculatedInitials,
        }
      } else if (stepNumber === 1) {
        partial = {
          country: selectedCountryCode,
          timezone: selectedTimezone,
        }
      } else if (stepNumber === 2) {
        partial = {
          dorm: dorm ? 'Dorm Room' : 'Off-campus',
          is_dorm_student: dorm,
        }
      } else if (stepNumber === 3) {
        partial = {
          appliances: selectedAppliances,
        }
      } else if (stepNumber === 4) {
        partial = {
          dietary_preference: dietaryPref,
          dietary_note: dietaryNote,
        }
      }

      if (Object.keys(partial).length > 0) {
        console.log(`[Dormosaur DB Step Write] Writing Step ${stepNumber} data to Supabase:`, partial)
        await upsertUserProfile(supabase, user.id, partial)
      }
    } catch (err) {
      console.error(`[Dormosaur DB Step Write ERROR] Step ${stepNumber} save failed:`, err)
    }
  }

  const go = (next: number) => {
    saveStepData(step)
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  // Camera Stream Controls
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
      console.warn('Camera restricted:', err)
      setCameraError('Camera access unavailable. Upload a photo instead!')
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
    if (step === 3 && mode === 'camera' && !capturedImage) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, mode, capturedImage])

  const [isOcrScanning, setIsOcrScanning] = React.useState(false)
  const [ocrError, setOcrError] = React.useState<string | null>(null)
  const [parsedClasses, setParsedClasses] = React.useState<any[] | null>(null)

  const processImageWithGemini = async (imageDataUrl: string) => {
    setIsOcrScanning(true)
    setOcrError(null)
    setParsedClasses(null)
    setRaw('')
    try {
      const res = await fetch('/api/schedule/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl, mode }),
      })
      const data = await res.json()

      if (data.success && Array.isArray(data.classes) && data.classes.length > 0) {
        setParsedClasses(data.classes)
        setOcrError(null)
      } else {
        setParsedClasses(null)
        setOcrError(data.error || "We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.")
      }
    } catch (err) {
      console.warn('Gemini vision processing error:', err)
      setParsedClasses(null)
      setOcrError("We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.")
    } finally {
      setIsOcrScanning(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 1280
    canvas.height = videoRef.current.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setCapturedImage(dataUrl)
      stopCamera()
      processImageWithGemini(dataUrl)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setCapturedImage(dataUrl)
        processImageWithGemini(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (file: File) => {
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB'
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setUploadedFile({ name: file.name, size: sizeKb })
        setCapturedImage(dataUrl)
        processImageWithGemini(dataUrl)
      }
      reader.readAsDataURL(file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = (event.target?.result as string) || ''
        setUploadedFile({ name: file.name, size: sizeKb })
        setRaw(content.trim())
      }
      reader.readAsText(file)
    }
  }

  const finish = async () => {
    setLoading(true)
    const trimmedName = name.trim()
    const trimmedSchool = school.trim()
    const parts = (trimmedName || 'Student').split(' ')
    const calculatedInitials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : (trimmedName || 'ST').slice(0, 2).toUpperCase()

    if (trimmedName) {
      setProfile((prev) => ({
        ...prev,
        name: trimmedName,
        school: trimmedSchool || prev.school,
        dorm: dorm ? 'Dorm Room' : 'Off-campus',
        initials: calculatedInitials,
        country: selectedCountryCode,
        timezone: selectedTimezone,
        appliances: selectedAppliances,
        dietary_preference: dietaryPref,
        dietary_note: dietaryNote,
      }))
    }

    // Save complete profile + mark onboarding complete in Supabase
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('[Dormosaur DB Onboarding Complete] Saving final profile & setting onboarding_completed = true for user:', user.id)
        await Promise.all([
          supabase.auth.updateUser({
            data: { full_name: trimmedName || user.user_metadata?.full_name || '', onboarding_completed: true },
          }),
          upsertUserProfile(supabase, user.id, {
            name: trimmedName || user.user_metadata?.full_name || '',
            school: trimmedSchool,
            dorm: dorm ? 'Dorm Room' : 'Off-campus',
            initials: calculatedInitials,
            is_dorm_student: dorm,
            onboarding_completed: true,
            country: selectedCountryCode,
            timezone: selectedTimezone,
            appliances: selectedAppliances,
            dietary_preference: dietaryPref,
            dietary_note: dietaryNote,
          }),
        ])
        console.log('[Dormosaur DB Onboarding Complete SUCCESS] Saved onboarding_completed = true for user:', user.id)
      }
    } catch (err) {
      console.error('[Dormosaur DB Onboarding Complete ERROR] Final save failed:', err)
    }

    let parsed = []
    if (parsedClasses && parsedClasses.length > 0) {
      parsed = parsedClasses
    } else {
      parsed = parseRawSchedule(raw.trim())
    }

    try {
      sessionStorage.setItem('dormosaur_parsed_draft', JSON.stringify(parsed))
    } catch (e) {
      console.warn('SessionStorage save notice:', e)
    }
    setTimeout(() => router.push('/schedule/review'), 1400)
  }

  const handleEnableNotifications = async () => {
    setNotifStatus('enabling')
    const res = await requestAndSubscribePush()

    if (res.success && res.permission === 'granted') {
      setNotifStatus('granted')
      setNotifFeedback("You're all set. We'll notify you before your next class.")

      // Trigger instant test push notification so the user gets real push confirmation
      fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Dormosaur Enabled!',
          message: 'Notifications active! We will notify you 15m before each class.',
        }),
      }).catch(() => {})

      // Smooth delay for confirmation animation payoff before redirecting
      setTimeout(() => finish(), 1600)
    } else {
      setNotifStatus('denied')
      setNotifFeedback('No worries — you can turn this on anytime in Settings.')
      setTimeout(() => finish(), 1600)
    }
  }

  const canContinue =
    step === 0
      ? name.trim().length > 1 && school.trim().length > 1
      : step === 1
        ? Boolean(selectedCountryCode && selectedTimezone)
        : true

  const canOrganize = raw.trim().length >= 5 || capturedImage !== null || uploadedFile !== null || (parsedClasses !== null && parsedClasses.length > 0)

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  )

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 px-5">
        {step > 0 ? (
          <button
            onClick={() => go(step - 1)}
            className="-ml-2 flex items-center gap-0.5 py-1 pr-2 pl-1 text-[16px] font-medium text-primary"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
            Back
          </button>
        ) : (
          <Link
            href="/"
            className="-ml-2 flex items-center gap-0.5 py-1 pr-2 pl-1 text-[16px] font-medium text-primary"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
            Exit
          </Link>
        )}

        <div className="mx-auto flex items-center gap-2" aria-label={`Step ${step + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                width: i === step ? 22 : 7,
                opacity: i <= step ? 1 : 0.3,
              }}
              transition={{ type: 'spring', stiffness: 480, damping: 34 }}
              className={cn('h-[7px] rounded-full', i <= step ? 'bg-primary' : 'bg-separator')}
            />
          ))}
        </div>

        <span className="w-12" />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <div className="flex flex-1 flex-col pt-6">
                <span className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <GraduationCap className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Let&apos;s get you set up.</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  Just your name and where you study. Everything else comes later.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <label className="flex flex-col gap-2">
                    <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      First name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Janver Manlapaz"
                      autoComplete="given-name"
                      className="h-14 rounded-2xl bg-card px-5 text-[17px] shadow-ios outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      School
                    </span>
                    <input
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Batangas State University (BSU)"
                      className="h-14 rounded-2xl bg-card px-5 text-[17px] shadow-ios outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-1 flex-col pt-6">
                <span className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <Globe className="size-7 text-primary" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Where are you studying?</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  This sets your time zone for alarms and helps us suggest food you&apos;ll actually recognize.
                </p>

                <div className="mt-8 flex flex-col gap-4">
                  {/* Country Field */}
                  <div className="flex flex-col gap-2">
                    <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      Country
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCountryPickerOpen((prev) => !prev)}
                      className="flex h-14 w-full items-center justify-between rounded-2xl bg-card px-5 text-[17px] shadow-ios outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-3 font-medium">
                        <span className="text-[22px]">{selectedCountry.flag}</span>
                        <span>{selectedCountry.name}</span>
                      </span>
                      <ChevronDown
                        className={cn('size-5 text-muted-foreground transition-transform', isCountryPickerOpen && 'rotate-180')}
                      />
                    </button>

                    {/* Searchable Country Picker */}
                    <AnimatePresence>
                      {isCountryPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          className="overflow-hidden rounded-3xl border border-border/50 bg-card p-3 shadow-ios-lg"
                        >
                          <div className="flex h-11 items-center gap-2.5 rounded-2xl bg-fill px-4">
                            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
                            <input
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search country..."
                              className="w-full bg-transparent text-[15px] placeholder:text-muted-foreground focus:outline-none"
                            />
                          </div>
                          <div className="mt-2 max-h-52 overflow-y-auto space-y-1 pr-1">
                            {filteredCountries.map((c) => {
                              const isSelected = c.code === selectedCountryCode
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => handleSelectCountry(c)}
                                  className={cn(
                                    'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all',
                                    isSelected ? 'bg-accent font-semibold text-accent-foreground' : 'text-foreground hover:bg-fill',
                                  )}
                                >
                                  <span className="flex items-center gap-3">
                                    <span className="text-[20px]">{c.flag}</span>
                                    <span>{c.name}</span>
                                  </span>
                                  {isSelected && <Check className="size-4 text-primary" strokeWidth={2.5} />}
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Region / Multi-timezone Selector */}
                  {selectedCountry.timezones && selectedCountry.timezones.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                        Region
                      </span>
                      <div className="space-y-1.5 rounded-3xl bg-card p-3 shadow-ios">
                        {selectedCountry.timezones.map((tz) => {
                          const active = selectedTimezone === tz.id
                          return (
                            <button
                              key={tz.id}
                              type="button"
                              onClick={() => setSelectedTimezone(tz.id)}
                              className={cn(
                                'flex w-full items-center justify-between rounded-2xl p-3 text-left transition-all',
                                active ? 'bg-accent font-semibold text-accent-foreground' : 'hover:bg-fill text-foreground',
                              )}
                            >
                              <div>
                                <p className="text-[14.5px] font-semibold">{tz.name}</p>
                                <p className="text-[12.5px] text-muted-foreground">{tz.city}</p>
                              </div>
                              {active && <Check className="size-4 text-primary" strokeWidth={2.5} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline Confirmation Card */}
                  <motion.div
                    key={selectedCountryCode + selectedTimezone}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className="rounded-3xl bg-accent/70 p-4 text-[14px] leading-relaxed text-foreground shadow-sm"
                  >
                    <p className="font-medium">
                      Time zone set to <span className="font-bold text-primary">{selectedTimezone}</span>. We&apos;ve added{' '}
                      <span className="font-semibold text-primary">{selectedCountry.cuisineHighlights}</span> to your Kitchen.
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col pt-4">
                <span className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <CookingPot className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">What&apos;s in your dorm?</h1>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  Select what you&apos;ve got — we&apos;ll only show you recipes you can actually make.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  {APPLIANCE_OPTIONS.map((opt) => {
                    const isSelected = selectedAppliances.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAppliance(opt.id)}
                        className={cn(
                          'flex items-center justify-between rounded-2xl border p-4 text-left transition-all',
                          isSelected
                            ? 'border-emerald-600/50 bg-emerald-500/12 text-foreground shadow-sm ring-1 ring-emerald-600/30'
                            : 'border-border/60 bg-card hover:bg-accent/40 text-foreground',
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col pr-3">
                          <span className="text-[15.5px] font-semibold">{opt.label}</span>
                          <span className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                            {opt.description}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-muted-foreground/30 bg-background/50',
                          )}
                        >
                          {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}

                  {/* None of these Option */}
                  <button
                    type="button"
                    onClick={() => toggleAppliance('none')}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border p-4 text-left transition-all mt-1',
                      selectedAppliances.length === 0
                        ? 'border-amber-500/50 bg-amber-500/12 text-foreground shadow-sm ring-1 ring-amber-500/30'
                        : 'border-border/60 bg-card hover:bg-accent/40 text-foreground',
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col pr-3">
                      <span className="text-[15.5px] font-semibold">None of these</span>
                      <span className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                        Only show no-cook/no-equipment recipes (overnight oats, salads, wraps)
                      </span>
                    </div>
                    <div
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                        selectedAppliances.length === 0
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-muted-foreground/30 bg-background/50',
                      )}
                    >
                      {selectedAppliances.length === 0 && <Check className="size-3.5" strokeWidth={3} />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-1 flex-col pt-4">
                <span className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <UtensilsCrossed className="size-7 text-primary" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Any dietary preferences?</h1>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  Optional — this just keeps Kitchen recommendations relevant to you.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  {[
                    { id: 'none', title: 'No restrictions', subtext: 'Show me everything' },
                    { id: 'vegetarian', title: 'Vegetarian', subtext: 'No meat or fish in recipe suggestions' },
                    { id: 'halal', title: 'Halal', subtext: 'Filters out pork and non-halal ingredients' },
                    { id: 'other', title: 'Other', subtext: 'Tell us more' },
                  ].map((item) => {
                    const isSelected = dietaryPref === item.id
                    return (
                      <div key={item.id} className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setDietaryPref(item.id as DietaryPreference)}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99]',
                            isSelected
                              ? 'border-emerald-600/50 bg-emerald-500/12 text-foreground shadow-sm ring-1 ring-emerald-600/30'
                              : 'border-border/60 bg-card hover:bg-accent/40 text-foreground',
                          )}
                        >
                          <div className="flex min-w-0 flex-1 flex-col pr-3">
                            <span className="text-[15.5px] font-semibold">{item.title}</span>
                            <span className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                              {item.subtext}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-muted-foreground/30 bg-background/50',
                            )}
                          >
                            {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                          </div>
                        </button>

                        {item.id === 'other' && isSelected && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                              className="overflow-hidden px-1 pt-1"
                            >
                              <input
                                type="text"
                                value={dietaryNote}
                                onChange={(e) => setDietaryNote(e.target.value)}
                                placeholder="e.g. dairy-free, no nuts, no shellfish"
                                className="w-full rounded-2xl border border-emerald-600/40 bg-card px-4 py-3 text-[14.5px] placeholder:text-muted-foreground focus:border-emerald-600 focus:outline-none shadow-sm"
                              />
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-1 flex-col pt-6">
                <span className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <BedDouble className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Do you live in a dorm?</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  Dorm students get recipes built around a microwave, a kettle, and no oven.
                </p>

                <div className="mt-8 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-ios">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16.5px] font-semibold tracking-[-0.01em]">
                      I live on campus
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted-foreground">
                      {dorm ? 'Kitchen filtered to dorm-safe appliances' : 'Full recipe library, no filters'}
                    </span>
                  </span>
                  <IosSwitch checked={dorm} onChange={setDorm} label="I live on campus" />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-1 flex-col pt-4">
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <ClipboardPaste className="size-6" strokeWidth={1.8} />
                </span>
                <h1 className="text-[26px] font-bold tracking-[-0.02em] text-balance">Import your schedule.</h1>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">
                  Paste text, scan with camera, or upload a photo/file. Messy is completely fine.
                </p>

                {/* ── Mode Switcher Pills ── */}
                <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-fill p-1 shadow-inner">
                  {[
                    { id: 'text', label: 'Text', icon: Type },
                    { id: 'camera', label: 'Camera', icon: Camera },
                    { id: 'photo', label: 'Photos', icon: ImageIcon },
                    { id: 'file', label: 'Files', icon: FileText },
                  ].map((item) => {
                    const Icon = item.icon
                    const active = mode === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMode(item.id as ImportMode)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11.5px] font-semibold transition-all ${
                          active
                            ? 'bg-card text-foreground shadow-ios'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className={`size-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2.2} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* ── Mode Card ── */}
                <div className="mt-4 rounded-3xl bg-card p-4 shadow-ios">
                  {/* TEXT MODE */}
                  {mode === 'text' && (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        rows={6}
                        placeholder={rawScheduleSample}
                        className="w-full resize-none rounded-2xl bg-fill p-3.5 font-mono text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setRaw(rawScheduleSample)}
                        className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-primary"
                      >
                        <WandSparkles className="size-3.5" />
                        Use sample schedule
                      </button>
                    </div>
                  )}

                  {/* CAMERA MODE */}
                  {mode === 'camera' && (
                    <div className="flex flex-col items-center text-center">
                      {!capturedImage ? (
                        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-fill p-3">
                          {cameraActive ? (
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
                              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                              <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-dashed border-white/60" />
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  className="flex size-12 items-center justify-center rounded-full bg-white shadow-lg active:scale-90"
                                >
                                  <div className="size-9 rounded-full border-2 border-primary bg-primary/20" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 py-4">
                              <Camera className="size-8 text-primary" />
                              <p className="text-[13px] text-muted-foreground">
                                {cameraError || 'Scan your printed schedule with your camera.'}
                              </p>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-ios"
                              >
                                Start Camera
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative overflow-hidden rounded-2xl border border-border bg-fill p-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={capturedImage} alt="Captured schedule" className="max-h-48 rounded-xl object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedImage(null)
                                setRaw('')
                                startCamera()
                              }}
                              className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                            Photo captured & OCR parsed!
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHOTOS MODE */}
                  {mode === 'photo' && (
                    <div className="flex flex-col items-center text-center">
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      {!capturedImage ? (
                        <div
                          onClick={() => photoInputRef.current?.click()}
                          className="flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-separator bg-fill p-4 hover:border-primary/50"
                        >
                          <ImageIcon className="size-8 text-primary" />
                          <div>
                            <p className="text-[14px] font-semibold">Pick photo from library</p>
                            <p className="text-[12px] text-muted-foreground">PNG, JPG, HEIC, or screenshot</p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-ios">
                            Select Photo
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative overflow-hidden rounded-2xl border border-border bg-fill p-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={capturedImage} alt="Photo" className="max-h-48 rounded-xl object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedImage(null)
                                setRaw('')
                              }}
                              className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                            Image uploaded & OCR text extracted!
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FILES MODE */}
                  {mode === 'file' && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      {!uploadedFile ? (
                        <div
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
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.pdf,.txt,.ics,image/*'
                            input.onchange = (e: any) => {
                              const file = e.target?.files?.[0]
                              if (file) handleFileSelect(file)
                            }
                            input.click()
                          }}
                          className={`flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-4 transition-all ${
                            dragOver ? 'border-primary bg-primary/5' : 'border-separator bg-fill hover:border-primary/50'
                          }`}
                        >
                          <UploadCloud className="size-8 text-primary" />
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-fill p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="size-5 text-primary" />
                            <div className="text-left">
                              <p className="text-[13.5px] font-semibold">{uploadedFile.name}</p>
                              <p className="text-[11.5px] text-muted-foreground">{uploadedFile.size}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null)
                              setRaw('')
                            }}
                            className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-1 flex-col pt-6">
                <span className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <BellRing className="size-7 text-primary" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Never miss a class.</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  We&apos;ll send you a heads-up a few minutes before each class starts — even if Dormosaur isn&apos;t open.
                </p>

                <div className="mt-8 overflow-hidden rounded-3xl bg-card p-4.5 shadow-ios border border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-[11px]">
                        D
                      </span>
                      <span className="text-[12.5px] font-bold tracking-tight text-foreground uppercase">Dormosaur</span>
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground">now</span>
                  </div>
                  <div className="mt-2.5">
                    <p className="text-[15.5px] font-bold text-foreground">
                      {parsedClasses && parsedClasses[0] ? `${parsedClasses[0].code || parsedClasses[0].subject} in 15m` : 'Next Class in 15m'}
                    </p>
                    <p className="text-[13.5px] text-muted-foreground">
                      {parsedClasses && parsedClasses[0] ? `${parsedClasses[0].room || 'Campus Room'} • ${parsedClasses[0].instructor || 'Instructor'}` : 'Schedule Nudge • Smart Reminder'}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {notifFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      className={cn(
                        'mt-5 rounded-3xl p-4 text-[14px] leading-relaxed shadow-sm',
                        notifStatus === 'granted'
                          ? 'bg-accent/80 font-medium text-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {notifStatus === 'granted' ? (
                          <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        ) : (
                          <Bell className="size-5 shrink-0 text-muted-foreground" />
                        )}
                        <span>{notifFeedback}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step === 5 && (
          <div className="mb-3 flex flex-col gap-2">
            {isOcrScanning && (
              <div className="flex items-center gap-2 rounded-2xl bg-accent/80 p-3.5 text-[13px] font-medium text-foreground">
                <Sparkles className="size-4 animate-spin text-primary" />
                <span>Scanning image text with AI OCR...</span>
              </div>
            )}
            {ocrError && (
              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-[13px] font-semibold text-destructive">
                {ocrError}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {step < 5 ? (
            <PillButton size="lg" full onClick={() => go(step + 1)} disabled={!canContinue}>
              Continue
            </PillButton>
          ) : step === 5 ? (
            <PillButton
              size="lg"
              full
              onClick={async () => {
                if (isOcrScanning) return
                setOcrError(null)

                let classesToSave: any[] = []

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
                    setIsOcrScanning(true)
                    try {
                      const res = await fetch('/api/schedule/parse', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: capturedImage, mode }),
                      })
                      const data = await res.json()
                      if (data.success && Array.isArray(data.classes) && data.classes.length > 0) {
                        classesToSave = data.classes
                        setParsedClasses(data.classes)
                      }
                    } catch (e) {
                      console.error('Scan error:', e)
                    } finally {
                      setIsOcrScanning(false)
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
                  console.warn('SessionStorage draft save notice:', e)
                }
                go(6)
              }}
              disabled={isOcrScanning || !canOrganize}
            >
              {isOcrScanning ? (
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
          ) : (
            <PillButton
              size="lg"
              full
              onClick={handleEnableNotifications}
              disabled={notifStatus === 'enabling' || loading}
            >
              {notifStatus === 'enabling' || loading ? (
                <>
                  <ActivityIndicator />
                  Enabling Notifications...
                </>
              ) : (
                <>
                  <BellRing className="size-4.5" strokeWidth={2.1} />
                  Enable Notifications
                </>
              )}
            </PillButton>
          )}
          <button
            type="button"
            onClick={async () => {
              const trimmedName = name.trim()
              const trimmedSchool = school.trim()
              const parts = (trimmedName || 'Student').split(' ')
              const calculatedInitials =
                parts.length >= 2
                  ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                  : (trimmedName || 'ST').slice(0, 2).toUpperCase()

              try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await Promise.all([
                    supabase.auth.updateUser({
                      data: { onboarding_completed: true },
                    }),
                    upsertUserProfile(supabase, user.id, {
                      name: trimmedName || user.user_metadata?.full_name || '',
                      school: trimmedSchool,
                      dorm: dorm ? 'Dorm Room' : 'Off-campus',
                      initials: calculatedInitials,
                      is_dorm_student: dorm,
                      onboarding_completed: true,
                      country: selectedCountryCode,
                      timezone: selectedTimezone,
                    }),
                  ])
                }
              } catch (_) { /* silent */ }
              router.push('/dashboard')
            }}
            className="py-1 text-center text-[15px] font-medium text-muted-foreground"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
