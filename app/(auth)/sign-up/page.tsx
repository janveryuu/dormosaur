'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Info, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { seedNewUser } from '@/lib/db'
import { BrandPanel } from '@/components/signup/brand-panel'
import { GoogleIcon } from '@/components/signup/google-icon'
import { PasswordStrength } from '@/components/signup/password-strength'
import { PillButton } from '@/components/ios/pill-button'
import {
  isEduOrSchoolEmail,
  isValidEmailFormat,
  getFallbackAuthEmail,
  detectSchoolFromEmail,
} from '@/lib/email-utils'

const IOS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<'form' | 'verify'>('form')
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [agreed, setAgreed] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const supabase = createClient()

  // Dynamic school email validation
  const isSchoolEmail = React.useMemo(() => {
    if (!email || !email.includes('@')) return true
    return isEduOrSchoolEmail(email)
  }, [email])

  // Auto-detect school name (e.g. Batangas State University from @g.batstate.edu.ph)
  const detectedSchool = React.useMemo(() => {
    return detectSchoolFromEmail(email)
  }, [email])

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password || !agreed) return

    if (!isValidEmailFormat(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanEmail = email.trim()
      let authRes = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            school: detectedSchool || '',
            school_email: cleanEmail,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      // Fallback: If Supabase GoTrue rejects BSU / Philippine email domain format
      if (
        authRes.error &&
        (authRes.error.message.toLowerCase().includes('is invalid') ||
          authRes.error.message.toLowerCase().includes('invalid email'))
      ) {
        const fallbackEmail = getFallbackAuthEmail(cleanEmail)
        authRes = await supabase.auth.signUp({
          email: fallbackEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              school: detectedSchool || '',
              school_email: cleanEmail,
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
      }

      if (authRes.error) {
        setError(authRes.error.message)
        setLoading(false)
        return
      }

      if (authRes.data.session && authRes.data.user) {
        await seedNewUser(supabase, authRes.data.user.id, {
          name: name.trim(),
          school: detectedSchool || 'Batangas State University',
          initials: getInitials(name.trim()),
        })
        router.push('/onboarding')
        router.refresh()
      } else {
        setStep('verify')
        setLoading(false)
      }
    } catch (err: unknown) {
      console.error('Sign up error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
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

  const [resendCooldown, setResendCooldown] = React.useState(0)
  const [resendLoading, setResendLoading] = React.useState(false)
  const [resendMessage, setResendMessage] = React.useState<string | null>(null)
  const [resendError, setResendError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleResendEmail() {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendMessage(null)
    setResendError(null)

    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setResendMessage('Confirmation email sent! Please check your inbox or spam folder.')
        setResendCooldown(60)
      } else {
        setResendError(data.error || 'Failed to resend confirmation email. Please try again.')
      }
    } catch (err) {
      setResendError('Network error — please check your connection and try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // Verification Screen
  if (step === 'verify') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: IOS_EASE }}
          className="w-full max-w-md text-center bg-card p-8 rounded-3xl border border-border shadow-ios-lg"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Check your email</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-foreground">{email}</span>. Click
            it to activate your account and turn the semester scramble into a plan.
          </p>

          {/* Success / Error Banners */}
          <AnimatePresence>
            {resendMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-2xl bg-emerald-500/10 p-3.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
              >
                {resendMessage}
              </motion.div>
            )}
            {resendError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-2xl bg-rose-500/10 p-3.5 text-[13px] font-semibold text-rose-700 dark:text-rose-300 border border-rose-500/20"
              >
                {resendError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col gap-3">
            <PillButton
              type="button"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resendLoading}
              full
              size="lg"
            >
              {resendLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Sending email…
                </span>
              ) : resendCooldown > 0 ? (
                `Resend email in ${resendCooldown}s`
              ) : (
                'Resend confirmation email'
              )}
            </PillButton>

            <Link href="/sign-in">
              <PillButton variant="secondary" full size="lg">
                Back to Sign In
              </PillButton>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2 bg-background">
      {/* Left Column: Brand Panel (Hidden on Mobile, Visible on Desktop) */}
      <BrandPanel />

      {/* Right Column: Sign Up Form Container */}
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
              Create your account
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Join Dormosaur and turn the semester scramble into a plan.
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
                  onClick={handleGoogleSignUp}
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
                  or sign up with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSignUp} className="flex flex-col gap-0 divide-y divide-border/60">
                {/* Full Name */}
                <div className="px-5 py-4">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Janver Manlapaz"
                    autoComplete="name"
                    required
                    className="w-full bg-transparent text-[15.5px] font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* School Email */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Email
                    </label>
                    {detectedSchool ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <GraduationCap className="size-3.5" /> {detectedSchool}
                      </span>
                    ) : !isSchoolEmail && email.length > 5 ? (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                        <Info className="size-3" /> Non-school email
                      </span>
                    ) : null}
                  </div>
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

                {/* Password with Strength Indicator */}
                <div className="px-5 py-4">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      minLength={8}
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
                  {/* Real-time Password Strength Component */}
                  <PasswordStrength password={password} />
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="px-5 py-4 flex items-start gap-3 bg-muted/10">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[13px] text-muted-foreground leading-snug cursor-pointer select-none">
                    I agree to Dormosaur&apos;s{' '}
                    <Link href="#" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {/* Error Banner */}
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

                {/* Submit Action Button */}
                <div className="p-5">
                  <PillButton
                    type="submit"
                    disabled={loading || !agreed || !name || !email || password.length < 8}
                    full
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Creating your account…
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </PillButton>
                </div>
              </form>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-[14.5px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
