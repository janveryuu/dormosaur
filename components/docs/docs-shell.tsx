'use client'

import { ArrowRight, Download, FileText, Hash, Menu, Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { GROUPS, blockText, docHref, pages, slugify } from '@/lib/docs/content'

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'

/** Docs chrome: sticky header with search, grouped sidebar (a drawer on phones), and the page. */
export function DocsShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMenu(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(s => !s)
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh bg-white text-[#0A1710]" style={{ fontFamily: 'var(--font-geist), -apple-system, system-ui, sans-serif' }}>
      <a href="#docs-main" className="sr-only z-[70] rounded-md bg-[#0A1710] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">Skip to content</a>

      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setMenu(true)} aria-label="Open navigation" className="-ml-2 grid size-11 place-items-center rounded-full text-black/70 hover:bg-black/[0.04] lg:hidden">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#34C77B]">
            <Image src="/dormosaur-logo.png" alt="" width={30} height={30} className="rounded-[9px]" />
            Dormosaur
          </Link>
          <span aria-hidden className="h-5 w-px bg-black/10" />
          <Link href="/docs" className="text-[15px] font-medium text-[#0E7A4A]">Help</Link>

          <button
            type="button"
            onClick={() => setSearch(true)}
            className="ml-auto flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-[#F6F8F5] text-[14px] text-black/50 transition-colors hover:border-black/15 sm:w-64 sm:justify-start sm:px-3.5 md:w-80"
            aria-label="Search the docs"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-auto hidden rounded-md border border-black/10 bg-white px-1.5 py-0.5 font-sans text-[11px] text-black/45 sm:inline">Ctrl K</kbd>
          </button>
          <a href={APK_URL} download className="hidden h-10 items-center gap-2 rounded-full bg-[#0A1710] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 md:inline-flex">
            <Download className="size-4" strokeWidth={2.5} /> Download
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[272px] shrink-0 overflow-y-auto border-r border-black/[0.06] px-4 py-8 lg:block">
          <SideNav pathname={pathname} />
        </aside>
        <main id="docs-main" className="min-w-0 flex-1">{children}</main>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" onClick={() => setMenu(false)} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="docs-drawer absolute inset-y-0 left-0 w-[86%] max-w-[320px] overflow-y-auto bg-white px-4 pb-10 pt-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Dormosaur Help</span>
              <button type="button" onClick={() => setMenu(false)} aria-label="Close navigation" className="grid size-11 place-items-center rounded-full hover:bg-black/[0.04]">
                <X className="size-5" />
              </button>
            </div>
            <SideNav pathname={pathname} />
          </div>
        </div>
      )}

      {search && <SearchDialog onClose={() => setSearch(false)} />}
    </div>
  )
}

function SideNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Docs">
      {GROUPS.map(group => (
        <div key={group} className="mb-6">
          <p className="mb-1.5 px-3 text-[13px] font-semibold text-[#0A1710]">{group}</p>
          <ul>
            {pages.filter(p => p.group === group).map(p => {
              const href = docHref(p.slug)
              const on = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on ? 'page' : undefined}
                    className={`flex min-h-9 items-center rounded-lg px-3 text-[14.5px] transition-colors ${
                      on ? 'bg-[#E3F3E9] font-medium text-[#0B5E38]' : 'text-black/60 hover:bg-black/[0.035] hover:text-black'
                    }`}
                  >
                    {p.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

type Hit = { href: string; title: string; page: string; snippet: string; heading: boolean }

const index = pages.flatMap(p => {
  const entries: { href: string; title: string; page: string; text: string; heading: boolean }[] = [
    { href: docHref(p.slug), title: p.title, page: p.group, text: `${p.title} ${p.description}`, heading: false },
  ]
  let current = { href: docHref(p.slug), title: p.title }
  let buffer = ''
  const flush = () => {
    if (current.href !== docHref(p.slug)) entries.push({ ...current, page: p.title, text: `${current.title} ${buffer}`, heading: true })
    buffer = ''
  }
  for (const b of p.body) {
    if ('h2' in b) {
      flush()
      current = { href: `${docHref(p.slug)}#${slugify(b.h2)}`, title: b.h2 }
    } else buffer += ' ' + blockText(b)
  }
  flush()
  return entries
})

const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/`/g, '').replace(/\s+/g, ' ').trim()

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    input.current?.focus()
    const root = document.documentElement
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = '' }
  }, [])

  const hits: Hit[] = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return pages.slice(1, 7).map(p => ({ href: docHref(p.slug), title: p.title, page: p.group, snippet: p.description, heading: false }))
    return index
      .map(e => {
        const text = plain(e.text).toLowerCase()
        const title = e.title.toLowerCase()
        if (!terms.every(t => text.includes(t))) return null
        const score = terms.reduce((n, t) => n + (title.includes(t) ? 3 : 0) + (title.startsWith(t) ? 2 : 0), 0) + (e.heading ? 0 : 4)
        const body = plain(e.text)
        const at = body.toLowerCase().indexOf(terms[0], e.title.length)
        const snippet = at > 0 ? (at > 40 ? '…' : '') + body.slice(Math.max(e.title.length + 1, at - 40), at + 90) + '…' : body.slice(e.title.length + 1, e.title.length + 120)
        return { hit: { href: e.href, title: e.title, page: e.page, snippet, heading: e.heading }, score }
      })
      .filter((x): x is { hit: Hit; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => x.hit)
  }, [q])

  const go = useCallback((href: string) => {
    onClose()
    router.push(href)
  }, [onClose, router])

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search the docs">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-[#0A1710]/35 backdrop-blur-sm" />
      <div className="docs-pop relative w-full max-w-[600px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_-20px_rgba(10,23,16,0.45)] ring-1 ring-black/5">
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5">
          <Search className="size-5 shrink-0 text-[#0E7A4A]" />
          <input
            ref={input}
            value={q}
            onChange={e => { setQ(e.target.value); setActive(0) }}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
              else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
              else if (e.key === 'Enter' && hits[active]) go(hits[active].href)
            }}
            placeholder="Search alarms, scanning, recipes…"
            aria-label="Search"
            aria-controls="docs-search-results"
            className="docs-search-input h-16 flex-1 bg-transparent text-[17px] outline-none placeholder:text-black/35"
          />
          <kbd className="rounded-md border border-black/10 px-1.5 py-0.5 text-[11px] text-black/45">Esc</kbd>
        </div>
        <ul id="docs-search-results" role="listbox" className="max-h-[56vh] overflow-y-auto p-2">
          {!q && <li className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/40">Popular guides</li>}
          {hits.map((h, i) => (
            <li key={h.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h.href)}
                className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ${i === active ? 'bg-[#EEF7F1]' : ''}`}
              >
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${i === active ? 'bg-[#0E7A4A] text-white' : 'bg-black/[0.05] text-black/50'}`}>
                  {h.heading ? <Hash className="size-4" /> : <FileText className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-black/45">{h.page}</span>
                  <span className="block font-semibold">{h.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[13.5px] text-black/55">{h.snippet}</span>
                </span>
                {i === active && <ArrowRight className="mt-2 size-4 shrink-0 text-[#0E7A4A]" />}
              </button>
            </li>
          ))}
          {q && !hits.length && (
            <li className="px-4 py-10 text-center text-black/55">
              No results for “{q}”. Try “alarm”, “scan”, or “grocery”, or see the <Link href="/docs/faq" onClick={onClose} className="font-medium text-[#0E7A4A] underline underline-offset-4">FAQ</Link>.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
