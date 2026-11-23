'use client'

import { motion } from 'framer-motion'
import { Check, Download } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { spring } from './shared'

type Status = 'idle' | 'starting' | 'done'

/**
 * APK download link. After the first tap it shows "Starting download…" then a check, and
 * stays locked for a few seconds so an impatient double tap doesn't fetch the APK twice.
 */
export function DownloadButton({ apkUrl, size = 'lg', dark = false, onStart }: { apkUrl: string; size?: 'lg' | 'sm'; dark?: boolean; onStart?: () => void }) {
  const lg = size === 'lg'
  const [status, setStatus] = useState<Status>('idle')
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (status !== 'idle') {
      e.preventDefault()
      return
    }
    setStatus('starting')
    onStart?.()
    timers.current.push(
      window.setTimeout(() => setStatus('done'), 900),
      window.setTimeout(() => setStatus('idle'), 3600),
    )
  }

  const busy = status !== 'idle'
  const title = status === 'starting' ? 'Starting download…' : status === 'done' ? 'Download started' : 'Download the APK'

  return (
    <motion.a
      href={apkUrl}
      download
      onClick={handleClick}
      aria-disabled={busy}
      whileHover={busy ? undefined : { y: -2, scale: 1.02 }}
      whileTap={busy ? undefined : { scale: 0.96 }}
      transition={spring}
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full font-semibold outline-none focus-visible:ring-4 focus-visible:ring-[#34C77B]/50 ${
        busy ? 'cursor-default' : ''
      } ${lg ? 'h-[60px] pl-3 pr-7 text-[17px]' : 'h-10 px-4 text-sm'} ${
        dark ? 'bg-white text-[#0A1710]' : 'bg-[#0A1710] text-white shadow-[0_18px_40px_-18px_rgba(14,122,74,0.9)]'
      }`}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {lg ? (
        <>
          <span className={`grid size-10 place-items-center rounded-full transition-colors ${status === 'done' ? 'bg-[#34C77B] text-[#0A1710]' : dark ? 'bg-[#0E7A4A] text-white' : 'bg-[#34C77B] text-[#0A1710]'}`}>
            {status === 'done' ? <Check className="size-5" strokeWidth={3} /> : <AndroidGlyph className="size-5" />}
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className={`text-[11px] font-medium ${dark ? 'text-black/55' : 'text-white/60'}`}>Free for Android</span>
            <span className="mt-1" aria-live="polite">{title}</span>
          </span>
          {status === 'starting' ? (
            <span aria-hidden className="ml-1 size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <Download aria-hidden className="ml-1 size-[18px] transition-transform group-hover:translate-y-0.5" strokeWidth={2.4} />
          )}
        </>
      ) : (
        <>
          {status === 'done' ? <Check className="size-4" strokeWidth={3} /> : <Download className="size-4" strokeWidth={2.5} />}
          <span aria-live="polite">{status === 'idle' ? 'Download' : status === 'starting' ? 'Starting…' : 'Started'}</span>
        </>
      )}
    </motion.a>
  )
}

export function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22A11.4 11.4 0 0012 8.1c-1.78 0-3.45.38-4.92 1.04L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  )
}
