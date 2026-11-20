import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { completeAuthFromUrl, oauthRedirect } from './auth-link'
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

  const redirectTo = oauthRedirect()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  })
  if (error || !data?.url) return { error: error?.message ?? 'Google sign-in is unavailable.' }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') return { cancelled: true }

  return completeAuthFromUrl(result.url)
}
