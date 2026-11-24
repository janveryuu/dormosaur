import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useSyncExternalStore } from 'react'
import { AppState } from 'react-native'
import { UpgradeError, proApi, type PaidPlan, type ProFeature, type ProStatus, type Wallet } from './api'

/**
 * Pro status shared by every screen. Cached per user so the app opens instantly
 * with the last known state, then refreshed from the server (which is the only
 * authority: limits are enforced there, the app just mirrors them for good UX).
 */

export const PLANS: { id: PaidPlan; name: string; amount: number; note: string; length: string; tag?: string }[] = [
  { id: 'semester', name: 'Semester', amount: 99, note: '₱16.50/mo', length: '6 months of Pro', tag: 'Best value' },
  { id: 'lifetime', name: 'Lifetime', amount: 249, note: 'Pay once', length: 'Pro forever' },
  { id: 'monthly', name: 'Monthly', amount: 29, note: 'per month', length: '30 days of Pro' },
]

export const WALLETS: { id: Wallet; name: string; color: string; qr: number }[] = [
  { id: 'gcash', name: 'GCash', color: '#005CE6', qr: require('@/assets/pay/gcash.jpg') },
  { id: 'maya', name: 'Maya', color: '#00A651', qr: require('@/assets/pay/maya.jpg') },
  { id: 'maribank', name: 'MariBank', color: '#EE6A1F', qr: require('@/assets/pay/maribank.jpg') },
  { id: 'gotyme', name: 'GoTyme', color: '#00B6C9', qr: require('@/assets/pay/gotyme.jpg') },
]

/** What Free gets vs Pro, shown on the paywall. */
export const COMPARE: { label: string; free: string; pro: string }[] = [
  { label: 'AI schedule scans', free: '1', pro: 'Unlimited' },
  { label: 'Syllabus deadline scans', free: '1', pro: 'Unlimited' },
  { label: 'Copilot messages', free: '5/day', pro: '100/day' },
  { label: 'Weekly meal plan & grocery list', free: 'Today only', pro: 'Full week' },
  { label: 'Alarm time per class', free: '15 min', pro: 'Your choice' },
  { label: 'Wallpaper themes', free: '1', pro: 'All, no watermark' },
  { label: 'Pro badge', free: '–', pro: '✓' },
]

/** Why the paywall opened, so it can speak to that moment. */
export const REASONS: Record<string, { title: string; body: string }> = {
  schedule_scan: { title: 'Scan every schedule', body: 'You’ve used your free AI scan. Pro scans every new semester and schedule change.' },
  syllabus_scan: { title: 'Import every syllabus', body: 'You’ve used your free syllabus scan. Pro pulls deadlines from every subject.' },
  copilot: { title: 'Keep chatting with Dormo', body: 'You’ve used today’s 5 free messages. Pro gets 100 a day plus study plans.' },
  meal_plan: { title: 'Plan the whole week', body: 'Pro plans every meal for the week and builds your grocery list.' },
  alarms: { title: 'Alarms that fit you', body: 'Pro lets you pick how early each class alarm rings.' },
  wallpaper: { title: 'Every wallpaper theme', body: 'Pro unlocks all themes with no watermark.' },
}

type Cached = { userId: string; status: ProStatus }
const KEY = 'dormosaur.pro.v1'
let state: Cached | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: Cached | null) {
  state = next
  listeners.forEach(l => l())
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {})
}

const DEMO: ProStatus = {
  isPro: false, plan: null, source: null, endsAt: null, lifetime: false, trialAvailable: true,
  usage: { schedule_scan: { used: 0, limit: 1, per: 'all' }, syllabus_scan: { used: 0, limit: 1, per: 'all' }, copilot: { used: 0, limit: 5, per: 'day' } },
  pendingPayment: null, lastRejection: null, referenceCode: 'DORMO-DEMO00', trialDays: 7,
}

async function refresh(userId: string, demo: boolean) {
  if (demo) { if (state?.userId !== userId) set({ userId, status: DEMO }); return }
  if (loading) return loading
  loading = (async () => {
    try {
      if (!state || state.userId !== userId) {
        const raw = await AsyncStorage.getItem(KEY).catch(() => null)
        const cached = raw ? (JSON.parse(raw) as Cached | null) : null
        if (cached?.userId === userId) { state = cached; listeners.forEach(l => l()) }
      }
      set({ userId, status: await proApi.status() })
    } catch {
      // Offline: keep the cached status. The server still enforces limits.
    } finally {
      loading = null
    }
  })()
  return loading
}

/** Pro is active right now (also re-checks the end date locally so expiry is instant). */
export function activeNow(s: ProStatus | null) {
  return !!s?.isPro && (s.lifetime || !s.endsAt || Date.parse(s.endsAt) > Date.now())
}

export const pro = {
  refresh,
  /** Replace the cached status with a fresh one from a server response. */
  apply(userId: string, status: ProStatus) { set({ userId, status }) },
  clear() { set(null) },
}

/** Current Pro status for this user; refreshes on mount and whenever the app comes to the front. */
export function usePro(userId: string | undefined, demo: boolean) {
  const snap = useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l) } }, () => state, () => state)
  useEffect(() => {
    if (!userId) return
    refresh(userId, demo)
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(userId, demo) })
    return () => sub.remove()
  }, [userId, demo])
  const status = userId && snap?.userId === userId ? snap.status : null
  const isPro = activeNow(status)
  return {
    status,
    isPro,
    loaded: !!status,
    /** True when a limited feature still has free uses left (or the student is Pro). */
    canUse: (f: ProFeature) => isPro || !status || status.usage[f].used < status.usage[f].limit,
  }
}

/** Opens the paywall, explaining which feature led there. */
export function openPaywall(reason?: string) {
  router.push(reason ? { pathname: '/pro', params: { reason } } : '/pro')
}

/** If an API call hit a free limit, open the paywall and return true. */
export function handleUpgrade(e: unknown, userId?: string, demo = false) {
  if (!(e instanceof UpgradeError)) return false
  if (userId) refresh(userId, demo)
  openPaywall(e.feature ?? undefined)
  return true
}

export function daysLeft(endsAt: string | null) {
  if (!endsAt) return null
  return Math.max(0, Math.ceil((Date.parse(endsAt) - Date.now()) / 86_400_000))
}
