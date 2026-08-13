'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { BedDouble, ChevronLeft, ClipboardPaste, GraduationCap, Sparkles } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { IosSwitch } from '@/components/ios/ios-switch'
import { ActivityIndicator } from '@/components/ios/activity-indicator'
import { rawScheduleSample } from '@/lib/data'
import { cn } from '@/lib/utils'

const totalSteps = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [name, setName] = React.useState('')
  const [school, setSchool] = React.useState('')
  const [dorm, setDorm] = React.useState(true)
  const [raw, setRaw] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const finish = () => {
    setLoading(true)
    setTimeout(() => router.push('/schedule/review'), 1400)
  }

  const canContinue = step === 0 ? name.trim().length > 1 && school.trim().length > 1 : true

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 px-5">
        {step > 0 ? (
          <button
            onClick={() => go(step - 1)}
            className="-ml-2 flex items-center gap-0.5 py-1 pr-2 pl-1 text-[16px] font-medium text-primary"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
            Back
          </button>
        ) : (
          <Link
            href="/"
            className="-ml-2 flex items-center gap-0.5 py-1 pr-2 pl-1 text-[16px] font-medium text-primary"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
            Exit
          </Link>
        )}

        <div className="mx-auto flex items-center gap-2" aria-label={`Step ${step + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                width: i === step ? 22 : 7,
                opacity: i <= step ? 1 : 0.3,
              }}
              transition={{ type: 'spring', stiffness: 480, damping: 34 }}
              className={cn('h-[7px] rounded-full', i <= step ? 'bg-primary' : 'bg-separator')}
            />
          ))}
        </div>

        <span className="w-12" />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <div className="flex flex-1 flex-col pt-8">
                <span className="mb-6 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <GraduationCap className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Let&apos;s get you set up.</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  Just your name and where you study. Everything else comes later.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <label className="flex flex-col gap-2">
                    <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      First name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mika"
                      autoComplete="given-name"
                      className="h-14 rounded-2xl bg-card px-5 text-[17px] shadow-ios outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      School
                    </span>
                    <input
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Northfield University"
                      className="h-14 rounded-2xl bg-card px-5 text-[17px] shadow-ios outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-1 flex-col pt-8">
                <span className="mb-6 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <BedDouble className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Do you live in a dorm?</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  Dorm students get recipes built around a microwave, a kettle, and no oven.
                </p>

                <div className="mt-8 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-ios">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16.5px] font-semibold tracking-[-0.01em]">
                      I live on campus
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted-foreground">
                      {dorm ? 'Kitchen filtered to dorm-safe appliances' : 'Full recipe library, no filters'}
                    </span>
                  </span>
                  <IosSwitch checked={dorm} onChange={setDorm} label="I live on campus" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col pt-8">
                <span className="mb-6 flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
                  <ClipboardPaste className="size-7" strokeWidth={1.8} />
                </span>
                <h1 className="ios-large-title text-balance">Paste your schedule.</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                  Copy it straight from your portal or an email. Messy is completely fine.
                </p>

                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={7}
                  placeholder={rawScheduleSample}
                  className="mt-6 resize-none rounded-3xl bg-card p-5 font-mono text-[13px] leading-relaxed shadow-ios outline-none placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring"
                />

                <button
                  onClick={() => setRaw(rawScheduleSample)}
                  className="mt-3 self-start rounded-full px-1 text-[14.5px] font-medium text-primary"
                >
                  Use a sample schedule
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col gap-3">
          {step < totalSteps - 1 ? (
            <PillButton size="lg" full onClick={() => go(step + 1)} disabled={!canContinue}>
              Continue
            </PillButton>
          ) : (
            <PillButton size="lg" full onClick={finish} disabled={loading || raw.trim().length < 5}>
              {loading ? (
                <>
                  <ActivityIndicator />
                  Organizing
                </>
              ) : (
                <>
                  <Sparkles className="size-4.5" strokeWidth={2.1} />
                  Organize My Schedule
                </>
              )}
            </PillButton>
          )}
          <Link
            href="/dashboard"
            className="py-1 text-center text-[15px] font-medium text-muted-foreground"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  )
}
