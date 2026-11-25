import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { CommonAnswers, SupportForm } from '@/components/support/support-form'

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif-display',
})

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dormosaur.app'

export const metadata: Metadata = {
  title: 'Dormosaur: Support',
  description: 'Get help installing Dormosaur, importing your schedule, or fixing class alarms. Contact support if you need a hand.',
  alternates: { canonical: '/support' },
}

const GUIDE_LINKS = [
  {
    title: 'Getting started',
    description: 'Install the app and import your first schedule.',
    href: '/docs/getting-started',
  },
  {
    title: 'Frequently asked questions',
    description: 'Check what works offline and what’s included in each plan.',
    href: '/docs/faq',
  },
  {
    title: 'Troubleshooting',
    description: 'Fix problems with installation, scanning, signing in, or alarms.',
    href: '/docs/troubleshooting',
  },
] as const

export default function SupportPage() {
  return (
    <div
      className={`${serif.variable} min-h-dvh bg-white text-[#0A1710] selection:bg-[#34C77B]/30`}
      style={{ fontFamily: 'var(--font-geist), -apple-system, system-ui, sans-serif' }}
    >
      <SiteNav apkUrl={APK_URL} alwaysPill />

      <main className="mx-auto max-w-[780px] px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
        <header>
          <h1
            className="text-[46px] leading-[1.02] tracking-[-0.02em] text-[#0A1710] sm:text-[60px]"
            style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}
          >
            How can we help?
          </h1>
          <p className="mt-5 max-w-[54ch] text-pretty text-[18px] leading-[1.68] text-[#4E5F55] sm:text-[19px]">
            Browse the help guides or send a message to the Dormosaur support team.
          </p>
        </header>

        <hr className="my-11 border-black/[0.08]" />

        <section>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Start with a guide</h2>
          <p className="mt-2 max-w-[56ch] text-[15.5px] leading-[1.65] text-[#4E5F55]">
            Find steps for common setup, scanning, and alarm issues.
          </p>

          <ul className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {GUIDE_LINKS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-4 py-5 transition-colors hover:text-[#0E7A4A]"
                >
                  <div>
                    <p className="text-[16px] font-semibold text-[#0A1710] group-hover:text-[#0E7A4A]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[14.5px] text-[#55665C]">{item.description}</p>
                  </div>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-black/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0E7A4A]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <hr className="my-12 border-black/[0.08]" />

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Send us a message</h2>
              <p className="mt-1.5 text-[15px] text-[#4E5F55]">We usually reply within two business days.</p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Dormosaur support')}`}
              className="text-[14.5px] font-medium text-[#0E7A4A] underline decoration-[#0E7A4A]/35 underline-offset-4 transition-colors hover:decoration-[#0E7A4A]"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          <SupportForm supportEmail={SUPPORT_EMAIL} />
        </section>

        <hr className="my-14 border-black/[0.08]" />

        <CommonAnswers />
      </main>

      <SiteFooter />
    </div>
  )
}
