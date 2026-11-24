import AsyncStorage from '@react-native-async-storage/async-storage'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useEffect, useSyncExternalStore } from 'react'
import { avatarApi } from './api'

/**
 * Profile picture store shared by the You tab, Today header and Profile editor.
 * Signed URLs are cached per user so the picture shows instantly on launch;
 * a fresh one is fetched when the cached URL is close to expiring.
 */
type Cached = { userId: string; url: string | null; expiresAt: number }

const KEY = 'dormosaur.avatar.v1'
const REFRESH_MARGIN = 60 * 60 * 1000
let state: Cached | null = null
let loading: string | null = null
const listeners = new Set<() => void>()

function set(next: Cached | null) {
  state = next
  listeners.forEach(l => l())
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {})
}

async function load(userId: string, demo: boolean) {
  if (loading === userId) return
  loading = userId
  try {
    if (!state || state.userId !== userId) {
      const raw = await AsyncStorage.getItem(KEY).catch(() => null)
      const cached = raw ? (JSON.parse(raw) as Cached | null) : null
      if (cached?.userId === userId) { state = cached; listeners.forEach(l => l()) }
    }
    if (demo) return
    if (state?.userId === userId && (state.url === null || state.expiresAt - Date.now() > REFRESH_MARGIN)) return
    const signed = await avatarApi.get()
    set({ userId, url: signed?.url ?? null, expiresAt: signed?.expiresAt ?? Date.now() + 24 * 3600 * 1000 })
  } catch {
    // Offline or server unavailable: keep whatever is cached; initials show otherwise.
  } finally {
    loading = null
  }
}

/** Square crop + resize to 320px JPEG (~20–40 KB) so uploads are fast even on slow Android phones. */
async function compress(asset: { uri: string; width: number; height: number }) {
  const side = Math.min(asset.width, asset.height)
  const image = await ImageManipulator.manipulate(asset.uri)
    .crop({ originX: Math.round((asset.width - side) / 2), originY: Math.round((asset.height - side) / 2), width: side, height: side })
    .resize({ width: 320, height: 320 })
    .renderAsync()
  const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.78, base64: true })
  if (!out.base64) throw new Error('We could not read that photo. Please pick another one.')
  return { uri: out.uri, dataUrl: `data:image/jpeg;base64,${out.base64}` }
}

export const avatar = {
  /** Uploads a picked photo. In preview mode it stays on this device. */
  async save(userId: string, asset: { uri: string; width: number; height: number }, demo: boolean) {
    const { uri, dataUrl } = await compress(asset)
    if (demo) return set({ userId, url: uri, expiresAt: Number.MAX_SAFE_INTEGER })
    const signed = await avatarApi.upload(dataUrl)
    set({ userId, url: signed?.url ?? uri, expiresAt: signed?.expiresAt ?? Date.now() + 3600 * 1000 })
  },
  async remove(userId: string, demo: boolean) {
    if (!demo) await avatarApi.remove()
    set({ userId, url: null, expiresAt: Date.now() + 24 * 3600 * 1000 })
  },
  clear() { set(null) },
}

/** Current profile picture URL for this user, or null to show initials. */
export function useAvatar(userId: string | undefined, demo: boolean) {
  const snap = useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l) } }, () => state, () => state)
  useEffect(() => { if (userId) load(userId, demo) }, [userId, demo])
  return userId && snap?.userId === userId ? snap.url : null
}
