'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ease } from '@/components/landing/shared'

const TOPICS = [
  'Something is broken (bug)',
  'Schedule scanner issue',
  'Alarms or notifications',
  'Dormosaur Pro / payment',
  'Account or data request',
  'Feature suggestion',
  'Other',
] as const

const COMMON_ANSWERS = [
  {
    q: 'Do I have to type in my schedule?',
    a: 'No. Take a photo of your printed registration form, upload a portal screenshot, import your official PDF, or paste plain text. Dormosaur extracts subjects, rooms, days, and times, and lets you review every class before saving.',
  },
  {
    q: 'Why is Dormosaur an Android APK right now?',
    a: 'We ship the signed Android build directly while store listings are finalized. Allow your browser to install unknown apps once, tap Install, and future updates install cleanly right over your existing app without losing account data.',
  },
  {
    q: 'Why did my class alarm not ring?',
    a: 'Make sure notifications are allowed for Dormosaur in Android settings and set Battery usage to Unrestricted so your phone does not pause background alerts. Alarms are scheduled locally on your device so they ring even offline.',
  },
  {
    q: 'How do I activate or verify Dormosaur Pro?',
    a: 'Start your 7-day free trial inside the app with no payment required, or choose a Monthly, Semester, or Lifetime plan payable via GCash, Maya, MariBank, or GoTyme. Payments are reviewed within 24 hours with zero auto-renewal.',
  },
  {
    q: 'Can I reset my password or delete my account?',
    a: 'Yes. Send us a message using the form above under "Account or data request" with the email address on your Dormosaur account and we will handle it promptly.',
  },
] as const

export function SupportForm({ supportEmail }: { supportEmail: string }) {
  const [topic, setTopic] = useState<string>(TOPICS[0])
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, details, email }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not send your message. Please try again.')
        return
      }
      setSent(true)
      setDetails('')
    } catch {
      setError(`Network error. You can also email us directly at ${supportEmail}.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label htmlFor="support-topic" className="block text-[14.5px] font-semibold text-[#0A1710]">
          What&apos;s this about?
        </label>
        <div className="relative mt-2">
          <select
            id="support-topic"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="h-12 w-full appearance-none rounded-[14px] border border-black/[0.08] bg-[#F3F5F3] pl-4 pr-10 text-[15px] text-[#0A1710] outline-none transition-colors focus:border-[#0E7A4A] focus:bg-white"
          >
            {TOPICS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-black/50"
            aria-hidden
          />
        </div>
      </div>

      <div>
        <label htmlFor="support-details" className="block text-[14.5px] font-semibold text-[#0A1710]">
          Details
        </label>
        <textarea
          id="support-details"
          rows={4}
          required
          minLength={8}
          maxLength={4000}
          value={details}
          onChange={e => {
            setDetails(e.target.value)
            if (sent) setSent(false)
          }}
          placeholder="What happened, and what you expected instead."
          className="mt-2 w-full resize-y rounded-[14px] border border-black/[0.08] bg-[#F3F5F3] px-4 py-3 text-[15px] leading-relaxed text-[#0A1710] outline-none transition-colors placeholder:text-black/40 focus:border-[#0E7A4A] focus:bg-white"
        />
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <label htmlFor="support-email" className="text-[14.5px] font-semibold text-[#0A1710]">
            Email
          </label>
          <span className="text-[13px] text-black/45">Optional</span>
        </div>
        <p className="mt-0.5 text-[13.5px] text-black/55">Add an email address if you would like a reply.</p>
        <input
          id="support-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@school.edu.ph"
          className="mt-2 h-12 w-full rounded-[14px] border border-black/[0.08] bg-[#F3F5F3] px-4 text-[15px] text-[#0A1710] outline-none transition-colors placeholder:text-black/40 focus:border-[#0E7A4A] focus:bg-white"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700">
          {error}
        </p>
      )}

      {sent && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-[14px] border border-[#0E7A4A]/20 bg-[#EBF7F0] px-4 py-3 text-[14.5px] font-medium text-[#0B5E39]"
        >
          <Check className="size-4 shrink-0" strokeWidth={2.8} aria-hidden />
          Message sent. Thank you — a real person will read it and follow up soon.
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-[14px] bg-[#0E7A4A] px-6 py-2.5 text-[15px] font-semibold text-white transition-all hover:bg-[#0B633B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}

export function CommonAnswers() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="grid gap-8 md:grid-cols-[0.8fr_1.4fr] md:gap-12">
      <div>
        <h2
          className="text-[36px] leading-[1.06] tracking-[-0.02em] text-[#0A1710] sm:text-[42px]"
          style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}
        >
          Common <em className="text-[#0E7A4A]">answers</em>
        </h2>
      </div>

      <div className="space-y-3">
        {COMMON_ANSWERS.map((item, idx) => {
          const isOpen = open === idx
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-[18px] bg-[#EDF5F0] transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex min-h-[56px] w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left text-[15.5px] font-semibold text-[#0A1710]"
              >
                <Plus
                  className={`size-4 shrink-0 text-[#0E7A4A] transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="flex-1">{item.q}</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 pl-[46px] text-[15px] leading-[1.68] text-[#354B3E]">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
