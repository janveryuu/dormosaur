'use client'

import { AnimatePresence, motion, useReducedMotionConfig } from 'framer-motion'
import {
  ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Download, ShieldCheck, Smartphone,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ease, serif } from './shared'

type StepItem = {
  stepNumber: number
  title: string
  summary: string
  detail: string
  badge: string
}

const STEPS: StepItem[] = [
  {
    stepNumber: 1,
    title: 'Download the APK',
    summary: 'Download the signed Android app from Dormosaur.',
    detail: 'Free to download on Android 8 or later. The app has no ads.',
    badge: 'Free · Signed APK',
  },
  {
    stepNumber: 2,
    title: 'Allow the install',
    summary: 'Open the file from your browser downloads or the Files app, then tap Install.',
    detail: 'If Android prompts you, allow installs from the app you used to open the file.',
    badge: 'One-time Android prompt',
  },
  {
    stepNumber: 3,
    title: 'Sign in and import your schedule',
    summary: 'Sign in with Google or email, then scan your schedule photo or PDF.',
    detail: 'Review your classes and save them to set up offline alarms.',
    badge: 'Under 2 min',
  },
]

/**
 * Interactive 2-column Android installation walkthrough with synchronized device preview
 * and a desktop link-copy helper for students sending the APK to their phone.
 */
