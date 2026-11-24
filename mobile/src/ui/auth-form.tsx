import { router } from 'expo-router'
import { CircleAlert, Eye, EyeOff, MailCheck } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { authRedirect } from '@/lib/auth-link'
import { signInWithGoogle } from '@/lib/oauth'
import { supabase } from '@/lib/supabase'
import { GoogleIcon } from './icons/google'
import { Button, Field, NavHeader, Press, T, haptic } from './index'

const EMAIL = /^\S+@\S+\.\S+$/

function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('already registered')) return 'That email already has an account. Log in instead.'
  if (m.includes('confirmation email') || m.includes('rate limit')) return "We couldn't send the confirmation email. Try Google, or try again later."
  if (m.includes('not confirmed')) return 'Confirm your email first, then log in.'
  if (m.includes('network')) return 'No connection. Check your internet and try again.'
  return message
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://dormosaur.vercel.app').replace(/\/$/, '')

async function fetchAuthApi(path: string, body: Record<string, unknown>, fallback: string): Promise<{ ok: boolean; error?: string; requiresConfirmation?: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, requiresConfirmation: json.requiresConfirmation !== false }
    return { ok: false, error: typeof json.error === 'string' ? json.error : fallback }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { ok: false, error: 'Request timed out. Check your connection and try again.' }
    return { ok: false, error: 'No connection. Check your internet and try again.' }
  } finally {
    clearTimeout(timer)
  }
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const signUp = mode === 'sign-up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState<'email' | 'google' | 'resend' | 'reset' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const passRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  const valid = EMAIL.test(email.trim()) && password.length >= 8 && (!signUp || !!name.trim())

  async function submit() {
    if (!valid || busy) return
    setBusy('email'); setError(null); setInfo(null)
    const mail = email.trim().toLowerCase()
    if (signUp) {
      const res = await fetchAuthApi('/api/auth/signup', { email: mail, password, name: name.trim() }, 'We could not create your account. Please try again.')
      if (!res.ok) { setBusy(null); haptic.warn(); return setError(res.error ?? 'We could not create your account.') }
      if (res.requiresConfirmation !== false) {
        setBusy(null)
        haptic.success()
        setSentTo(mail)
        return
      }
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email: mail, password })
    setBusy(null)
    if (e) { haptic.warn(); return setError(friendly(e.message)) }
    haptic.success()
  }

  async function resendConfirmation(targetEmail: string) {
    if (busy) return
    setBusy('resend')
    const res = await fetchAuthApi('/api/auth/resend-confirmation', { email: targetEmail }, 'Could not resend confirmation email.')
    setBusy(null)
    if (!res.ok) {
      haptic.warn()
      Alert.alert('Could not resend link', res.error ?? 'Try again in a minute.')
      return
    }
    haptic.success()
    Alert.alert('Confirmation email sent', `If ${targetEmail} needs confirmation, a new link is on its way. Check your inbox and spam folder.`)
  }

  async function resetPassword() {
    if (busy) return
    const mail = email.trim().toLowerCase()
    if (!EMAIL.test(mail)) {
      setError('Enter your email above first so we can send a reset link.')
      emailRef.current?.focus()
      return
    }
    setBusy('reset'); setError(null); setInfo(null)
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: authRedirect() })
      if (e) {
        haptic.warn()
        setError(friendly(e.message))
      } else {
        haptic.success()
        setInfo(`If ${mail} has an account, we sent a password reset link. Check your inbox and spam folder.`)
      }
    } catch {
      haptic.warn()
      setError('No connection. Check your internet and try again.')
    } finally {
      setBusy(null)
    }
  }

  async function google() {
    if (busy) return
    setBusy('google'); setError(null); setInfo(null)
    const r = await signInWithGoogle()
    setBusy(null)
    if (r.error) setError(friendly(r.error))
  }

  if (sentTo) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 28, justifyContent: 'center', gap: 16 }}>
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MailCheck size={34} color={c.green} strokeWidth={2} />
          </View>
          <T v="title1" center>Check your email</T>
          <T v="callout" color={c.ink2} center>We sent a confirmation link to {sentTo}. Open the link first, then log in.</T>
        </Animated.View>
        <Button title="Resend confirmation link" kind="secondary" loading={busy === 'resend'} disabled={!!busy} onPress={() => resendConfirmation(sentTo)} />
        <Button title="Back to log in" kind="ghost" disabled={!!busy} onPress={() => router.replace('/sign-in')} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <NavHeader onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)} style={{ marginTop: 12, gap: 8 }}>
          <T v="largeTitle" accessibilityRole="header">{signUp ? 'Create your account' : 'Welcome back'}</T>
          <T v="callout" color={c.ink2}>{signUp ? 'Classes, deadlines and meals — sorted in one place.' : 'Log in to pick up where you left off.'}</T>
        </Animated.View>

        <Animated.View entering={rise(1)} style={{ marginTop: 32, gap: 18 }}>
          <Press onPress={google} disabled={!!busy} accessibilityLabel="Continue with Google"
            style={[{ height: 56, borderRadius: radius.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, elevation(c, 1)]}>
            {busy === 'google' ? <ActivityIndicator color={c.ink} /> : (<><GoogleIcon size={20} /><T v="headline">Continue with Google</T></>)}
          </Press>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
            <T v="footnote" color={c.ink3}>or with email</T>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          </View>

          {signUp && <Field label="Name" value={name} onChangeText={setName} placeholder="What should we call you?" autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />}
          <Field ref={emailRef} label="Email" value={email} onChangeText={t => { setEmail(t); setError(null); setInfo(null) }} placeholder="you@school.edu"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
          <View>
            <Field ref={passRef} label="Password" value={password} onChangeText={t => { setPassword(t); setError(null) }} secureTextEntry={!shown}
              placeholder={signUp ? 'At least 8 characters' : 'Your password'} autoCapitalize="none" autoComplete={signUp ? 'new-password' : 'current-password'}
              returnKeyType="go" onSubmitEditing={submit} style={{ paddingRight: 52 }} />
            <Pressable onPress={() => setShown(s => !s)} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 4, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              {shown ? <EyeOff size={20} color={c.ink2} /> : <Eye size={20} color={c.ink2} />}
            </Pressable>
          </View>

          {!signUp && (
            <Pressable onPress={resetPassword} disabled={!!busy} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-end', marginTop: -8 }}>
              <T v="footnote" color={c.green} style={{ fontWeight: '700' }}>{busy === 'reset' ? 'Sending reset link…' : 'Forgot password?'}</T>
            </Pressable>
          )}

          {info && (
            <Animated.View entering={fade(0, 200)} style={{ flexDirection: 'row', gap: 10, backgroundColor: c.greenSoft, borderRadius: radius.sm, padding: 12 }}>
              <MailCheck size={18} color={c.green} />
              <T v="footnote" color={c.greenInk} style={{ flex: 1 }}>{info}</T>
            </Animated.View>
          )}

          {error && (
            <Animated.View entering={fade(0, 200)} accessibilityRole="alert" style={{ gap: 8, backgroundColor: c.dangerSoft, borderRadius: radius.sm, padding: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <CircleAlert size={18} color={c.danger} />
                <T v="footnote" color={c.danger} style={{ flex: 1 }}>{error}</T>
              </View>
              {error.toLowerCase().includes('confirm your email') && EMAIL.test(email.trim()) && (
                <Pressable onPress={() => resendConfirmation(email.trim().toLowerCase())} disabled={!!busy} hitSlop={8}>
                  <T v="footnote" color={c.green} style={{ fontWeight: '700' }}>{busy === 'resend' ? 'Sending confirmation link…' : 'Resend confirmation link'}</T>
                </Pressable>
              )}
            </Animated.View>
          )}

          <Button title={signUp ? 'Create account' : 'Log in'} disabled={!valid || !!busy} loading={busy === 'email'} onPress={submit} />
        </Animated.View>

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable onPress={() => router.replace(signUp ? '/sign-in' : '/sign-up')} accessibilityRole="link" style={{ alignSelf: 'center', flexDirection: 'row', padding: 12 }}>
          <T v="subhead" color={c.ink2}>{signUp ? 'Already have an account? ' : 'New to Dormosaur? '}</T>
          <T v="subhead" color={c.green} style={{ fontWeight: '700' }}>{signUp ? 'Log in' : 'Create account'}</T>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
