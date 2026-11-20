import { Image } from 'expo-image'
import { Link, router } from 'expo-router'
import { ChevronLeft, CircleAlert, Eye, EyeOff, MailCheck } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native'
import Animated from 'react-native-reanimated'
import { fade, rise } from '@/design/motion'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { color, font, radius, shadow } from '@/design/tokens'
import { signInWithGoogle } from '@/lib/oauth'
import { supabase } from '@/lib/supabase'
import { GoogleIcon } from './icons/google'
import { Button, Press, T } from './ui'

type InputRef = React.ComponentRef<typeof TextInput>

const EMAIL = /^\S+@\S+\.\S+$/

function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('already registered')) return 'That email already has an account. Sign in instead.'
  if (m.includes('confirmation email') || m.includes('rate limit')) return "We couldn't send the confirmation email. Try Google, or try again later."
  if (m.includes('not confirmed')) return 'Confirm your email first, then sign in.'
  if (m.includes('network')) return 'No connection. Check your internet and try again.'
  return message
}

/** Shared sign-in / sign-up screen. */
export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const insets = useSafeAreaInsets()
  const signUp = mode === 'sign-up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const emailRef = useRef<InputRef>(null)
  const passwordRef = useRef<InputRef>(null)

  const valid = EMAIL.test(email.trim()) && password.length >= 8 && (!signUp || !!name.trim())

  async function submitEmail() {
    if (!valid || busy) return
    setBusy('email'); setError(null)
    const { data, error: e } = signUp
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(null)
    if (e) return setError(friendly(e.message))
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
      <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24, justifyContent: 'center', gap: 20 }}>
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: color.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MailCheck size={32} color={color.green} strokeWidth={2} />
          </View>
          <T v="title" style={{ textAlign: 'center' }}>Check your email</T>
          <T v="body" style={{ textAlign: 'center', color: color.inkSoft }}>
            We sent a link to <T v="strong">{sentTo}</T>. Open it, then come back to sign in.
          </T>
        </Animated.View>
        <Link href="/sign-in" replace asChild>
          <Button title="Back to sign in" kind="secondary" />
        </Link>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View entering={fade(0, 400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={require('@/assets/images/dormosaur-logo.png')} style={{ width: 40, height: 40, borderRadius: 12 }} accessibilityIgnoresInvertColors />
          <T v="heading" style={{ fontFamily: font.black, letterSpacing: -0.4, flex: 1 }}>Dormosaur</T>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/welcome')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.card, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} color={color.ink} strokeWidth={2.2} />
          </Pressable>
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={rise(1)} style={{ marginTop: 44, gap: 8 }}>
          <T v="display" accessibilityRole="header">{signUp ? 'Create your\naccount' : 'Welcome\nback'}</T>
          <T v="body" style={{ color: color.inkSoft }}>
            {signUp ? 'Classes, deadlines and meals, sorted.' : 'Sign in to pick up where you left off.'}
          </T>
        </Animated.View>

        {/* Methods */}
        <Animated.View entering={rise(2)} style={{ marginTop: 32, gap: 20 }}>
          <Press
            haptic
            onPress={google}
            disabled={!!busy}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={[{ height: 56, borderRadius: radius.pill, backgroundColor: color.card, borderWidth: 1, borderColor: color.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: busy && busy !== 'google' ? 0.5 : 1 }, shadow]}
          >
            {busy === 'google' ? <ActivityIndicator color={color.ink} /> : (
              <>
                <GoogleIcon size={20} />
                <T v="strong" style={{ fontFamily: font.bold, fontSize: 16 }}>Continue with Google</T>
              </>
            )}
          </Press>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessible={false}>
            <View style={{ flex: 1, height: 1, backgroundColor: color.line }} />
            <T v="meta" style={{ color: color.inkMute }}>or with email</T>
            <View style={{ flex: 1, height: 1, backgroundColor: color.line }} />
          </View>

          <View style={{ gap: 14 }}>
            {signUp && (
              <Input label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name"
                returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} placeholder="What should we call you?" />
            )}
            <Input ref={emailRef} label="Email" value={email} onChangeText={t => { setEmail(t); setError(null) }}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
              returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@school.edu" />
            <PasswordInput ref={passwordRef} value={password} onChangeText={t => { setPassword(t); setError(null) }}
              isNew={signUp} onSubmitEditing={submitEmail} />
          </View>

          {error && (
            <Animated.View entering={fade(0, 180)} accessibilityLiveRegion="polite" accessibilityRole="alert"
              style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: color.coralSoft, borderRadius: radius.sm, padding: 12 }}>
              <CircleAlert size={18} color={color.coral} strokeWidth={2.2} style={{ marginTop: 1 }} />
              <T v="meta" style={{ flex: 1, color: '#9A3A24', lineHeight: 18 }}>{error}</T>
            </Animated.View>
          )}

          <Button title={signUp ? 'Create account' : 'Sign in'} disabled={!valid || (!!busy && busy !== 'email')} loading={busy === 'email'} onPress={submitEmail} />
        </Animated.View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Link href={signUp ? '/sign-in' : '/sign-up'} replace asChild>
          <Pressable accessibilityRole="link" hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row' }}>
            <T v="meta">{signUp ? 'Already have an account? ' : 'New to Dormosaur? '}</T>
            <T v="meta" style={{ color: color.green, fontFamily: font.bold }}>{signUp ? 'Sign in' : 'Create account'}</T>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

type InputProps = TextInputProps & { label: string; right?: React.ReactNode; ref?: React.Ref<InputRef> }

function Input({ label, right, style, onFocus, onBlur, ref, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: radius.md, backgroundColor: focused ? color.card : color.sunken, borderWidth: 1.5, borderColor: focused ? color.green : 'transparent' }}>
        <TextInput
          ref={ref}
          placeholderTextColor={color.inkMute}
          accessibilityLabel={label}
          onFocus={e => { setFocused(true); onFocus?.(e) }}
          onBlur={e => { setFocused(false); onBlur?.(e) }}
          {...rest}
          style={[{ flex: 1, height: '100%', paddingHorizontal: 16, fontFamily: font.regular, fontSize: 16, color: color.ink }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object), style]}
        />
        {right}
      </View>
    </View>
  )
}

function PasswordInput({ isNew, ref, ...rest }: TextInputProps & { isNew: boolean; ref?: React.Ref<InputRef> }) {
  const [shown, setShown] = useState(false)
  const short = isNew && !!rest.value && rest.value.length < 8
  return (
    <View style={{ gap: 6 }}>
      <Input
        ref={ref}
        label="Password"
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        textContentType={isNew ? 'newPassword' : 'password'}
        returnKeyType="go"
        placeholder={isNew ? 'At least 8 characters' : 'Your password'}
        right={
          <Pressable onPress={() => setShown(s => !s)} hitSlop={6} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
            style={{ width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            {shown ? <EyeOff size={20} color={color.inkSoft} /> : <Eye size={20} color={color.inkSoft} />}
          </Pressable>
        }
        {...rest}
      />
      {short && <T v="meta" style={{ color: color.inkMute, fontSize: 12 }}>{8 - rest.value!.length} more characters</T>}
    </View>
  )
}
