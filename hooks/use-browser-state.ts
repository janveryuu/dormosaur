'use client'
import { useCallback, useSyncExternalStore } from 'react'

const noSubscription = () => () => {}
export function useClientReady() {
  return useSyncExternalStore(noSubscription, () => true, () => false)
}
let now = Date.now()
const clockListeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined
function subscribeClock(listener: () => void) {
  clockListeners.add(listener)
  now = Date.now()
  if (!timer) timer = setInterval(() => { now = Date.now(); for (const notify of clockListeners) notify() }, 30_000)
  return () => { clockListeners.delete(listener); if (!clockListeners.size) { clearInterval(timer); timer = undefined } }
}
export function useNow() { return useSyncExternalStore(subscribeClock, () => now, () => 0) }

const memory = new Map<string, boolean>()
export function useStoredBoolean(key: string, fallback: boolean) {
  const getSnapshot = useCallback(() => {
    try {
      const value = localStorage.getItem(key) ?? localStorage.getItem(key.replace('dormosaur_', 'dormly_'))
      return value === null ? memory.get(key) ?? fallback : value === 'true'
    } catch { return memory.get(key) ?? fallback }
  }, [key, fallback])
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener('storage', notify); window.addEventListener('dormosaur-storage', notify)
    return () => { window.removeEventListener('storage', notify); window.removeEventListener('dormosaur-storage', notify) }
  }, [])
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback)
  const setValue = useCallback((next: boolean) => {
    memory.set(key, next)
    try { localStorage.setItem(key, String(next)) } catch {}
    window.dispatchEvent(new Event('dormosaur-storage'))
  }, [key])
  return [value, setValue] as const
}
