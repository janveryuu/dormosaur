import Link from 'next/link'
import { BellRing, CalendarDays, CookingPot } from 'lucide-react'
import { PillLink } from '@/components/ios/pill-button'
import { TransformPreview } from '@/components/landing/transform-preview'

const features = [
  {
    icon: CalendarDays,
    title: 'Schedule',
    body: 'Paste the mess from your registrar. Get a clean weekly grid in seconds.',
  },
  {
    icon: BellRing,
    title: 'Alarms',
    body: 'Every class gets an alarm that follows your timetable automatically.',
  },
  {
    icon: CookingPot,
    title: 'Kitchen',
    body: 'Real meals from a microwave, a kettle, and a very small budget.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="ios-glass sticky top-0 z-40 border-b border-separator">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-[14px] font-bold text-primary-foreground">
              D
            </span>
            <span className="text-[18px] font-semibold tracking-[-0.03em]">Dormly</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1" aria-label="Primary">
            <Link
              href="/dashboard"
              className="hidden rounded-full px-4 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Open app
            </Link>
            <PillLink href="/onboarding" size="sm">
              Get Started
            </PillLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24">
        <section className="flex flex-col items-center pt-16 pb-14 text-center sm:pt-24">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-[13px] font-medium text-muted-foreground shadow-ios">
            <span className="size-1.5 rounded-full bg-primary" />
            Built for dorm life
          </span>
          <h1 className="max-w-2xl text-[clamp(2.5rem,9vw,4.5rem)] leading-[1.03] font-bold tracking-[-0.04em] text-balance">
            Your chaos, organized.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground text-pretty">
            Paste your class schedule exactly as it came to you. Dormly turns it into a timetable,
            sets your alarms, and feeds you between lectures.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <PillLink href="/onboarding" size="lg">
              Get Started
            </PillLink>
            <PillLink href="/dashboard" size="lg" variant="glass">
              See a live demo
            </PillLink>
          </div>
        </section>

        <section aria-label="How Dormly works" className="pb-20">
          <TransformPreview />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-ios"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5.5" strokeWidth={1.9} />
                </span>
                <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{feature.title}</h2>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            )
          })}
        </section>

        <section className="mt-16 flex flex-col items-center gap-5 rounded-4xl bg-card px-6 py-14 text-center shadow-ios">
          <h2 className="max-w-md text-[clamp(1.75rem,5vw,2.25rem)] leading-tight font-bold tracking-[-0.03em] text-balance">
            Set it up once. Coast the whole semester.
          </h2>
          <p className="max-w-sm text-[15.5px] leading-relaxed text-muted-foreground">
            Takes about ninety seconds, and there is nothing to configure afterwards.
          </p>
          <PillLink href="/onboarding" size="lg">
            Get Started
          </PillLink>
        </section>
      </main>

      <footer className="border-t border-separator py-8">
        <p className="text-center text-[13px] text-muted-foreground">
          Dormly · A better semester, one paste at a time.
        </p>
      </footer>
    </div>
  )
}
