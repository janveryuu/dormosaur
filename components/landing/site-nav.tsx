'use client'

import { motion, useScroll } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DownloadButton } from './download-button'
import { spring } from './shared'

const NAV_LINKS = [
  { label: 'Docs', href: '/docs' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
] as const

/**
 * Floating pill navigation bar shared across the landing, about, and support pages.
 */
export function SiteNav({ apkUrl, alwaysPill = false }: { apkUrl: string; alwaysPill?: boolean }) {
  const { scrollY } = useScroll()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (alwaysPill) return
    return scrollY.on('change', v => setScrolled(v > 40))
  }, [scrollY, alwaysPill])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const pill = alwaysPill || scrolled

  return (
    <div className="fixed inset-x-0 top-3 z-50 flex flex-col items-center px-4">
      <motion.nav
        layout
        transition={spring}
        className={`flex w-full items-center gap-3 rounded-full border transition-colors duration-300 sm:gap-6 ${
          pill
            ? 'max-w-[680px] border-black/[0.08] bg-white/85 py-2 pl-3 pr-2 shadow-[0_10px_40px_-14px_rgba(10,23,16,0.22)] backdrop-blur-xl'
            : 'max-w-[1100px] border-transparent bg-transparent py-3 pl-2 pr-2'
        }`}
        aria-label="Main"
      >
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-[#0A1710]">
          <Image src="/dormosaur-logo.png" alt="" width={32} height={32} className="rounded-[10px]" />
          Dormosaur
        </Link>

        <div className="mx-auto hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map(item => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[14.5px] font-medium transition-colors ${
                  active
                    ? 'bg-[#E7F5ED] text-[#0B5E39]'
                    : 'text-black/65 hover:bg-black/[0.04] hover:text-black'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          <DownloadButton apkUrl={apkUrl} size="sm" />
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-black/[0.08] bg-white/85 text-black/80 sm:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.nav>

      {menuOpen && (
        <div
          role="region"
          aria-label="Mobile navigation"
          className="mt-2 flex w-full max-w-[420px] flex-col gap-1 rounded-3xl border border-black/[0.08] bg-white/95 p-3 shadow-xl backdrop-blur-xl sm:hidden"
        >
          {NAV_LINKS.map(item => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-2xl px-4 py-2.5 text-[15px] font-medium ${
                  active ? 'bg-[#E7F5ED] text-[#0B5E39]' : 'text-black/80 hover:bg-black/[0.04]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
