import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { AppState, Platform } from 'react-native'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isConfigured = Boolean(url && anonKey)

const CHUNK_SIZE = 1800
const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
}
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_')

/**
 * Chunked encrypted session storage using SecureStore on native platforms,
 * performing a transparent one-time migration from legacy plaintext AsyncStorage.
 */
const NativeSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key)
    const countRaw = await SecureStore.getItemAsync(`${base}.__chunks`, SECURE_OPTS)
    if (countRaw) {
      const count = Number(countRaw)
      if (Number.isInteger(count) && count > 0) {
        const parts = await Promise.all(
          Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${base}.__c${i}`, SECURE_OPTS)),
        )
        if (parts.every(p => typeof p === 'string')) return parts.join('')
      }
    }
    const single = await SecureStore.getItemAsync(base, SECURE_OPTS)
    if (single !== null) return single

    const legacy = await AsyncStorage.getItem(key).catch(() => null)
    if (legacy !== null) {
      await this.setItem(key, legacy).catch(() => {})
      await AsyncStorage.removeItem(key).catch(() => {})
      return legacy
    }
    return null
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key)
    const prevCount = Number(await SecureStore.getItemAsync(`${base}.__chunks`, SECURE_OPTS).catch(() => '0')) || 0
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(base, value, SECURE_OPTS)
      await SecureStore.deleteItemAsync(`${base}.__chunks`, SECURE_OPTS).catch(() => {})
      for (let i = 0; i < prevCount; i++) {
        await SecureStore.deleteItemAsync(`${base}.__c${i}`, SECURE_OPTS).catch(() => {})
      }
    } else {
      const chunks: string[] = []
      for (let i = 0; i < value.length; i += CHUNK_SIZE) chunks.push(value.slice(i, i + CHUNK_SIZE))
      await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${base}.__c${i}`, c, SECURE_OPTS)))
      await SecureStore.setItemAsync(`${base}.__chunks`, String(chunks.length), SECURE_OPTS)
      await SecureStore.deleteItemAsync(base, SECURE_OPTS).catch(() => {})
      for (let i = chunks.length; i < prevCount; i++) {
        await SecureStore.deleteItemAsync(`${base}.__c${i}`, SECURE_OPTS).catch(() => {})
      }
    }
    await AsyncStorage.removeItem(key).catch(() => {})
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key)
    const count = Number(await SecureStore.getItemAsync(`${base}.__chunks`, SECURE_OPTS).catch(() => '0')) || 0
    await SecureStore.deleteItemAsync(base, SECURE_OPTS).catch(() => {})
    await SecureStore.deleteItemAsync(`${base}.__chunks`, SECURE_OPTS).catch(() => {})
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${base}.__c${i}`, SECURE_OPTS).catch(() => {})
    }
    await AsyncStorage.removeItem(key).catch(() => {})
  },
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    storage: Platform.OS === 'web' ? AsyncStorage : NativeSecureStorage,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
