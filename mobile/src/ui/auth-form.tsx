import { router } from 'expo-router'
import { CircleAlert, Eye, EyeOff, MailCheck } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
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

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const signUp = mode === 'sign-up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const passRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  const valid = EMAIL.test(email.trim()) && password.length >= 8 && (!signUp || !!name.trim())

  async function submit() {
    if (!valid || busy) return
    setBusy('email'); setError(null)
    const { data, error: e } = signUp
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: authRedirect() } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(null)
    if (e) { haptic.warn(); return setError(friendly(e.message)) }
    haptic.success()
    if (signUp && !data.session) setSentTo(email.trim())
  }

  async function google() {
    if (busy) return
    setBusy('google'); setError(null)
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
          <T v="callout" color={c.ink2} center>We sent a link to {sentTo}. Open it, then come back to log in.</T>
        </Animated.View>
        <Button title="Back to log in" kind="secondary" onPress={() => router.replace('/sign-in')} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)} style={{ marginTop: 12, gap: 8 }}>
          <T v="largeTitle" accessibilityRole="header">{signUp ? 'Create your account' : 'Welcome back'}</T>
          <T v="callout" color={c.ink2}>{signUp ? 'Classes, deadlines and meals — sorted in one place.' : 'Log in to pick up where you left off.'}</T>
        </Animated.View>

        <Animated.View entering={rise(1)} style={{ marginTop: 32, gap: 18 }}>
          <Press onPress={google} disabled={!!busy && busy !== 'google'} accessibilityLabel="Continue with Google"
            style={[{ height: 56, borderRadius: radius.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, elevation(c, 1)]}>
            {busy === 'google' ? <ActivityIndicator color={c.ink} /> : (<><GoogleIcon size={20} /><T v="headline">Continue with Google</T></>)}
          </Press>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
            <T v="footnote" color={c.ink3}>or with email</T>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          </View>

          {signUp && <Field label="Name" value={name} onChangeText={setName} placeholder="What should we call you?" autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />}
          <Field ref={emailRef} label="Email" value={email} onChangeText={t => { setEmail(t); setError(null) }} placeholder="you@school.edu"
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

          {error && (
            <Animated.View entering={fade(0, 200)} accessibilityRole="alert" style={{ flexDirection: 'row', gap: 10, backgroundColor: c.dangerSoft, borderRadius: radius.sm, padding: 12 }}>
              <CircleAlert size={18} color={c.danger} />
              <T v="footnote" color={c.danger} style={{ flex: 1 }}>{error}</T>
            </Animated.View>
          )}

          <Button title={signUp ? 'Create account' : 'Log in'} disabled={!valid} loading={busy === 'email'} onPress={submit} />
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
