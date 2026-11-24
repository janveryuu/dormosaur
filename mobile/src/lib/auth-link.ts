import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Linking from 'expo-linking'
import { Platform } from 'react-native'
import { supabase } from './supabase'

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

/**
 * Fixed return address for Google sign-in. It never depends on the dev machine's IP,
 * so Supabase always accepts it (it is on the allow list) instead of falling back to the
 * Site URL (the Vercel landing page). iOS auth sessions catch this scheme even inside
 * Expo Go; Android Expo Go cannot, so it keeps the exp:// address there.
 */
export const oauthRedirect = () =>
  isExpoGo && Platform.OS === 'android' ? Linking.createURL('auth/callback') : 'dormosaur://auth/callback'

/** Where Supabase sends users back after Google or an email confirmation link. */
export const authRedirect = () => Linking.createURL('auth/callback')

/** Reads a PKCE code (or OAuth implicit tokens inside a verified browser session) and starts the session. */
export async function completeAuthFromUrl(raw: string, opts?: { allowImplicitSession?: boolean }): Promise<{ error?: string }> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { error: 'Invalid sign-in link.' }
  }
  const params = new URLSearchParams(url.hash.replace(/^#/, ''))
  url.searchParams.forEach((v, k) => params.set(k, v))

  const failure = params.get('error_description') ?? params.get('error')
  if (failure) return { error: failure.replace(/\+/g, ' ') }

  const code = params.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? { error: error.message } : {}
  }
  if (!opts?.allowImplicitSession) return {}
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return {}
  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  return error ? { error: error.message } : {}
}
