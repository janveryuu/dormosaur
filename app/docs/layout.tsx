import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import type { ReactNode } from 'react'
import { DocsShell } from '@/components/docs/docs-shell'
import { SiteFooter } from '@/components/site-footer'
import './docs.css'

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif-display' })

export const metadata: Metadata = {
  title: { template: '%s · Dormosaur Help', default: 'Dormosaur Help' },
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={serif.variable}>
      <DocsShell>{children}</DocsShell>
      <SiteFooter />
    </div>
  )
}
