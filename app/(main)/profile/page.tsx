'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BedDouble,
  Bell,
  BellRing,
  Camera,
  Check,
  ChevronRight,
  CookingPot,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  UtensilsCrossed,
  X,
  Zap,
  Search,
} from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import { IosSwitch } from '@/components/ios/ios-switch'
import { ThemeToggle } from '@/components/ios/theme-toggle'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { PillButton } from '@/components/ios/pill-button'
import { useTheme } from '@/components/theme-provider'
import { useSchedule } from '@/components/schedule-provider'
import { useSignOut } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { upsertUserProfile } from '@/lib/db'
import { getCountryByCode, searchCountries, type CountryInfo } from '@/lib/countries-data'
import {
  APPLIANCE_OPTIONS,
  formatApplianceSummary,
  formatDietarySummary,
  type ApplianceType,
  type DietaryPreference,
} from '@/lib/appliances-data'
import { requestAndSubscribePush, unsubscribePush, getCurrentEndpoint } from '@/lib/push-notifications'
import { getDeviceLabel } from '@/lib/ua-parser'
import { IosToast, type ToastMessage } from '@/components/ios/toast'
import { cropAndCompressAvatar } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

const spring = { type: 'spring' as const, stiffness: 500, damping: 30 }

const POPULAR_PH_SCHOOLS = [
  'National University Lipa (NU LIPA)',
  'Batangas State University (BSU)',
  'University of the Philippines (UP)',
  'De La Salle University (DLSU)',
  'University of Santo Tomas (UST)',
  'Ateneo de Manila University (ADMU)',
  'Mapúa University',
  'Far Eastern University (FEU)',
  'Polytechnic University of the Philippines (PUP)',
  'Adamson University',
  'University of the East (UE)',
  'San Beda University',
  'Lyceum of the Philippines University (LPU)',
]

function formatRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay}d ago`
  } catch (e) {
    return 'Recently'
  }
}

// ─── Interactive Editable Field Component ─────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  placeholder,
}: {
  label: string
  value: string
  onSave: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setDraft(value)
  }, [value])

  function save() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
    setEditing(false)
  }

  React.useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  return (
    <div
      onClick={() => {
        if (!editing) {
          setDraft(value)
          setEditing(true)
        }
      }}
      className="group flex cursor-pointer items-center justify-between px-5 py-3.5 hover:bg-accent/40 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {editing ? (
          <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') {
                  setDraft(value)
                  setEditing(false)
                }
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[16px] font-semibold text-foreground outline-none border-b border-primary pb-0.5"
            />
            <button
              onClick={save}
              className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-transform"
            >
              <Check className="size-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                setDraft(value)
                setEditing(false)
              }}
              className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">
            {value || <span className="text-muted-foreground font-normal">{placeholder}</span>}
          </p>
        )}
      </div>
      {!editing && (
        <span className="flex size-7 items-center justify-center rounded-full bg-accent/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
          <Pencil className="size-3.5" />
        </span>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const { profile, setProfile, classes, resetToDemo, isSyncing } = useSchedule()
  const signOut = useSignOut()

  // Preference Toggles
  const [dorm, setDormState] = React.useState(true)
  const [classAlerts, setClassAlertsState] = React.useState(true)
  const [deadlineAlerts, setDeadlineAlertsState] = React.useState(true)
  const [mealNudge, setMealNudgeState] = React.useState(true)
  const [quietHours, setQuietHoursState] = React.useState(false)
  const [haptics, setHaptics] = React.useState(true)

  // Dedicated Modals
  const [isSchoolModalOpen, setIsSchoolModalOpen] = React.useState(false)
  const [schoolSearch, setSchoolSearch] = React.useState('')
  const [customSchool, setCustomSchool] = React.useState('')

  const [isKitchenModalOpen, setIsKitchenModalOpen] = React.useState(false)
  const [tempAppliances, setTempAppliances] = React.useState<ApplianceType[]>(
    (profile.appliances as ApplianceType[]) || ['microwave', 'kettle']
  )

  const [isDietaryModalOpen, setIsDietaryModalOpen] = React.useState(false)
  const [tempDietaryPref, setTempDietaryPref] = React.useState<DietaryPreference>(
    (profile.dietary_preference as DietaryPreference) || 'none'
  )
  const [tempDietaryNote, setTempDietaryNote] = React.useState(profile.dietary_note || '')

  const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const

  // Dedicated Year Level Modal
  const [isYearModalOpen, setIsYearModalOpen] = React.useState(false)

  // Profile Avatar Upload & File Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)

  // Full Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [modalDraft, setModalDraft] = React.useState({
    name: profile.name,
    school: profile.school,
    dorm: profile.dorm,
    year: profile.year,
    country: profile.country || 'PH',
    timezone: profile.timezone || 'Asia/Manila',
  })

  // Country & Timezone Picker Modal
  const [isCountryModalOpen, setIsCountryModalOpen] = React.useState(false)
  const [countrySearch, setCountrySearch] = React.useState('')

  // Privacy Info Modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false)

  // Devices & Push state
  const [signingOut, setSigningOut] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string>('')
  const [subscribedDevices, setSubscribedDevices] = React.useState<
    Array<{ id: string; deviceLabel: string; lastSeenAt: string; endpoint: string }>
  >([])
  const [currentEndpoint, setCurrentEndpoint] = React.useState<string | null>(null)
  const [pushEnabled, setPushEnabled] = React.useState(false)
  const [isPushToggling, setIsPushToggling] = React.useState(false)
  const [pushFeedback, setPushFeedback] = React.useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [toast, setToast] = React.useState<ToastMessage | null>(null)

  // Sync draft state whenever profile updates
  React.useEffect(() => {
    setModalDraft({
      name: profile.name,
      school: profile.school,
      dorm: profile.dorm,
      year: profile.year,
      country: profile.country || 'PH',
      timezone: profile.timezone || 'Asia/Manila',
    })
  }, [profile])

  // Load saved preferences from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const qh = localStorage.getItem('dormosaur_quiet_hours') ?? localStorage.getItem('dormly_quiet_hours')
      if (qh !== null) setQuietHoursState(qh === 'true')

      const ca = localStorage.getItem('dormosaur_class_alerts') ?? localStorage.getItem('dormly_class_alerts')
      if (ca !== null) setClassAlertsState(ca === 'true')

      const da = localStorage.getItem('dormosaur_deadline_alerts') ?? localStorage.getItem('dormly_deadline_alerts')
      if (da !== null) setDeadlineAlertsState(da === 'true')

      const mn = localStorage.getItem('dormosaur_meal_nudges') ?? localStorage.getItem('dormly_meal_nudges')
      if (mn !== null) setMealNudgeState(mn === 'true')

      const dm = localStorage.getItem('dormosaur_dorm_student') ?? localStorage.getItem('dormly_dorm_student')
      if (dm !== null) setDormState(dm === 'true')

      const hp = localStorage.getItem('dormosaur_haptics') ?? localStorage.getItem('dormly_haptics')
      if (hp !== null) setHaptics(hp === 'true')
    }
  }, [])

  // Helper to save settings directly to Supabase DB
  const saveSettingToSupabase = async (patch: Record<string, unknown>) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await upsertUserProfile(supabase, user.id, patch)
      }
    } catch (e) {
      console.warn('Setting save notice:', e)
    }
  }

  // Toggle Handlers with Toast & DB Save
  const handleSetQuietHours = (val: boolean) => {
    setQuietHoursState(val)
    if (typeof window !== 'undefined') localStorage.setItem('dormosaur_quiet_hours', String(val))
    saveSettingToSupabase({ quiet_hours: val })
    setToast({
      type: 'info',
      title: val ? 'Quiet hours enabled' : 'Quiet hours disabled',
      message: val ? 'Notifications silenced 11pm – 7am.' : 'All alerts active 24/7.',
    })
  }

  const handleSetClassAlerts = (val: boolean) => {
    setClassAlertsState(val)
    if (typeof window !== 'undefined') localStorage.setItem('dormosaur_class_alerts', String(val))
    saveSettingToSupabase({ class_alerts: val })
    setToast({
      type: 'info',
      title: val ? 'Class alerts enabled' : 'Class alerts silenced',
      message: val ? 'Buzzing before lectures.' : 'Lecture reminders turned off.',
    })
  }

  const handleSetDeadlineAlerts = (val: boolean) => {
    setDeadlineAlertsState(val)
    if (typeof window !== 'undefined') localStorage.setItem('dormosaur_deadline_alerts', String(val))
    saveSettingToSupabase({ deadline_alerts: val })
    setToast({
      type: 'info',
      title: val ? 'Deadline alerts active' : 'Deadline alerts muted',
      message: val ? 'Push reminders set for upcoming exams.' : 'Exam reminders turned off.',
    })
  }

  const handleSetMealNudge = (val: boolean) => {
    setMealNudgeState(val)
    if (typeof window !== 'undefined') localStorage.setItem('dormosaur_meal_nudges', String(val))
    saveSettingToSupabase({ meal_nudges: val })
    setToast({
      type: 'info',
      title: val ? 'Meal nudges active' : 'Meal nudges off',
      message: val ? 'Recipe suggestions active for schedule gaps.' : 'Gap meal suggestions muted.',
    })
  }

  const handleSetDorm = (val: boolean) => {
    setDormState(val)
    if (typeof window !== 'undefined') localStorage.setItem('dormosaur_dorm_student', String(val))
    const newDormStr = val ? 'Dorm Room' : 'Off-campus'
    updateProfileField('dorm', newDormStr)
    setToast({
      type: 'success',
      title: val ? 'Dorm student mode active' : 'Off-campus mode active',
      message: val ? 'Kitchen recipes filtered to dorm appliances.' : 'Showing all full-kitchen recipes.',
    })
  }

  const handleSetHaptics = (val: boolean) => {
    setHaptics(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dormosaur_haptics', String(val))
      if (val && 'vibrate' in navigator) {
        navigator.vibrate([15])
      }
    }
    setToast({
      type: 'info',
      title: val ? 'Haptic feedback on' : 'Haptic feedback off',
      message: val ? 'Device will vibrate on key interactions.' : 'Vibrations disabled.',
    })
  }

  // Fetch devices
  const loadDevices = React.useCallback(async () => {
    try {
      let endpoint = await getCurrentEndpoint()
      const isGranted =
        typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      const storedPref =
        typeof window !== 'undefined'
          ? (localStorage.getItem('dormosaur_web_push_enabled') ?? localStorage.getItem('dormly_web_push_enabled')) === 'true'
          : false

      if ((isGranted || storedPref) && !endpoint) {
        const subRes = await requestAndSubscribePush()
        if (subRes.success) {
          endpoint = await getCurrentEndpoint()
        }
      }

      setCurrentEndpoint(endpoint)

      let deviceList: Array<{ id: string; deviceLabel: string; lastSeenAt: string; endpoint: string }> = []

      try {
        const res = await fetch('/api/push/devices')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.devices)) {
            deviceList = data.devices
          }
        }
      } catch (err) {
        console.warn('Devices fetch notice:', err)
      }

      if (endpoint || isGranted) {
        setPushEnabled(true)
        if (typeof window !== 'undefined') localStorage.setItem('dormosaur_web_push_enabled', 'true')

        const activeEndpoint = endpoint || 'active-browser'
        const exists = deviceList.some((d) => d.endpoint === activeEndpoint)
        if (!exists) {
          deviceList = [
            {
              id: 'local-current-device',
              deviceLabel: getDeviceLabel(),
              lastSeenAt: new Date().toISOString(),
              endpoint: activeEndpoint,
            },
            ...deviceList,
          ]
        }
      } else {
        setPushEnabled(false)
      }

      setSubscribedDevices(deviceList)
    } catch (e) {
      console.warn('Load devices notice:', e)
    }
  }, [])

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
    loadDevices()
  }, [loadDevices])

  const handleTogglePush = async (enable: boolean) => {
    setIsPushToggling(true)
    setPushFeedback(null)

    if (enable) {
      const res = await requestAndSubscribePush()
      if (res.success) {
        setPushEnabled(true)
        if (typeof window !== 'undefined') localStorage.setItem('dormosaur_web_push_enabled', 'true')
        setPushFeedback({
          type: 'success',
          message: 'Test notification sent — check your device.',
        })
        setToast({
          type: 'success',
          title: 'Web Push enabled',
          message: 'Notifications are active for this browser.',
        })

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Dormosaur', {
              body: "You're all set — notifications are on for this device.",
              icon: '/android-chrome-192x192.png',
              tag: `test-push-instant-${Date.now()}`,
            })
          } catch (_) {}
        }

        await loadDevices()
      } else {
        setPushEnabled(false)
        if (typeof window !== 'undefined') localStorage.setItem('dormosaur_web_push_enabled', 'false')
        setPushFeedback({
          type: 'error',
          message: res.error || "Couldn't confirm that device — try again.",
        })
        setToast({
          type: 'error',
          title: 'Notification setup failed',
          message: res.error || 'Please check browser notification permissions.',
        })
      }
    } else {
      await unsubscribePush()
      setPushEnabled(false)
      if (typeof window !== 'undefined') localStorage.setItem('dormosaur_web_push_enabled', 'false')
      setPushFeedback(null)
      await loadDevices()
      setToast({
        type: 'info',
        title: 'Web Push disabled',
        message: 'This device will no longer receive push notifications.',
      })
    }
    setIsPushToggling(false)
  }

  const handleRemoveDevice = async (id: string, endpoint: string) => {
    try {
      if (endpoint === currentEndpoint) {
        await unsubscribePush()
        setPushEnabled(false)
      } else {
        await fetch(`/api/push/devices/${id}`, { method: 'DELETE' })
      }
      await loadDevices()
      setToast({
        type: 'info',
        title: 'Device removed',
        message: 'Device subscription unlinked successfully.',
      })
    } catch (e) {
      console.warn('Remove device notice:', e)
    }
  }

  // Direct single-field update with instant Supabase persistence & Toast
  async function updateProfileField(field: keyof typeof profile, value: string) {
    const trimmed = value.trim()
    const updated = { ...profile, [field]: trimmed }

    if (field === 'name') {
      const parts = trimmed.split(' ')
      updated.initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : trimmed.slice(0, 2).toUpperCase() || 'ST'
    }

    setProfile(updated)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (field === 'name') {
          await supabase.auth.updateUser({ data: { full_name: trimmed } }).catch(() => {})
        }
        await upsertUserProfile(supabase, user.id, {
          [field]: trimmed,
          ...(field === 'name' ? { initials: updated.initials } : {}),
        })
      }
    } catch (err) {
      console.warn('Profile save notice:', err)
    }

    const fieldLabels: Record<string, string> = {
      name: 'Full Name',
      school: 'School',
      dorm: 'Dorm / Room',
      year: 'Year Level',
      country: 'Country Code',
      timezone: 'Time Zone',
    }

    setToast({
      type: 'success',
      title: `${fieldLabels[field] || 'Profile'} updated`,
      message: trimmed ? `Saved as "${trimmed}".` : 'Field updated.',
    })
  }

  // Avatar Upload Handler
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Validate type and size (max 5MB)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: 'Please upload a JPG, PNG, or WEBP image.',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Please choose an image under 5MB.',
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      // 2. Crop to square & compress to lightweight WebP (< 30KB)
      const { dataUrl, blob } = await cropAndCompressAvatar(file, 320, 0.88)
      let avatarUrl = dataUrl

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 3. Try upload to Supabase Storage 'avatars' bucket
        try {
          const filePath = `${user.id}/avatar_${Date.now()}.webp`
          const uploadPayload = blob || file
          const { error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(filePath, uploadPayload, {
              upsert: true,
              contentType: 'image/webp',
            })

          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
            if (urlData?.publicUrl) {
              avatarUrl = urlData.publicUrl
            }
          }
        } catch (storageErr) {
          console.warn('[Avatar Storage Notice] Using compressed base64 profile image:', storageErr)
        }

        // 4. Save to user profile in Supabase DB
        await upsertUserProfile(supabase, user.id, { avatar_url: avatarUrl })
      }

      // 5. Update local state immediately
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }))
      setToast({
        type: 'success',
        title: 'Profile Picture Updated',
        message: 'Your new avatar is saved across Dormosaur.',
      })
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Unable to process image. Please try again.',
      })
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Remove Avatar Handler
  const handleRemoveAvatar = async () => {
    setProfile((prev) => ({ ...prev, avatar_url: '' }))
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await upsertUserProfile(supabase, user.id, { avatar_url: null })
      }
    } catch (e) {
      console.warn('Remove avatar notice:', e)
    }

    setToast({
      type: 'info',
      title: 'Profile Picture Removed',
      message: 'Reverted to your initials avatar.',
    })
  }

  // Full Profile Modal Save Handler
  async function handleSaveFullProfile() {
    const trimmedName = modalDraft.name.trim() || 'Student'
    const parts = trimmedName.split(' ')
    const calculatedInitials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : trimmedName.slice(0, 2).toUpperCase()

    const updatedProfile = {
      ...profile,
      name: trimmedName,
      school: modalDraft.school.trim() || profile.school,
      dorm: modalDraft.dorm.trim() || profile.dorm,
      year: modalDraft.year.trim(),
      initials: calculatedInitials,
      country: modalDraft.country.trim().toUpperCase() || 'PH',
      timezone: modalDraft.timezone.trim() || 'Asia/Manila',
    }

    setProfile(updatedProfile)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({ data: { full_name: trimmedName } }).catch(() => {})
        await upsertUserProfile(supabase, user.id, {
          name: trimmedName,
          school: updatedProfile.school,
          dorm: updatedProfile.dorm,
          year: updatedProfile.year,
          initials: calculatedInitials,
          country: updatedProfile.country,
          timezone: updatedProfile.timezone,
        })
      }
    } catch (e) {
      console.error('Modal save profile error:', e)
    }

    setIsEditModalOpen(false)
    setToast({
      type: 'success',
      title: 'Profile Saved',
      message: 'All profile details updated in cloud storage.',
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  const filteredCountries = searchCountries(countrySearch)
  const filteredSchools = POPULAR_PH_SCHOOLS.filter((s) =>
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  )

  return (
    <>
      <PullAffordance />
      <div className="mb-2 flex items-center justify-between">
        <ScreenHeader title="Profile" eyebrow="Account" />
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground"
          >
            <Loader2 className="size-3.5 animate-spin text-primary" />
            Syncing…
          </motion.div>
        )}
      </div>

      {/* Hidden Avatar File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      <div className="flex flex-col gap-7 pb-4">

        {/* ─── Avatar + Name Header Card ─────────────────────────────────────── */}
        <motion.section
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsEditModalOpen(true)}
          className="group relative flex cursor-pointer items-center gap-4.5 rounded-4xl bg-card p-5 shadow-ios-lg border border-border/50 hover:border-primary/40 transition-all"
        >
          {/* Avatar Container with Camera Overlay */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name || 'User Avatar'}
                className="size-16 rounded-full object-cover shadow-ios-sm ring-2 ring-primary/20 transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-[22px] font-bold text-primary-foreground shadow-ios-sm transition-transform group-hover:scale-105">
                {profile.initials || 'ST'}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex size-6.5 items-center justify-center rounded-full bg-card border border-border/80 shadow-ios-sm text-foreground hover:bg-primary hover:text-white active:scale-90 transition-all"
              title="Upload profile photo"
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] leading-tight font-bold tracking-[-0.03em] text-foreground truncate">
                {profile.name || 'Student'}
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase text-primary shrink-0">
                Edit
              </span>
            </div>
            <p className="mt-1 text-[14px] font-medium text-muted-foreground truncate">
              {profile.year
                ? `${profile.year} · ${profile.school || 'Batangas State University'}`
                : profile.school || 'Batangas State University'}
            </p>
            {userEmail && (
              <p className="text-[13px] text-muted-foreground/70 truncate">{userEmail}</p>
            )}
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.section>

        {/* ─── Edit Profile Section ───────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-4xl bg-card shadow-ios-lg border border-border/50 divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30">
            <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
              Edit Profile
            </p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
            >
              <Pencil className="size-3.5" />
              Edit All Details
            </button>
          </div>
          <EditableField
            label="Full Name"
            value={profile.name}
            onSave={(v) => updateProfileField('name', v)}
            placeholder="Your name"
          />
          <EditableField
            label="School"
            value={profile.school}
            onSave={(v) => updateProfileField('school', v)}
            placeholder="University name"
          />
          <EditableField
            label="Dorm / Room"
            value={profile.dorm}
            onSave={(v) => updateProfileField('dorm', v)}
            placeholder="e.g. Dorm Room 312"
          />
          {/* Dedicated Year Level Row */}
          <div
            onClick={() => setIsYearModalOpen(true)}
            className="group flex cursor-pointer items-center justify-between px-5 py-3.5 hover:bg-accent/40 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                Year Level
              </p>
              <p
                className={cn(
                  'text-[16px] font-semibold',
                  profile.year ? 'text-foreground' : 'text-muted-foreground/70 font-normal italic'
                )}
              >
                {profile.year || 'Not set (Select year level)'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              <Pencil className="size-4 opacity-50 group-hover:opacity-100" />
            </div>
          </div>
          <EditableField
            label="Country Code"
            value={profile.country || 'PH'}
            onSave={(v) => updateProfileField('country', v.toUpperCase())}
            placeholder="PH"
          />
          <EditableField
            label="Time Zone"
            value={profile.timezone || 'Asia/Manila'}
            onSave={(v) => updateProfileField('timezone', v)}
            placeholder="Asia/Manila"
          />
        </div>

        {/* ─── Student & Region (Every Row Clickable to Open Dedicated Modal) ──── */}
        <ListGroup title="Student & Region">
          <ListRow
            icon={<GraduationCap className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="School"
            onClick={() => {
              setSchoolSearch('')
              setCustomSchool(profile.school)
              setIsSchoolModalOpen(true)
            }}
            trailing={
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-[15px] font-medium text-foreground">{profile.school}</span>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </div>
            }
          />
          <ListRow
            icon={<Globe className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Study Location"
            detail={`Time zone: ${profile.timezone || 'Asia/Manila'}`}
            onClick={() => setIsCountryModalOpen(true)}
            trailing={
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-medium text-foreground">
                  {getCountryByCode(profile.country).flag} {getCountryByCode(profile.country).name}
                </span>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </div>
            }
          />
          <ListRow
            icon={<BedDouble className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Dorm student"
            detail={dorm ? 'Kitchen filtered to dorm appliances' : 'Showing every recipe'}
            trailing={<IosSwitch checked={dorm} onChange={handleSetDorm} label="Dorm student" />}
          />
          <ListRow
            icon={<CookingPot className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Kitchen setup"
            detail={formatApplianceSummary(profile.appliances)}
            onClick={() => {
              setTempAppliances((profile.appliances as ApplianceType[]) || ['microwave', 'kettle'])
              setIsKitchenModalOpen(true)
            }}
            trailing={
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[14px] font-medium text-foreground">
                  {formatApplianceSummary(profile.appliances)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </div>
            }
          />
          <ListRow
            icon={<UtensilsCrossed className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Dietary preference"
            detail={formatDietarySummary(profile.dietary_preference as DietaryPreference, profile.dietary_note)}
            onClick={() => {
              setTempDietaryPref((profile.dietary_preference as DietaryPreference) || 'none')
              setTempDietaryNote(profile.dietary_note || '')
              setIsDietaryModalOpen(true)
            }}
            trailing={
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[14px] font-medium text-foreground">
                  {formatDietarySummary(profile.dietary_preference as DietaryPreference, profile.dietary_note)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </div>
            }
          />
        </ListGroup>

        {/* ─── Notifications ─────────────────────────────────────────────────── */}
        <ListGroup
          title="Notifications"
          footnote="Class alerts follow the lead times you set on the Alarms tab. Web Push delivers notifications even when Dormosaur is closed."
        >
          <ListRow
            icon={<BellRing className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Web Push on this device"
            detail={
              isPushToggling ? (
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <Loader2 className="size-3.5 animate-spin" />
                  Confirming device & sending test push...
                </span>
              ) : pushFeedback ? (
                <span
                  className={cn(
                    'font-medium',
                    pushFeedback.type === 'success'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {pushFeedback.message}
                </span>
              ) : pushEnabled ? (
                'Notifications active for this browser'
              ) : (
                'Receive class reminders even when tab is closed'
              )
            }
            trailing={
              isPushToggling ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <IosSwitch
                  checked={pushEnabled}
                  onChange={handleTogglePush}
                  label="Web Push on this device"
                />
              )
            }
          />
          <ListRow
            icon={<BellRing className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Class alerts"
            detail="Push reminders before lecture starts"
            trailing={
              <IosSwitch checked={classAlerts} onChange={handleSetClassAlerts} label="Class alerts" />
            }
          />
          <ListRow
            icon={<Bell className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Deadline alerts"
            detail="Push reminders 1 day, 1 hour, and 3 mins before due dates"
            trailing={
              <IosSwitch checked={deadlineAlerts} onChange={handleSetDeadlineAlerts} label="Deadline alerts" />
            }
          />
          <ListRow
            icon={<CookingPot className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Meal nudges"
            detail="A recipe suggestion when you have a long gap"
            trailing={<IosSwitch checked={mealNudge} onChange={handleSetMealNudge} label="Meal nudges" />}
          />
          <ListRow
            icon={<Moon className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Quiet hours"
            detail="Silence everything from 11pm to 7am"
            trailing={<IosSwitch checked={quietHours} onChange={handleSetQuietHours} label="Quiet hours" />}
          />
        </ListGroup>

        {/* ─── Registered Devices ────────────────────────────────────────────── */}
        <ListGroup
          title="Notification Devices"
          footnote="Each browser or phone registers independently so class reminders buzz where you are."
        >
          {subscribedDevices.length > 0 ? (
            subscribedDevices.map((d) => {
              const isThisDevice = Boolean(currentEndpoint && d.endpoint === currentEndpoint)
              return (
                <ListRow
                  key={d.id || d.endpoint}
                  icon={<Smartphone className="size-4.5 text-primary" strokeWidth={1.9} />}
                  label={d.deviceLabel}
                  detail={`Last confirmed: ${formatRelativeTime(d.lastSeenAt)}`}
                  trailing={
                    <div className="flex items-center gap-2">
                      {isThisDevice && (
                        <span className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                          This device
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(d.id, d.endpoint)}
                        className="rounded-full bg-destructive/10 px-3 py-1 text-[12px] font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-transform"
                      >
                        Remove
                      </button>
                    </div>
                  }
                />
              )
            })
          ) : (
            <ListRow
              icon={<Bell className="size-4.5 text-muted-foreground" strokeWidth={1.9} />}
              label="No active devices"
              detail="Toggle Web Push above to subscribe this browser"
            />
          )}
        </ListGroup>

        {/* ─── Appearance ────────────────────────────────────────────────────── */}
        <ListGroup title="Appearance">
          <ListRow
            icon={<Palette className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Theme"
            detail={theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
            trailing={
              <ThemeToggle
                value={theme}
                onChange={(v) => setTheme(v as 'light' | 'dark')}
              />
            }
          />
          <ListRow
            icon={
              theme === 'dark' ? (
                <Moon className="size-4.5 text-primary" strokeWidth={1.9} />
              ) : (
                <Sun className="size-4.5 text-primary" strokeWidth={1.9} />
              )
            }
            label="Haptic feedback"
            detail="Vibrate on button clicks and actions"
            trailing={<IosSwitch checked={haptics} onChange={handleSetHaptics} label="Haptic feedback" />}
          />
        </ListGroup>

        {/* ─── Schedule ───────────────────────────────────────────────────────── */}
        <ListGroup title="Schedule">
          <Link href="/schedule/import">
            <ListRow
              icon={<Zap className="size-4.5 text-primary" strokeWidth={1.9} />}
              label="Import a new schedule"
              detail="Paste a fresh timetable for next term"
              trailing={<ChevronRight className="size-4.5 text-muted-foreground" />}
            />
          </Link>
          <Link href="/schedule/review">
            <ListRow
              icon={<Pencil className="size-4.5 text-primary" strokeWidth={1.9} />}
              label="Edit parsed classes"
              detail={`${classes.length} ${classes.length === 1 ? 'class' : 'classes'} on file`}
              trailing={<ChevronRight className="size-4.5 text-muted-foreground" />}
            />
          </Link>
        </ListGroup>

        {/* ─── Account & Security ────────────────────────────────────────────── */}
        <ListGroup title="Account" footnote="Dormosaur v1.0 · Made for small rooms and long semesters.">
          <ListRow
            icon={<ShieldCheck className="size-4.5 text-primary" strokeWidth={1.9} />}
            label="Privacy & Data Protection"
            detail="Your data is encrypted and stored securely on Supabase"
            onClick={() => setIsPrivacyModalOpen(true)}
            trailing={
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">Protected</span>
                <ChevronRight className="size-4.5 text-muted-foreground" />
              </div>
            }
          />
        </ListGroup>

        {/* Reset to Demo Button */}
        <PillButton
          variant="secondary"
          size="lg"
          full
          onClick={() => {
            if (confirm('Reset all classes and alarms back to demo values? This cannot be undone.')) {
              resetToDemo()
              setToast({
                type: 'info',
                title: 'Data Reset',
                message: 'All schedule data restored to demo defaults.',
              })
            }
          }}
          className="text-destructive hover:bg-destructive/10 border border-destructive/20"
        >
          <RotateCcw className="mr-2 size-4" />
          Reset All Data to Demo
        </PillButton>

        {/* Sign Out Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={spring}
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-destructive/10 py-4 text-[16px] font-semibold text-destructive hover:bg-destructive/15 active:scale-95 disabled:opacity-60 transition-all shadow-ios-sm"
        >
          {signingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4.5" strokeWidth={2} />
          )}
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </motion.button>
      </div>

      {/* ─── DEDICATED SCHOOL SELECTION MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {isSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSchoolModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
                    <GraduationCap className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[18px] font-bold">Select University / School</h3>
                    <p className="text-[12px] text-muted-foreground">Pick your institution or enter custom name</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-3 space-y-3">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Custom School Name
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      placeholder="e.g. NU LIPA or Batangas State University"
                      className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-2.5 text-[14px] outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (customSchool.trim()) {
                          updateProfileField('school', customSchool)
                          setIsSchoolModalOpen(false)
                        }
                      }}
                      className="rounded-2xl bg-primary px-4 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Popular Universities
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      placeholder="Filter schools..."
                      className="w-full rounded-2xl border border-border/60 bg-fill pl-9 pr-4 py-2 text-[13px] outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="my-2 max-h-[40vh] overflow-y-auto space-y-1.5 pr-1">
                {filteredSchools.map((s) => {
                  const isSelected = profile.school.toLowerCase().includes(s.toLowerCase().slice(0, 8))
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        updateProfileField('school', s)
                        setIsSchoolModalOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all',
                        isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-accent/40 text-foreground'
                      )}
                    >
                      <span className="text-[14px] font-medium">{s}</span>
                      {isSelected && <Check className="size-4.5 text-primary" strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEDICATED KITCHEN SETUP MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {isKitchenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKitchenModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
                    <CookingPot className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[18px] font-bold">Select Dorm Appliances</h3>
                    <p className="text-[12px] text-muted-foreground">Recipes will filter to your available equipment</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKitchenModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-4 grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-[50vh] overflow-y-auto pr-1">
                {APPLIANCE_OPTIONS.map((opt) => {
                  const isSelected = tempAppliances.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTempAppliances((prev) =>
                          prev.includes(opt.id) ? prev.filter((a) => a !== opt.id) : [...prev, opt.id],
                        )
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-3 text-left transition-all',
                        isSelected
                          ? 'border-emerald-600/40 bg-emerald-500/10 font-semibold text-foreground ring-1 ring-emerald-600/30'
                          : 'border-border/60 bg-fill text-foreground hover:bg-accent/40',
                      )}
                    >
                      <span className="text-[13.5px]">{opt.label}</span>
                      <div
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border transition-all',
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-muted-foreground/30',
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsKitchenModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setProfile((prev) => ({ ...prev, appliances: tempAppliances }))
                    try {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user) {
                        await upsertUserProfile(supabase, user.id, { appliances: tempAppliances })
                      }
                    } catch (_) {}
                    setIsKitchenModalOpen(false)
                    setToast({
                      type: 'success',
                      title: 'Kitchen Setup Saved',
                      message: `Filtered to ${formatApplianceSummary(tempAppliances)}`,
                    })
                  }}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-[13.5px] font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-transform"
                >
                  Save Kitchen Setup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEDICATED DIETARY PREFERENCE MODAL ───────────────────────────── */}
      <AnimatePresence>
        {isDietaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDietaryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
                    <UtensilsCrossed className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[18px] font-bold">Dietary Preference</h3>
                    <p className="text-[12px] text-muted-foreground">Customize meal recommendations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDietaryModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {[
                  { id: 'none', label: 'No restrictions' },
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'halal', label: 'Halal' },
                  { id: 'other', label: 'Other Custom Restriction' },
                ].map((opt) => {
                  const isSelected = tempDietaryPref === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempDietaryPref(opt.id as DietaryPreference)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all',
                        isSelected
                          ? 'border-emerald-600/40 bg-emerald-500/10 font-semibold text-foreground ring-1 ring-emerald-600/30'
                          : 'border-border/60 bg-fill text-foreground hover:bg-accent/40',
                      )}
                    >
                      <span className="text-[14px] font-medium">{opt.label}</span>
                      <div
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border transition-all',
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-muted-foreground/30',
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}

                {tempDietaryPref === 'other' && (
                  <div className="pt-2">
                    <label className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      Custom Restriction Note
                    </label>
                    <input
                      type="text"
                      value={tempDietaryNote}
                      onChange={(e) => setTempDietaryNote(e.target.value)}
                      placeholder="e.g. dairy-free, no nuts, no shellfish"
                      className="w-full rounded-xl border border-border/80 bg-fill px-3.5 py-2.5 text-[13.5px] focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDietaryModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setProfile((prev) => ({
                      ...prev,
                      dietary_preference: tempDietaryPref,
                      dietary_note: tempDietaryNote,
                    }))
                    try {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user) {
                        await upsertUserProfile(supabase, user.id, {
                          dietary_preference: tempDietaryPref,
                          dietary_note: tempDietaryNote,
                        })
                      }
                    } catch (_) {}
                    setIsDietaryModalOpen(false)
                    setToast({
                      type: 'success',
                      title: 'Dietary Preference Saved',
                      message: `Saved as ${formatDietarySummary(tempDietaryPref, tempDietaryNote)}`,
                    })
                  }}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-[13.5px] font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-transform"
                >
                  Save Preference
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEDICATED YEAR LEVEL MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {isYearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsYearModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
                    <GraduationCap className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[18px] font-bold">Year Level</h3>
                    <p className="text-[12px] text-muted-foreground">Select your current academic standing</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsYearModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {YEAR_OPTIONS.map((opt) => {
                  const isSelected = profile.year === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={async () => {
                        await updateProfileField('year', opt)
                        setIsYearModalOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all',
                        isSelected
                          ? 'border-primary/40 bg-primary/10 font-semibold text-foreground ring-1 ring-primary/30'
                          : 'border-border/60 bg-fill text-foreground hover:bg-accent/40'
                      )}
                    >
                      <span className="text-[14.5px] font-medium">{opt}</span>
                      <div
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border transition-all',
                          isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}

                {profile.year && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateProfileField('year', '')
                      setIsYearModalOpen(false)
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/80 p-3 text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                  >
                    <RotateCcw className="size-3.5" />
                    Clear / Leave Unset
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsYearModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-muted-foreground hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FULL EDIT PROFILE MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
                    <Pencil className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-[19px] font-bold tracking-[-0.02em]">Edit Full Profile</h3>
                    <p className="text-[12.5px] text-muted-foreground">Update your details across Dormosaur</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Avatar Affordance inside Modal */}
                <div className="flex items-center gap-4 rounded-3xl bg-muted/40 p-3.5 border border-border/50">
                  <div className="relative shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={modalDraft.name || 'User Avatar'}
                        className="size-14 rounded-full object-cover shadow-xs"
                      />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-full bg-primary text-[18px] font-bold text-primary-foreground shadow-xs">
                        {profile.initials || 'ST'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-foreground">Profile Picture</p>
                    <p className="text-[11.5px] text-muted-foreground">JPG, PNG, or WEBP up to 5MB</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Camera className="size-3" />
                            Change Photo
                          </>
                        )}
                      </button>
                      {profile.avatar_url && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-rose-800 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={modalDraft.name}
                    onChange={(e) => setModalDraft({ ...modalDraft, name: e.target.value })}
                    className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Janver Manlapaz"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    University / School
                  </label>
                  <input
                    type="text"
                    value={modalDraft.school}
                    onChange={(e) => setModalDraft({ ...modalDraft, school: e.target.value })}
                    className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Batangas State University"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Dorm / Room
                    </label>
                    <input
                      type="text"
                      value={modalDraft.dorm}
                      onChange={(e) => setModalDraft({ ...modalDraft, dorm: e.target.value })}
                      className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Dorm Room"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Year Level
                    </label>
                    <div className="relative">
                      <select
                        value={modalDraft.year}
                        onChange={(e) => setModalDraft({ ...modalDraft, year: e.target.value })}
                        className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer text-foreground"
                      >
                        <option value="">Select year level</option>
                        {YEAR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 rotate-90 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Country Code
                    </label>
                    <input
                      type="text"
                      value={modalDraft.country}
                      onChange={(e) => setModalDraft({ ...modalDraft, country: e.target.value.toUpperCase() })}
                      className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
                      placeholder="PH"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Time Zone
                    </label>
                    <input
                      type="text"
                      value={modalDraft.timezone}
                      onChange={(e) => setModalDraft({ ...modalDraft, timezone: e.target.value })}
                      className="w-full rounded-2xl border border-border/80 bg-fill px-4 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Asia/Manila"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFullProfile}
                  className="rounded-full bg-primary px-6 py-2.5 text-[14px] font-bold text-primary-foreground shadow-ios hover:bg-primary/90 active:scale-95 transition-transform"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── COUNTRY & TIMEZONE PICKER MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {isCountryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCountryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="size-5 text-primary" />
                  <h3 className="text-[18px] font-bold">Select Study Country</h3>
                </div>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country or code (e.g. Philippines, PH)"
                className="my-3 w-full rounded-2xl border border-border/80 bg-fill px-4 py-2.5 text-[14px] outline-none focus:border-primary"
              />

              <div className="my-2 max-h-[50vh] overflow-y-auto space-y-1 pr-1">
                {filteredCountries.map((c) => {
                  const isSelected = profile.country === c.code
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        updateProfileField('country', c.code)
                        updateProfileField('timezone', c.defaultTimezone)
                        setIsCountryModalOpen(false)
                        setToast({
                          type: 'success',
                          title: 'Study Location Updated',
                          message: `${c.flag} ${c.name} (${c.defaultTimezone})`,
                        })
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all',
                        isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-accent/40 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[22px]">{c.flag}</span>
                        <div>
                          <p className="text-[15px] font-semibold">{c.name}</p>
                          <p className="text-[12px] text-muted-foreground">{c.defaultTimezone}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="size-5 text-primary" strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── PRIVACY & DATA SECURITY MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={spring}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl bg-card p-6 shadow-ios-2xl border border-border"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 font-bold">
                    <ShieldCheck className="size-5" />
                  </span>
                  <h3 className="text-[18px] font-bold">Privacy & Security</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-4 space-y-3.5 text-[14px] leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">🔒 Row Level Security (RLS)</strong>: Your student profile, class schedule, and alarms are isolated so only your authenticated user ID can read or write data.
                </p>
                <p>
                  <strong className="text-foreground">⚡ Local-First Cache</strong>: Your timetable is cached in browser local storage for instant offline access even without WiFi.
                </p>
                <p>
                  <strong className="text-foreground">🛡️ Zero Ads & Tracking</strong>: Dormosaur is built exclusively for student utility. We never track your personal data or sell info to third parties.
                </p>
              </div>

              <div className="pt-3 flex justify-end border-t border-border">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="rounded-full bg-primary px-5 py-2 text-[13.5px] font-bold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-transform"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <IosToast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
