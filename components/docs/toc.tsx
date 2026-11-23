'use client'

import { AlignLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

/** "On this page" list that highlights the section being read. */
export function Toc({ headings }: { headings: { id: string; title: string }[] }) {
  const [active, setActive] = useState(headings[0]?.id)

  useEffect(() => {
    const els = headings.map(h => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e)
    const onScroll = () => {
      // The last heading that has passed the top quarter of the viewport is the one being read.
      const line = window.innerHeight * 0.25
      let current = els[0]?.id
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = els[els.length - 1]?.id
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  return (
    <nav aria-label="On this page">
      <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#0A1710]">
        <AlignLeft className="size-4 text-black/45" aria-hidden /> On this page
      </p>
      <ul className="border-l border-black/[0.08]">
        {headings.map(h => {
          const on = h.id === active
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={on ? 'location' : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3.5 text-[13.5px] leading-snug transition-colors ${
                  on ? 'border-[#0E7A4A] font-medium text-[#0E7A4A]' : 'border-transparent text-black/55 hover:text-black'
                }`}
              >
                {h.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
