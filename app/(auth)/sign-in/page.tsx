'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandPanel } from '@/components/signup/brand-panel'
import { GoogleIcon } from '@/components/signup/google-icon'
import { PillButton } from '@/components/ios/pill-button'
import { getFallbackAuthEmail } from '@/lib/email-utils'

const IOS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const callbackError = searchParams.get('error')

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    callbackError ? 'Sign-in failed. Please try again.' : null,
  )

  const supabase = createClient()

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)

    try {
      const cleanEmail = email.trim()
      let authRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      // Fallback: If primary sign-in fails with invalid email syntax, try fallback email
      if (
        authRes.error &&
        (authRes.error.message.toLowerCase().includes('is invalid') ||
          authRes.error.message.toLowerCase().includes('invalid email'))
      ) {
        const fallbackEmail = getFallbackAuthEmail(cleanEmail)
        authRes = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password,
        })
      }

      if (authRes.error) {
        const msg = authRes.error.message.toLowerCase()
        if (
          msg.includes('invalid login credentials') ||
          msg.includes('user not found') ||
          msg.includes('invalid grant')
        ) {
          setError('Incorrect email or password')
        } else {
          setError(authRes.error.message || 'Something went wrong, please try again.')
        }
        setLoading(false)
        return
      }

      if (authRes.data.session && authRes.data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authRes.data.user.id)
            .single()

          if (profile && profile.onboarding_completed) {
            router.push(nextPath)
          } else {
            router.push('/onboarding')
          }
        } catch {
          router.push('/onboarding')
        }
        router.refresh()
      } else {
        setError('Sign-in failed. Please try again.')
        setLoading(false)
      }
    } catch (err: unknown) {
      console.error('Sign-in error:', err)
      setError('Something went wrong, please try again.')
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2 bg-background">
      {/* Left Column: Brand Panel (Matches Sign Up screen 100%) */}
      <BrandPanel />

      {/* Right Column: Sign In Form Container */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: IOS_EASE }}
          className="flex w-full max-w-md flex-col gap-6"
        >
          {/* Mobile Logo Header */}
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <img
              src="/android-chrome-192x192.png"
              alt="Dormosaur"
              className="size-12 rounded-2xl object-cover shadow-ios-md"
            />
          </div>

          {/* Headline & Subhead */}
          <div className="flex flex-col gap-1.5 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Sign in to your Dormosaur account
            </p>
          </div>

          {/* Form Card */}
          <div className="overflow-hidden rounded-3xl bg-card border border-border/80 shadow-ios-lg">
            <div className="flex flex-col gap-0 divide-y divide-border/60">
              {/* Google Auth Button */}
              <div className="p-5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-fill py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60 border border-border/40"
                >
                  {googleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </motion.button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 px-5 py-3 bg-muted/20">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[12.5px] font-medium text-muted-foreground uppercase tracking-wider">
                  or sign in with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailSignIn} className="flex flex-col gap-0 divide-y divide-border/60">
                {/* Email */}
                <div className="px-5 py-4">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="24-01096@g.batstate.edu.ph"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-[15.5px] font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Password */}
                <div className="px-5 py-4">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="flex-1 bg-transparent text-[15.5px] font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Inline Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2.5 px-5 py-3 text-[13.5px] font-medium text-destructive bg-destructive/10 border-t border-destructive/20"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="p-5">
                  <PillButton
                    type="submit"
                    disabled={loading || !email || !password}
                    full
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </PillButton>
                </div>
              </form>
            </div>
          </div>

          {/* Create Account Link */}
          <p className="text-center text-[14.5px] text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Create one
            </Link>
          </p>

          {/* Terms Footer */}
          <p className="text-center text-[12px] text-muted-foreground/70">
            By continuing you agree to Dormosaur&apos;s terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="size-12 animate-pulse rounded-2xl bg-fill" /></div>}>
      <SignInContent />
    </React.Suspense>
  )
}