export function InstallSteps({ apkUrl, apkVersion }: { apkUrl: string; apkVersion: string }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | null>(null)
  const reduce = useReducedMotionConfig()

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    }
  }, [])

  async function copyApkLink() {
    const absoluteUrl = typeof window !== 'undefined' ? new URL(apkUrl, window.location.origin).toString() : apkUrl
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  function handleStepKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const next = e.key === 'ArrowDown' ? (idx + 1) % STEPS.length : (idx - 1 + STEPS.length) % STEPS.length
    setActive(next)
    document.getElementById(`install-step-tab-${next}`)?.focus()
  }

  return (
    <section id="install" className="scroll-mt-24 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-[1100px]">
        <div className="max-w-[560px]">
          <h2 className="text-balance text-[42px] leading-[1.01] tracking-[-0.025em] text-[#0A1710] sm:text-[62px]" style={serif}>
            Install Dormosaur <em className="text-[#0E7A4A]">in three steps.</em>
          </h2>
          <p className="mt-4 max-w-[46ch] text-pretty text-[16px] leading-[1.65] text-[#35463C] sm:text-[17px]">
            Download version {apkVersion} for Android and set up your timetable and class alarms in under two minutes.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Left column: interactive stepper */}
          <div>
            <div className="relative space-y-3" role="tablist" aria-orientation="vertical" aria-label="Android install steps">
              {STEPS.map((s, i) => {
                const isActive = i === active
                const isPast = i < active
                return (
                  <div
                    key={s.stepNumber}
                    className={`relative rounded-[24px] border transition-colors duration-200 ${
                      isActive
                        ? 'border-[#0E7A4A]/25 bg-[#F4F7F4]'
                        : 'border-[#0A1710]/[0.07] bg-white hover:border-[#0A1710]/[0.15]'
                    }`}
                  >
                    <button
                      id={`install-step-tab-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="install-phone-stage"
                      onClick={() => setActive(i)}
                      onKeyDown={e => handleStepKeyDown(e, i)}
                      className="flex w-full cursor-pointer items-start gap-4 p-5 text-left sm:p-6"
                    >
                      <span
                        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold tabular-nums transition-colors ${
                          isActive
                            ? 'bg-[#0E7A4A] text-white'
                            : isPast
                              ? 'bg-[#DFF2E7] text-[#0E7A4A]'
                              : 'bg-[#EEF2EF] text-[#354B3E]'
                        }`}
                      >
                        {isPast ? <Check className="size-4" strokeWidth={2.8} aria-hidden /> : s.stepNumber}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-[19px] font-bold tracking-[-0.015em] text-[#0A1710] sm:text-[20px]">
                            {s.title}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                              isActive ? 'bg-white text-[#0B5E39]' : 'bg-[#F4F7F4] text-[#455C4E]'
                            }`}
                          >
                            {s.badge}
                          </span>
                        </div>
                        <p className="mt-1.5 text-pretty text-[15px] leading-[1.58] text-[#35463C]">{s.summary}</p>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#0A1710]/[0.07] px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pl-[76px]">
                            <p className="text-pretty text-[14.5px] leading-[1.6] text-[#3A5144]">{s.detail}</p>
                            {i === 0 && (
                              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                <a
                                  href={apkUrl}
                                  download
                                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0E7A4A] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#0B633B] active:scale-[0.98]"
                                >
                                  <Download className="size-4" strokeWidth={2.4} aria-hidden />
                                  Download v{apkVersion} APK
                                </a>
                                <button
                                  type="button"
                                  onClick={copyApkLink}
                                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#0A1710]/[0.12] bg-white px-4 py-2 text-[14px] font-semibold text-[#0A1710] transition-colors hover:border-[#0A1710]/30 active:scale-[0.98]"
                                >
                                  {copied ? (
                                    <>
                                      <Check className="size-4 text-[#0E7A4A]" strokeWidth={2.6} aria-hidden />
                                      Link copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-4 text-[#43594C]" strokeWidth={2.2} aria-hidden />
                                      Copy link for phone
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActive(a => (a - 1 + STEPS.length) % STEPS.length)}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[#0A1710]/[0.12] bg-white px-4 text-[14px] font-semibold text-[#0A1710] transition-colors hover:border-[#0A1710]/30 active:scale-[0.97]"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActive(a => (a + 1) % STEPS.length)}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[#0A1710]/[0.12] bg-white px-4 text-[14px] font-semibold text-[#0A1710] transition-colors hover:border-[#0A1710]/30 active:scale-[0.97]"
                >
                  Next step
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
              <Link
                href="/docs/install"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-[14.5px] font-semibold text-[#0E7A4A] underline-offset-4 hover:underline"
              >
                Read install guide
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Right column: synchronized Android device preview */}
          <div
            id="install-phone-stage"
            role="tabpanel"
            aria-labelledby={`install-step-tab-${active}`}
            className="rounded-[32px] border border-[#0A1710]/[0.08] bg-[#F4F7F4] p-6 sm:p-10"
          >
            <div className="mx-auto w-full max-w-[288px] rounded-[40px] bg-[#141A17] p-[8px] shadow-[0_28px_56px_-22px_rgba(10,23,16,0.34)] ring-1 ring-black/15">
              <div className="relative h-[452px] overflow-hidden rounded-[32px] bg-[#F7F8F5]">
                {/* Clean Android status bar */}
                <div className="relative z-20 flex h-8 items-center justify-between bg-[#F7F8F5]/95 px-5 text-[12px] font-semibold tabular-nums text-[#0A1710]">
                  <span>9:41</span>
                  <span aria-hidden className="size-[7px] rounded-full bg-[#1C2420]" />
                  <span>5G</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, scale: 0.96, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.96, filter: 'blur(2px)' }}
                    transition={{ duration: 0.28, ease }}
                    className="h-[calc(100%-32px)]"
                  >
                    {active === 0 && <PhoneStepDownload apkVersion={apkVersion} reduce={!!reduce} />}
                    {active === 1 && <PhoneStepInstall reduce={!!reduce} />}
                    {active === 2 && <PhoneStepReady />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === active ? 'step' : undefined}
                  className={`min-h-[40px] cursor-pointer rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                    i === active
                      ? 'bg-[#0E7A4A] text-white'
                      : 'bg-white text-[#354B3E] hover:bg-[#E7EFEA]'
                  }`}
                >
                  Step {s.stepNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneStepDownload({ apkVersion, reduce }: { apkVersion: string; reduce: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_6px_18px_-10px_rgba(10,23,16,0.12)]">
        <div className="flex items-center gap-3">
          <Image src="/dormosaur-logo.png" alt="" width={40} height={40} className="rounded-[12px]" />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#0A1710]">dormosaur-v{apkVersion}.apk</p>
            <p className="text-[12.5px] text-[#455C4E]">Signed Android build · Free</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#0E7A4A]">
            <span>Download complete</span>
            <span className="tabular-nums">100%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E6EFE9]">
            <motion.div
              initial={reduce ? { scaleX: 1 } : { scaleX: 0.15 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.75, ease }}
              className="h-full origin-left rounded-full bg-[#0E7A4A]"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[14px] bg-[#F2F7F4] px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#0B5E39]">
            <ShieldCheck className="size-4" aria-hidden />
            Official release verified
          </span>
          <span className="rounded-full bg-[#0E7A4A] px-3 py-1 text-[12px] font-semibold text-white">Open</span>
        </div>
      </div>

      <div className="rounded-[20px] bg-white/90 p-4">
        <div className="flex items-start gap-2.5">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-[#0E7A4A]" aria-hidden />
          <p className="text-[13px] leading-[1.5] text-[#35463C]">
            Find the file anytime in your browser&apos;s <strong className="font-semibold text-[#0A1710]">Downloads</strong> folder if you close the prompt.
          </p>
        </div>
      </div>
    </div>
  )
}

function PhoneStepInstall({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      {/* Android source permission card */}
      <div className="rounded-[20px] bg-white p-4 shadow-[0_6px_18px_-10px_rgba(10,23,16,0.12)]">
        <p className="text-[12.5px] font-semibold text-[#455C4E]">Install unknown apps</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-bold text-[#0A1710]">Allow from this source</p>
            <p className="text-[12.5px] text-[#455C4E]">Chrome · Required once</p>
          </div>
          <div aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-[#0E7A4A] p-1">
            <motion.span
              initial={reduce ? { x: 20 } : { x: 0 }}
              animate={{ x: 20 }}
              transition={{ duration: 0.45, ease, delay: 0.15 }}
              className="block size-5 rounded-full bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Android install confirmation dialog */}
      <div className="rounded-[22px] bg-white p-4 shadow-[0_14px_30px_-18px_rgba(10,23,16,0.22)]">
        <div className="flex items-center gap-3">
          <Image src="/dormosaur-logo.png" alt="" width={40} height={40} className="rounded-[12px]" />
          <div>
            <p className="text-[15px] font-bold text-[#0A1710]">Dormosaur</p>
            <p className="text-[12.5px] text-[#455C4E]">Do you want to install this app?</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-[#455C4E]">Cancel</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0E7A4A] px-4 py-2 text-[13px] font-semibold text-white">
            <Check className="size-3.5" strokeWidth={2.8} aria-hidden />
            Install
          </span>
        </div>
      </div>
    </div>
  )
}

function PhoneStepReady() {
  return (
    <div className="relative h-full overflow-hidden">
      <Image
        src="/landing/screens/app-schedule-v2.webp"
        alt="Weekly timetable in Dormosaur after importing classes"
        width={780}
        height={1688}
        sizes="272px"
        className="block h-auto w-full"
      />
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-[16px] bg-[#0B2A1C]/95 px-3.5 py-2.5 text-white shadow-lg">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold">
          <span className="grid size-5 place-items-center rounded-full bg-[#34C77B] text-[#052414]">
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
          Classes synced · Alarms on
        </span>
      </div>
    </div>
  )
}
