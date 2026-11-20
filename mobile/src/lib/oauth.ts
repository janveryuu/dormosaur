import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { supabase } from './supabase'

WebBrowser.maybeCompleteAuthSession()

/**
 * Google sign-in through Supabase OAuth.
 * Native: opens an auth session and reads the tokens from the redirect.
 * Web: full-page redirect; supabase-js picks the session up from the URL on return.
 * Every redirect URL used here must be allowed in Supabase → Auth → URL Configuration.
 */
export async function signInWithGoogle(): Promise<{ error?: string; cancelled?: boolean }> {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    return error ? { error: error.message } : {}
  }

  const redirectTo = Linking.createURL('auth/callback')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  })
  if (error || !data?.url) return { error: error?.message ?? 'Google sign-in is unavailable.' }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') return { cancelled: true }

  const url = new URL(result.url)
  const params = new URLSearchParams(url.hash.replace(/^#/, ''))
  url.searchParams.forEach((v, k) => params.set(k, v))

  const failure = params.get('error_description') ?? params.get('error')
  if (failure) return { error: failure.replace(/\+/g, ' ') }

  const code = params.get('code')
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code)
    return e ? { error: e.message } : {}
  }
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return { error: 'Google did not return a session.' }
  const { error: e } = await supabase.auth.setSession({ access_token, refresh_token })
  return e ? { error: e.message } : {}
}
